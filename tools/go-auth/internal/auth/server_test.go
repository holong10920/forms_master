package auth_test

import (
	"context"
	"crypto/rand"
	"crypto/rsa"
	"encoding/base64"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"path/filepath"
	"regexp"
	"strings"
	"sync"
	"testing"
	"time"

	"forms-master/go-auth/internal/auth"
	"forms-master/go-auth/internal/localidp"
	"forms-master/go-auth/internal/persistence"
	"golang.org/x/oauth2"
)

type fixture struct {
	s        *auth.Server
	provider *httptest.Server
	client   *http.Client
	handler  http.Handler
	origin   string
	mutate   func(map[string]any)
	key      *rsa.PrivateKey
}

func newFixture(t *testing.T) *fixture {
	t.Helper()
	f := &fixture{origin: "http://localhost:4180", client: &http.Client{Timeout: 5 * time.Second, CheckRedirect: func(*http.Request, []*http.Request) error { return http.ErrUseLastResponse }}}
	var err error
	f.key, err = rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatal(err)
	}
	var provider http.Handler
	f.provider = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/token" && f.mutate != nil {
			rec := httptest.NewRecorder()
			provider.ServeHTTP(rec, r)
			if rec.Code != 200 {
				w.WriteHeader(rec.Code)
				_, _ = w.Write(rec.Body.Bytes())
				return
			}
			var tokens map[string]any
			_ = json.Unmarshal(rec.Body.Bytes(), &tokens)
			parts := strings.Split(tokens["id_token"].(string), ".")
			b, _ := base64.RawURLEncoding.DecodeString(parts[1])
			var claims map[string]any
			_ = json.Unmarshal(b, &claims)
			f.mutate(claims)
			tokens["id_token"] = localidp.Sign(f.key, claims)
			w.Header().Set("Content-Type", "application/json")
			_ = json.NewEncoder(w).Encode(tokens)
			return
		}
		provider.ServeHTTP(w, r)
	}))
	provider = localidp.New(f.provider.URL, f.origin+"/api/v1/auth/callback", "form-master-go", f.key).Handler()
	t.Cleanup(f.provider.Close)
	db, err := persistence.Open(filepath.Join(t.TempDir(), "auth.sqlite3"))
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { db.DB.Close() })
	if err = db.Seed(context.Background(), f.provider.URL); err != nil {
		t.Fatal(err)
	}
	f.s, err = auth.New(context.Background(), auth.Config{Origin: f.origin, Issuer: f.provider.URL, ClientID: "form-master-go", LocalHTTP: true, SessionTTL: time.Hour}, db)
	if err != nil {
		t.Fatal(err)
	}
	f.handler = f.s.Handler()
	return f
}
func (f *fixture) api(method, path, session, csrf, origin string) *httptest.ResponseRecorder {
	r := httptest.NewRequest(method, f.origin+path, nil)
	r.Host = "localhost:4180"
	r.RemoteAddr = "127.0.0.1:12345"
	if session != "" {
		r.AddCookie(&http.Cookie{Name: f.s.Config.SessionCookie(), Value: session})
	}
	if csrf != "" {
		r.Header.Set("X-CSRF-Token", csrf)
	}
	if origin != "" {
		r.Header.Set("Origin", origin)
	}
	w := httptest.NewRecorder()
	f.handler.ServeHTTP(w, r)
	return w
}

type pending struct{ callback, flow, code, verifier string }

