package studio

import (
	"bytes"
	"context"
	"encoding/json"
	"forms-master/go-auth/internal/compiler"
	"forms-master/go-auth/internal/persistence"
	"io/fs"
	"net/http/httptest"
	"os"
	"path/filepath"
	"reflect"
	"strings"
	"testing"
)

// A two-screen form (Input → Submit → Completion) built only from typed display components.
func displayForm(form string) M {
	display := func(d M) M { return M{"display": d} }
	return M{"schemaVersion": "1.0.0", "kind": "form", "formId": form, "siteId": "site_pc_synthetic",
		"locale": M{"default": "ja", "supported": []any{"ja"}},
		"fields": []any{
			M{"id": "fld_plan", "key": "plan", "type": "choice.radio", "label": M{"ja": "プラン"}, "classification": "public", "required": true,
				"options": []any{M{"value": "a", "label": M{"ja": "プランA"}}, M{"value": "b", "label": M{"ja": "プランB"}}}},
			M{"id": "fld_name", "key": "name", "type": "text", "label": M{"ja": "お名前"}, "classification": "personal", "required": true},
		},
		"conditions": M{},
		"steps": []any{
			M{"id": "stp_plan", "kind": "form", "title": M{"ja": "プラン選択"}, "description": M{"ja": "ご希望のプランを選んでください"},
				"content": []any{display(M{"id": "dsp_intro", "type": "heading", "text": M{"ja": "お申し込み"}}), M{"field": "$local:fld_plan"}},
				"transitions": []any{M{"default": "stp_name"}}},
			M{"id": "stp_name", "kind": "form",
				"content": []any{M{"field": "$local:fld_name"}, display(M{"id": "dsp_plan", "type": "fieldValue", "field": "$local:fld_plan"})},
				"transitions": []any{M{"default": "stp_review"}}},
			M{"id": "stp_review", "kind": "review", "autoSubmit": true,
				"content": []any{display(M{"id": "dsp_summary", "type": "summary", "title": M{"ja": "入力内容"}})},
				"transitions": []any{M{"default": "stp_done"}}},
			M{"id": "stp_done", "kind": "complete", "content": []any{
				display(M{"id": "dsp_image", "type": "image", "asset": "success", "alt": M{"ja": "完了"}}),
				display(M{"id": "dsp_thanks", "type": "text", "text": M{"ja": "ありがとうございました"}}),
				display(M{"id": "dsp_receipt", "type": "reference"}),
				display(M{"id": "dsp_home", "type": "button", "label": M{"ja": "トップへ"}, "action": "link", "link": "home"}),
				display(M{"id": "dsp_again", "type": "button", "label": M{"ja": "新しく申し込む"}, "action": "restart"}),
			}},
		}}
}

func TestDisplayComponentsSaveReloadPublishSubmit(t *testing.T) {
	s, admin, _ := setup(t)
	ctx := context.Background()
	session := adminSession(t, s, admin)
	form := "frm_display_contract"
	d := displayForm(form)
	call(t, s, admin, "save", M{"site": "site_pc_synthetic", "form": form, "definition": d, "title": "Synthetic display", "expected": float64(0)})
	reloaded := call(t, s, admin, "get", M{"site": "site_pc_synthetic", "form": form})
	want, _ := json.Marshal(d["steps"])
	got, _ := json.Marshal(object(reloaded["definition"])["steps"])
	var a, b any
	_ = json.Unmarshal(want, &a)
	_ = json.Unmarshal(got, &b)
	if !reflect.DeepEqual(a, b) {
		t.Fatalf("display components changed on reload:\n%s\n%s", want, got)
	}
	call(t, s, admin, "validate", M{"site": "site_pc_synthetic", "form": form})
	review := call(t, s, admin, "review", M{"site": "site_pc_synthetic", "form": form, "version": float64(1), "dataContractAck": true})
	call(t, s, persistence.User{ID: "synthetic-approver", Subject: "synthetic-approver", Role: "admin", Status: "active"}, "approve", M{"id": review["id"], "dataContractAck": true})
	value, err := s.Execute(ctx, admin, session, "publish", M{"id": review["id"]})
	if err != nil {
		t.Fatal("publish", err)
	}
	release := text(object(value)["candidateId"])
	var shipped bool
	_ = filepath.WalkDir(filepath.Join(s.Data, "objects/releases", release), func(path string, e fs.DirEntry, _ error) error {
		if e != nil && !e.IsDir() {
			raw, _ := os.ReadFile(path)
			shipped = shipped || bytes.Contains(raw, []byte("dsp_receipt"))
		}
		return nil
	})
	if !shipped {
		t.Fatal("published release lost the completion layout")
	}
	raw, _ := json.Marshal(M{"payload": M{"plan": "a", "name": "合成 太郎"}, "idempotencyKey": "display-idem"})
	r := httptest.NewRequest("POST", "http://127.0.0.1:4183/r/"+release+"/api/submit", bytes.NewReader(raw))
	r.Header.Set("Origin", "http://127.0.0.1:4183")
	r.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	s.Public(false).ServeHTTP(w, r)
	if w.Code != 200 || !strings.HasPrefix(text(parse(w.Body.Bytes())["receipt"]), "synthetic_") {
		t.Fatalf("submit %d %s", w.Code, w.Body)
	}
}

// Completion may not show personal data; the engine rejects it before review or publish.
func TestDisplayPolicyRejectsPersonalDataOnCompletion(t *testing.T) {
	s, admin, _ := setup(t)
	form := "frm_display_pii"
	d := displayForm(form)
	done := object(list(d["steps"])[3])
	done["content"] = append(list(done["content"]), M{"display": M{"id": "dsp_leak", "type": "fieldValue", "field": "$local:fld_name"}})
	call(t, s, admin, "save", M{"site": "site_pc_synthetic", "form": form, "definition": d, "expected": float64(0)})
	_, err := s.Execute(context.Background(), admin, "", "validate", M{"site": "site_pc_synthetic", "form": form})
	failure, ok := err.(compiler.Failure)
	if !ok || !strings.Contains(strings.Join(failure.Diagnostics, " "), "E-DISPLAY-PII") {
		t.Fatalf("personal data on completion accepted: %v", err)
	}
}
