package studio

import (
	"context"
	"encoding/json"
	"forms-master/go-auth/internal/auth"
	"forms-master/go-auth/internal/engine"
	"forms-master/go-auth/internal/persistence"
	"io"
	"net/http"
	"path/filepath"
	"regexp"
	"strings"
	"time"
)

var publicRoute = regexp.MustCompile(`^/r/((?:dev|rel)_[a-z2-7]{26})/(index\.html|assets/[a-z0-9.-]+\.(?:js|css|json)|api/(?:store-list|postal-lookup|submit))$`)
var activeRoute = regexp.MustCompile(`^/forms/(site_[a-z0-9_]+)/(frm_[a-z0-9_]+)/$`)

func (u *unit) checkPreview(token string) M {
	p := u.one(`SELECT session,site,form,version,candidate,expires FROM previews WHERE token=?`, persistenceHash(token))
	if p == nil {
		abort("PREVIEW_SESSION_EXPIRED", 410)
	}
	expires, _ := p["expires"].(float64)
	if expires < float64(time.Now().Unix()) {
		abort("PREVIEW_SESSION_EXPIRED", 410)
	}
	var id, sub, email, name, role, status string
	err := u.s.Auth.DB.QueryRowContext(u.ctx, `SELECT u.id,u.identity_subject,u.email,u.display_name,u.role,u.status FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.verifier=? AND s.revoked_at IS NULL AND s.expires_at>unixepoch() AND u.status='active'`, p["session"]).Scan(&id, &sub, &email, &name, &role, &status)
	if err != nil {
		abort("PREVIEW_SESSION_EXPIRED", 410)
	}
	parent := u.user
	u.user = persistence.User{ID: id, Subject: sub, Email: email, DisplayName: name, Role: role, Status: status}
	defer func() { u.user = parent }()
	site, form, candidate := text(p["site"]), text(p["form"]), text(p["candidate"])
	u.permit(site, "form:read")
	manifest, _, lock := verifyCandidate(filepath.Join(u.s.Candidates, candidate))
	if object(manifest["form"])["siteId"] != site || object(manifest["form"])["formId"] != form {
		abort("PREVIEW_SESSION_SCOPE", 403)
	}
	if numberInt(p["version"]) >= 0 {
		d := u.draft(site, form)
		if numberInt(d["version"]) != numberInt(p["version"]) || object(manifest["inputs"])["definition"] != "sha256:"+digest(d["definition"]) {
			abort("PREVIEW_SESSION_EXPIRED", 410)
		}
	}
	if u.one(`SELECT 1 FROM gate_intents LIMIT 1`) != nil {
		abort("E-ADMISSION-UNAVAILABLE", 503)
	}
	u.gate("form:" + site + ":" + form)
	for _, binding := range list(lock["bindings"]) {
		key := object(object(binding)["key"])
		if key["facet"] == "server" {
			u.gate("fbk:" + text(key["plugin"]) + "@" + text(key["version"]) + "#" + text(key["capability"]) + "/server")
		}
	}
	if object(manifest["inputs"])["blockLock"] != nil {
		bytes := mustRead(filepath.Join(filepath.Dir(u.s.Candidates), "private", candidate), "block-lock.json")
		var blocks []any
		if json.Unmarshal(bytes, &blocks) != nil {
			abort("E-BLOCK-LOCK-INTEGRITY", 503)
		}
		pins := M{}
		for i, b := range blocks {
			pins[fmtInt(i)] = object(b)["pin"]
		}
		u.blockPolicy(M{"dependencies": M{"blocks": pins}})
	}
	return M{"candidateId": candidate, "partial": object(manifest["inputs"])["previewProjection"] != nil}
}
func (s *Service) Public(preview bool) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := "http://127.0.0.1:4183"
		if preview {
			origin = "http://127.0.0.1:4185"
		}
		expected := strings.TrimPrefix(origin, "http://")
		if r.Host != expected {
			respond(w, 403, M{"code": "HOST"})
			return
		}
		w.Header().Set("Cache-Control", "no-store")
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("Referrer-Policy", "no-referrer")
		w.Header().Set("Cross-Origin-Resource-Policy", "same-origin")
		ancestors := "'none'"
		if preview {
			ancestors = "http://localhost:4180"
		}
		w.Header().Set("Content-Security-Policy", "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors "+ancestors)
		defer func() {
			if p := recover(); p != nil {
				f, ok := p.(Fault)
				if !ok {
					f = Fault{"E-VALIDATION-UNAVAILABLE", 503}
				}
				respond(w, f.Status, M{"ok": false, "errors": []M{{"code": f.Code, "path": ""}}, "payload": M{}})
			}
		}()
		path := r.URL.Path
		if preview && (path == "/" || path == "/preview.js") && r.Method == "GET" {
			if path == "/" {
				w.Header().Set("Content-Type", "text/html; charset=utf-8")
				_, _ = w.Write([]byte(`<!doctype html><html lang="ja"><meta charset="utf-8"><title>Isolated Preview</title><body><main id="app">プレビュー接続中…</main><script type="module" src="/preview.js"></script></body></html>`))
			} else {
				raw := mustRead(s.Root, "tools/go-auth/studio/preview.js")
				w.Header().Set("Content-Type", "text/javascript")
				_, _ = w.Write([]byte(strings.ReplaceAll(string(raw), "http://localhost:4174", "http://localhost:4180")))
			}
			return
		}
		if !preview {
			if match := activeRoute.FindStringSubmatch(path); match != nil && r.Method == "GET" {
				result, err := s.with(r.Context(), persistence.User{}, "", func(u *unit) any { return u.active(match[1], match[2]) })
				if err != nil || object(result)["candidateId"] == nil {
					respond(w, 404, M{"code": "NOT_FOUND"})
					return
				}
				http.Redirect(w, r, "/r/"+text(object(result)["candidateId"])+"/index.html", 302)
				return
			}
		}
		match := publicRoute.FindStringSubmatch(path)
		bootstrap := preview && path == "/api/preview/bootstrap"
		if match == nil && !bootstrap {
			respond(w, 404, M{"code": "NOT_FOUND"})
			return
		}
		candidate, asset := "", ""
		if match != nil {
			candidate, asset = match[1], match[2]
		}
		api := strings.HasPrefix(asset, "api/")
		staticExecutable := preview && !api && (strings.HasSuffix(asset, ".js") || strings.HasSuffix(asset, ".css"))
		if api {
			wanted := "GET"
			if strings.HasSuffix(asset, "submit") {
				wanted = "POST"
			}
			if r.Method != wanted {
				respond(w, 405, M{"code": "METHOD_NOT_ALLOWED"})
				return
			}
		} else if r.Method != "GET" && r.Method != "HEAD" {
			respond(w, 405, M{"code": "METHOD_NOT_ALLOWED"})
			return
		}
		if api || preview && !staticExecutable {
			if r.Header.Get("Origin") != "" && r.Header.Get("Origin") != origin {
				respond(w, 403, M{"code": "ORIGIN"})
				return
			}
			if r.Method == "POST" && r.Header.Get("Origin") != origin {
				respond(w, 403, M{"code": "ORIGIN"})
				return
			}
			if r.Header.Get("Sec-Fetch-Site") != "same-origin" && preview {
				respond(w, 403, M{"code": "ORIGIN"})
				return
			}
		}
		var body M
		if r.Method == "POST" {
			r.Body = http.MaxBytesReader(w, r.Body, 65536)
			decoder := json.NewDecoder(r.Body)
			var extra any
			if decoder.Decode(&body) != nil || decoder.Decode(&extra) != io.EOF {
				respond(w, 400, M{"code": "INVALID_REQUEST"})
				return
			}
		}
		var raw []byte
		var response any
		_, err := s.with(r.Context(), persistence.User{}, "", func(u *unit) any {
			partial := false
			if preview && !staticExecutable {
				auth := u.checkPreview(r.Header.Get("X-Preview-Session"))
				if bootstrap {
					candidate = text(auth["candidateId"])
					asset = "index.html"
				} else if candidate != auth["candidateId"] {
					abort("PREVIEW_SESSION_SCOPE", 403)
				}
				partial = auth["partial"] == true
			}
			base := filepath.Join(s.Data, "objects/releases", candidate)
			if preview {
				base = filepath.Join(s.Candidates, candidate)
			} else if u.one(`SELECT 1 FROM local_releases WHERE candidate_id=?`, candidate) == nil {
				abort("NOT_FOUND", 404)
			}
			manifest, ir, lock := verifyCandidate(base)
			if !api {
				raw = mustRead(base, asset)
				return nil
			}
			if preview && partial && asset == "api/submit" {
				abort("PREVIEW_ONLY", 403)
			}
			if !preview {
				if asset == "api/submit" {
					if old := u.replay(candidate, body); old != nil {
						response = old
						return nil
					}
				}
				if admission := u.admission(candidate); admission == nil {
					abort("E-ADMISSION-UNAVAILABLE", 503)
				}
			}
			if asset == "api/postal-lookup" {
				zip := r.URL.Query().Get("zip")
				if !regexp.MustCompile(`^[0-9]{7}$`).MatchString(zip) {
					abort("POSTAL_INPUT", 400)
				}
				enabled := false
				for _, node := range list(ir["nodes"]) {
					f := object(node)
					if f["type"] == "postal" && text(object(f["config"])["postalAddressTarget"]) != "" {
						enabled = true
					}
				}
				if !enabled {
					abort("CAPABILITY_NOT_DECLARED", 403)
				}
				if zip != "0000000" {
					abort("POSTAL_NOT_FOUND", 404)
				}
				response = M{"address": "東京都 合成市 サンプル町 0-0", "synthetic": true}
				return nil
			}
			if asset == "api/store-list" {
				verifyStoreAdapter(s.Root, lock)
				response = storeRows(text(object(manifest["form"])["siteId"]))
				return nil
			}
			if body == nil || len(body) != 2 || body["payload"] == nil || text(body["idempotencyKey"]) == "" || len(text(body["idempotencyKey"])) > 200 {
				abort("E-REQUEST", 400)
			}
			if payload, ok := body["payload"].(map[string]any); ok {
				if value, has := payload["store"]; has {
					v, is := value.(string)
					if !is || !regexp.MustCompile(`^ST-[0-9]{4}$`).MatchString(v) {
						response = M{"ok": false, "errors": []M{{"code": "storeNotAvailable", "path": "fld_store"}}, "payload": M{}}
						return nil
					}
				}
			}
			result := engine.Submission(ir, body["payload"])
			payload := object(result["payload"])
			if result["ok"] == true && payload["store"] != nil {
				verifyStoreAdapter(s.Root, lock)
				valid := false
				for _, row := range storeRows(text(object(manifest["form"])["siteId"])) {
					if row["id"] == payload["store"] {
						valid = true
					}
				}
				if !valid {
					result = M{"ok": false, "errors": []M{{"code": "storeNotAvailable", "path": "fld_store"}}, "payload": M{}}
				}
			}
			response = result
			if result["ok"] == true && !preview {
				response = u.submit(candidate, body, payload)
			}
			return nil
		})
		if err != nil {
			if f, ok := err.(Fault); ok {
				abort(f.Code, f.Status)
			}
			abort("E-VALIDATION-UNAVAILABLE", 503)
		}
		if api {
			status := 200
			if object(response)["ok"] == false {
				status = 422
			}
			respond(w, status, response)
			return
		}
		contentType := "application/json"
		if strings.HasSuffix(asset, ".html") {
			contentType = "text/html; charset=utf-8"
		} else if strings.HasSuffix(asset, ".js") {
			contentType = "text/javascript"
		} else if strings.HasSuffix(asset, ".css") {
			contentType = "text/css"
		}
		w.Header().Set("Content-Type", contentType)
		if r.Method != "HEAD" {
			_, _ = w.Write(raw)
		}
	})
}

