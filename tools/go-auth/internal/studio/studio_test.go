package studio

import (
	"bytes"
	"context"
	"encoding/json"
	"forms-master/go-auth/internal/auth"
	"forms-master/go-auth/internal/persistence"
	"net/http/httptest"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"sync"
	"testing"
	"time"
)

func setup(t *testing.T) (*Service, persistence.User, persistence.User) {
	t.Helper()
	_, source, _, _ := runtime.Caller(0)
	root := filepath.Clean(filepath.Join(filepath.Dir(source), "../../../.."))
	data := filepath.Join(t.TempDir(), "business")
	if _, e := Snapshot(context.Background(), root, filepath.Join(root, "var/s2-publication"), data); e != nil {
		t.Fatal("snapshot", e)
	}
	a, e := persistence.Open(filepath.Join(t.TempDir(), "auth.sqlite3"))
	if e != nil {
		t.Fatal(e)
	}
	if e = a.Seed(context.Background(), "http://127.0.0.1:4182"); e != nil {
		t.Fatal(e)
	}
	s, e := Open(context.Background(), root, data, a)
	if e != nil {
		t.Fatal("open", e)
	}
	t.Cleanup(func() { s.Close(); a.DB.Close() })
	return s, persistence.User{ID: "synthetic-admin", Subject: "synthetic-admin", Role: "admin", Status: "active"}, persistence.User{ID: "synthetic-member", Subject: "synthetic-member", Role: "member", Status: "active"}
}
func call(t *testing.T, s *Service, u persistence.User, op string, b M) M {
	t.Helper()
	r, e := s.Execute(context.Background(), u, "", op, b)
	if e != nil {
		t.Fatalf("%s: %v", op, e)
	}
	return object(r)
}
func requireFault(t *testing.T, err error, status int) {
	t.Helper()
	f, ok := err.(Fault)
	if !ok || f.Status != status {
		t.Fatalf("expected %d got %v", status, err)
	}
}
func TestMigratedFormsCASAndPermissions(t *testing.T) {
	s, admin, member := setup(t)
	ctx := context.Background()
	pc := M{"site": "site_pc_synthetic"}
	badBody, _ := json.Marshal(M{"site": "site_pc_synthetic", "form": "frm_missing_expected", "definition": basicForm("frm_missing_expected")})
	badRequest := httptest.NewRequest("POST", "http://localhost:4180/api/save", bytes.NewReader(badBody))
	badResponse := httptest.NewRecorder()
	s.HTTP(badResponse, badRequest, admin, "")
	if badResponse.Code != 400 {
		t.Fatal("missing CAS expectation accepted")
	}
	r := call(t, s, admin, "list", pc)
	if len(list(r["forms"])) == 0 {
		t.Fatal("no migrated PC forms")
	}
	call(t, s, member, "list", pc)
	_, e := s.Execute(ctx, member, "", "list", M{"site": "site_sports_synthetic"})
	requireFault(t, e, 403)
	bytes, e := os.ReadFile(filepath.Join(s.Root, "contracts/fixtures/engine/pc-reference.json"))
	if e != nil {
		t.Fatal(e)
	}
	d := parse(bytes)
	d["formId"] = "frm_go_migration_test"
	site, form := text(d["siteId"]), text(d["formId"])
	save := M{"site": site, "form": form, "expected": float64(0), "title": "Synthetic Go test", "definition": d}
	_, e = s.Execute(ctx, member, "", "save", save)
	requireFault(t, e, 403)
	saved := call(t, s, admin, "save", save)
	if numberInt(saved["version"]) != 1 {
		t.Fatal(saved)
	}
	save["expected"] = float64(1)
	var wg sync.WaitGroup
	var mu sync.Mutex
	success, conflicts := 0, 0
	for range 8 {
		wg.Go(func() {
			_, err := s.Execute(ctx, admin, "", "save", save)
			mu.Lock()
			defer mu.Unlock()
			if err == nil {
				success++
			} else if f, ok := err.(Fault); ok && f.Code == "VERSION_CONFLICT" {
				conflicts++
			} else {
				t.Errorf("unexpected %v", err)
			}
		})
	}
	wg.Wait()
	if success != 1 || conflicts != 7 {
		t.Fatalf("CAS %d/%d", success, conflicts)
	}
	save["site"] = "site_sports_synthetic"
	save["expected"] = float64(0)
	_, e = s.Execute(ctx, admin, "", "save", save)
	requireFault(t, e, 403)
	call(t, s, admin, "validate", M{"site": site, "form": form})
	call(t, s, admin, "contract", M{"site": site, "form": form})
}
func TestServerMembershipChangesAndIdempotency(t *testing.T) {
	s, admin, member := setup(t)
	ctx := context.Background()
	_, err := s.DB.ExecContext(ctx, `UPDATE master_memberships SET capabilities='[]' WHERE user_id=?`, member.ID)
	if err != nil {
		t.Fatal(err)
	}
	_, err = s.Execute(ctx, member, "", "list", M{"site": "site_pc_synthetic"})
	requireFault(t, err, 403)
	admin.Role = "member"
	_, err = s.Execute(ctx, admin, "", "policy.get", M{"site": "site_pc_synthetic"})
	requireFault(t, err, 403)
	_, err = s.with(ctx, persistence.User{}, "", func(u *unit) any { u.gate("unknown-gate"); return nil })
	requireFault(t, err, 503)
}
func TestFilesRejectCorruptionAndSymlinks(t *testing.T) {
	root := t.TempDir()
	if e := writeOnce(root, "releases/test/index.html", []byte("one")); e != nil {
		t.Fatal(e)
	}
	if e := writeOnce(root, "releases/test/index.html", []byte("two")); e == nil {
		t.Fatal("immutable overwrite")
	}
	if e := os.Symlink("test", filepath.Join(root, "releases/link")); e != nil {
		t.Fatal(e)
	}
	if _, e := readSafe(root, "releases/link/index.html"); e == nil {
		t.Fatal("symlink accepted")
	}
}
func TestMockWorkerRetriesBlockedAdmissions(t *testing.T) {
	s, admin, _ := setup(t)
	ctx := context.Background()
	_ = admin
	_, err := s.with(ctx, persistence.User{}, "", func(u *unit) any {
		r := u.one(`SELECT id FROM managed_releases LIMIT 1`)
		if r == nil {
			abort("NOT_FOUND", 404)
		}
		release := text(r["id"])
		admission := u.one(`SELECT site,form FROM managed_releases WHERE id=?`, release)
		u.exec(`INSERT INTO submissions VALUES('synthetic_go_worker',?,?,?,'go-worker-key','hash','{}','{}')`, admission["site"], admission["form"], release)
		u.exec(`INSERT INTO outbox VALUES('synthetic_go_worker','synthetic_go_worker','PENDING')`)
		u.exec(`UPDATE gates SET blockers='["form#paused"]' WHERE key=?`, "form:"+text(admission["site"])+":"+text(admission["form"]))
		return nil
	})
	if err != nil {
		t.Fatal(err)
	}
	if numberInt(s.Worker(ctx)["blocked"]) < 1 {
		t.Fatal("blocked job not retryable")
	}
	var state string
	_ = s.DB.QueryRow(`SELECT state FROM outbox WHERE id='synthetic_go_worker'`).Scan(&state)
	if state != "PENDING" {
		t.Fatal("blocked job completed")
	}
	_, _ = s.DB.Exec(`UPDATE gates SET blockers='[]'`)
	if numberInt(s.Worker(ctx)["mockEffects"]) < 1 {
		t.Fatal("retry not completed")
	}
	s.Worker(ctx)
	var n int
	_ = s.DB.QueryRow(`SELECT count(*) FROM mock_effects WHERE id='synthetic_go_worker'`).Scan(&n)
	if n != 1 {
		t.Fatal("duplicate effect")
	}
}
func TestSnapshotNeverOverwrites(t *testing.T) {
	path := filepath.Join(t.TempDir(), "existing")
	_ = os.MkdirAll(path, 0700)
	_, e := Snapshot(context.Background(), "", path, path)
	if e == nil {
		t.Fatal("same source/destination allowed")
	}
	_, e = Snapshot(context.Background(), "", "missing", path)
	if e == nil {
		t.Fatal("existing destination overwritten")
	}
}
func TestSemanticArtifactsReadOnly(t *testing.T) {
	s, _, _ := setup(t)
	entries, e := os.ReadDir(filepath.Join(s.Data, "objects/releases"))
	if e != nil {
		t.Fatal(e)
	}
	count := 0
	for _, entry := range entries {
		if entry.IsDir() {
			_, _, _ = verifyCandidate(filepath.Join(s.Data, "objects/releases", entry.Name()))
			count++
		}
	}
	t.Logf("verified %d immutable releases after migration", count)
	if count < 67 {
		t.Fatal("lost releases")
	}
	raw, _ := json.Marshal(s.Worker(context.Background()))
	if len(raw) == 0 {
		t.Fatal("worker unavailable")
	}
	_ = time.Second
	releasePath := filepath.Join(s.Data, "objects/releases", entries[0].Name())
	manifest, _, _ := verifyCandidate(releasePath)
	asset := text(object(list(manifest["inventory"])[0])["path"])
	path := filepath.Join(releasePath, asset)
	if e = os.Chmod(path, 0600); e != nil {
		t.Fatal(e)
	}
	if e = os.WriteFile(path, []byte("corrupt synthetic fixture"), 0444); e != nil {
		t.Fatal(e)
	}
	defer func() {
		p := recover()
		f, ok := p.(Fault)
		if !ok || f.Code != "E-ASSET-INTEGRITY" {
			t.Errorf("corruption not rejected: %v", p)
		}
	}()
	verifyCandidate(releasePath)

}

