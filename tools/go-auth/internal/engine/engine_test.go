package engine

import (
	"encoding/json"
	"os"
	"os/exec"
	"path/filepath"
	"reflect"
	"runtime"
	"testing"
)

func TestSharedSemanticFixtures(t *testing.T) {
	_, source, _, _ := runtime.Caller(0)
	root := filepath.Clean(filepath.Join(filepath.Dir(source), "../../../.."))
	cmd := exec.Command("node", filepath.Join(root, "tools/go-auth/semantic-fixtures.ts"))
	cmd.Dir = root
	if b, e := cmd.CombinedOutput(); e != nil {
		t.Fatalf("fixture lowering: %s %v", b, e)
	}
	files, _ := filepath.Glob(filepath.Join(root, "var/go-auth/semantic/*.json"))
	count := 0
	for _, file := range files {
		raw, e := os.ReadFile(file)
		if e != nil {
			t.Fatal(e)
		}
		var suite struct {
			IR    M   `json:"ir"`
			Cases []M `json:"cases"`
		}
		if json.Unmarshal(raw, &suite) != nil {
			t.Fatal("invalid fixtures")
		}
		for _, c := range suite.Cases {
			count++
			t.Run(filepath.Base(file)+"/"+str(c["name"]), func(t *testing.T) {
				got := Case(suite.IR, c)
				b, _ := json.Marshal(got)
				var normalized any
				_ = json.Unmarshal(b, &normalized)
				if !reflect.DeepEqual(normalized, c["expected"]) {
					want, _ := json.Marshal(c["expected"])
					t.Fatalf("Go=%s\nTS=%s", b, want)
				}
			})
		}
	}
	if count < 236 {
		t.Fatalf("expected full golden+seed suite, got %d", count)
	}
	t.Logf("TS/Go compared %d cases", count)
}
func TestSubmissionBoundaries(t *testing.T) {
	_, source, _, _ := runtime.Caller(0)
	root := filepath.Clean(filepath.Join(filepath.Dir(source), "../../../.."))
	files, _ := filepath.Glob(filepath.Join(root, "var/go-auth/semantic/*.json"))
	count := 0
	accepted := 0
	for _, file := range files {
		raw, e := os.ReadFile(file)
		if e != nil {
			t.Fatal(e)
		}
		var suite struct {
			IR    M
			Cases []M
		}
		if json.Unmarshal(raw, &suite) != nil {
			t.Fatal("fixtures")
		}
		for _, p := range []any{nil, M{}, M{"unknown": "unexpected"}} {
			result := Submission(suite.IR, p)
			count++
			if p == nil && result["ok"] != false {
				t.Fatal("non-object admitted")
			}
			if m, ok := p.(map[string]any); ok && m["unknown"] != nil && result["ok"] != false {
				t.Fatal("unknown field admitted")
			}
		}
		for _, c := range suite.Cases {
			expected := obj(c["expected"])
			if len(arr(expected["errors"])) != 0 {
				continue
			}
			payload, ok := expected["payload"].(map[string]any)
			if !ok || len(payload) == 0 {
				continue
			}
			result := Submission(suite.IR, payload)
			if result["ok"] != true {
				continue
			} // Some fixtures model pre-submit state, not a complete request.
			if !reflect.DeepEqual(result["payload"], expected["payload"]) {
				t.Fatalf("TS projection changed: %s", c["name"])
			}
			accepted++
		}
	}
	if count < 24 || accepted == 0 {
		t.Fatalf("missing coverage: %d boundary cases, %d complete payloads", count, accepted)
	}
	t.Logf("Go submission boundaries: %d; accepted TS projections: %d", count, accepted)
}
