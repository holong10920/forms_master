package auth

import (
	"context"
	"crypto/rand"
	"crypto/subtle"
	"encoding/base64"
	"encoding/json"
	"errors"
	"log/slog"
	"net"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"

	"forms-master/go-auth/internal/persistence"
	"github.com/coreos/go-oidc/v3/oidc"
	"golang.org/x/oauth2"
)

type Server struct {
	Business func(http.ResponseWriter, *http.Request, persistence.User, string)
	Config   Config
	Store    *persistence.Store
	OAuth    oauth2.Config
	Verifier *oidc.IDTokenVerifier
	Client   *http.Client
	Now      func() time.Time
	mu       sync.Mutex
	limits   map[string]bucket
}
type bucket struct {
	count int
	until time.Time
}

func Random() string {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		panic("secure random unavailable")
	}
	return base64.RawURLEncoding.EncodeToString(b)
}
func New(ctx context.Context, c Config, store *persistence.Store) (*Server, error) {
	if err := c.Validate(); err != nil {
		return nil, err
	}
	client := &http.Client{Timeout: 8 * time.Second, CheckRedirect: func(*http.Request, []*http.Request) error { return http.ErrUseLastResponse }}
	ctx = oidc.ClientContext(ctx, client)
	p, err := oidc.NewProvider(ctx, c.Issuer)
	if err != nil {
		return nil, err
	}
	var metadata struct {
		JWKS string `json:"jwks_uri"`
	}
	if err = p.Claims(&metadata); err != nil {
		return nil, err
	}
	ep := p.Endpoint()
	// Discovery cannot redirect code exchange to an untrusted origin.
	for _, raw := range []string{ep.AuthURL, ep.TokenURL, metadata.JWKS} {
		u, e := url.Parse(raw)
		if e != nil || u.Scheme+"://"+u.Host != c.Issuer {
			return nil, errors.New("provider endpoint outside configured issuer")
		}
	}
	return &Server{Config: c, Store: store, OAuth: oauth2.Config{ClientID: c.ClientID, ClientSecret: c.ClientSecret, RedirectURL: c.Callback(), Endpoint: ep, Scopes: []string{oidc.ScopeOpenID}}, Verifier: p.Verifier(&oidc.Config{ClientID: c.ClientID, SupportedSigningAlgs: []string{"RS256"}}), Client: client, Now: time.Now, limits: make(map[string]bucket)}, nil
}
func (s *Server) Handler() http.Handler {
	m := http.NewServeMux()
	m.HandleFunc("GET /healthz", func(w http.ResponseWriter, r *http.Request) {
		if err := s.Store.DB.PingContext(r.Context()); err != nil {
			fail(w, 503, "unavailable")
			return
		}
		write(w, 200, map[string]string{"status": "ok"})
	})
	if s.Business != nil {
		m.HandleFunc("/api/", s.protected(false, s.Business))
	}
	m.HandleFunc("GET /api/v1/auth/login", s.login)
	m.HandleFunc("GET /api/v1/auth/callback", s.callback)
	m.HandleFunc("GET /api/v1/auth/me", s.protected(false, func(w http.ResponseWriter, r *http.Request, u persistence.User, raw string) {
		write(w, 200, map[string]any{"user": u, "csrf_token": csrf(raw)})
	}))
	m.HandleFunc("POST /api/v1/auth/logout", s.protected(false, s.logout))
	m.HandleFunc("GET /api/v1/dashboard", s.protected(false, func(w http.ResponseWriter, r *http.Request, u persistence.User, _ string) {
		write(w, 200, map[string]string{"message": "Welcome to Form Master", "role": u.Role})
	}))
	m.HandleFunc("GET /api/v1/admin/overview", s.protected(true, func(w http.ResponseWriter, r *http.Request, _ persistence.User, _ string) {
		write(w, 200, map[string]string{"message": "Admin workspace", "status": "Phase 1 — management coming next"})
	}))
	m.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) { fail(w, 404, "not_found") })
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		id := Random()
		w.Header().Set("X-Request-ID", id)
		w.Header().Set("Cache-Control", "no-store")
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("Referrer-Policy", "no-referrer")
		w.Header().Set("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'")
		expected, _ := url.Parse(s.Config.Origin)
		if r.Host != expected.Host {
			fail(w, 400, "invalid_host")
			return
		}
		if r.Method != "GET" && r.Method != "HEAD" && r.Header.Get("Origin") != s.Config.Origin {
			fail(w, 403, "untrusted_origin")
			return
		}
		defer func() {
			if recover() != nil {
				slog.Error("request_failed", "request_id", id)
				fail(w, 500, "internal_error")
			}
		}()
		// Query strings deliberately excluded: callbacks contain authorization codes.
		slog.Info("request", "request_id", id, "method", r.Method, "path", r.URL.Path)
		m.ServeHTTP(w, r)
	})
}
func write(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}
func fail(w http.ResponseWriter, status int, code string) {
	write(w, status, map[string]string{"error": code})
}
func cookie(r *http.Request, name string) string {
	c, err := r.Cookie(name)
	if err != nil {
		return ""
	}
	return c.Value
}
func (s *Server) setCookie(w http.ResponseWriter, name, value string, age int) {
	http.SetCookie(w, &http.Cookie{Name: name, Value: value, Path: "/", HttpOnly: true, Secure: !s.Config.LocalHTTP, SameSite: http.SameSiteLaxMode, MaxAge: age})
}
func csrf(raw string) string { return persistence.Hash("csrf:" + raw) }
func equal(a, b string) bool { return subtle.ConstantTimeCompare([]byte(a), []byte(b)) == 1 }
func (s *Server) allow(remote string) bool {
	host, _, err := net.SplitHostPort(remote)
	if err != nil {
		host = remote
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	now := s.Now()
	for k, b := range s.limits {
		if !now.Before(b.until) {
			delete(s.limits, k)
		}
	}
	b := s.limits[host]
	if b.until.IsZero() {
		b.until = now.Add(time.Minute)
	}
	if b.count >= 20 || len(s.limits) > 10000 {
		return false
	}
	b.count++
	s.limits[host] = b
	return true
}
func (s *Server) login(w http.ResponseWriter, r *http.Request) {
	if !s.allow(r.RemoteAddr) {
		w.Header().Set("Retry-After", "60")
		fail(w, 429, "rate_limited")
		return
	}
	target := r.URL.Query().Get("return_to")
	if target == "" {
		target = "/dashboard"
	}
	if !AllowedTarget(target) {
		fail(w, 400, "invalid_return_to")
		return
	}
	if lang := r.URL.Query().Get("lang"); lang == "ja" || lang == "vi" {
		target += "?lang=" + lang
	}
	state, nonce, verifier := Random(), Random(), oauth2.GenerateVerifier()
	f := persistence.Flow{Nonce: nonce, Verifier: verifier, Target: target, Previous: persistence.Hash(cookie(r, s.Config.SessionCookie()))}
	if err := s.Store.Begin(r.Context(), state, f, s.Now()); err != nil {
		fail(w, 500, "storage_error")
		return
	}
	s.setCookie(w, s.Config.FlowCookie(), state, 300)
	http.Redirect(w, r, s.OAuth.AuthCodeURL(state, oauth2.S256ChallengeOption(verifier), oidc.Nonce(nonce)), http.StatusFound)
}
func (s *Server) callback(w http.ResponseWriter, r *http.Request) {
	state := r.URL.Query().Get("state")
	s.setCookie(w, s.Config.FlowCookie(), "", -1)
	if len(state) != 43 || !equal(state, cookie(r, s.Config.FlowCookie())) {
		s.loginError(w, r)
		return
	}
	f, err := s.Store.Consume(r.Context(), state, s.Now())
	if err != nil {
		s.loginError(w, r)
		return
	}
	code := r.URL.Query().Get("code")
	if code == "" || len(code) > 2048 {
		s.loginError(w, r)
		return
	}
	ctx := oidc.ClientContext(r.Context(), s.Client)
	token, err := s.OAuth.Exchange(ctx, code, oauth2.VerifierOption(f.Verifier))
	if err != nil {
		s.loginError(w, r)
		return
	}
	raw, ok := token.Extra("id_token").(string)
	if !ok {
		s.loginError(w, r)
		return
	}
	id, err := s.Verifier.Verify(ctx, raw)
	if err != nil {
		s.loginError(w, r)
		return
	}
	if !equal(id.Nonce, f.Nonce) || id.IssuedAt.After(s.Now().Add(30*time.Second)) || id.Subject == "" {
		s.loginError(w, r)
		return
	}
	secret := Random()
	if err = s.Store.Complete(ctx, s.Config.Issuer, id.Subject, secret, f.Previous, s.Now(), s.Config.SessionTTL); err != nil {
		s.loginError(w, r)
		return
	}
	s.setCookie(w, s.Config.SessionCookie(), secret, int(s.Config.SessionTTL.Seconds()))
	http.Redirect(w, r, s.Config.Origin+f.Target, http.StatusFound)
}
func (s *Server) loginError(w http.ResponseWriter, r *http.Request) {
	http.Redirect(w, r, s.Config.Origin+"/login?error=authentication_failed", http.StatusFound)
}
func (s *Server) protected(admin bool, next func(http.ResponseWriter, *http.Request, persistence.User, string)) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		raw := cookie(r, s.Config.SessionCookie())
		if len(raw) != 43 {
			fail(w, 401, "unauthenticated")
			return
		}
		u, err := s.Store.Authenticate(r.Context(), raw, s.Now())
		if err != nil {
			if errors.Is(err, persistence.ErrUnauthenticated) {
				fail(w, 401, "unauthenticated")
			} else {
				fail(w, 500, "storage_error")
			}
			return
		}
		if r.Method != "GET" && !equal(r.Header.Get("X-CSRF-Token"), csrf(raw)) {
			fail(w, 403, "invalid_csrf")
			return
		}
		if admin && u.Role != "admin" {
			fail(w, 403, "forbidden")
			return
		}
		next(w, r, u, raw)
	}
}
func (s *Server) logout(w http.ResponseWriter, r *http.Request, _ persistence.User, raw string) {
	r.Body = http.MaxBytesReader(w, r.Body, 1024)
	if r.ContentLength > 0 || strings.Contains(r.Header.Get("Content-Type"), "application/x-www-form-urlencoded") {
		fail(w, 400, "unexpected_body")
		return
	}
	if err := s.Store.Revoke(r.Context(), raw, s.Now()); err != nil {
		fail(w, 500, "storage_error")
		return
	}
	s.setCookie(w, s.Config.SessionCookie(), "", -1)
	w.WriteHeader(204)
}