func basicForm(form string) M {
	return M{"schemaVersion": "1.0.0", "kind": "form", "formId": form, "siteId": "site_pc_synthetic", "locale": M{"default": "ja", "supported": []any{"ja"}}, "fields": []any{M{"id": "fld_name", "key": "name", "type": "text", "label": M{"ja": "Synthetic name"}, "classification": "personal", "required": true}}, "conditions": M{}, "steps": []any{M{"id": "stp_details", "kind": "form", "content": []any{M{"field": "$local:fld_name"}}, "transitions": []any{M{"default": "stp_review"}}}, M{"id": "stp_review", "kind": "review", "transitions": []any{M{"default": "stp_complete"}}}, M{"id": "stp_complete", "kind": "complete"}}}
}
func adminSession(t *testing.T, s *Service, admin persistence.User) string {
	t.Helper()
	secret := auth.Random()
	if e := s.Auth.Complete(context.Background(), "http://127.0.0.1:4182", admin.Subject, secret, "", time.Now(), time.Hour); e != nil {
		t.Fatal(e)
	}
	return persistence.Hash(secret)
}
func TestPublishFourEyesRollbackSubmission(t *testing.T) {
	s, admin, _ := setup(t)
	ctx := context.Background()
	session := adminSession(t, s, admin)
	approver := persistence.User{ID: "synthetic-approver", Subject: "synthetic-approver", Role: "admin", Status: "active"}
	form := "frm_go_release_contract"
	d := basicForm(form)
	scope := M{"site": "site_pc_synthetic", "form": form}
	save := M{"site": scope["site"], "form": form, "definition": d, "title": "Synthetic release test", "expected": float64(0)}
	call(t, s, admin, "save", save)
	publish := func(version int) M {
		t.Helper()
		review := call(t, s, admin, "review", M{"site": scope["site"], "form": form, "version": float64(version), "dataContractAck": true})
		_, err := s.Execute(ctx, admin, session, "approve", M{"id": review["id"], "dataContractAck": true})
		requireFault(t, err, 403)
		call(t, s, approver, "approve", M{"id": review["id"], "dataContractAck": true})
		value, e := s.Execute(ctx, admin, session, "publish", M{"id": review["id"]})
		if e != nil {
			t.Fatal("publish", e)
		}
		return object(value)
	}
	first := publish(1)
	cloned := call(t, s, admin, "clone", M{"site": scope["site"], "form": "frm_go_clone_contract", "release": first["candidateId"], "title": "Synthetic clone"})
	if object(list(object(cloned["definition"])["fields"])[0])["id"] == "fld_name" {
		t.Fatal("clone reused field identity")
	}
	call(t, s, admin, "validate", M{"site": scope["site"], "form": "frm_go_clone_contract"})
	release := text(first["candidateId"])
	if !strings.HasPrefix(release, "rel_") {
		t.Fatal("canonical host release missing")
	}
	before := sha(mustRead(filepath.Join(s.Data, "objects/releases", release), "index.html"))
	req := M{"payload": M{"name": "Synthetic customer"}, "idempotencyKey": "go-contract-idem"}
	post := func(rid string, body M) *httptest.ResponseRecorder {
		raw, _ := json.Marshal(body)
		r := httptest.NewRequest("POST", "http://127.0.0.1:4183/r/"+rid+"/api/submit", bytes.NewReader(raw))
		r.Header.Set("Origin", "http://127.0.0.1:4183")
		r.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		s.Public(false).ServeHTTP(w, r)
		return w
	}
	response := post(release, req)
	if response.Code != 200 {
		t.Fatalf("submit %d %s", response.Code, response.Body)
	}
	receipt := parse(response.Body.Bytes())
	same := post(release, req)
	if same.Code != 200 || parse(same.Body.Bytes())["receipt"] != receipt["receipt"] {
		t.Fatal("idempotency replay")
	}
	changed := M{"payload": M{"name": "Changed"}, "idempotencyKey": "go-contract-idem"}
	if post(release, changed).Code != 409 {
		t.Fatal("idempotency conflict missing")
	}
	s.Worker(ctx)
	var n int
	_ = s.DB.QueryRow(`SELECT count(*) FROM mock_effects WHERE submission=?`, receipt["receipt"]).Scan(&n)
	if n != 1 {
		t.Fatal("mock effect missing")
	}
	d["fields"].([]any)[0].(M)["label"] = M{"ja": "Synthetic name v2"}
	save["expected"] = float64(1)
	call(t, s, admin, "save", save)
	second := publish(2)
	if second["candidateId"] == first["candidateId"] {
		t.Fatal("release identity reused")
	}
	call(t, s, admin, "rollback", M{"site": scope["site"], "form": form, "release": release, "expected": float64(2)})
	if before != sha(mustRead(filepath.Join(s.Data, "objects/releases", release), "index.html")) {
		t.Fatal("immutable release changed")
	}
	hold := call(t, s, admin, "hold.get", scope)
	call(t, s, admin, "hold.change", M{"site": scope["site"], "form": form, "expected": float64(numberInt(hold["version"])), "source": "M4", "incident": "synthetic-go-test", "blocked": true})
	if post(release, M{"payload": M{"name": "new"}, "idempotencyKey": "new-key"}).Code != 423 {
		t.Fatal("hold bypass")
	}
	if post(release, req).Code != 200 {
		t.Fatal("committed receipt replay lost under hold")
	}
}
func TestPreviewExpirationAndRevocation(t *testing.T) {
	s, admin, member := setup(t)
	ctx := context.Background()
	session := adminSession(t, s, admin)
	form := "frm_go_preview_contract"
	call(t, s, admin, "save", M{"site": "site_pc_synthetic", "form": form, "definition": basicForm(form), "expected": float64(0)})
	_, err := s.Execute(ctx, member, "", "preview", M{"site": "site_pc_synthetic", "form": form})
	requireFault(t, err, 403)
	raw, e := s.Execute(ctx, admin, session, "preview", M{"site": "site_pc_synthetic", "form": form})
	if e != nil {
		t.Fatal(e)
	}
	token := text(object(raw)["previewSessionId"])
	_, e = s.with(ctx, admin, session, func(u *unit) any { return u.checkPreview(token) })
	if e != nil {
		t.Fatal("preview check", e)
	}
	_, _ = s.Auth.DB.ExecContext(ctx, `UPDATE sessions SET revoked_at=unixepoch() WHERE verifier=?`, session)
	_, e = s.with(ctx, admin, session, func(u *unit) any { return u.checkPreview(token) })
	requireFault(t, e, 410)
	_, e = s.Execute(ctx, admin, session, "validate", M{"site": "site_pc_synthetic", "form": form})
	requireFault(t, e, 401)
	_, _ = s.Auth.DB.ExecContext(ctx, `UPDATE sessions SET revoked_at=NULL WHERE verifier=?`, session)
	_, _ = s.Auth.DB.ExecContext(ctx, `UPDATE users SET role='member' WHERE id=?`, admin.ID)
	_, e = s.Execute(ctx, admin, session, "validate", M{"site": "site_pc_synthetic", "form": form})
	requireFault(t, e, 403)
}
func TestCapabilityRevocationAndPartialPreview(t *testing.T) {
	s, admin, _ := setup(t)
	ctx := context.Background()
	session := adminSession(t, s, admin)
	raw, e := os.ReadFile(filepath.Join(s.Root, "contracts/fixtures/engine/pc-plugin.json"))
	if e != nil {
		t.Fatal(e)
	}
	d := parse(raw)
	form := "frm_go_plugin_contract"
	d["formId"] = form
	scope := M{"site": "site_pc_synthetic", "form": form}
	call(t, s, admin, "save", M{"site": scope["site"], "form": form, "definition": d, "expected": float64(0)})
	first, e := s.Execute(ctx, admin, session, "preview", scope)
	if e != nil {
		t.Fatal(e)
	}
	token := text(object(first)["previewSessionId"])
	p := call(t, s, admin, "policy.get", M{"site": scope["site"]})
	call(t, s, admin, "policy.change", M{"site": scope["site"], "expected": float64(numberInt(p["version"])), "source": "override", "key": "synthetic-go-revocation", "value": true})
	_, e = s.with(ctx, admin, session, func(u *unit) any { return u.checkPreview(token) })
	requireFault(t, e, 423)
	partial, e := s.Execute(ctx, admin, session, "preview", scope)
	if e != nil {
		t.Fatal("partial", e)
	}
	if object(partial)["mode"] != "partial" {
		t.Fatal("blocked plugin was not projected")
	}
	_, e = s.Execute(ctx, admin, session, "review", M{"site": scope["site"], "form": form, "version": float64(1)})
	requireFault(t, e, 409)
}
func TestLegacySourceWriteGuard(t *testing.T) {
	_, file, _, _ := runtime.Caller(0)
	root := filepath.Clean(filepath.Join(filepath.Dir(file), "../../../.."))
	source := filepath.Join(root, "var/s2-publication")
	if s, e := Open(context.Background(), root, source, nil); e == nil {
		s.Close()
		t.Fatal("legacy DB opened for writes")
	}
	alias := filepath.Join(t.TempDir(), "alias")
	if e := os.Symlink(source, alias); e != nil {
		t.Fatal(e)
	}
	if s, e := Open(context.Background(), root, alias, nil); e == nil {
		s.Close()
		t.Fatal("legacy DB alias opened")
	}
}

