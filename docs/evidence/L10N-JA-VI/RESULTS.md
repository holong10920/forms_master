# L10N-JA-VI — Bản địa hoá Nhật ⇄ Việt (local synthetic P0)

> Ngày: 2026-10-26. Branch local `codex/p03-s1-workflow-engine`, HEAD `693969a`. Chưa stage, chưa commit.
> G9 BLOCKED (không push), G10 BLOCKED (không AWS). Chỉ dữ liệu synthetic. ADR-080.

## 1. Màn hình hỗ trợ ja ⇄ vi

| Màn hình | Cách chuyển | Ghi nhớ |
|---|---|---|
| Customer Form Runtime (artifact đã publish) | Bộ chọn `表示言語 / Ngôn ngữ`, chỉ hiện khi form bật > 1 locale; không reload | sessionStorage `fb.locale`; `?lang=vi` dùng làm giá trị đầu |
| Preview (origin cô lập 127.0.0.1:4175) | Mở theo ngôn ngữ Admin đang chọn (`session.start.locale`), sau đó dùng bộ chọn runtime | như runtime |
| Business Admin (localhost:4174) | `#admin-locale` ở header: chrome UI (nút, nhãn, thông báo, confirm) ja ⇄ vi qua `web/i18n.js` | sessionStorage `fb.admin.locale` |
| Admin — panel 翻訳（日本語 / Tiếng Việt） | Sửa song song ja/vi: tiêu đề/mô tả form, tiêu đề step, label, placeholder, help, option, thông báo validation, nút, thông báo hoàn tất/lỗi | lưu trong draft (`texts`, `{ja, vi}`) |

ID, key, option value, rule, payload không đổi theo ngôn ngữ. Data Contract không phụ thuộc label nên sửa bản dịch không cần contract ack.

## 2. Mức độ hoạt động

- **A — Localization: HOẠT ĐỘNG (offline).**
  - Compiler `tools/compiler/src/l10n.ts` resolve mọi message theo từng locale được hỗ trợ và pin vào IR (`assets/form-ir.<sha>.json`). Runtime không gọi API và không có chuỗi message riêng.
  - Fallback: thiếu bản vi thì dùng ja, phần tử fallback mang `lang="ja-JP"`.
  - Form chỉ ja: không có bộ chọn, `lang=ja-JP`.
- **B — Dịch tự động: CHỈ CÓ UI + CONTRACT, KHÔNG CÓ PROVIDER.**
  - Op `translate` (RPC có session + CSRF) validate input rồi luôn trả `503 TRANSLATION_PROVIDER_UNAVAILABLE`. Không gọi mạng, không dịch giả.
  - Admin hiển thị: 「自動翻訳は利用できません：承認済みの翻訳プロバイダーが設定されていません。手動で入力してください。」
  - Khi có provider được duyệt trả `{"drafts":[{"id","text"}]}`, UI chỉ điền vào ô còn trống và đánh dấu trạng thái 「自動翻訳（要確認）」. Bản dịch tay không bao giờ bị ghi đè; E2E kiểm chứng bằng route stub.

## 3. URL local

- Admin: http://localhost:4174/
- Preview: http://127.0.0.1:4175 (nhúng trong Admin)
- Form song ngữ đã publish (lần chạy E2E cuối, form `frm_9b683fbafda94c62a94ae87bc250a7d6`): http://127.0.0.1:4173/r/dev_iqnwd3s6pnmbfrh6fh53goihma/index.html (thêm `?lang=vi` để mở bằng tiếng Việt)

Host `pnpm local:p0` đã được khởi động lại trong phiên này để nạp op `translate`. Process cũ do Codex app chạy; Codex không ghi file trong lúc đó.

## 4. Ảnh chụp (thư mục này)

| File | Nội dung |
|---|---|
| `l10n-admin-ja.png` | Admin + panel dịch, chrome tiếng Nhật |
| `l10n-admin-vi.png` | Cùng màn hình, chrome tiếng Việt |
| `l10n-customer-vi-required.png` | Runtime vi: thông báo validation bắt buộc bằng tiếng Việt |
| `l10n-customer-vi-fallback.png` | Runtime vi: trường thiếu bản dịch, fallback ja |
| `l10n-customer-ja-review.png` | Chuyển về ja ở bước review, dữ liệu giữ nguyên |
| `l10n-customer-vi-complete.png` | Hoàn tất bằng tiếng Việt |

## 5. Kiểm thử

### Browser E2E `tools/local_p0/test/l10n-browser.txt` — PASS

Output: `l10n-browser.json` (`allPassed: true`). Kịch bản đã chạy:

| # | Yêu cầu | Kết quả |
|---|---|---|
| 1 | ja → vi → ja | PASS |
| 2 | Chuyển khi đang nhập (giá trị và focus được giữ) | PASS |
| 3 | Chuyển giữa workflow (step 2, dữ liệu step 1 giữ nguyên) | PASS |
| 4 | Validation message theo locale (required, maxLength) | PASS |
| 5 | Label option đổi, value giữ (`store`) | PASS |
| 6 | Thiếu bản dịch thì fallback ja, `lang=ja-JP` | PASS |
| 7 | Save/reload giữ bản dịch; sửa ja không mất vi | PASS |
| 8 | Preview (khởi động theo vi) và Published đúng | PASS |
| 9 | Payload không đổi: `{"method":"store","nickname":"Synthetic","comment":"合成メモ"}` | PASS |
| — | Auto-translate: provider unavailable; draft stub chỉ điền ô trống | PASS |

