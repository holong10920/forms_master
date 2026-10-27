package studio

import (
	"context"
	"encoding/json"
	"forms-master/go-auth/internal/engine"
	"forms-master/go-auth/internal/persistence"
	"path/filepath"
	"time"
)

func (u *unit) pointer(site, form, target string, expected int) {
	n := 0
	if expected == 0 {
		n = u.exec(`INSERT OR IGNORE INTO local_active VALUES(?,?,?,1)`, site, form, target)
	} else {
		n = u.exec(`UPDATE local_active SET candidate_id=?,version=version+1 WHERE site_id=? AND form_id=? AND version=?`, target, site, form, expected)
	}
	if n != 1 {
		abort("POINTER_CHANGED", 409)
	}
}
func (u *unit) failOperation(opid, code string, cancel bool) M {
	op := u.operation(opid)
	u.permit(text(op["site"]), "form:publish")
	state := text(op["state"])
	if state != "BUILDING" && state != "VERIFYING" && state != "ACTIVATING" {
		return op
	}
	stale := u.head(text(op["site"]), text(op["form"])) != numberInt(op["base"])
	next, reviewState := "FAILED", "APPROVED"
	if cancel {
		next = "CANCELLED"
	}
	if stale {
		next = "SUPERSEDED"
		reviewState = "STALE"
	}
	if len(code) > 100 {
		code = code[:100]
	}
	u.exec(`UPDATE operations SET state=?,version=version+1,error=?,updated=? WHERE id=?`, next, code, float64(time.Now().UnixMilli())/1000, opid)
	u.exec(`UPDATE reviews SET state=? WHERE id=? AND state='PUBLISHING'`, reviewState, op["review"])
	if stale {
		u.exec(`UPDATE review_meta SET stale_reason='pointer' WHERE id=?`, op["review"])
	}
	u.audit(text(op["site"]), text(op["form"]), "publication."+next, opid)
	return u.operation(opid)
}
func (s *Service) publish(ctx context.Context, user persistence.User, session, rid string) (any, error) {
	started, err := s.with(ctx, user, session, func(u *unit) any { return u.beginPublication(rid) })
	if err != nil {
		return nil, err
	}
	op := object(started)
	if op["state"] == "ACTIVATED" {
		return M{"candidateId": op["candidateId"], "version": numberInt(op["base"]) + 1, "url": s.customerURL(text(op["candidateId"]))}, nil
	}
	if op["state"] != "BUILDING" {
		return nil, Fault{"OPERATION_FENCED", 409}
	}
	reviewed, err := s.with(ctx, user, session, func(u *unit) any { return u.review(rid) })
	if err != nil {
		return nil, err
	}
	r := object(reviewed)
	built, err := s.Compiler.Call(ctx, "release", r["definition"], false, false)
	if err != nil {
		_, _ = s.with(ctx, user, session, func(u *unit) any { return u.failOperation(text(op["id"]), "BUILD_FAILED", false) })
		return nil, Fault{"BUILD_FAILED", 422}
	}
	candidate := text(built["candidateId"])
	if !releaseID.MatchString(candidate) {
		return nil, Fault{"BUILD_FAILED", 422}
	}
	result, err := s.with(ctx, user, session, func(u *unit) any {
		// The session and role must remain valid across an expensive external build.
		var active int
		if e := s.Auth.DB.QueryRowContext(ctx, `SELECT count(*) FROM sessions x JOIN users y ON y.id=x.user_id WHERE x.verifier=? AND x.revoked_at IS NULL AND x.expires_at>unixepoch() AND y.status='active' AND y.role='admin'`, session).Scan(&active); e != nil || active != 1 {
			abort("UNAUTHORIZED", 401)
		}
		current := u.operation(text(op["id"]))
		u.permit(text(current["site"]), "form:publish")
		if current["state"] != "BUILDING" || numberInt(current["fence"]) != numberInt(op["fence"]) {
			abort("OPERATION_FENCED", 409)
		}
		u.exec(`UPDATE operations SET state='VERIFYING',version=version+1,candidate=?,updated=? WHERE id=? AND version=?`, candidate, float64(time.Now().UnixMilli())/1000, op["id"], op["fence"])
		snapshot := u.review(rid)
		site, form := text(snapshot["site"]), text(snapshot["form"])
		if snapshot["state"] != "PUBLISHING" || u.head(site, form) != numberInt(snapshot["base"]) {
			abort("POINTER_CHANGED", 409)
		}
		if snapshot["platform"] != s.fingerprint() {
			abort("PLATFORM_CHANGED", 409)
		}
		path := filepath.Join(s.Candidates, candidate)
		manifest, _, lock := verifyCandidate(path)
		if object(manifest["inputs"])["previewProjection"] != nil {
			abort("PREVIEW_ONLY", 403)
		}
		if object(manifest["form"])["siteId"] != site || object(manifest["form"])["formId"] != form || object(manifest["inputs"])["definition"] != "sha256:"+text(snapshot["digest"]) {
			abort("RELEASE_SCOPE", 403)
		}
		for _, a := range list(manifest["inventory"]) {
			name := text(object(a)["path"])
			if e := writeOnce(filepath.Join(s.Data, "objects"), "releases/"+candidate+"/"+name, mustRead(path, name)); e != nil {
				abort("E-ASSET-INTEGRITY", 503)
			}
		}
		if e := writeOnce(filepath.Join(s.Data, "objects"), "releases/"+candidate+"/index.html", mustRead(path, "index.html")); e != nil {
			abort("E-INDEX-INTEGRITY", 503)
		}
		for _, name := range []string{"candidate-manifest.json", "data-contract.json", "chunk-manifest.json", "capability-lock.json", "block-lock.json", "local-integrity.json", "lrm.json", "chunk-plan.json", "semantic-fixtures.json", "attestation.json", "provenance.json"} {
			if e := writeOnce(filepath.Join(s.Data, "objects"), "releases/"+candidate+"/_private/"+name, mustRead(filepath.Join(filepath.Dir(s.Candidates), "private", candidate), name)); e != nil {
				abort("E-PRIVATE-INTEGRITY", 503)
			}
		}
		verifyCandidate(filepath.Join(s.Data, "objects/releases", candidate))
		u.dependencies(object(snapshot["definition"]))
		u.keyCheck(site, form, object(snapshot["definition"]), true)
		bindings := []any{}
		if len(list(lock["bindings"])) > 0 {
			bindings = append(bindings, fbks[0], fbks[1])
		}
		bindings = append(bindings, effect)
		for _, key := range []string{"form:" + site + ":" + form, "release:" + candidate} {
			u.exec(`INSERT OR IGNORE INTO gates VALUES(?,'[]')`, key)
			u.exec(`INSERT OR IGNORE INTO object_security VALUES(?,1,'{}')`, key)
		}
		u.check(site, form, candidate, bindings)
		u.exec(`INSERT OR IGNORE INTO local_releases VALUES(?,?,?)`, candidate, site, form)
		u.exec(`INSERT OR IGNORE INTO managed_releases VALUES(?,?,?,?,?,?)`, candidate, site, form, rid, string(canon(bindings)), float64(time.Now().UnixMilli())/1000)
		u.pointer(site, form, candidate, numberInt(snapshot["base"]))
		u.exec(`UPDATE reviews SET state='PUBLISHED' WHERE id=?`, rid)
		u.exec(`UPDATE operations SET state='ACTIVATED',version=version+1,updated=? WHERE id=?`, float64(time.Now().UnixMilli())/1000, op["id"])
		u.audit(site, form, "release.activate", candidate)
		return M{"candidateId": candidate, "version": numberInt(snapshot["base"]) + 1, "operation": op["id"], "url": s.customerURL(candidate)}
	})
	if err != nil {
		_, _ = s.with(context.WithoutCancel(ctx), user, session, func(u *unit) any { return u.failOperation(text(op["id"]), "VERIFICATION_FAILED", false) })
	}
	return result, err
}
func (s *Service) customerURL(id string) string {
	return "http://127.0.0.1:4183/r/" + id + "/index.html"
}
func (u *unit) rollback(b M) M {
	site, form, release := text(b["site"]), text(b["form"]), text(b["release"])
	u.permit(site, "form:rollback")
	r := u.one(`SELECT fbks FROM managed_releases WHERE id=? AND site=? AND form=?`, release, site, form)
	if r == nil {
		abort("ROLLBACK_TARGET_INELIGIBLE", 409)
	}
	manifest, _, _ := verifyCandidate(filepath.Join(u.s.Data, "objects/releases", release))
	if object(manifest["inputs"])["blockLock"] != nil {
		var pins []any
		raw := mustRead(filepath.Join(u.s.Data, "objects/releases", release), "_private/block-lock.json")
		if json.Unmarshal(raw, &pins) != nil {
			abort("E-BLOCK-LOCK-INTEGRITY", 503)
		}
		blocks := M{}
		for i, p := range pins {
			blocks[fmtInt(i)] = object(p)["pin"]
		}
		u.blockPolicy(M{"dependencies": M{"blocks": blocks}})
	}
	u.check(site, form, release, list(decodeValue(r["fbks"])))
	u.pointer(site, form, release, integer(b["expected"]))
	u.audit(site, form, "release.rollback", release)
	return M{"candidateId": release, "version": integer(b["expected"]) + 1}
}
func verifySemantics(ir M, raw []byte, irDigest any) {
	fixtures := parse(raw)
	if fixtures["irDigest"] != irDigest {
		abort("E-SEMANTIC-CONFORMANCE", 503)
	}
	for _, c := range list(fixtures["cases"]) {
		test := object(c)
		if digest(engine.Case(ir, test)) != digest(test["expected"]) {
			abort("E-SEMANTIC-CONFORMANCE", 503)
		}
	}
}