func (f *fixture) begin(t *testing.T, subject, previous string) pending {
	t.Helper()
	w := f.api("GET", "/api/v1/auth/login?return_to=/dashboard", previous, "", "")
	if w.Code != 302 {
		t.Fatalf("begin %d %s", w.Code, w.Body)
	}
	var flow string
	for _, c := range w.Result().Cookies() {
		if c.Name == f.s.Config.FlowCookie() {
			flow = c.Value
		}
	}
	var verifier string
	err := f.s.Store.DB.QueryRow(`SELECT pkce_verifier FROM login_flows WHERE state_hash=?`, persistence.Hash(flow)).Scan(&verifier)
	if err != nil {
		t.Fatal(err)
	}
	res, err := f.client.Get(w.Header().Get("Location"))
	if err != nil {
		t.Fatal(err)
	}
	if res.Header.Get("Referrer-Policy") != "same-origin" || !strings.Contains(res.Header.Get("Content-Security-Policy"), f.origin) {
		t.Fatal("provider browser navigation policy invalid")
	}
	b, _ := io.ReadAll(res.Body)
	res.Body.Close()
	match := regexp.MustCompile(`name="ticket" value="([^"]+)"`).FindStringSubmatch(string(b))
	if len(match) != 2 {
		t.Fatalf("picker %d %s", res.StatusCode, b)
	}
	req, _ := http.NewRequest("POST", f.provider.URL+"/choose", strings.NewReader(url.Values{"ticket": {match[1]}, "subject": {subject}}.Encode()))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Origin", f.provider.URL)
	res, err = f.client.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	res.Body.Close()
	callback := res.Header.Get("Location")
	u, _ := url.Parse(callback)
	return pending{callback: callback, flow: flow, code: u.Query().Get("code"), verifier: verifier}
}
func (f *fixture) callback(p pending) *httptest.ResponseRecorder {
	r := httptest.NewRequest("GET", p.callback, nil)
	r.Host = "localhost:4180"
	r.AddCookie(&http.Cookie{Name: f.s.Config.FlowCookie(), Value: p.flow})
	w := httptest.NewRecorder()
	f.handler.ServeHTTP(w, r)
	return w
}
func (f *fixture) login(t *testing.T, subject, previous string) string {
	t.Helper()
	w := f.callback(f.begin(t, subject, previous))
	for _, c := range w.Result().Cookies() {
		if c.Name == f.s.Config.SessionCookie() && c.Value != "" {
			return c.Value
		}
	}
	t.Fatalf("login failed %d %s", w.Code, w.Header().Get("Location"))
	return ""
}
func expect(t *testing.T, w *httptest.ResponseRecorder, status int) {
	t.Helper()
	if w.Code != status {
		t.Fatalf("want %d got %d: %s", status, w.Code, w.Body.String())
	}
}
func TestRolesSessionAndAuthoritativeChanges(t *testing.T) {
	for _, role := range []string{"admin", "member"} {
		t.Run(role, func(t *testing.T) {
			f := newFixture(t)
			secret := f.login(t, "synthetic-"+role, "")
			expect(t, f.api("GET", "/api/v1/auth/me", secret, "", ""), 200)
			expect(t, f.api("GET", "/api/v1/dashboard", secret, "", ""), 200)
			want := 403
			if role == "admin" {
				want = 200
			}
			expect(t, f.api("GET", "/api/v1/admin/overview", secret, "", ""), want)
			_, err := f.s.Store.DB.Exec(`UPDATE users SET role='member' WHERE id=?`, "synthetic-"+role)
			if err != nil {
				t.Fatal(err)
			}
			expect(t, f.api("GET", "/api/v1/admin/overview", secret, "", ""), 403)
			_, err = f.s.Store.DB.Exec(`UPDATE users SET status='disabled' WHERE id=?`, "synthetic-"+role)
			if err != nil {
				t.Fatal(err)
			}
			expect(t, f.api("GET", "/api/v1/auth/me", secret, "", ""), 401)
		})
	}
}
func TestOIDCRejections(t *testing.T) {
	cases := map[string]func(map[string]any){"nonce": func(c map[string]any) { c["nonce"] = "wrong" }, "issuer": func(c map[string]any) { c["iss"] = "https://wrong.invalid" }, "audience": func(c map[string]any) { c["aud"] = "wrong" }, "expired": func(c map[string]any) { c["exp"] = time.Now().Add(-time.Hour).Unix() }, "future_iat": func(c map[string]any) { c["iat"] = time.Now().Add(time.Hour).Unix() }}
	for name, mutate := range cases {
		t.Run(name, func(t *testing.T) {
			f := newFixture(t)
			f.mutate = mutate
			w := f.callback(f.begin(t, "synthetic-admin", ""))
			if !strings.Contains(w.Header().Get("Location"), "error=authentication_failed") {
				t.Fatal("invalid claims accepted")
			}
		})
	}
	t.Run("signature", func(t *testing.T) {
		f := newFixture(t)
		p := f.begin(t, "synthetic-admin", "")
		f.mutate = func(c map[string]any) {}
		f.key, _ = rsa.GenerateKey(rand.Reader, 2048)
		w := f.callback(p)
		if !strings.Contains(w.Header().Get("Location"), "error=") {
			t.Fatal("bad signature accepted")
		}
	})
	for _, kind := range []string{"state", "pkce", "flow_expiry", "callback_replay"} {
		t.Run(kind, func(t *testing.T) {
			f := newFixture(t)
			p := f.begin(t, "synthetic-admin", "")
			switch kind {
			case "state":
				p.flow = auth.Random()
			case "pkce":
				_, _ = f.s.Store.DB.Exec(`UPDATE login_flows SET pkce_verifier=?`, oauth2.GenerateVerifier())
			case "flow_expiry":
				_, _ = f.s.Store.DB.Exec(`UPDATE login_flows SET expires_at=0`)
			case "callback_replay":
				expect(t, f.callback(p), 302)
			}
			w := f.callback(p)
			if !strings.Contains(w.Header().Get("Location"), "error=") {
				t.Fatal("invalid flow accepted")
			}
		})
	}
}
func TestCodeReplayAndPKCE(t *testing.T) {
	for _, badPKCE := range []bool{false, true} {
		t.Run(map[bool]string{false: "replay", true: "invalid_pkce"}[badPKCE], func(t *testing.T) {
			f := newFixture(t)
			p := f.begin(t, "synthetic-member", "")
			verifier := p.verifier
			if badPKCE {
				verifier = oauth2.GenerateVerifier()
			}
			values := url.Values{"client_id": {"form-master-go"}, "redirect_uri": {f.s.Config.Callback()}, "grant_type": {"authorization_code"}, "code": {p.code}, "code_verifier": {verifier}}
			res, err := f.client.PostForm(f.provider.URL+"/token", values)
			if err != nil {
				t.Fatal(err)
			}
			res.Body.Close()
			if badPKCE && res.StatusCode == 200 {
				t.Fatal("PKCE accepted")
			}
			if !badPKCE && res.StatusCode != 200 {
				t.Fatal(res.StatusCode)
			}
			res, err = f.client.PostForm(f.provider.URL+"/token", values)
			if err != nil {
				t.Fatal(err)
			}
			res.Body.Close()
			if res.StatusCode == 200 {
				t.Fatal("code replay accepted")
			}
		})
	}
}
func TestDisabledCannotLogin(t *testing.T) {
	f := newFixture(t)
	_, _ = f.s.Store.DB.Exec(`UPDATE users SET status='disabled'`)
	w := f.callback(f.begin(t, "synthetic-admin", ""))
	if !strings.Contains(w.Header().Get("Location"), "error=") {
		t.Fatal("disabled login succeeded")
	}
}
func TestExpiryLogoutFixationAndCSRF(t *testing.T) {
	f := newFixture(t)
	expect(t, f.api("GET", "/api/v1/dashboard", "", "", ""), 401)
	fixed := auth.Random()
	secret := f.login(t, "synthetic-admin", fixed)
	if secret == fixed {
		t.Fatal("session fixation")
	}
	expect(t, f.api("GET", "/api/v1/auth/me", fixed, "", ""), 401)
	next := f.login(t, "synthetic-admin", secret)
	expect(t, f.api("GET", "/api/v1/auth/me", secret, "", ""), 401)
	csrf := persistence.Hash("csrf:" + next)
	expect(t, f.api("POST", "/api/v1/auth/logout", next, csrf, "https://evil.invalid"), 403)
	expect(t, f.api("POST", "/api/v1/auth/logout", next, "", f.origin), 403)
	expect(t, f.api("POST", "/api/v1/auth/logout", next, csrf, ""), 403)
	expect(t, f.api("POST", "/api/v1/auth/logout", next, csrf, f.origin), 204)
	expect(t, f.api("GET", "/api/v1/auth/me", next, "", ""), 401)
	secret = f.login(t, "synthetic-member", "")
	f.s.Now = func() time.Time { return time.Now().Add(2 * time.Hour) }
	expect(t, f.api("GET", "/api/v1/auth/me", secret, "", ""), 401)
}
func TestHeadersAndConcurrency(t *testing.T) {
	f := newFixture(t)
	secret := f.login(t, "synthetic-member", "")
	r := httptest.NewRequest("GET", f.origin+"/api/v1/admin/overview?role=admin", nil)
	r.Host = "localhost:4180"
	r.AddCookie(&http.Cookie{Name: f.s.Config.SessionCookie(), Value: secret})
	for _, k := range []string{"X-Role", "X-User-Role", "X-Forwarded-User", "Authorization"} {
		r.Header.Set(k, "admin")
	}
	w := httptest.NewRecorder()
	f.handler.ServeHTTP(w, r)
	expect(t, w, 403)
	var wg sync.WaitGroup
	for range 24 {
		wg.Go(func() { expect(t, f.api("GET", "/api/v1/auth/me", secret, "", ""), 200) })
	}
	wg.Wait()
	p := f.begin(t, "synthetic-member", "")
	var accepted int
	var mu sync.Mutex
	for range 5 {
		wg.Go(func() {
			w := f.callback(p)
			if !strings.Contains(w.Header().Get("Location"), "error=") {
				mu.Lock()
				accepted++
				mu.Unlock()
			}
		})
	}
	wg.Wait()
	if accepted != 1 {
		t.Fatalf("concurrent callback success count %d", accepted)
	}
}
func TestRedirectAndLimits(t *testing.T) {
	f := newFixture(t)
	for _, target := range []string{"https://evil.invalid", "//evil.invalid", "/%2fevil.invalid"} {
		expect(t, f.api("GET", "/api/v1/auth/login?return_to="+url.QueryEscape(target), "", "", ""), 400)
	}
	for range 20 {
		f.api("GET", "/api/v1/auth/login", "", "", "")
	}
	expect(t, f.api("GET", "/api/v1/auth/login", "", "", ""), 429)
}
func TestConfiguration(t *testing.T) {
	for _, origin := range []string{"http://example.invalid", "http://localhost.evil.invalid", "http://localhost:4180/path", "https://example.invalid?x=1", "https://example.invalid"} {
		c := auth.Config{Origin: origin, Issuer: "https://id.invalid", ClientID: "client", LocalHTTP: true, SessionTTL: time.Hour}
		if c.Validate() == nil {
			t.Fatal("invalid config accepted", origin)
		}
	}
	c := auth.Config{Origin: "https://app.invalid", Issuer: "https://id.invalid", ClientID: "client", SessionTTL: time.Hour}
	if c.Validate() != nil || c.SessionCookie() != "__Host-fm_session" {
		t.Fatal("secure defaults")
	}
}

