package engine

import (
	"encoding/json"
	"os/exec"
	"path/filepath"
	"reflect"
	"runtime"
	"testing"
)

func TestMultiProductSubmission(t *testing.T) {
	_, source, _, _ := runtime.Caller(0)
	root := filepath.Clean(filepath.Join(filepath.Dir(source), "../../../.."))
	script := `import {readFileSync} from 'node:fs'; import {pathToFileURL} from 'node:url'; const root=process.argv[1]; const {loadDefinition}=await import(pathToFileURL(root+'/packages/form-engine/src/definition.ts')); console.log(JSON.stringify(loadDefinition(JSON.parse(readFileSync(root+'/contracts/fixtures/engine/multi-product.json')))));`
	cmd := exec.Command("node", "--input-type=module", "-e", script, root)
	cmd.Dir = root
	bytes, err := cmd.CombinedOutput()
	if err != nil {
		t.Fatalf("lower: %v %s", err, bytes)
	}
	var ir M
	if err := json.Unmarshal(bytes, &ir); err != nil {
		t.Fatal(err)
	}
	first := M{"itemId": "itm_a", "product_family": "gakki_site", "category": "guitar-bass", "title": "合成 Model A", "condition": "used"}
	second := M{"itemId": "itm_b", "product_family": "pc_site", "category": "note", "title": "合成 PC Model B", "condition": "used"}
	base := M{"products": []any{first, second}, "kana": "カタカナ", "email": "synthetic@example.invalid", "phone_number": "05012345678", "agree_policy": true}
	accepted := Submission(ir, base)
	if accepted["ok"] != true {
		t.Fatalf("valid cart rejected: %#v", accepted)
	}
	if !reflect.DeepEqual(obj(accepted["payload"])["products"], base["products"]) {
		t.Fatalf("identity/order/projection changed: %#v", accepted)
	}
	for _, name := range []string{"missing-title", "foreign-branch", "duplicate-id", "unknown-child", "empty"} {
		t.Run(name, func(t *testing.T) {
			bytes, _ := json.Marshal(base)
			var payload M
			_ = json.Unmarshal(bytes, &payload)
			rows := arr(payload["products"])
			switch name {
			case "missing-title":
				delete(obj(rows[1]), "title")
			case "foreign-branch":
				obj(rows[0])["category"] = "note"
			case "duplicate-id":
				obj(rows[1])["itemId"] = "itm_a"
			case "unknown-child":
				obj(rows[0])["injected"] = "value"
			case "empty":
				payload["products"] = []any{}
			}
			if got := Submission(ir, payload); got["ok"] != false {
				t.Fatalf("invalid cart admitted: %#v", got)
			}
		})
	}
}