### Unit/contract

- `tools/compiler/test/l10n.test.ts`: 3 PASS. Bao gồm override/fallback/lọc locale; `E-LOCALE`; `E-DEFINITION-SCHEMA` cho `en` và key `texts` lạ; build Sports song ngữ deterministic, bản dịch pin trong IR, không có module motion/store/i18n, không có dynamic import.
- `python/fb_engine/tests/local_p0/test_translation.py`: 3 PASS. Bao gồm provider unavailable + 6 case validation; RPC cần session/CSRF; draft song ngữ save/reload giống hệt, id/key/value không đổi.

### Verify toàn repo

| Lệnh | Kết quả |
|---|---|
| format:check, lint, typecheck, gen:check, schemas:lint, boundaries | PASS |
| py:lint, py:typecheck, py:imports | PASS |
| py:test | 796 passed |
| vitest | 627 passed, **3 failed**, 15 expected fail, 1 skipped |
| synthetic:check, secrets | PASS |

3 test fail đều nằm ở `tools/security/test/alternative-scan.test.ts` với lỗi "detect-secrets could not execute". Nguyên nhân: `detect-secrets==1.5.0` không có trong uv cache và máy đang offline. Đây là **BLOCKED_BY_ENVIRONMENT**, không liên quan l10n; không thử tải qua mạng.

### Regression browser (Sports/PC, Admin)

`browser-flow`, `reference`, `numeric`, `rules`, `shared-block`, `autosave`, `preview-revocation`, `clone-settings`: tất cả `allPassed: true`.

`rules-browser.txt` (file CP2 của Codex) đổi assertion từ mã thô `required` sang `合成備考: 必須項目です`, vì runtime giờ hiện message đã bản địa hoá.

### Kích thước Sports Motion-none (artifact thật)

| Chỉ số | Giá trị |
|---|---|
| JS gzip | 12,154 B (giới hạn 12,288; trước l10n 11,597) — chỉ còn **134 B** headroom |
| CSS gzip | 691 B |
| IR gzip | 1,253 B (chỉ ja) / 1,696 B (ja+vi) |
| Motion | 0 module, 1 chunk |

Candidate ID của Sports/PC thay đổi vì IR giờ chứa `texts`; build vẫn deterministic.

## 6. Chưa hỗ trợ / giới hạn

- Chưa có provider dịch tự động nào được duyệt; nút dịch tự động chỉ báo unavailable.
- Label field trong shared block chỉ có ja (runtime fallback ja).
- Label fixture có sẵn của Sports/PC lấy từ map tiêu đề ja trong runtime, nên fallback ja.
- Phần bên trong plugin store-selector và thông báo lỗi boot chỉ có ja.
- Named condition (chỉ hiện trong Admin) không dịch.
- Step không có tiêu đề hiển thị step id (hành vi cũ).
- Chỉ hai ngôn ngữ ja/vi; schema từ chối locale khác.

## 7. Phạm vi commit đề xuất (chưa stage)

So với snapshot baseline phần CP2 chưa commit của Codex (chụp đầu phiên):

**File mới, chỉ l10n:**

- `tools/compiler/src/l10n.ts`, `tools/compiler/test/l10n.test.ts`
- `tools/local_p0/translation.py`, `tools/local_p0/web/i18n.js`
- `python/fb_engine/tests/local_p0/test_translation.py`
- `tools/local_p0/test/l10n-browser.txt`
- `docs/evidence/L10N-JA-VI/`

**File chỉ l10n sửa:** `tools/local_p0/web/preview.js`.

**File có hunk trộn (CP2 Codex + l10n), cần commit cùng hoặc tách bằng baseline `tracked.diff`:**

- `contracts/schemas/{engine-ir,form-definition}/v1.schema.json`
- `packages/contracts/src/generated/{engine-ir.v1,form-definition.v1,schemas}.ts`
- `packages/form-engine/src/definition.ts`
- `packages/static-runtime/src/{index.ts,style.css}`
- `tools/compiler/src/build.ts`
- `tools/local_p0/{host.ts,rpc.py}`
- `tools/local_p0/web/{admin.js,index.html,style.css}`
- `tools/local_p0/test/rules-browser.txt`

**Docs:** `docs/DECISIONS.md` (ADR-080), `docs/PROJECT_CHECKLIST.md`, `docs/CURRENT_STATUS.md`, `docs/CONTEXT_HANDOFF.md`, `docs/REQUIREMENTS_TRACEABILITY.md`.

Đề xuất: commit l10n **sau** CP2 của Codex, hoặc gộp vào một checkpoint mà user duyệt danh sách file. Không tự commit.
