package studio

import (
	"context"
	"database/sql"
	_ "embed"
	"encoding/json"
	"errors"
	"fmt"
	"forms-master/go-auth/internal/compiler"
	"forms-master/go-auth/internal/persistence"
	_ "modernc.org/sqlite"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"
)

//go:embed 001_legacy.sql
var schema string

const plugin = "@platform/store-selector@1.0.0"
const effect = "@platform/effect-mock-log#recordSubmission/server"

var fbks = []string{plugin + "#storeList/server", plugin + "#storeIdValid/server"}

type Fault struct {
	Code   string
	Status int
}

func (f Fault) Error() string       { return f.Code }
func abort(code string, status int) { panic(Fault{code, status}) }

type Service struct {
	DB                     *sql.DB
	Root, Data, Candidates string
	Compiler               compiler.Adapter
	Auth                   *persistence.Store
	mu                     sync.Mutex
	platform               string
	catalog                M
}
type unit struct {
	s       *Service
	c       *sql.Conn
	ctx     context.Context
	user    persistence.User
	session string
}

func numberInt(v any) int {
	switch n := v.(type) {
	case int:
		return n
	case int64:
		return int(n)
	case float64:
		return int(n)
	}
	return 0
}
func (u *unit) exec(q string, args ...any) int {
	r, e := u.c.ExecContext(u.ctx, q, args...)
	if e != nil {
		abort("STORE_UNAVAILABLE", 503)
	}
	n, e := r.RowsAffected()
	if e != nil {
		abort("STORE_UNAVAILABLE", 503)
	}
	return int(n)
}
func (u *unit) rows(q string, args ...any) []M {
	r, e := u.c.QueryContext(u.ctx, q, args...)
	if e != nil {
		abort("STORE_UNAVAILABLE", 503)
	}
	defer r.Close()
	cols, e := r.Columns()
	if e != nil {
		abort("STORE_UNAVAILABLE", 503)
	}
	out := []M{}
	for r.Next() {
		v := make([]any, len(cols))
		ptr := make([]any, len(cols))
		for i := range v {
			ptr[i] = &v[i]
		}
		if r.Scan(ptr...) != nil {
			abort("STORE_UNAVAILABLE", 503)
		}
		row := M{}
		for i, k := range cols {
			if b, ok := v[i].([]byte); ok {
				v[i] = string(b)
			}
			row[k] = v[i]
		}
		out = append(out, row)
	}
	if r.Err() != nil {
		abort("STORE_UNAVAILABLE", 503)
	}
	return out
}
func (u *unit) one(q string, args ...any) M {
	rows := u.rows(q, args...)
	if len(rows) == 0 {
		return nil
	}
	return rows[0]
}
func (u *unit) audit(site, form, action, target string) {
	u.exec(`INSERT INTO audit(at,actor,site,form,action,target) VALUES(?,?,?,?,?,?)`, float64(time.Now().UnixMilli())/1000, u.user.Subject, site, form, action, target)
}
func Open(ctx context.Context, root, data string, auth *persistence.Store) (s *Service, err error) {
	// Runtime never initializes a new empty business DB or writes the P0 source.
	sourcePath, _ := filepath.EvalSymlinks(filepath.Join(root, "var/s2-publication"))
	dataPath, _ := filepath.EvalSymlinks(data)
	sourceInfo, _ := os.Stat(filepath.Join(root, "var/s2-publication/active.sqlite3"))
	dataInfo, _ := os.Stat(filepath.Join(data, "active.sqlite3"))
	if (sourcePath != "" && sourcePath == dataPath) || (sourceInfo != nil && dataInfo != nil && os.SameFile(sourceInfo, dataInfo)) {
		return nil, errors.New("refusing legacy source data")
	}
	if _, err = os.Stat(filepath.Join(data, "active.sqlite3")); err != nil {
		return nil, errors.New("run the explicit snapshot migration first")
	}
	db, err := sql.Open("sqlite", filepath.Join(data, "active.sqlite3"))
	if err != nil {
		return nil, err
	}
	db.SetMaxOpenConns(1)
	for _, q := range []string{"PRAGMA foreign_keys=ON", "PRAGMA busy_timeout=5000", "PRAGMA journal_mode=WAL"} {
		if _, err = db.ExecContext(ctx, q); err != nil {
			db.Close()
			return nil, err
		}
	}
	s = &Service{DB: db, Root: root, Data: data, Candidates: filepath.Join(root, "var/master-candidates/r"), Auth: auth, Compiler: compiler.Adapter{Root: root}}
	s.catalog, err = s.Compiler.Call(ctx, "catalog", nil, false, false)
	if err != nil {
		db.Close()
		return nil, err
	}
	// Explicit versioned additive migration. Existing Python migrations stay untouched.
	if _, err = db.ExecContext(ctx, `CREATE TABLE IF NOT EXISTS master_migrations(version INTEGER PRIMARY KEY,checksum TEXT NOT NULL,applied_at INTEGER NOT NULL);CREATE TABLE IF NOT EXISTS master_memberships(user_id TEXT NOT NULL,site TEXT NOT NULL,capabilities TEXT NOT NULL,PRIMARY KEY(user_id,site));`); err != nil {
		db.Close()
		return nil, err
	}
	checksum := sha([]byte(schema))
	var existing string
	err = db.QueryRowContext(ctx, `SELECT checksum FROM master_migrations WHERE version=1`).Scan(&existing)
	if err == nil && existing != checksum {
		db.Close()
		return nil, errors.New("migration checksum mismatch")
	}
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		db.Close()
		return nil, err
	}
	_, err = db.ExecContext(ctx, `INSERT OR IGNORE INTO master_migrations VALUES(1,?,unixepoch())`, checksum)
	if err != nil {
		db.Close()
		return nil, err
	}
	grants := map[string]map[string][]string{"synthetic-admin": {}, "synthetic-member": {"site_pc_synthetic": {"form:read"}}, "synthetic-approver": {}}
	for _, site := range []string{"site_pc_synthetic", "site_sports_synthetic"} {
		grants["synthetic-admin"][site] = []string{"form:read", "form:create", "form:edit", "form:review", "form:publish", "form:rollback", "submissions:read", "security:manage"}
		grants["synthetic-approver"][site] = []string{"form:read", "form:review"}
	}
	for user, sites := range grants {
		for site, caps := range sites {
			if _, err = db.ExecContext(ctx, `INSERT OR IGNORE INTO master_memberships VALUES(?,?,?)`, user, site, string(canon(caps))); err != nil {
				db.Close()
				return nil, err
			}
		}
	}
	s.platform = s.fingerprint()
	return s, nil
}
func (s *Service) with(ctx context.Context, user persistence.User, session string, fn func(*unit) any) (result any, err error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	c, e := s.DB.Conn(ctx)
	if e != nil {
		return nil, e
	}
	defer c.Close()
	u := &unit{s: s, c: c, ctx: ctx, user: user, session: session}
	if _, e = c.ExecContext(ctx, "BEGIN IMMEDIATE"); e != nil {
		return nil, e
	}
	defer func() {
		if p := recover(); p != nil {
			_, _ = c.ExecContext(context.Background(), "ROLLBACK")
			if f, ok := p.(Fault); ok {
				err = f
			} else if failure, ok := p.(compiler.Failure); ok {
				err = failure
			} else {
				err = Fault{"STORE_UNAVAILABLE", 503}
			}
		} else if err != nil {
			_, _ = c.ExecContext(context.Background(), "ROLLBACK")
		}
	}()
	result = fn(u)
	_, err = c.ExecContext(ctx, "COMMIT")
	if f, ok := result.(Fault); ok && err == nil {
		result = nil
		err = f
	}
	return
}
func (u *unit) caps(site string) []string {
	r := u.one(`SELECT capabilities FROM master_memberships WHERE user_id=? AND site=?`, u.user.ID, site)
	if r == nil {
		return nil
	}
	var caps []string
	if json.Unmarshal([]byte(text(r["capabilities"])), &caps) != nil {
		abort("FORBIDDEN", 403)
	}
	return caps
}
func (u *unit) permit(site, cap string) {
	caps := u.caps(site)
	if len(caps) == 0 {
		abort("FORBIDDEN", 403)
	}
	if cap == "" {
		cap = "form:read"
	}
	if u.user.Role != "admin" && cap != "form:read" {
		abort("FORBIDDEN", 403)
	}
	for _, c := range caps {
		if c == cap {
			return
		}
	}
	abort("FORBIDDEN", 403)
}
func (u *unit) sites() []M {
	out := []M{}
	for _, r := range u.rows(`SELECT site FROM master_memberships WHERE user_id=? ORDER BY site`, u.user.ID) {
		site := text(r["site"])
		caps := u.caps(site)
		if u.user.Role != "admin" {
			read := false
			for _, c := range caps {
				if c == "form:read" {
					read = true
				}
			}
			caps = []string{}
			if read {
				caps = append(caps, "form:read")
			}
		}
		roles := []string{"viewer"}
		if u.user.Role == "admin" {
			for _, pair := range [][2]string{{"form:edit", "editor"}, {"form:review", "reviewer"}, {"form:publish", "publisher"}, {"security:manage", "security"}} {
				for _, c := range caps {
					if c == pair[0] {
						roles = append(roles, pair[1])
					}
				}
			}
		}
		out = append(out, M{"id": site, "roles": roles, "capabilities": caps})
	}
	return out
}
func (u *unit) document(raw string) M {
	m := parse([]byte(raw))
	if len(m) == 1 && m["snapshotRef"] != nil {
		ref := object(m["snapshotRef"])
		key := text(ref["blobKey"])
		if key != "sha256/"+text(ref["sha256"]) {
			abort("E-SNAPSHOT-INTEGRITY", 503)
		}
		b := mustRead(filepath.Join(u.s.Data, "blobs"), key)
		if sha(b) != ref["sha256"] || len(b) != integer(ref["size"]) {
			abort("E-SNAPSHOT-INTEGRITY", 503)
		}
		return parse(b)
	}
	return m
}
func (u *unit) storeDocument(m M) string {
	raw := canon(m)
	h := sha(raw)
	if e := writeOnce(filepath.Join(u.s.Data, "blobs"), "sha256/"+h, raw); e != nil {
		abort("E-SNAPSHOT-INTEGRITY", 503)
	}
	return string(canon(M{"snapshotRef": M{"blobKey": "sha256/" + h, "sha256": h, "size": len(raw), "format": "jcs-json"}}))
}
func (u *unit) active(site, form string) M {
	r := u.one(`SELECT candidate_id AS candidateId,version FROM local_active WHERE site_id=? AND form_id=?`, site, form)
	if r == nil {
		return M{}
	}
	return r
}
func (u *unit) head(site, form string) int { return numberInt(u.active(site, form)["version"]) }
func (s *Service) fingerprint() string {
	files := map[string]string{}
	for _, dir := range []string{"packages/form-engine/src", "packages/static-runtime/src", "tools/compiler/src", "tools/go-auth/internal", "tools/go-auth/cmd", "tools/go-auth/compiler.ts", "tools/go-auth/generate-studio.ts", "tools/go-auth/studio", "tools/go-auth/web/src", "contracts/schemas"} {
		_ = filepath.WalkDir(filepath.Join(s.Root, dir), func(path string, d os.DirEntry, e error) error {
			if e != nil {
				return e
			}
			if !d.IsDir() && (strings.HasSuffix(path, ".go") || strings.HasSuffix(path, ".ts") || strings.HasSuffix(path, ".json") || strings.HasSuffix(path, ".tsx") || strings.HasSuffix(path, ".js") || strings.HasSuffix(path, ".css") || strings.HasSuffix(path, ".html")) {
				b, e := os.ReadFile(path)
				if e != nil {
					return e
				}
				rel, _ := filepath.Rel(s.Root, path)
				files[filepath.ToSlash(rel)] = sha(b)
			}
			return nil
		})
	}
	return "go_platform_" + digest(files)
}
func (s *Service) Close() error { return s.DB.Close() }
func (s *Service) String() string {
	return fmt.Sprintf("master business store %s", filepath.Base(s.Data))
}

func persistenceHash(raw string) string { return persistence.Hash(raw) }