const legacyStoreSourceDigest = "sha256:701cd7b89b4a1490cc9f6e8c964cdbd98608aa9e0209276cf8b899d00dd00e2b"

func verifyStoreAdapter(root string, lock M) {
	source := mustRead(root, "tools/go-auth/internal/studio/store_adapter.go")
	// Exact compatibility pin for already-published synthetic releases; no legacy code execution.
	wanted := "sha256:" + sha(source)
	count := 0
	for _, b := range list(lock["bindings"]) {
		binding := object(b)
		key := object(binding["key"])
		if key["facet"] == "server" {
			count++
			if (binding["sourceDigest"] != wanted && binding["sourceDigest"] != legacyStoreSourceDigest) || key["version"] != "1.0.0" || key["plugin"] != "@platform/store-selector" {
				abort("E-SERVER-ADAPTER-UNAVAILABLE", 503)
			}
		}
	}
	if count != 2 {
		abort("E-CAPABILITY-NOT-USED", 503)
	}
}
func (u *unit) admission(release string) M {
	r := u.one(`SELECT site,form,fbks FROM managed_releases WHERE id=?`, release)
	if r == nil {
		return nil
	}
	u.check(text(r["site"]), text(r["form"]), release, list(decodeValue(r["fbks"])))
	return r
}
func (u *unit) replay(release string, request M) M {
	r := u.one(`SELECT site,form FROM managed_releases WHERE id=?`, release)
	if r == nil || text(request["idempotencyKey"]) == "" {
		return nil
	}
	old := u.one(`SELECT hash,receipt FROM submissions WHERE site=? AND form=? AND idem=?`, r["site"], r["form"], request["idempotencyKey"])
	if old == nil {
		return nil
	}
	if old["hash"] != digest(M{"release": release, "values": request["payload"]}) {
		abort("IDEMPOTENCY_KEY_REUSED", 409)
	}
	return parse([]byte(text(old["receipt"])))
}
func (u *unit) submit(release string, request, payload M) M {
	if old := u.replay(release, request); old != nil {
		return old
	}
	admission := u.admission(release)
	if admission == nil {
		abort("E-ADMISSION-UNAVAILABLE", 503)
	}
	sid := "synthetic_" + auth.Random()[:24]
	receipt := M{"ok": true, "receipt": sid, "synthetic": true}
	u.exec(`INSERT INTO submissions VALUES(?,?,?,?,?,?,?,?)`, sid, admission["site"], admission["form"], release, request["idempotencyKey"], digest(M{"release": release, "values": request["payload"]}), string(canon(payload)), string(canon(receipt)))
	u.exec(`INSERT INTO outbox VALUES(?,?,'PENDING')`, sid, sid)
	return receipt
}
func (s *Service) Worker(ctx context.Context) M {
	rows, e := s.DB.QueryContext(ctx, `SELECT id FROM outbox WHERE state='PENDING' ORDER BY id`)
	if e != nil {
		return M{"blocked": 1}
	}
	ids := []string{}
	for rows.Next() {
		var id string
		_ = rows.Scan(&id)
		ids = append(ids, id)
	}
	rows.Close()
	done, blocked := 0, 0
	for _, id := range ids {
		_, e = s.with(ctx, persistence.User{Subject: "system:mock-worker"}, "", func(u *unit) any {
			row := u.one(`SELECT s.release,o.state FROM outbox o JOIN submissions s ON s.id=o.submission WHERE o.id=?`, id)
			if row == nil || row["state"] != "PENDING" {
				return nil
			}
			if u.admission(text(row["release"])) == nil {
				abort("E-ADMISSION-UNAVAILABLE", 503)
			}
			u.exec(`INSERT OR IGNORE INTO mock_effects VALUES(?,?,?)`, id, id, float64(time.Now().UnixMilli())/1000)
			u.exec(`UPDATE outbox SET state='DONE' WHERE id=? AND state='PENDING'`, id)
			return true
		})
		if e != nil {
			blocked++
		} else {
			done++
		}
	}
	// Recover abandoned publication operations without granting a user capability.
	_, _ = s.with(ctx, persistence.User{Subject: "system:reconciler"}, "", func(u *unit) any {
		for _, op := range u.rows(`SELECT id,review,site,form,base FROM operations WHERE state IN('BUILDING','VERIFYING','ACTIVATING') AND updated<?`, float64(time.Now().Unix())-120) {
			state, reviewState := "FAILED", "APPROVED"
			if u.head(text(op["site"]), text(op["form"])) != numberInt(op["base"]) {
				state = "SUPERSEDED"
				reviewState = "STALE"
				u.exec(`UPDATE review_meta SET stale_reason='pointer' WHERE id=?`, op["review"])
			}
			u.exec(`UPDATE operations SET state=?,version=version+1,error='INTERRUPTED',updated=? WHERE id=?`, state, float64(time.Now().Unix()), op["id"])
			u.exec(`UPDATE reviews SET state=? WHERE id=? AND state='PUBLISHING'`, reviewState, op["review"])
			u.audit(text(op["site"]), text(op["form"]), "publication.recover", text(op["id"]))
		}
		return nil
	})
	return M{"mockEffects": done, "blocked": blocked}
}