func TestSyntheticPostalCapabilityAndContactValidation(t *testing.T) {
	s, admin, _ := setup(t)
	raw, err := os.ReadFile(filepath.Join(s.Root, "contracts/fixtures/engine/pc-apply-reference.json"))
	if err != nil {
		t.Fatal(err)
	}
	d := parse(raw)
	d["formId"] = "frm_postal_capability_test"
	call(t, s, admin, "save", M{"site": "site_pc_synthetic", "form": d["formId"], "definition": d, "expected": float64(0)})
	review := call(t, s, admin, "review", M{"site": "site_pc_synthetic", "form": d["formId"], "version": float64(1), "dataContractAck": true})
	approver := persistence.User{ID: "synthetic-approver", Subject: "synthetic-approver", Role: "admin", Status: "active"}
	call(t, s, approver, "approve", M{"id": review["id"], "dataContractAck": true})
	value, err := s.Execute(context.Background(), admin, adminSession(t, s, admin), "publish", M{"id": review["id"]})
	if err != nil {
		t.Fatal(err)
	}
	release := object(value)
	get := func(zip, origin string, expected int) {
		t.Helper()
		r := httptest.NewRequest("GET", "http://127.0.0.1:4183/r/"+text(release["candidateId"])+"/api/postal-lookup?zip="+zip, nil)
		if origin != "" {
			r.Header.Set("Origin", origin)
		}
		w := httptest.NewRecorder()
		s.Public(false).ServeHTTP(w, r)
		if w.Code != expected {
			t.Fatalf("postal %s: %d %s", zip, w.Code, w.Body.String())
		}
		if expected == 200 && !strings.Contains(w.Body.String(), `"synthetic":true`) {
			t.Fatal("non-synthetic lookup")
		}
	}
	get("0000000", "", 200)
	get("0000001", "", 404)
	get("bad", "", 400)
	get("0000000", "http://localhost:4180", 403)
	cloned := call(t, s, admin, "clone", M{"site": "site_pc_synthetic", "form": "frm_postal_clone_test", "release": release["candidateId"], "title": "Synthetic postal clone"})
	var target string
	known := map[string]bool{}
	for _, raw := range list(object(cloned["definition"])["fields"]) {
		f := object(raw)
		known[text(f["id"])] = true
		if f["type"] == "postal" {
			target = text(object(f["config"])["postalAddressTarget"])
		}
	}
	if target == "fld_address" || !known[target] {
		t.Fatal("clone retained a stale postal reference")
	}
	call(t, s, admin, "validate", M{"site": "site_pc_synthetic", "form": "frm_postal_clone_test"})
}

