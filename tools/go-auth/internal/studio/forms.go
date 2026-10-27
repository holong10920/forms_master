package studio

import (
	"encoding/json"
	"forms-master/go-auth/internal/auth"
	"sort"
	"strings"
)

func (u *unit) draft(site, form string) M {
	u.permit(site, "form:read")
	r := u.one(`SELECT version,definition FROM drafts WHERE site=? AND form=?`, site, form)
	if r == nil {
		abort("NOT_FOUND", 404)
	}
	title := form
	var cloned any
	if meta := u.one(`SELECT title,cloned_from FROM form_meta WHERE site=? AND form=?`, site, form); meta != nil {
		title = text(meta["title"])
		cloned = meta["cloned_from"]
	}
	return M{"version": r["version"], "definition": u.document(text(r["definition"])), "title": title, "clonedFrom": cloned}
}
func (u *unit) blockPolicy(d M) {
	pins := object(object(d["dependencies"])["blocks"])
	for _, v := range pins {
		pin := text(v)
		var entry M
		for _, raw := range list(u.s.catalog["blocks"]) {
			if object(raw)["pin"] == pin {
				entry = object(raw)
			}
		}
		r := u.one(`SELECT digest,state FROM block_status WHERE pin=?`, pin)
		if entry == nil || r == nil || r["digest"] != entry["digest"] {
			abort("E-BLOCK-UNAVAILABLE", 503)
		}
		if r["state"] == "vulnerable" {
			abort("E-BLOCK-VULNERABLE", 409)
		}
		if r["state"] != "published" && r["state"] != "deprecated" {
			abort("E-BLOCK-UNAVAILABLE", 503)
		}
	}
}
func (u *unit) contractFields(d M) []M {
	fields := []M{}
	for _, v := range list(d["fields"]) {
		f := object(v)
		req := f["required"]
		if req != true {
			req = f["requiredWhen"]
			if req == nil {
				req = false
			}
		}
		fields = append(fields, M{"path": f["key"], "identity": f["id"], "type": f["type"], "classification": f["classification"], "required": req})
	}
	for _, raw := range list(d["blockInstances"]) {
		i := object(raw)
		pin := object(object(d["dependencies"])["blocks"])[text(i["block"])]
		var block M
		for _, e := range list(u.s.catalog["blocks"]) {
			entry := object(e)
			if entry["pin"] == pin {
				block = object(entry["block"])
			}
		}
		if block == nil {
			abort("E-BLOCK-PIN", 409)
		}
		alias, iid := text(i["alias"]), text(i["id"])
		fields = append(fields, M{"path": alias, "identity": iid, "type": "blockAlias", "classification": "public", "required": false})
		inputs := M{}
		for k, v := range object(block["inputs"]) {
			x, ok := object(i["inputs"])[k]
			if !ok {
				x = object(v)["default"]
			}
			inputs[k] = x
		}
		for _, raw := range list(block["fields"]) {
			f := object(raw)
			req := f["required"]
			if req != true {
				req = f["requiredWhen"]
				if req == nil {
					req = false
				}
			}
			fields = append(fields, M{"path": alias + "." + text(f["key"]), "identity": iid + ":" + text(f["id"]), "type": f["type"], "inputs": inputs, "classification": f["classification"], "required": req})
		}
	}
	return fields
}
func (u *unit) keyCheck(site, form string, d M, reserve bool) []M {
	fields := u.contractFields(d)
	seen := map[string]bool{}
	for _, f := range fields {
		path, identity := text(f["path"]), text(f["identity"])
		if seen[path] {
			abort("KEY_COLLISION", 409)
		}
		seen[path] = true
		prior := u.one(`SELECT identity FROM key_ledger WHERE site=? AND form=? AND path=?`, site, form, path)
		if prior != nil && prior["identity"] != identity {
			abort("KEY_COLLISION", 409)
		}
		shape := u.one(`SELECT type FROM identity_types WHERE site=? AND form=? AND identity=?`, site, form, identity)
		if shape != nil && shape["type"] != f["type"] {
			abort("BREAKING_FIELD_REPLACEMENT_REQUIRED", 409)
		}
		old := []any{}
		for _, r := range u.rows(`SELECT path FROM key_ledger WHERE site=? AND form=? AND identity=? AND path<>? ORDER BY path`, site, form, identity, path) {
			old = append(old, r["path"])
		}
		f["renamedFrom"] = old
		if reserve {
			u.exec(`INSERT OR IGNORE INTO key_ledger VALUES(?,?,?,?)`, site, form, path, identity)
			u.exec(`INSERT OR IGNORE INTO identity_types VALUES(?,?,?,?)`, site, form, identity, f["type"])
		}
	}
	return fields
}
func (u *unit) contract(site, form string) M {
	d := u.draft(site, form)
	fields := u.keyCheck(site, form, object(d["definition"]), false)
	active := u.active(site, form)
	before := M{}
	if active["candidateId"] != nil {
		r := u.one(`SELECT review FROM managed_releases WHERE id=?`, active["candidateId"])
		if r != nil {
			c := u.one(`SELECT document FROM review_contracts WHERE id=?`, r["review"])
			var old []any
			if c != nil {
				old = list(u.document(text(c["document"]))["fields"])
			} else {
				review := u.review(text(r["review"]))
				for _, f := range u.contractFields(object(review["definition"])) {
					old = append(old, f)
				}
			}
			for _, f := range old {
				v := object(f)
				delete(v, "renamedFrom")
				before[text(v["identity"])] = v
			}
		}
	}
	after := M{}
	for _, f := range fields {
		copy := M{}
		for k, v := range f {
			if k != "renamedFrom" {
				copy[k] = v
			}
		}
		after[text(f["identity"])] = copy
	}
	changed := []any{}
	if len(active) > 0 {
		keys := map[string]bool{}
		for k := range before {
			keys[k] = true
		}
		for k := range after {
			keys[k] = true
		}
		sorted := []string{}
		for k := range keys {
			sorted = append(sorted, k)
		}
		sort.Strings(sorted)
		for _, k := range sorted {
			if digest(before[k]) != digest(after[k]) {
				changed = append(changed, M{"identity": k, "before": before[k], "after": after[k]})
			}
		}
	}
	return M{"fields": fields, "changes": changed, "ackRequired": len(changed) > 0}
}
func (u *unit) save(b M) M {
	site, form := text(b["site"]), text(b["form"])
	expected := integer(b["expected"])
	cap := "form:edit"
	if expected == 0 {
		cap = "form:create"
	}
	u.permit(site, cap)
	d := object(b["definition"])
	if d["siteId"] != site || d["formId"] != form {
		abort("FORM_SCOPE", 403)
	}
	if len(canon(d)) > 2000000 {
		abort("DEFINITION_TOO_LARGE", 413)
	}
	if title, has := b["title"]; has {
		if _, ok := title.(string); !ok || len([]rune(text(title))) > 200 || strings.TrimSpace(text(title)) == "" {
			abort("FORM_TITLE", 400)
		}
	}
	u.build("schema", d, false, false)
	u.permit(site, cap)
	u.keyCheck(site, form, d, false)
	if prior := u.one(`SELECT definition FROM drafts WHERE site=? AND form=?`, site, form); prior != nil {
		rank := map[string]int{"public": 0, "personal": 1, "secret": 2}
		old := M{}
		for _, f := range u.contractFields(u.document(text(prior["definition"]))) {
			old[text(f["identity"])] = f
		}
		for _, f := range u.contractFields(d) {
			if v := object(old[text(f["identity"])]); len(v) > 0 {
				a, aok := rank[text(f["classification"])]
				if !aok {
					a = -1
				}
				b, bok := rank[text(v["classification"])]
				if !bok {
					b = -1
				}
				if a < b {
					abort("CLASSIFICATION_DOWNGRADE_FORBIDDEN", 403)
				}
			}
		}
	}
	stored := u.storeDocument(d)
	var count int
	if expected == 0 {
		count = u.exec(`INSERT OR IGNORE INTO drafts VALUES(?,?,1,?,?)`, site, form, stored, u.user.Subject)
	} else {
		count = u.exec(`UPDATE drafts SET definition=?,version=version+1,author=? WHERE site=? AND form=? AND version=?`, stored, u.user.Subject, site, form, expected)
	}
	if count != 1 {
		abort("VERSION_CONFLICT", 409)
	}
	if title, ok := b["title"]; ok {
		u.exec(`INSERT INTO form_meta VALUES(?,?,?,NULL) ON CONFLICT(site,form) DO UPDATE SET title=excluded.title`, site, form, strings.TrimSpace(text(title)))
	}
	if expected == 0 {
		u.exec(`INSERT OR IGNORE INTO gates VALUES(?,'[]')`, "form:"+site+":"+form)
		u.exec(`INSERT OR IGNORE INTO object_security VALUES(?,1,'{}')`, "form:"+site+":"+form)
	}
	u.exec(`DELETE FROM previews WHERE site=? AND form=?`, site, form)
	u.audit(site, form, "draft.save", fmtInt(expected+1))
	return u.draft(site, form)
}
func fmtInt(n int) string { b, _ := json.Marshal(n); return string(b) }
func cloneDefinition(source M, form string) M {
	ids := map[string]string{}
	var collect func(any)
	collect = func(v any) {
		switch x := v.(type) {
		case map[string]any:
			if s := text(x["id"]); strings.HasPrefix(s, "fld_") || strings.HasPrefix(s, "grp_") || strings.HasPrefix(s, "stp_") || strings.HasPrefix(s, "inst_") {
				ids[s] = strings.SplitN(s, "_", 2)[0] + "_" + persistenceHash(auth.Random())[:32]
			}
			for _, v := range x {
				collect(v)
			}
		case []any:
			for _, v := range x {
				collect(v)
			}
		}
	}
	collect(source)
	for k := range object(source["conditions"]) {
		ids[k] = strings.SplitN(k, "_", 2)[0] + "_" + persistenceHash(auth.Random())[:32]
	}
	replace := func(s string) string {
		if v, ok := ids[s]; ok {
			return v
		}
		return s
	}
	var remap func(any, string) any
	remap = func(v any, key string) any {
		switch x := v.(type) {
		case map[string]any:
			if key == "const" {
				return x
			}
			m := M{}
			for k, v := range x {
				next := k
				if key == "conditions" {
					next = replace(k)
				}
				m[next] = remap(v, k)
			}
			return m
		case []any:
			a := []any{}
			for _, v := range x {
				a = append(a, remap(v, key))
			}
			return a
		case string:
			switch key {
			case "id", "cond", "block", "to", "default", "postalAddressTarget":
				return replace(x)
			case "ref", "field":
				if strings.HasPrefix(x, "$local:") {
					return "$local:" + replace(x[7:])
				}
				if i := strings.Index(x, ":@"); i >= 0 {
					return replace(x[:i]) + x[i:]
				}
			}
		}
		return v
	}
	result := object(remap(source, ""))
	result["formId"] = form
	return result
}
