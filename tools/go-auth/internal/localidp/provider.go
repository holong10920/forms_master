// Package localidp is a synthetic loopback-only IdP, never a production identity source.
package localidp

import (
	"crypto"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"html/template"
	"math/big"
	"net/http"
	"net/url"
	"sync"
	"time"

	"forms-master/go-auth/internal/auth"
)

type grant struct {
	Nonce, Challenge, Subject string
	Expires                   time.Time
}
type Provider struct {
	Issuer, Callback, ClientID string
	key                        *rsa.PrivateKey
	mu                         sync.Mutex
	requests                   map[string]grant
	codes                      map[string]grant
}

func New(issuer, callback, client string, key *rsa.PrivateKey) *Provider {
	return &Provider{Issuer: issuer, Callback: callback, ClientID: client, key: key, requests: make(map[string]grant), codes: make(map[string]grant)}
}
func (p *Provider) Handler() http.Handler {
	m := http.NewServeMux()
	m.HandleFunc("GET /.well-known/openid-configuration", func(w http.ResponseWriter, r *http.Request) {
		reply(w, map[string]any{"issuer": p.Issuer, "authorization_endpoint": p.Issuer + "/authorize", "token_endpoint": p.Issuer + "/token", "jwks_uri": p.Issuer + "/keys", "response_types_supported": []string{"code"}, "subject_types_supported": []string{"public"}, "id_token_signing_alg_values_supported": []string{"RS256"}, "code_challenge_methods_supported": []string{"S256"}, "token_endpoint_auth_methods_supported": []string{"none"}})
	})
	m.HandleFunc("GET /keys", func(w http.ResponseWriter, r *http.Request) {
		reply(w, map[string]any{"keys": []any{map[string]any{"kty": "RSA", "kid": "local", "alg": "RS256", "use": "sig", "n": base64.RawURLEncoding.EncodeToString(p.key.N.Bytes()), "e": base64.RawURLEncoding.EncodeToString(big.NewInt(int64(p.key.E)).Bytes())}}})
	})
	m.HandleFunc("GET /authorize", p.authorize)
	m.HandleFunc("POST /choose", p.choose)
	m.HandleFunc("POST /token", p.token)
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		u, _ := url.Parse(p.Issuer)
		if r.Host != u.Host {
			http.Error(w, "invalid host", 400)
			return
		}
		w.Header().Set("Cache-Control", "no-store")
		w.Header().Set("Referrer-Policy", "same-origin")
		w.Header().Set("X-Content-Type-Options", "nosniff")
		callback, _ := url.Parse(p.Callback)
		w.Header().Set("Content-Security-Policy", "default-src 'none'; form-action 'self' "+callback.Scheme+"://"+callback.Host+"; frame-ancestors 'none'; base-uri 'none'")
		m.ServeHTTP(w, r)
	})
}
func reply(w http.ResponseWriter, v any) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(v)
}
func (p *Provider) authorize(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	if q.Get("client_id") != p.ClientID || q.Get("redirect_uri") != p.Callback || q.Get("response_type") != "code" || q.Get("scope") != "openid" || q.Get("code_challenge_method") != "S256" {
		http.Error(w, "invalid request", 400)
		return
	}
	for _, k := range []string{"state", "nonce", "code_challenge"} {
		b, e := base64.RawURLEncoding.DecodeString(q.Get(k))
		if e != nil || len(b) != 32 {
			http.Error(w, "invalid request", 400)
			return
		}
	}
	ticket := auth.Random()
	p.mu.Lock()
	now := time.Now()
	for k, g := range p.requests {
		if !now.Before(g.Expires) {
			delete(p.requests, k)
		}
	}
	for k, g := range p.codes {
		if !now.Before(g.Expires) {
			delete(p.codes, k)
		}
	}
	if len(p.requests) > 1000 {
		p.mu.Unlock()
		http.Error(w, "rate limited", 429)
		return
	}
	// State is carried inside the server-bound request; browser cannot override it at selection.
	p.requests[ticket] = grant{Nonce: q.Get("nonce"), Challenge: q.Get("code_challenge"), Subject: q.Get("state"), Expires: now.Add(time.Minute)}
	p.mu.Unlock()
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	_ = picker.Execute(w, ticket)
}

