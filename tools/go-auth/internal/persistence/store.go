package persistence

import (
	"context"
	"crypto/sha256"
	"database/sql"
	_ "embed"
	"encoding/hex"
	"errors"
	"fmt"
	"time"

	_ "modernc.org/sqlite"
)

//go:embed 001_init.sql
var migration string

var ErrUnauthenticated = errors.New("unauthenticated")

type User struct {
	ID          string `json:"id"`
	Subject     string `json:"identity_subject"`
	Email       string `json:"email"`
	DisplayName string `json:"display_name"`
	Role        string `json:"role"`
	Status      string `json:"status"`
}
type Store struct{ DB *sql.DB }
type Flow struct{ Nonce, Verifier, Target, Previous string }

func Hash(secret string) string { b := sha256.Sum256([]byte(secret)); return hex.EncodeToString(b[:]) }
func Open(path string) (*Store, error) {
	db, err := sql.Open("sqlite", path)
	if err != nil {
		return nil, err
	}
	db.SetMaxOpenConns(1)
	for _, stmt := range []string{"PRAGMA foreign_keys=ON", "PRAGMA busy_timeout=5000", "PRAGMA journal_mode=WAL", migration} {
		if _, err = db.Exec(stmt); err != nil {
			db.Close()
			return nil, fmt.Errorf("initialize database: %w", err)
		}
	}
	return &Store{DB: db}, nil
}
func (s *Store) Seed(ctx context.Context, issuer string) error {
	for _, role := range []string{"admin", "member"} {
		sub := "synthetic-" + role
		_, err := s.DB.ExecContext(ctx, `INSERT INTO users VALUES(?,?,?,?,?,?, 'active',unixepoch(),unixepoch()) ON CONFLICT(issuer,identity_subject) DO NOTHING`, sub, issuer, sub, sub+"@example.invalid", "Synthetic "+role, role)
		if err != nil {
			return err
		}
	}
	_, err := s.DB.ExecContext(ctx, `INSERT INTO users VALUES('synthetic-approver',?,'synthetic-approver','synthetic-approver@example.invalid','Synthetic approver','admin','active',unixepoch(),unixepoch()) ON CONFLICT(issuer,identity_subject) DO NOTHING`, issuer)
	return err
}
func (s *Store) Begin(ctx context.Context, state string, f Flow, now time.Time) error {
	tx, err := s.DB.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()
	if _, err = tx.ExecContext(ctx, `DELETE FROM login_flows WHERE expires_at <= ?`, now.Unix()); err != nil {
		return err
	}
	// Expired and revoked sessions are not retained indefinitely in this local store.
	if _, err = tx.ExecContext(ctx, `DELETE FROM sessions WHERE expires_at <= ? OR revoked_at IS NOT NULL`, now.Unix()); err != nil {
		return err
	}
	_, err = tx.ExecContext(ctx, `INSERT INTO login_flows VALUES(?,?,?,?,?,?)`, Hash(state), f.Nonce, f.Verifier, f.Target, f.Previous, now.Add(5*time.Minute).Unix())
	if err != nil {
		return err
	}
	return tx.Commit()
}

// Consume atomically deletes a flow, including failed exchanges, preventing replay.
func (s *Store) Consume(ctx context.Context, state string, now time.Time) (Flow, error) {
	var f Flow
	err := s.DB.QueryRowContext(ctx, `DELETE FROM login_flows WHERE state_hash=? AND expires_at>? RETURNING nonce,pkce_verifier,target,previous_session`, Hash(state), now.Unix()).Scan(&f.Nonce, &f.Verifier, &f.Target, &f.Previous)
	return f, err
}
func (s *Store) Complete(ctx context.Context, issuer, subject, secret, previous string, now time.Time, ttl time.Duration) error {
	tx, err := s.DB.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()
	var id string
	err = tx.QueryRowContext(ctx, `SELECT id FROM users WHERE issuer=? AND identity_subject=? AND status='active'`, issuer, subject).Scan(&id)
	if errors.Is(err, sql.ErrNoRows) {
		return ErrUnauthenticated
	}
	if err != nil {
		return err
	}
	if _, err = tx.ExecContext(ctx, `UPDATE sessions SET revoked_at=? WHERE verifier=?`, now.Unix(), previous); err != nil {
		return err
	}
	if _, err = tx.ExecContext(ctx, `INSERT INTO sessions VALUES(?,?,?,?,NULL)`, Hash(secret), id, now.Unix(), now.Add(ttl).Unix()); err != nil {
		return err
	}
	return tx.Commit()
}
func (s *Store) Authenticate(ctx context.Context, secret string, now time.Time) (User, error) {
	var u User
	err := s.DB.QueryRowContext(ctx, `SELECT u.id,u.identity_subject,u.email,u.display_name,u.role,u.status FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.verifier=? AND s.expires_at>? AND s.revoked_at IS NULL AND u.status='active'`, Hash(secret), now.Unix()).Scan(&u.ID, &u.Subject, &u.Email, &u.DisplayName, &u.Role, &u.Status)
	if errors.Is(err, sql.ErrNoRows) {
		return u, ErrUnauthenticated
	}
	return u, err
}
func (s *Store) Revoke(ctx context.Context, secret string, now time.Time) error {
	_, err := s.DB.ExecContext(ctx, `UPDATE sessions SET revoked_at=? WHERE verifier=?`, now.Unix(), Hash(secret))
	return err
}
