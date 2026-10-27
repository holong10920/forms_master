package studio

import (
	"bytes"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base32"
	"encoding/hex"
	"encoding/json"
	"errors"
	"github.com/cyberphone/json-canonicalization/go/src/webpki.org/jsoncanonicalizer"
	"golang.org/x/sys/unix"
	"io"
	"io/fs"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
	"syscall"
)

type M = map[string]any

func object(v any) M {
	m, _ := v.(map[string]any)
	if m == nil {
		return M{}
	}
	return m
}
func list(v any) []any {
	switch a := v.(type) {
	case []any:
		return a
	case []M:
		out := make([]any, len(a))
		for i, v := range a {
			out[i] = v
		}
		return out
	case []string:
		out := make([]any, len(a))
		for i, v := range a {
			out[i] = v
		}
		return out
	}
	return []any{}
}
func text(v any) string { s, _ := v.(string); return s }
func integer(v any) int { n, _ := v.(float64); return int(n) }
func canon(v any) []byte {
	raw, e := json.Marshal(v)
	if e != nil {
		panic(Fault{"INVALID_REQUEST", 400})
	}
	out, e := jsoncanonicalizer.Transform(raw)
	if e != nil {
		panic(Fault{"INVALID_REQUEST", 400})
	}
	return out
}
func sha(b []byte) string { sum := sha256.Sum256(b); return hex.EncodeToString(sum[:]) }
func digest(v any) string { return sha(canon(v)) }
func parse(b []byte) M {
	var m M
	if json.Unmarshal(b, &m) != nil || m == nil {
		panic(Fault{"E-INTEGRITY", 503})
	}
	return m
}

var releaseID = regexp.MustCompile(`^(?:dev|rel)_[a-z2-7]{26}$`)
var assetName = regexp.MustCompile(`^assets/[a-z0-9.-]+\.(?:js|css|json)$`)

// Reads reject symlinks/nonregular files in every path component. os.Root additionally
// confines racing path resolution to the selected storage root.
func readSafe(root, key string) ([]byte, error) {
	if !fs.ValidPath(key) {
		return nil, errors.New("E-PATH")
	}
	path := root
	for _, part := range strings.Split(key, "/") {
		path = filepath.Join(path, part)
		info, e := os.Lstat(path)
		if e != nil {
			return nil, e
		}
		if info.Mode()&os.ModeSymlink != 0 {
			return nil, errors.New("E-SYMLINK")
		}
	}
	r, e := os.OpenRoot(root)
	if e != nil {
		return nil, e
	}
	defer r.Close()
	f, e := r.OpenFile(key, os.O_RDONLY|syscall.O_NOFOLLOW|syscall.O_NONBLOCK, 0)
	if e != nil {
		return nil, e
	}
	defer f.Close()
	info, e := f.Stat()
	if e != nil || !info.Mode().IsRegular() || info.Size() > 16*1024*1024 {
		return nil, errors.New("E-FILE")
	}
	raw, err := io.ReadAll(io.LimitReader(f, 16*1024*1024+1))
	if len(raw) > 16*1024*1024 {
		return nil, errors.New("E-FILE")
	}
	return raw, err
}
func syncDir(path string) error {
	f, e := os.Open(path)
	if e != nil {
		return e
	}
	defer f.Close()
	return f.Sync()
}

// Directory descriptors plus O_NOFOLLOW preserve the legacy store's no-symlink
// and write-once rules, including when another process swaps path components.
func writeOnce(root, key string, raw []byte) error {
	if !fs.ValidPath(key) {
		return errors.New("E-PATH")
	}
	if e := os.MkdirAll(root, 0700); e != nil {
		return e
	}
	fd, e := unix.Open(root, unix.O_RDONLY|unix.O_DIRECTORY|unix.O_NOFOLLOW|unix.O_CLOEXEC, 0)
	if e != nil {
		return e
	}
	defer func() { _ = unix.Close(fd) }()
	segments := strings.Split(key, "/")
	for _, part := range segments[:len(segments)-1] {
		made := unix.Mkdirat(fd, part, 0700)
		if made != nil && made != unix.EEXIST {
			return made
		}
		if made == nil {
			if e = syncDescriptor(fd); e != nil {
				return e
			}
		}
		child, e := unix.Openat(fd, part, unix.O_RDONLY|unix.O_DIRECTORY|unix.O_NOFOLLOW|unix.O_CLOEXEC, 0)
		if e != nil {
			return e
		}
		_ = unix.Close(fd)
		fd = child
	}
	name := segments[len(segments)-1]
	compare := func() error {
		existing, e := unix.Openat(fd, name, unix.O_RDONLY|unix.O_NOFOLLOW|unix.O_NONBLOCK|unix.O_CLOEXEC, 0)
		if e != nil {
			return e
		}
		f := os.NewFile(uintptr(existing), name)
		defer f.Close()
		info, e := f.Stat()
		if e != nil || !info.Mode().IsRegular() || info.Size() != int64(len(raw)) {
			return errors.New("E-IMMUTABLE-COLLISION")
		}
		b, e := io.ReadAll(io.LimitReader(f, int64(len(raw))+1))
		if e != nil {
			return e
		}
		if !bytes.Equal(raw, b) {
			return errors.New("E-IMMUTABLE-COLLISION")
		}
		return syncDescriptor(fd)
	}
	if e = compare(); e == nil {
		return nil
	} else if e != unix.ENOENT {
		return e
	}
	var nonce [16]byte
	if _, e = rand.Read(nonce[:]); e != nil {
		return e
	}
	tmp := ".master-" + hex.EncodeToString(nonce[:])
	tmpFD, e := unix.Openat(fd, tmp, unix.O_WRONLY|unix.O_CREAT|unix.O_EXCL|unix.O_NOFOLLOW|unix.O_CLOEXEC, 0600)
	if e != nil {
		return e
	}
	defer unix.Unlinkat(fd, tmp, 0)
	f := os.NewFile(uintptr(tmpFD), tmp)
	if _, e = f.Write(raw); e == nil {
		e = f.Sync()
	}
	if e == nil {
		e = fullSync(f)
	}
	if e == nil {
		e = f.Chmod(0444)
	}
	closeErr := f.Close()
	if e != nil {
		return e
	}
	if closeErr != nil {
		return closeErr
	}
	if e = unix.Linkat(fd, tmp, fd, name, 0); e == unix.EEXIST {
		return compare()
	} else if e != nil {
		return e
	}
	return syncDescriptor(fd)
}
func syncDescriptor(fd int) error {
	duplicate, e := unix.Dup(fd)
	if e != nil {
		return e
	}
	f := os.NewFile(uintptr(duplicate), "directory")
	defer f.Close()
	if e = f.Sync(); e != nil {
		return e
	}
	return fullSync(f)
}