func TestSaveSchemaRejectsUnsafeStyleAndAllowsIncompleteWorkflow(t *testing.T) {
	s, admin, _ := setup(t)
	d := basicForm("frm_unsafe_style_test")
	d["appearance"] = M{"background": "url(https://unsafe.invalid/collect)"}
	_, err := s.Execute(context.Background(), admin, "", "save", M{"site": "site_pc_synthetic", "form": d["formId"], "definition": d, "expected": float64(0)})
	if err == nil || err.Error() != "DEFINITION_INVALID" {
		t.Fatalf("unsafe style accepted: %v", err)
	}
	var count int
	if err = s.DB.QueryRow(`SELECT count(*) FROM drafts WHERE form=?`, d["formId"]).Scan(&count); err != nil || count != 0 {
		t.Fatal("invalid definition persisted")
	}
	d = basicForm("frm_partial_schema_test")
	object(list(d["steps"])[0])["transitions"] = []any{}
	call(t, s, admin, "save", M{"site": "site_pc_synthetic", "form": d["formId"], "definition": d, "expected": float64(0)})
}

func TestGoStoreAdapterPins(t *testing.T) {
	_, source, _, _ := runtime.Caller(0)
	root := filepath.Clean(filepath.Join(filepath.Dir(source), "../../../.."))
	current := "sha256:" + sha(mustRead(root, "tools/go-auth/internal/studio/store_adapter.go"))
	lock := func(pin string) M {
		return M{"bindings": []any{
			M{"key": M{"plugin": "@platform/store-selector", "version": "1.0.0", "facet": "server", "capability": "storeList"}, "sourceDigest": pin},
			M{"key": M{"plugin": "@platform/store-selector", "version": "1.0.0", "facet": "server", "capability": "storeIdValid"}, "sourceDigest": pin},
		}}
	}
	verifyStoreAdapter(root, lock(current))
	verifyStoreAdapter(root, lock(legacyStoreSourceDigest))
	func() {
		defer func() {
			if recover() == nil {
				t.Error("unrecognized adapter pin admitted")
			}
		}()
		verifyStoreAdapter(root, lock("sha256:"+strings.Repeat("0", 64)))
	}()
	if len(storeRows("site_pc_synthetic")) != 2 || len(storeRows("site_other_synthetic")) != 1 || len(storeRows("unknown")) != 0 {
		t.Fatal("store site isolation changed")
	}
}