var picker = template.Must(template.New("picker").Parse(`<!doctype html><html lang="en"><meta name="viewport" content="width=device-width"><title>Form Master · Local identity provider</title><main><h1>Choose a synthetic identity</h1><p>Local development only. No real account or password is used.</p><form method="post" action="/choose"><input type="hidden" name="ticket" value="{{.}}"><button name="subject" value="synthetic-admin">Continue as synthetic-admin</button><button name="subject" value="synthetic-member">Continue as synthetic-member</button><button name="subject" value="synthetic-approver">Continue as synthetic-approver</button></form></main></html>`))

func (p *Provider) choose(w http.ResponseWriter, r *http.Request) {
	if r.Header.Get("Origin") != p.Issuer {
		http.Error(w, "invalid origin", 403)
		return
	}
	r.Body = http.MaxBytesReader(w, r.Body, 4096)
	if r.ParseForm() != nil {
		http.Error(w, "invalid request", 400)
		return
	}
	subject := r.PostForm.Get("subject")
	if subject != "synthetic-admin" && subject != "synthetic-member" && subject != "synthetic-approver" {
		http.Error(w, "invalid subject", 400)
		return
	}
	p.mu.Lock()
	defer p.mu.Unlock()
	ticket := r.PostForm.Get("ticket")
	g, ok := p.requests[ticket]
	delete(p.requests, ticket)
	if !ok || !time.Now().Before(g.Expires) {
		http.Error(w, "expired request", 400)
		return
	}
	code := auth.Random()
	state := g.Subject
	g.Subject = subject
	p.codes[code] = g
	u, _ := url.Parse(p.Callback)
	q := u.Query()
	q.Set("code", code)
	q.Set("state", state)
	u.RawQuery = q.Encode()
	http.Redirect(w, r, u.String(), http.StatusSeeOther)
}
func (p *Provider) token(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, 8192)
	if r.ParseForm() != nil {
		http.Error(w, "invalid request", 400)
		return
	}
	f := r.PostForm
	if f.Get("client_id") != p.ClientID || f.Get("redirect_uri") != p.Callback || f.Get("grant_type") != "authorization_code" {
		http.Error(w, "invalid client", 400)
		return
	}
	p.mu.Lock()
	defer p.mu.Unlock()
	g, ok := p.codes[f.Get("code")]
	delete(p.codes, f.Get("code"))
	challenge := sha256.Sum256([]byte(f.Get("code_verifier")))
	if !ok || !time.Now().Before(g.Expires) || base64.RawURLEncoding.EncodeToString(challenge[:]) != g.Challenge {
		http.Error(w, "invalid grant", 400)
		return
	}
	now := time.Now().Unix()
	claims := map[string]any{"iss": p.Issuer, "aud": p.ClientID, "sub": g.Subject, "nonce": g.Nonce, "iat": now, "exp": now + 120}
	reply(w, map[string]any{"id_token": Sign(p.key, claims), "access_token": auth.Random(), "token_type": "Bearer", "expires_in": 120})
}

// Sign is used only by this synthetic provider and protocol rejection tests.
func Sign(key *rsa.PrivateKey, claims map[string]any) string {
	header := base64.RawURLEncoding.EncodeToString([]byte(`{"alg":"RS256","kid":"local","typ":"JWT"}`))
	b, _ := json.Marshal(claims)
	input := header + "." + base64.RawURLEncoding.EncodeToString(b)
	sum := sha256.Sum256([]byte(input))
	sig, err := rsa.SignPKCS1v15(rand.Reader, key, crypto.SHA256, sum[:])
	if err != nil {
		panic("signing failed")
	}
	return input + "." + base64.RawURLEncoding.EncodeToString(sig)
}
