package studio

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"forms-master/go-auth/internal/persistence"
	"os"
	"path/filepath"
)

// Bootstrap initializes only a new synthetic store. Existing data is never replaced.
func Bootstrap(ctx context.Context, root, destination string) (report M, err error) {
	destination, err = filepath.Abs(destination)
	if err != nil {
		return nil, err
	}
	if _, err = os.Lstat(destination); !os.IsNotExist(err) {
		return nil, errors.New("destination already exists or cannot be inspected")
	}
	if err = os.MkdirAll(filepath.Dir(destination), 0700); err != nil {
		return nil, err
	}
	stage, err := os.MkdirTemp(filepath.Dir(destination), "master-bootstrap-")
	if err != nil {
		return nil, err
	}
	// Failed staging stores remain inspectable; never remove unrelated user data.
	defer func() {
		if recover() != nil {
			err = errors.New("synthetic bootstrap failed")
		}
	}()
	db, err := sql.Open("sqlite", filepath.Join(stage, "active.sqlite3"))
	if err != nil {
		return nil, err
	}
	if _, err = db.ExecContext(ctx, schema); err != nil {
		db.Close()
		return nil, err
	}
	if err = db.Close(); err != nil {
		return nil, err
	}
	s, err := Open(ctx, root, stage, nil)
	if err != nil {
		return nil, err
	}
	defer s.Close()
	admin := persistence.User{ID: "synthetic-admin", Subject: "synthetic-admin", Role: "admin", Status: "active"}
	_, err = s.with(ctx, admin, "", func(u *unit) any {
		for _, raw := range list(s.catalog["blocks"]) {
			b := object(raw)
			u.exec(`INSERT INTO block_status VALUES(?,?,'active',1)`, b["pin"], b["digest"])
		}
		u.exec(`INSERT INTO deployments VALUES('current',1,?)`, string(canon(fbks)))
		u.ingest()
		return nil
	})
	if err != nil {
		return nil, err
	}
	count := 0
	for _, name := range []string{"sports", "pc-reference", "pc-plugin"} {
		raw, e := os.ReadFile(filepath.Join(root, "contracts/fixtures/engine", name+".json"))
		if e != nil {
			return nil, e
		}
		var definition M
		if json.Unmarshal(raw, &definition) != nil {
			return nil, errors.New("invalid synthetic seed")
		}
		if name == "pc-plugin" {
			definition["formId"] = "frm_pc_plugin"
		}
		_, err = s.Execute(ctx, admin, "", "save", M{"site": definition["siteId"], "form": definition["formId"], "expected": float64(0), "definition": definition, "title": "Synthetic " + name})
		if err != nil {
			return nil, err
		}
		count++
	}
	var integrity string
	if err = s.DB.QueryRowContext(ctx, "PRAGMA integrity_check").Scan(&integrity); err != nil || integrity != "ok" {
		return nil, errors.New("bootstrap SQLite integrity failure")
	}
	if err = s.Close(); err != nil {
		return nil, err
	}
	report = M{"status": "BOOTSTRAP_INITIALIZED", "database": "Go synthetic SQLite", "seeded_drafts": count, "immutable_files": 0, "immutable_tree_digest": digest(M{}), "sqlite_integrity": "ok"}
	raw, _ := json.MarshalIndent(report, "", "  ")
	if err = os.WriteFile(filepath.Join(stage, "migration-report.json"), raw, 0600); err != nil {
		return nil, err
	}
	// Rename only into an absent destination, refusing even an externally-created empty directory.
	if _, err = os.Lstat(destination); !os.IsNotExist(err) {
		return nil, errors.New("destination appeared during bootstrap")
	}
	if err = os.Rename(stage, destination); err != nil {
		return nil, err
	}
	return report, nil
}