func TestCookiePolicyAndPersistence(t *testing.T) {
	f := newFixture(t)
	f.s.Config.LocalHTTP = false
	p := f.begin(t, "synthetic-admin", "")
	w := f.callback(p)
	var raw string
	for _, c := range w.Result().Cookies() {
		if c.Name == "__Host-fm_session" {
			if !c.Secure || !c.HttpOnly || c.Path != "/" || c.Domain != "" || c.SameSite != http.SameSiteLaxMode {
				t.Fatal("insecure production cookie")
			}
			raw = c.Value
		}
	}
	if raw == "" {
		t.Fatal("missing session")
	}
	var path, name string
	var seq int
	if err := f.s.Store.DB.QueryRow(`PRAGMA database_list`).Scan(&seq, &name, &path); err != nil {
		t.Fatal(err)
	}
	reopened, err := persistence.Open(path)
	if err != nil {
		t.Fatal(err)
	}
	defer reopened.DB.Close()
	if _, err = reopened.Authenticate(context.Background(), raw, time.Now()); err != nil {
		t.Fatal("session not persisted", err)
	}
	var count int
	if err = reopened.DB.QueryRow(`SELECT count(*) FROM sessions WHERE verifier=?`, raw).Scan(&count); err != nil || count != 0 {
		t.Fatal("raw reusable session secret stored")
	}
}
