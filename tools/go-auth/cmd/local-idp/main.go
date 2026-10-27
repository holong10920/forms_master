package main

import (
	"crypto/rand"
	"crypto/rsa"
	"log/slog"
	"os"

	"forms-master/go-auth/internal/localidp"
	"forms-master/go-auth/internal/platform"
)

func main() {
	// Intentionally fixed loopback configuration; cannot be bound for remote use.
	key, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		slog.Error("key_generation_failed")
		os.Exit(1)
	}
	p := localidp.New("http://127.0.0.1:4182", "http://localhost:4180/api/v1/auth/callback", "form-master-go", key)
	if err = platform.Run("127.0.0.1:4182", p.Handler()); err != nil {
		slog.Error("provider_failed")
		os.Exit(1)
	}
}