func TestGoOnlyBootstrap(t *testing.T) {
	_, source, _, _ := runtime.Caller(0)
	root := filepath.Clean(filepath.Join(filepath.Dir(source), "../../../.."))
	data := filepath.Join(t.TempDir(), "fresh")
	report, err := Bootstrap(context.Background(), root, data)
	if err != nil {
		t.Fatal(err)
	}
	if report["seeded_drafts"] != 3 {
		t.Fatalf("seed missing: %v", report)
	}
	before := sha(mustRead(data, "active.sqlite3"))
	if _, err = Bootstrap(context.Background(), root, data); err == nil {
		t.Fatal("bootstrap overwrote an existing store")
	}
	if before != sha(mustRead(data, "active.sqlite3")) {
		t.Fatal("failed bootstrap modified data")
	}
	s, err := Open(context.Background(), root, data, nil)
	if err != nil {
		t.Fatal(err)
	}
	defer s.Close()
	member := persistence.User{ID: "synthetic-member", Subject: "synthetic-member", Role: "member", Status: "active"}
	forms := call(t, s, member, "list", M{"site": "site_pc_synthetic"})
	if len(list(forms["forms"])) != 2 {
		t.Fatalf("PC seed missing: %v", forms)
	}
	_, err = s.Execute(context.Background(), member, "", "save", M{"site": "site_pc_synthetic", "form": "frm_denied", "expected": float64(0), "definition": basicForm("frm_denied")})
	requireFault(t, err, 403)
	inspected, err := Inspect(context.Background(), root, data)
	if err != nil || inspected["sqlite_integrity"] != "ok" {
		t.Fatalf("inspect: %v %v", inspected, err)
	}
}
