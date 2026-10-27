package studio

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"strings"
	"time"
)

func Snapshot(ctx context.Context, root, source, destination string) (report M, err error) {
	source, _ = filepath.Abs(source)
	destination, _ = filepath.Abs(destination)
	if real, e := filepath.EvalSymlinks(source); e == nil {
		source = real
	}
	if parent, e := filepath.EvalSymlinks(filepath.Dir(destination)); e == nil {
		destination = filepath.Join(parent, filepath.Base(destination))
	}
	if source == destination || strings.HasPrefix(destination, source+string(os.PathSeparator)) {
		return nil, errors.New("source and destination must be isolated")
	}
	if _, e := os.Stat(destination); !os.IsNotExist(e) {
		return nil, errors.New("destination already exists; refusing overwrite")
	}
	if e := os.MkdirAll(filepath.Dir(destination), 0700); e != nil {
		return nil, e
	}
	stage, e := os.MkdirTemp(filepath.Dir(destination), "master-migration-")
	if e != nil {
		return nil, e
	}
	// Keep a failed staging snapshot for inspection, never delete user data.
	report = M{"source": source, "destination": destination, "staging": stage, "started_at": time.Now().UTC().Format(time.RFC3339)}
	defer func() {
		if p := recover(); p != nil {
			if f, ok := p.(Fault); ok {
				err = f
			} else {
				err = errors.New("snapshot verification failed")
			}
		}
	}()
	db, e := sql.Open("sqlite", "file:"+filepath.ToSlash(filepath.Join(source, "active.sqlite3"))+"?mode=ro")
	if e != nil {
		return report, e
	}
	defer db.Close()
	if _, e = db.ExecContext(ctx, "VACUUM INTO ?", filepath.Join(stage, "active.sqlite3")); e != nil {
		return report, e
	}
	checksums := M{}
	for _, dir := range []string{"blobs", "objects"} {
		e = filepath.WalkDir(filepath.Join(source, dir), func(path string, d os.DirEntry, walkErr error) error {
			if walkErr != nil {
				return walkErr
			}
			if d.Type()&os.ModeSymlink != 0 {
				return errors.New("source contains symlink")
			}
			if d.IsDir() {
				return nil
			}
			relative, e := filepath.Rel(source, path)
			if e != nil {
				return e
			}
			key := filepath.ToSlash(relative)
			raw, e := readSafe(source, key)
			if e != nil {
				return e
			}
			if e = writeOnce(stage, key, raw); e != nil {
				return e
			}
			checksums[key] = sha(raw)
			return nil
		})
		if e != nil {
			return report, e
		}
	}
	copyDB, e := sql.Open("sqlite", filepath.Join(stage, "active.sqlite3"))
	if e != nil {
		return report, e
	}
	defer copyDB.Close()
	var integrity string
	if e = copyDB.QueryRowContext(ctx, "PRAGMA integrity_check").Scan(&integrity); e != nil || integrity != "ok" {
		return report, errors.New("SQLite integrity failure")
	}
	counts := M{}
	rows, e := copyDB.QueryContext(ctx, `SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`)
	if e != nil {
		return report, e
	}
	names := []string{}
	for rows.Next() {
		var name string
		_ = rows.Scan(&name)
		names = append(names, name)
	}
	rows.Close()
	for _, name := range names {
		var n int
		if e = copyDB.QueryRowContext(ctx, `SELECT count(*) FROM "`+strings.ReplaceAll(name, `"`, `""`)+`"`).Scan(&n); e != nil {
			return report, e
		}
		counts[name] = n
	}
	releases := []string{}
	r, e := copyDB.QueryContext(ctx, `SELECT candidate_id FROM local_releases`)
	if e != nil {
		return report, e
	}
	for r.Next() {
		var id string
		_ = r.Scan(&id)
		if !releaseID.MatchString(id) {
			r.Close()
			return report, errors.New("invalid release identity")
		}
		releases = append(releases, id)
	}
	r.Close()
	for _, id := range releases {
		verifyCandidate(filepath.Join(stage, "objects/releases", id))
	}
	// Transient credentials/preview handles are never transferred across auth boundaries.
	for _, table := range []string{"previews", "oidc_tokens", "oidc_states", "oidc_codes", "sessions"} {
		if _, e = copyDB.ExecContext(ctx, "DELETE FROM "+table); e != nil {
			return report, e
		}
	}
	if e = copyDB.Close(); e != nil {
		return report, e
	}
	report["source_rows"] = counts
	report["immutable_files"] = len(checksums)
	report["immutable_tree_digest"] = digest(checksums)
	report["verified_releases"] = len(releases)
	report["sqlite_integrity"] = integrity
	report["ephemeral_auth_invalidated"] = true
	report["status"] = "SNAPSHOT_VERIFIED"
	report["database_sha256"] = sha(mustRead(stage, "active.sqlite3"))
	raw, _ := json.MarshalIndent(report, "", "  ")
	if e = os.WriteFile(filepath.Join(stage, "migration-report.json"), raw, 0600); e != nil {
		return report, e
	}
	if e = os.Rename(stage, destination); e != nil {
		return report, e
	}
	return report, nil
}
