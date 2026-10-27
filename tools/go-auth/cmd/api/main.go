package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"forms-master/go-auth/internal/auth"
	"forms-master/go-auth/internal/persistence"
	"forms-master/go-auth/internal/platform"
	"forms-master/go-auth/internal/studio"
)

func main() {
	if err := run(); err != nil {
		slog.Error("startup_failed", "error", err)
		os.Exit(1)
	}
}
func run() error {
	slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, nil)))
	ttl, err := time.ParseDuration(platform.Env("FM_SESSION_TTL", "8h"))
	if err != nil {
		return err
	}
	c := auth.Config{Origin: platform.Env("FM_ORIGIN", "http://localhost:4180"), Issuer: platform.Env("FM_ISSUER", "http://127.0.0.1:4182"), ClientID: platform.Env("FM_CLIENT_ID", "form-master-go"), ClientSecret: os.Getenv("FM_CLIENT_SECRET"), LocalHTTP: os.Getenv("FM_LOCAL_HTTP") == "1", SessionTTL: ttl}
	if err = c.Validate(); err != nil {
		return err
	}
	path := platform.Env("FM_DATABASE", "../../var/go-auth/auth.sqlite3")
	if err = os.MkdirAll(filepath.Dir(path), 0700); err != nil {
		return err
	}
	db, err := persistence.Open(path)
	if err != nil {
		return err
	}
	defer db.DB.Close()
	// Synthetic identities are never seeded in HTTPS/production mode.
	if c.LocalHTTP {
		if err = db.Seed(context.Background(), c.Issuer); err != nil {
			return err
		}
	}
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	s, err := auth.New(ctx, c, db)
	if err != nil {
		return err
	}
	if os.Getenv("FM_MASTER") == "1" {
		if !c.LocalHTTP || (os.Getenv("FB_DATA_MODE") != "" && os.Getenv("FB_DATA_MODE") != "synthetic") {
			return errors.New("synthetic loopback configuration required")
		}
		for _, key := range []string{"AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "SMTP_PASSWORD"} {
			if os.Getenv(key) != "" {
				return errors.New("real connector credentials refused")
			}
		}
		root, err := filepath.Abs("../..")
		if err != nil {
			return err
		}
		business, err := studio.Open(context.Background(), root, platform.Env("FM_MASTER_DATA", filepath.Join(root, "var/master")), db)
		if err != nil {
			return err
		}
		defer business.Close()
		s.Business = business.HTTP
		workerCtx, stopWorker := context.WithCancel(context.Background())
		done := make(chan struct{})
		defer func() { stopWorker(); <-done }()
		go func() {
			defer close(done)
			ticker := time.NewTicker(time.Second)
			defer ticker.Stop()
			for {
				select {
				case <-ticker.C:
					business.Worker(workerCtx)
				case <-workerCtx.Done():
					return
				}
			}
		}()
		return platform.RunGroup(map[string]http.Handler{"127.0.0.1:4181": s.Handler(), "127.0.0.1:4183": business.Public(false), "127.0.0.1:4185": business.Public(true)})
	}
	return platform.Run(platform.Env("FM_LISTEN", "127.0.0.1:4181"), s.Handler())
}
