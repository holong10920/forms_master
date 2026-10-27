package studio

import (
	"encoding/json"
	"sort"
)

func decodeValue(raw any) any {
	var v any
	if json.Unmarshal([]byte(text(raw)), &v) != nil {
		abort("E-ADMISSION-UNAVAILABLE", 503)
	}
	return v
}
func (u *unit) policy() M {
	r := u.one(`SELECT version,ledger,overrides,m3,fbks,ledger_seq AS seq FROM capabilities WHERE prk=?`, plugin)
	if r == nil {
		abort("E-ADMISSION-UNAVAILABLE", 503)
	}
	ledger := u.one(`SELECT seq,state FROM trusted_ledger WHERE prk=?`, plugin)
	if ledger == nil || numberInt(ledger["seq"]) != numberInt(r["seq"]) || ledger["state"] != r["ledger"] {
		abort("E-LEDGER-UNAVAILABLE", 503)
	}
	r["overrides"] = object(decodeValue(r["overrides"]))
	r["fbks"] = list(decodeValue(r["fbks"]))
	r["m3"] = numberInt(r["m3"]) != 0
	return r
}
func blockers(p M) []string {
	b := []string{}
	if p["ledger"] == "revoked" || p["ledger"] == "vulnerable" {
		b = append(b, "ledger:"+text(p["ledger"]))
	}
	if p["m3"] == true {
		b = append(b, "M3")
	}
	for k, v := range object(p["overrides"]) {
		if v == true {
			b = append(b, "override:"+k)
		}
	}
	sort.Strings(b)
	return b
}
func (u *unit) deployment() M {
	r := u.one(`SELECT version,adapters FROM deployments WHERE id='current'`)
	if r == nil {
		abort("E-ADMISSION-UNAVAILABLE", 503)
	}
	r["adapters"] = list(decodeValue(r["adapters"]))
	return r
}
func includes(a []any, v any) bool {
	for _, x := range a {
		if x == v {
			return true
		}
	}
	return false
}
func (u *unit) opening(p M) {
	if len(blockers(p)) == 0 {
		for _, f := range list(p["fbks"]) {
			if !includes(list(u.deployment()["adapters"]), f) {
				abort("ADAPTER_NOT_DEPLOYED", 409)
			}
		}
	}
}
func (u *unit) gateExists(key string) {
	if u.one(`SELECT 1 FROM gates WHERE key=?`, key) == nil {
		abort("E-ADMISSION-UNAVAILABLE", 503)
	}
}
func (u *unit) gate(key string) {
	r := u.one(`SELECT blockers FROM gates WHERE key=?`, key)
	if r == nil {
		abort("E-ADMISSION-UNAVAILABLE", 503)
	}
	b := list(decodeValue(r["blockers"]))
	if len(b) > 0 {
		code := "E-CAPABILITY-BLOCKED"
		if len(key) > 8 && key[:8] == "release:" {
			code = "E-RELEASE-SUSPENDED"
		}
		if includes(b, "form#suspended") {
			code = "E-FORM-SUSPENDED"
		} else if includes(b, "form#paused") {
			code = "E-FORM-SUBMISSION-PAUSED"
		}
		abort(code, 423)
	}
}
func (u *unit) check(site, form, release string, bindings []any) {
	if u.one(`SELECT 1 FROM gate_intents LIMIT 1`) != nil {
		abort("E-ADMISSION-UNAVAILABLE", 503)
	}
	for _, k := range []string{"form:" + site + ":" + form, "release:" + release} {
		u.gate(k)
	}
	for _, f := range bindings {
		u.gate("fbk:" + text(f))
	}
}
func (u *unit) ingest() {
	if u.one(`SELECT 1 FROM capabilities WHERE prk=?`, plugin) != nil {
		p := u.policy()
		for _, f := range list(p["fbks"]) {
			u.gateExists("fbk:" + text(f))
		}
		return
	}
	for _, f := range fbks {
		if u.one(`SELECT 1 FROM gates WHERE key=?`, "fbk:"+f) != nil {
			abort("E-ADMISSION-UNAVAILABLE", 503)
		}
	}
	ledger := u.one(`SELECT seq,state FROM trusted_ledger WHERE prk=?`, plugin)
	if ledger == nil {
		u.exec(`INSERT INTO trusted_ledger VALUES(?,1,'active','approved-local-fixture')`, plugin)
		ledger = M{"seq": 1, "state": "active"}
	}
	bindings := []any{fbks[0], fbks[1]}
	p := M{"ledger": ledger["state"], "seq": ledger["seq"], "overrides": M{}, "m3": false, "fbks": bindings}
	u.opening(p)
	u.exec(`INSERT INTO capabilities VALUES(?,1,?,'{}',0,?,?)`, plugin, p["ledger"], string(canon(bindings)), p["seq"])
	for _, f := range fbks {
		u.exec(`INSERT INTO gates VALUES(?,?)`, "fbk:"+f, string(canon(blockers(p))))
	}
}
func (u *unit) dependencies(d M) {
	u.blockPolicy(d)
	if len(object(object(d["dependencies"])["capabilities"])) > 0 {
		u.ingest()
		p := u.policy()
		if len(blockers(p)) > 0 {
			abort("REVIEW_RECHECK_REQUIRED", 409)
		}
		u.opening(p)
		for _, f := range list(p["fbks"]) {
			u.gate("fbk:" + text(f))
		}
	}
}
func (u *unit) projectPolicy(p M, expected int, repair bool) {
	u.opening(p)
	m3 := 0
	if p["m3"] == true {
		m3 = 1
	}
	if u.exec(`UPDATE capabilities SET version=version+1,ledger=?,overrides=?,m3=?,ledger_seq=? WHERE prk=? AND version=?`, p["ledger"], string(canon(p["overrides"])), m3, p["seq"], plugin, expected) != 1 {
		abort("VERSION_CONFLICT", 409)
	}
	for _, f := range list(p["fbks"]) {
		key := "fbk:" + text(f)
		raw := string(canon(blockers(p)))
		if repair {
			u.exec(`INSERT INTO gates VALUES(?,?) ON CONFLICT(key) DO UPDATE SET blockers=excluded.blockers`, key, raw)
		} else if u.exec(`UPDATE gates SET blockers=? WHERE key=?`, raw, key) != 1 {
			abort("E-ADMISSION-UNAVAILABLE", 503)
		}
	}
}
func (u *unit) holds(site, form, release string) M {
	key := "form:" + site + ":" + form
	if release != "" {
		if u.one(`SELECT 1 FROM managed_releases WHERE id=? AND site=? AND form=?`, release, site, form) == nil {
			abort("NOT_FOUND", 404)
		}
		key = "release:" + release
	}
	u.gateExists(key)
	r := u.one(`SELECT version,sources FROM object_security WHERE key=?`, key)
	if r == nil {
		abort("E-ADMISSION-UNAVAILABLE", 503)
	}
	r["key"] = key
	r["sources"] = object(decodeValue(r["sources"]))
	return r
}
func (u *unit) policyOperation(op string, b M) any {
	site := text(b["site"])
	u.permit(site, "security:manage")
	switch op {
	case "policy.get":
		return u.policy()
	case "deployment.get":
		return u.deployment()
	case "policy.change":
		if b["source"] != "override" {
			abort("FORBIDDEN", 403)
		}
		p := u.policy()
		if numberInt(p["version"]) != integer(b["expected"]) {
			abort("VERSION_CONFLICT", 409)
		}
		key := text(b["key"])
		if key == "" {
			key = "local-incident"
		}
		if _, ok := b["value"].(bool); !ok {
			abort("POLICY_VALUE", 400)
		}
		object(p["overrides"])[key] = b["value"]
		u.projectPolicy(p, integer(b["expected"]), false)
		u.audit(site, "", "policy.override", key)
		return u.policy()
	case "policy.repair":
		p := u.policy()
		u.exec(`INSERT OR IGNORE INTO gate_intents VALUES(?)`, plugin)
		u.projectPolicy(p, integer(b["expected"]), true)
		u.exec(`DELETE FROM gate_intents WHERE prk=?`, plugin)
		u.audit(site, "", "policy.repair", "")
		return u.policy()
	case "policy.ledger":
		seq := integer(b["seq"])
		state, commit := text(b["state"]), text(b["commit"])
		if seq < 1 || commit == "" || !(state == "active" || state == "deprecated" || state == "vulnerable" || state == "revoked") {
			abort("POLICY_VALUE", 400)
		}
		old := u.one(`SELECT seq,state FROM trusted_ledger WHERE prk=?`, plugin)
		if old != nil && seq <= numberInt(old["seq"]) {
			return M{"seq": old["seq"], "state": old["state"], "changed": false}
		}
		if u.one(`SELECT 1 FROM capabilities WHERE prk=?`, plugin) != nil {
			p := u.policy()
			p["ledger"] = state
			p["seq"] = seq
			u.projectPolicy(p, numberInt(p["version"]), false)
		}
		u.exec(`INSERT INTO trusted_ledger VALUES(?,?,?,?) ON CONFLICT(prk) DO UPDATE SET seq=excluded.seq,state=excluded.state,commit_id=excluded.commit_id`, plugin, seq, state, commit)
		u.audit(site, "", "ledger.sync", fmtInt(seq))
		return M{"seq": seq, "state": state, "changed": true}
	case "deployment.change":
		d := u.deployment()
		if numberInt(d["version"]) != integer(b["expected"]) {
			abort("VERSION_CONFLICT", 409)
		}
		adapters, ok := b["adapters"].([]any)
		if !ok {
			abort("ADAPTER_INVENTORY", 400)
		}
		seen := map[string]bool{}
		for _, a := range adapters {
			s := text(a)
			if seen[s] || !(s == effect || s == fbks[0] || s == fbks[1]) {
				abort("ADAPTER_INVENTORY", 400)
			}
			seen[s] = true
		}
		if !seen[effect] {
			abort("ADAPTER_REQUIRED", 409)
		}
		if u.one(`SELECT 1 FROM capabilities WHERE prk=?`, plugin) != nil {
			p := u.policy()
			exempt := p["ledger"] == "revoked"
			for _, v := range object(p["overrides"]) {
				if v == true {
					exempt = true
				}
			}
			for _, f := range list(p["fbks"]) {
				u.gateExists("fbk:" + text(f))
				if !seen[text(f)] && !exempt {
					abort("ADAPTER_REQUIRED", 409)
				}
			}
		}
		names := []string{}
		for s := range seen {
			names = append(names, s)
		}
		sort.Strings(names)
		u.exec(`UPDATE deployments SET version=version+1,adapters=? WHERE id='current' AND version=?`, string(canon(names)), integer(b["expected"]))
		u.audit(site, "", "deployment.activate", fmtInt(integer(b["expected"])+1))
		return u.deployment()
	case "hold.change":
		form, release := text(b["form"]), text(b["release"])
		source, incident := text(b["source"]), text(b["incident"])
		if incident == "" || (release == "" && source != "M4" && source != "M5") {
			abort("HOLD_VALUE", 400)
		}
		blocked, ok := b["blocked"].(bool)
		if !ok {
			abort("HOLD_VALUE", 400)
		}
		h := u.holds(site, form, release)
		if numberInt(h["version"]) != integer(b["expected"]) {
			abort("VERSION_CONFLICT", 409)
		}
		sources := object(h["sources"])
		name := source + ":" + incident
		if blocked {
			sources[name] = source
		} else {
			delete(sources, name)
		}
		values := []any{}
		for _, v := range sources {
			values = append(values, v)
		}
		bs := []string{}
		if release != "" {
			if len(values) > 0 {
				bs = append(bs, "rel#security")
			}
		} else {
			if includes(values, "M4") {
				bs = append(bs, "form#paused")
			}
			if includes(values, "M5") {
				bs = append(bs, "form#suspended")
			}
		}
		u.exec(`UPDATE object_security SET version=version+1,sources=? WHERE key=? AND version=?`, string(canon(sources)), h["key"], integer(b["expected"]))
		if u.exec(`UPDATE gates SET blockers=? WHERE key=?`, string(canon(bs)), h["key"]) != 1 {
			abort("E-ADMISSION-UNAVAILABLE", 503)
		}
		u.audit(site, form, "security.hold", name)
		return u.holds(site, form, release)
	}
	abort("NOT_FOUND", 404)
	return nil
}
