# FLEXIBLE-CANVAS — Step & Visual Canvas Builder (2026-10-28)

Phạm vi: P0 thứ tự field, P1 confirmation đọc được, P2 quản lý step, P3 display components, P4 confirmation/completion, tùy chọn 2 màn hình. Chỉ synthetic local; không commit/GitHub/AWS.

## Kết quả kiểm chứng

| Hạng mục | Lệnh | Kết quả | File |
|---|---|---|---|
| TS unit/contract/compiler/runtime | `node_modules/.bin/vitest run` | 684 PASS, 15 expected fail (đã có từ trước), 1 skip (gitleaks không cài) — exit 0 | `ts-tests.txt` |
| ESLint / Prettier | `eslint . --max-warnings=0`, `prettier --check .` | exit 0 / exit 0 | `lint.txt`, `format.txt` |
| Typecheck | `corepack pnpm -r --if-present typecheck` | 17 package Done, exit 0 | `typecheck.txt` |
| Parity TS↔Go | `node tools/engine-demo/src/parity.ts` | PASS 293 cases | `parity.txt` |
| gen:check / schemas:lint | chạy trực tiếp script trong `packages/contracts` | OK | `gen-schemas.txt` |
| Go | `./go-local.sh test ./...` | ok (studio 143.7s), gồm `display_test.go` save/reload/publish/submit + PII reject | `go-tests.txt` |
| React shell | vitest + tsc + eslint trong `tools/go-auth/web` | 17 PASS, exit 0 | `web-tests.txt` |
| Boundaries / synthetic / secrets | depcruise, synthetic-data-check, secrets | 0 violation / exit 0 / 0 findings | `security-boundaries.txt` |
| Browser A/B/D | Playwright (`e2e-abd.mjs.txt`) | PASS | `browser-abd.txt`, `browser-abd.json` |
| Browser C/E/F/G/H | Playwright (`e2e-cefgh.mjs.txt`) | PASS | `browser-cefgh.json` |
| Smoke PC/Sports/Gakki | Studio preview mỗi form (`e2e-smoke.mjs.txt`) | 3/3 preview 200, validation chặn 次へ rỗng | `browser-smoke.json` |

Screenshot: `output/playwright/flexible-canvas/`.

## Browser scenarios

- **A** Blank form: Heading + Paragraph + 2 field; thứ tự sau Save/Reload giữ đúng `display, display, field, field`.
- **B** 10 step: thêm 9 step, đổi thứ tự bằng outline và inspector, nhân bản STEP 1 (ID duy nhất); Save/Reload giữ thứ tự; preview đi đúng 11 step theo thứ tự mới.
- **C** 2 màn hình (`autoSubmit` trên review): bật/tắt trong inspector, giữ sau reload; preview bỏ qua confirmation và **không** sinh receipt giả.
- **D** Confirmation: summary theo step (11 section), fieldValue プラン=はい, product summary 合成ギター; không raw JSON.
- **E** Completion: image, heading, text, fieldValue (public), reference, CTA link (allowlist) + restart. Field personal (email) không có trong lựa chọn binding.
- **F** Review → approve (synthetic-approver) → publish → URL customer `rel_7foelfn4alqze2xwipab5jgsg6`; layout đúng thứ tự; submit Go thật 200, receipt `synthetic_…`.
- **G** Không raw JSON ở confirmation/completion.
- **H** Tự approve bị 403; approver/member không có palette chỉnh sửa (member read-only); completion không hiện email/nickname; restart mở form mới, tổng số submit = 1.

## Ghi chú

- Bug sửa trong phiên: nút 「ステップを追加」 truyền click event thành `position`, step mới không được nối (unreachable). Đã sửa và kiểm chứng ở scenario B.
- Giới hạn cũ (Go binary cũ → `E-REF-UNSUPPORTED`) đã đóng ở phần Final verification bên dưới.

## Final verification (2026-10-28)

Runtime: user cho phép dừng đúng PID 85535/85562/85563; `node tools/go-auth/start.ts` build lại `var/go-auth/master-api` lúc 13:56 (sau `engine.go` 12:50), PID mới 89148/89191/89193 (`final-runtime.txt`). Studio bundle được sinh lại khi start; compiler chạy từ source mỗi lần; parity 293 PASS.

| Hạng mục | Kết quả | File |
|---|---|---|
| A Blank canvas | STEP 1 = heading, text, 3 field, fieldValue; Save/Reload giữ thứ tự; customer cùng thứ tự; submit 200, không `E-REF-UNSUPPORTED` | `final-browser-abc.json` |
| B Confirmation | summary + groupSummary (合成ギター) + email mask `＊…om`; không raw JSON; 0 submit trước khi bấm gửi; Go 200 / replay cùng receipt / đổi payload cùng key 409 / email sai 422 `formatEmail` | `final-browser-abc.json` |
| C Completion | image, heading, text, reference, CTA, restart; 1 receipt `synthetic_…`; preview ghi 「プレビューでは受付番号は発行されません」; không lộ email/nickname; restart không submit lại | `final-browser-abc.json` |
| D 2 màn hình | email sai bị chặn ở client (0 request), không hiện confirmation; Go 422 + replay idempotent; 1 submit | `final-browser-d.json` |
| E 10 step | thêm 9 step, đổi thứ tự (outline + inspector), nhân bản, branch STEP 1 → STEP 6; Reload giữ thứ tự + branch; preview: はい → STEP 6, 戻る → STEP 1, いいえ → STEP 2 | `final-browser-e-progress.json` |
| Progress | 11 step: 「STEP 1 · 1 / 11」 + thanh, không tràn ngang (PC và スマホ); 1 và 3 stage giữ circles (1440/390) | `final-browser-e-progress.json`, `progress.test.ts` |
| Budget | release thật: initial JS 11.592 ≤ 12.288, total 15.846 ≤ 16.384; template không đổi (polished 16.078) | `final-budget.txt` |
| Regression | root 687 PASS + 15 expected fail + 1 skip; Go test/vet/race; React 17 PASS + tsc/eslint/build; eslint/prettier/typecheck; depcruise/synthetic/secrets 0; gen/schemas OK; smoke PC/Sports/Gakki 3/3 | `final-*.txt`, `final-browser-smoke.json` |
