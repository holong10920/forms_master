package auth

import (
	"errors"
	"net/url"
	"regexp"
	"time"
)

type Config struct {
	Origin, Issuer, ClientID, ClientSecret string
	LocalHTTP                              bool
	SessionTTL                             time.Duration
}

func (c Config) Validate() error {
	if c.ClientID == "" || c.SessionTTL < time.Second || c.SessionTTL > 24*time.Hour {
		return errors.New("invalid client or session duration")
	}
	for _, raw := range []string{c.Origin, c.Issuer} {
		u, err := url.Parse(raw)
		if err != nil || u.Host == "" || u.User != nil || u.RawQuery != "" || u.Fragment != "" || u.Path != "" || raw != u.Scheme+"://"+u.Host {
			return errors.New("origin and issuer must be canonical origins")
		}
		loopback := u.Hostname() == "localhost" || u.Hostname() == "127.0.0.1"
		if c.LocalHTTP {
			if u.Scheme != "http" || !loopback {
				return errors.New("local HTTP mode requires loopback HTTP origins")
			}
		} else if u.Scheme != "https" {
			return errors.New("HTTPS required outside explicit loopback development")
		}
	}
	return nil
}
func (c Config) SessionCookie() string {
	if c.LocalHTTP {
		return "fm_local_session"
	}
	return "__Host-fm_session"
}
func (c Config) FlowCookie() string {
	if c.LocalHTTP {
		return "fm_local_flow"
	}
	return "__Host-fm_flow"
}
func (c Config) Callback() string { return c.Origin + "/api/v1/auth/callback" }

var studioTarget = regexp.MustCompile(`^/studio/sites/site_[a-z0-9_]+/forms/frm_[a-z0-9_]+$`)

func AllowedTarget(target string) bool {
	return target == "/dashboard" || target == "/profile" || target == "/settings/profile" || target == "/admin" || target == "/studio" || studioTarget.MatchString(target)
}
