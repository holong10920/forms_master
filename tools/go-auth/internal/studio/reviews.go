package studio

import (
	"database/sql"
	"errors"
	"forms-master/go-auth/internal/auth"
	"forms-master/go-auth/internal/compiler"
	"path/filepath"
	"time"
)

func (u *unit) review(rid string) M {
	r := u.one(`SELECT id,site,form,version,definition,digest,author,approver,state,base FROM reviews WHERE id=?`, rid)
	if r == nil {
		abort("NOT_FOUND", 404)
	}
	site, form := text(r["site"]), text(r["form"])
	u.permit(site, "form:read")
	r["definition"] = u.document(text(r["definition"]))
	meta := u.one(`SELECT platform,stale_reason FROM review_meta WHERE id=?`, rid)
	r["platform"] = "legacy-unpinned"
	r["staleReason"] = ""
	if meta != nil {
		r["platform"] = meta["platform"]
		r["staleReason"] = meta["stale_reason"]
	}
	state := text(r["state"])
	if state == "OPEN" || state == "APPROVED" || state == "STALE" {
		reason := text(r["staleReason"])
		if numberInt(r["base"]) != u.head(site, form) {
			reason = "pointer"
		} else if state == "OPEN" || state == "APPROVED" {
			var depFailure *Fault
			func() {
				defer func() {
					if p := recover(); p != nil {
						f, ok := p.(Fault)
						if !ok {
							panic(p)
						}
						depFailure = &f
					}
				}()
				u.dependencies(object(r["definition"]))
			}()
			if depFailure != nil {
				if depFailure.Code != "REVIEW_RECHECK_REQUIRED" && depFailure.Code != "ADAPTER_NOT_DEPLOYED" && depFailure.Code != "E-CAPABILITY-BLOCKED" {
					panic(*depFailure)
				}
				reason = "dependency"
			}
			if reason == "" && r["platform"] != u.s.fingerprint() {
				reason = "platform"
			}
		}
		if reason != "" {
			u.exec(`UPDATE reviews SET state='STALE' WHERE id=?`, rid)
			u.exec(`INSERT INTO review_meta VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET stale_reason=excluded.stale_reason`, rid, r["platform"], reason)
			r["state"] = "STALE"
			r["staleReason"] = reason
		}
	}
	return r
}
func (u *unit) openReview(b M) M {
	site, form := text(b["site"]), text(b["form"])
	u.permit(site, "form:edit")
	d := u.draft(site, form)
	if numberInt(d["version"]) != integer(b["version"]) {
		abort("VERSION_CONFLICT", 409)
	}
	definition := object(d["definition"])
	u.dependencies(definition)
	contract := u.contract(site, form)
	if contract["ackRequired"] == true && b["dataContractAck"] != true {
		abort("DATA_CONTRACT_ACK_REQUIRED", 409)
	}
	u.build("compile", definition, false, false)
	rid := "review_" + auth.Random()[:24]
	u.exec(`INSERT INTO reviews VALUES(?,?,?,?,?,?,?,?,?,?)`, rid, site, form, d["version"], u.storeDocument(definition), digest(definition), u.user.Subject, "", "OPEN", u.head(site, form))
	u.exec(`INSERT INTO review_meta VALUES(?,?,'')`, rid, u.s.fingerprint())
	u.exec(`INSERT INTO review_contracts VALUES(?,?)`, rid, u.storeDocument(contract))
	u.audit(site, form, "review.open", rid)
	return M{"id": rid, "state": "OPEN"}
}
func (u *unit) operation(opid string) M {
	r := u.one(`SELECT id,review,site,form,state,version AS fence,candidate AS candidateId,error,updated,base,platform FROM operations WHERE id=?`, opid)
	if r == nil {
		abort("NOT_FOUND", 404)
	}
	u.permit(text(r["site"]), "form:read")
	return r
}
func (u *unit) approve(b M) any {
	r := u.review(text(b["id"]))
	u.permit(text(r["site"]), "form:review")
	if r["author"] == u.user.Subject || b["dataContractAck"] != true {
		abort("FORBIDDEN", 403)
	}
	if r["state"] != "OPEN" {
		code := "REVIEW_STALE"
		if r["staleReason"] == "dependency" || r["staleReason"] == "platform" {
			code = "REVIEW_RECHECK_REQUIRED"
		}
		return Fault{code, 409}
	}
	u.exec(`UPDATE reviews SET state='APPROVED',approver=? WHERE id=? AND state='OPEN'`, u.user.Subject, b["id"])
	u.audit(text(r["site"]), text(r["form"]), "review.approve", text(b["id"]))
	return u.review(text(b["id"]))
}
func (u *unit) build(action string, d M, partial, blocked bool) M {
	result, err := u.s.Compiler.Call(u.ctx, action, d, partial, blocked)
	if err != nil {
		if failure, ok := err.(compiler.Failure); ok {
			panic(failure)
		}
		abort("E-COMPILER-UNAVAILABLE", 503)
	}
	if u.session != "" {
		var userID, subject, role string
		err := u.s.Auth.DB.QueryRowContext(u.ctx, `SELECT u.id,u.identity_subject,u.role FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.verifier=? AND s.revoked_at IS NULL AND s.expires_at>unixepoch() AND u.status='active'`, u.session).Scan(&userID, &subject, &role)
		if errors.Is(err, sql.ErrNoRows) {
			abort("UNAUTHORIZED", 401)
		}
		if err != nil {
			abort("STORE_UNAVAILABLE", 503)
		}
		if userID != u.user.ID || subject != u.user.Subject || role != u.user.Role {
			abort("FORBIDDEN", 403)
		}
	}
	return result
}
func (u *unit) beginPublication(rid string) any {
	r := u.review(rid)
	site, form := text(r["site"]), text(r["form"])
	u.permit(site, "form:publish")
	if r["state"] == "PUBLISHING" || r["state"] == "PUBLISHED" {
		if old := u.one(`SELECT id FROM operations WHERE review=? ORDER BY rowid DESC LIMIT 1`, rid); old != nil {
			return u.operation(text(old["id"]))
		}
		return Fault{"REVIEW_STALE", 409}
	}
	if r["state"] != "APPROVED" {
		return Fault{"REVIEW_STALE", 409}
	}
	u.dependencies(object(r["definition"]))
	key := "form:" + site + ":" + form
	if u.one(`SELECT 1 FROM gates WHERE key=?`, key) != nil {
		u.gate(key)
	}
	u.gate("fbk:" + effect)
	opid := "op_" + auth.Random()[:24]
	u.exec(`INSERT INTO operations VALUES(?,?,?,?,?,1,'','',?,?,?)`, opid, rid, site, form, "BUILDING", float64(time.Now().UnixMilli())/1000, r["base"], r["platform"])
	u.exec(`UPDATE reviews SET state='PUBLISHING' WHERE id=? AND state='APPROVED'`, rid)
	u.audit(site, form, "publication.begin", opid)
	return u.operation(opid)
}
func (u *unit) preview(b M) M {
	site, form := text(b["site"]), text(b["form"])
	u.permit(site, "form:read")
	var d M
	version := -1
	partial := false
	blocked := false
	if rid := text(b["id"]); rid != "" {
		r := u.review(rid)
		if r["site"] != site || r["form"] != form {
			abort("FORM_SCOPE", 403)
		}
		u.permit(site, "form:review")
		d = object(r["definition"])
	} else {
		u.permit(site, "form:edit")
		draft := u.draft(site, form)
		d = object(draft["definition"])
		version = numberInt(draft["version"])
		partial = true
		if len(object(object(d["dependencies"])["capabilities"])) > 0 {
			u.ingest()
			blocked = len(blockers(u.policy())) > 0
		}
	}
	u.blockPolicy(d)
	result := u.build("compile", d, partial, blocked)
	candidate := text(result["candidateId"])
	if !releaseID.MatchString(candidate) {
		abort("BUILD_FAILED", 422)
	}
	manifest, _, _ := verifyCandidate(filepath.Join(u.s.Candidates, candidate))
	if object(manifest["form"])["siteId"] != site || object(manifest["form"])["formId"] != form {
		abort("FORM_SCOPE", 403)
	}
	token := auth.Random()
	u.exec(`INSERT INTO previews VALUES(?,?,?,?,?,?,?)`, persistenceHash(token), u.session, site, form, version, candidate, float64(time.Now().Unix())+1800)
	u.audit(site, form, "preview.create", "")
	return M{"previewSessionId": token, "diagnostics": result["diagnostics"], "mode": map[bool]string{true: "partial", false: "full"}[result["partial"] == true]}
}
