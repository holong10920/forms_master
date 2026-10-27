package studio

import (
	"context"
	"encoding/json"
	"forms-master/go-auth/internal/compiler"
	"forms-master/go-auth/internal/persistence"
	"io"
	"net/http"
	"regexp"
	"strings"
)

var sitePattern = regexp.MustCompile(`^site_[a-z0-9_]+$`)
var formPattern = regexp.MustCompile(`^frm_[a-z0-9_]+$`)

func respond(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "no-store")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}
func (s *Service) HTTP(w http.ResponseWriter, r *http.Request, user persistence.User, secret string) {
	if r.URL.Path == "/api/health" {
		respond(w, 200, M{"status": "ok", "backend": "go", "pythonRuntime": false})
		return
	}
	op := strings.TrimPrefix(r.URL.Path, "/api/")
	var b M = M{}
	if r.Method == "GET" {
		if op != "session" && op != "schema" && op != "catalog" {
			respond(w, 405, M{"code": "METHOD_NOT_ALLOWED"})
			return
		}
	} else if r.Method == "POST" {
		r.Body = http.MaxBytesReader(w, r.Body, 2000000)
		dec := json.NewDecoder(r.Body)
		if e := dec.Decode(&b); e != nil || b == nil {
			respond(w, 400, M{"code": "INVALID_REQUEST"})
			return
		}
		var extra any
		if dec.Decode(&extra) != io.EOF {
			respond(w, 400, M{"code": "INVALID_REQUEST"})
			return
		}
	} else {
		respond(w, 405, M{"code": "METHOD_NOT_ALLOWED"})
		return
	}
	if r.Method == "POST" && (op == "session" || op == "schema" || op == "catalog") {
		respond(w, 405, M{"code": "METHOD_NOT_ALLOWED"})
		return
	}
	required := map[string][]string{
		"list": {"site"}, "get": {"site", "form"}, "save": {"site", "form", "expected", "definition"}, "clone": {"site", "form", "release", "title"}, "delete": {"site", "form", "expected"}, "contract": {"site", "form"}, "validate": {"site", "form"}, "review": {"site", "form", "version"}, "preview": {"site", "form"}, "history": {"site", "form"}, "rollback": {"site", "form", "release", "expected"}, "review.get": {"id"}, "approve": {"id"}, "reject": {"id"}, "recheck": {"id"}, "publish": {"id"}, "publication.get": {"operation"}, "publication.cancel": {"operation"}, "preview.status": {"previewSessionId"}, "policy.get": {"site"}, "policy.change": {"site", "expected", "source", "value"}, "policy.repair": {"site", "expected"}, "policy.ledger": {"site", "seq", "state", "commit"}, "deployment.get": {"site"}, "deployment.change": {"site", "expected", "adapters"}, "hold.get": {"site", "form"}, "hold.change": {"site", "form", "expected", "source", "incident", "blocked"}, "submissions.list": {"site", "form"},
	}
	for _, key := range required[op] {
		if _, ok := b[key]; !ok {
			respond(w, 400, M{"code": "INVALID_REQUEST"})
			return
		}
	}
	for _, pair := range []struct {
		key     string
		pattern *regexp.Regexp
	}{{"site", sitePattern}, {"form", formPattern}} {
		if v, ok := b[pair.key]; ok && !pair.pattern.MatchString(text(v)) {
			respond(w, 400, M{"code": "INVALID_REQUEST"})
			return
		}
	}
	for _, key := range []string{"expected", "version", "seq"} {
		if v, ok := b[key]; ok {
			n, is := v.(float64)
			if !is || n < 0 || n > 9007199254740991 || float64(int64(n)) != n {
				respond(w, 400, M{"code": "INVALID_REQUEST"})
				return
			}
		}
	}
	result, err := s.Execute(r.Context(), user, persistenceHash(secret), op, b)
	if err != nil {
		if failure, ok := err.(compiler.Failure); ok {
			respond(w, 422, M{"code": "DEFINITION_INVALID", "diagnostics": failure.Diagnostics})
			return
		}
		status, code := 503, "STORE_UNAVAILABLE"
		if f, ok := err.(Fault); ok {
			status, code = f.Status, f.Code
		}
		respond(w, status, M{"code": code, "retryable": status == 503})
		return
	}
	if op == "session" {
		object(result)["csrf"] = persistence.Hash("csrf:" + secret)
	}
	respond(w, 200, result)
}
func (s *Service) Execute(ctx context.Context, user persistence.User, session, op string, b M) (any, error) {
	if op == "publish" {
		return s.publish(ctx, user, session, text(b["id"]))
	}
	return s.with(ctx, user, session, func(u *unit) any {
		site, form := text(b["site"]), text(b["form"])
		switch op {
		case "session":
			return M{"user": user.Subject, "role": user.Role, "sites": u.sites()}
		case "schema":
			return s.catalog["schema"]
		case "catalog":
			blocks := []M{}
			for _, raw := range list(s.catalog["blocks"]) {
				e := object(raw)
				copy := M{}
				for k, v := range e {
					copy[k] = v
				}
				state := u.one(`SELECT state,version FROM block_status WHERE pin=? AND digest=?`, e["pin"], e["digest"])
				copy["state"] = "unknown"
				copy["version"] = 0
				if state != nil {
					copy["state"] = state["state"]
					copy["version"] = state["version"]
				}
				blocks = append(blocks, copy)
			}
			return M{"themes": s.catalog["themes"], "texts": s.catalog["texts"], "blocks": blocks}
		case "list":
			u.permit(site, "form:read")
			return M{"forms": u.rows(`SELECT d.form AS formId,d.version,COALESCE(m.title,d.form) AS title FROM drafts d LEFT JOIN form_meta m ON m.site=d.site AND m.form=d.form WHERE d.site=? ORDER BY d.form`, site)}
		case "get":
			return u.draft(site, form)
		case "save":
			return u.save(b)
		case "contract":
			return u.contract(site, form)
		case "clone":
			u.permit(site, "form:create")
			r := u.one(`SELECT r.definition FROM managed_releases m JOIN reviews r ON r.id=m.review WHERE m.id=? AND m.site=? AND r.site=? AND r.state='PUBLISHED'`, b["release"], site, site)
			if r == nil {
				abort("NOT_FOUND", 404)
			}
			d := cloneDefinition(u.document(text(r["definition"])), form)
			u.dependencies(d)
			result := u.save(M{"site": site, "form": form, "expected": float64(0), "definition": d, "title": b["title"]})
			u.exec(`UPDATE form_meta SET cloned_from=? WHERE site=? AND form=?`, b["release"], site, form)
			u.audit(site, form, "draft.clone", text(b["release"]))
			result["clonedFrom"] = b["release"]
			return result
		case "delete":
			u.permit(site, "form:edit")
			if len(u.active(site, form)) > 0 {
				abort("PUBLISHED_FORM_DELETE_FORBIDDEN", 409)
			}
			if u.exec(`DELETE FROM drafts WHERE site=? AND form=? AND version=?`, site, form, integer(b["expected"])) != 1 {
				abort("VERSION_CONFLICT", 409)
			}
			u.exec(`DELETE FROM previews WHERE site=? AND form=?`, site, form)
			u.audit(site, form, "draft.delete", "")
			return M{"ok": true}
		case "validate":
			u.permit(site, "form:edit")
			d := u.draft(site, form)
			u.build("lower", object(d["definition"]), false, false)
			return M{"diagnostics": []any{}}
		case "review":
			return u.openReview(b)
		case "review.get":
			r := u.review(text(b["id"]))
			if site != "" && r["site"] != site || form != "" && r["form"] != form {
				abort("FORM_SCOPE", 403)
			}
			return r
		case "approve":
			return u.approve(b)
		case "reject":
			r := u.review(text(b["id"]))
			u.permit(text(r["site"]), "form:review")
			if r["author"] == user.Subject {
				abort("FORBIDDEN", 403)
			}
			if r["state"] != "OPEN" {
				return Fault{"REVIEW_STALE", 409}
			}
			u.exec(`UPDATE reviews SET state='REJECTED' WHERE id=? AND state='OPEN'`, b["id"])
			u.audit(text(r["site"]), text(r["form"]), "review.reject", text(b["id"]))
			return u.review(text(b["id"]))
		case "recheck":
			r := u.review(text(b["id"]))
			u.permit(text(r["site"]), "form:review")
			if r["staleReason"] == "pointer" || !(r["state"] == "STALE" || r["state"] == "OPEN") {
				return Fault{"REVIEW_STALE", 409}
			}
			u.dependencies(object(r["definition"]))
			u.build("compile", object(r["definition"]), false, false)
			u.exec(`UPDATE review_meta SET platform=?,stale_reason='' WHERE id=?`, s.fingerprint(), b["id"])
			u.exec(`UPDATE reviews SET state='OPEN',approver='' WHERE id=?`, b["id"])
			u.audit(text(r["site"]), text(r["form"]), "review.recheck", text(b["id"]))
			return u.review(text(b["id"]))
		case "preview":
			return u.preview(b)
		case "preview.status":
			p := u.one(`SELECT token FROM previews WHERE token=? AND session=?`, persistenceHash(text(b["previewSessionId"])), session)
			if p == nil {
				return M{"active": false, "code": "PREVIEW_SESSION_EXPIRED"}
			}
			var failure *Fault
			func() {
				defer func() {
					if v := recover(); v != nil {
						f, ok := v.(Fault)
						if !ok {
							panic(v)
						}
						failure = &f
					}
				}()
				u.checkPreview(text(b["previewSessionId"]))
			}()
			if failure != nil {
				u.exec(`DELETE FROM previews WHERE token=?`, persistenceHash(text(b["previewSessionId"])))
				return M{"active": false, "code": failure.Code}
			}
			return M{"active": true}
		case "history":
			u.permit(site, "form:read")
			for _, r := range u.rows(`SELECT id FROM reviews WHERE site=? AND form=?`, site, form) {
				u.review(text(r["id"]))
			}
			operations := []M{}
			for _, r := range u.rows(`SELECT id FROM operations WHERE site=? AND form=? ORDER BY rowid DESC`, site, form) {
				operations = append(operations, u.operation(text(r["id"])))
			}
			return M{"operations": operations, "active": u.active(site, form), "releases": u.rows(`SELECT id,review,at FROM managed_releases WHERE site=? AND form=? ORDER BY at DESC`, site, form), "reviews": u.rows(`SELECT r.id,r.state,r.author,COALESCE(m.stale_reason,'') AS staleReason FROM reviews r LEFT JOIN review_meta m ON m.id=r.id WHERE r.site=? AND r.form=? ORDER BY r.rowid DESC`, site, form), "audit": u.rows(`SELECT action,actor,target FROM audit WHERE site=? AND form=? ORDER BY id DESC LIMIT 50`, site, form)}
		case "rollback":
			return u.rollback(b)
		case "publication.get":
			return u.operation(text(b["operation"]))
		case "publication.cancel":
			return u.failOperation(text(b["operation"]), "CANCELLED_BY_USER", true)
		case "policy.get", "policy.change", "policy.ledger", "policy.repair", "deployment.get", "deployment.change", "hold.change":
			return u.policyOperation(op, b)
		case "hold.get":
			u.permit(site, "form:read")
			return u.holds(site, form, text(b["release"]))
		case "submissions.list":
			u.permit(site, "submissions:read")
			return M{"submissions": u.rows(`SELECT id,release,receipt FROM submissions WHERE site=? AND form=?`, site, form)}
		}
		abort("NOT_FOUND", 404)
		return nil
	})
}
