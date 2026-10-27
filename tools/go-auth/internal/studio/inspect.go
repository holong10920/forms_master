package studio

import (
	"context"
	"database/sql"
	"errors"
	"os"
	"path/filepath"
)

// Inspect performs only read-only queries and verified filesystem reads. It is
// an operator verification command, not an HTTP administration bypass.
func Inspect(ctx context.Context, root, data string) (result M, err error) {
	defer func() {
		if p := recover(); p != nil {
			err = errors.New("integrity verification failed")
		}
	}()
	source := filepath.Join(root, "var/s2-publication")
	baseline := parse(mustRead(data, "migration-report.json"))
	tree := M{}
	unchanged := true
	if baseline["status"] != "BOOTSTRAP_INITIALIZED" {
		for _, dir := range []string{"blobs", "objects"} {
			if e := filepath.WalkDir(filepath.Join(source, dir), func(path string, d os.DirEntry, walkErr error) error {
				if walkErr != nil {
					return walkErr
				}
				if d.IsDir() {
					return nil
				}
				rel, e := filepath.Rel(source, path)
				if e != nil {
					return e
				}
				key := filepath.ToSlash(rel)
				raw := mustRead(source, key)
				tree[key] = sha(raw)
				if sha(mustRead(data, key)) != sha(raw) {
					unchanged = false
				}
				return nil
			}); e != nil {
				return nil, e
			}
		}
		if digest(tree) != baseline["immutable_tree_digest"] {
			return nil, errors.New("legacy immutable tree changed since migration")
		}
	}
	db, e := sql.Open("sqlite", "file:"+filepath.ToSlash(filepath.Join(data, "active.sqlite3"))+"?mode=ro")
	if e != nil {
		return nil, e
	}
	defer db.Close()
	var integrity string
	if e = db.QueryRowContext(ctx, `PRAGMA integrity_check`).Scan(&integrity); e != nil || integrity != "ok" {
		return nil, errors.New("SQLite integrity failure")
	}
	counts := M{}
	for _, table := range []string{"drafts", "reviews", "managed_releases", "local_releases", "local_active", "submissions", "outbox", "mock_effects", "audit"} {
		var n int
		if e = db.QueryRowContext(ctx, "SELECT count(*) FROM "+table).Scan(&n); e != nil {
			return nil, e
		}
		counts[table] = n
	}
	effects := []M{}
	rows, e := db.QueryContext(ctx, `SELECT m.id,m.submission,o.state FROM mock_effects m JOIN outbox o ON o.submission=m.submission ORDER BY m.at DESC LIMIT 5`)
	if e != nil {
		return nil, e
	}
	for rows.Next() {
		var id, submission, state string
		if e = rows.Scan(&id, &submission, &state); e != nil {
			rows.Close()
			return nil, e
		}
		effects = append(effects, M{"id": id, "submission": submission, "state": state})
	}
	rows.Close()
	return M{"sqlite_integrity": integrity, "legacy_immutable_tree_digest": digest(tree), "migrated_original_files_unchanged": unchanged, "verified_original_files": len(tree), "current_rows": counts, "latest_mock_effects": effects, "business_authority": "Go", "T12_K13": "VERIFICATION_PENDING"}, nil
}

// VerifyArtifact runs the same read-only integrity/semantic checks as public admission.
func VerifyArtifact(path string) (result M, err error) {
	defer func() {
		if recover() != nil {
			err = errors.New("artifact integrity verification failed")
		}
	}()
	manifest, _, _ := verifyCandidate(path)
	return manifest, nil
}