func mustRead(root, key string) []byte {
	b, e := readSafe(root, key)
	if e != nil {
		panic(Fault{"E-INTEGRITY", 503})
	}
	return b
}
func verifyCandidate(path string) (manifest, ir, lock M) {
	root := path
	metadata := "_private"
	if _, e := os.Stat(filepath.Join(root, metadata)); e != nil {
		metadata = ""
		root = filepath.Dir(filepath.Dir(path))
		metadata = "private/" + filepath.Base(path)
	}
	get := func(name string) []byte { return mustRead(root, metadata+"/"+name) }
	manifest = parse(get("candidate-manifest.json"))
	prefix := "dev_"
	if manifest["lrmFormat"] == float64(1) {
		prefix = "rel_"
	}
	sum := sha256.Sum256(canon(manifest))
	ident := prefix + strings.ToLower(base32.StdEncoding.WithPadding(base32.NoPadding).EncodeToString(sum[:]))[:26]
	if ident != filepath.Base(path) {
		panic(Fault{"E-CANDIDATE-INTEGRITY", 503})
	}
	var irRaw []byte
	artifacts := []M{}
	for _, a := range list(manifest["inventory"]) {
		asset := object(a)
		name := text(asset["path"])
		if !assetName.MatchString(name) {
			panic(Fault{"E-PATH", 503})
		}
		raw := mustRead(path, name)
		if "sha256:"+sha(raw) != asset["sha256"] {
			panic(Fault{"E-ASSET-INTEGRITY", 503})
		}
		if strings.HasPrefix(name, "assets/form-ir.") {
			irRaw = raw
		}
		artifacts = append(artifacts, M{"path": name, "sha256": sha(raw)})
	}
	if irRaw == nil {
		panic(Fault{"E-IR-INTEGRITY", 503})
	}
	ir = parse(irRaw)
	lock = parse(get("capability-lock.json"))
	inputs := object(manifest["inputs"])
	if inputs["capabilityLock"] != "sha256:"+digest(lock) {
		panic(Fault{"E-LOCK-INTEGRITY", 503})
	}
	for _, pair := range [][2]string{{"data-contract.json", "dataContract"}, {"chunk-manifest.json", "chunkManifest"}, {"block-lock.json", "blockLock"}} {
		if pair[1] == "blockLock" && inputs[pair[1]] == nil {
			continue
		}
		if inputs[pair[1]] != "sha256:"+sha(get(pair[0])) {
			panic(Fault{"E-PRIVATE-INTEGRITY", 503})
		}
	}
	seal := parse(get("local-integrity.json"))
	index := mustRead(path, "index.html")
	if seal["manifestDigest"] != digest(manifest) || seal["indexHtmlDigest"] != sha(index) {
		panic(Fault{"E-INDEX-INTEGRITY", 503})
	}
	if prefix == "rel_" {
		if !bytes.Equal(get("lrm.json"), canon(manifest)) {
			panic(Fault{"E-LRM-INTEGRITY", 503})
		}
		verifySemantics(ir, get("semantic-fixtures.json"), inputs["ir"])
		att := parse(get("attestation.json"))
		artifacts = append(artifacts, M{"path": "index.html", "sha256": sha(index)})
		sort.Slice(artifacts, func(i, j int) bool { return text(artifacts[i]["path"]) < text(artifacts[j]["path"]) })
		expected := M{"releaseId": ident, "lrmDigest": "sha256:" + digest(manifest), "indexHtmlSha256": sha(index), "provenanceDigest": "sha256:" + sha(get("provenance.json")), "semanticFixturesDigest": "sha256:" + sha(get("semantic-fixtures.json")), "artifactSetDigest": "sha256:" + digest(artifacts)}
		for k, v := range expected {
			if att[k] != v {
				panic(Fault{"E-ATTESTATION-INTEGRITY", 503})
			}
		}
		if inputs["chunkPlan"] != "sha256:"+sha(get("chunk-plan.json")) {
			panic(Fault{"E-CHUNK-PLAN-INTEGRITY", 503})
		}
	}
	return
}
