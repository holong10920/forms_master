# Gakki demo và refactor — 2026-10-27

Tái tạo được mẫu **Gakki Pattern A một sản phẩm**, chỉnh qua No-Code Admin, lưu definition, Preview và xuất bản bằng Go. Không khẳng định toàn bộ legacy/cart hay pixel parity.

## Gap matrix

| Feature | Legacy | Form Master ban đầu | Status / xử lý |
| --- | --- | --- | --- |
| Field types | Select, text, radio, textarea | Có đủ | SUPPORTED |
| Nested/dependent selection | Category → piano → floor → carry-out | Engine đã có rules; chưa có mẫu Gakki | SUPPORTED trong mẫu khai báo mới |
| Conditional rules | Show/require theo câu trả lời | Có DSL TS/Go | SUPPORTED; giữ một Workflow Engine |
| Reset khi category đổi | Xóa câu trả lời phụ thuộc | MISSING | SUPPORTED: `resetOnChange`, chỉnh trong Inspector |
| Validation | Required, blank, 250 ký tự, enum | Có validators | SUPPORTED; browser + TS/Go |
| Workflow | Product/cart/customer/review | Có steps/review | PARTIAL: demo một sản phẩm, chưa repeated cart |
| Layout/style | Card, progress, badges | Thiếu progress/badge runtime | SUPPORTED; thêm phần dùng chung; native selects khác popup/icon cũ |
| Dynamic/mock data | Danh sách theo config | Static options + rules | SUPPORTED cho flow này; không gọi catalog thật |
| Preview/publish | Flow cũ | Go review/four-eyes/publish | Kiểm chứng qua UI, xem browser.json |
| Submission mapping | Legacy items + metadata | Key projection/Go validation | PARTIAL: synthetic flat payload; chưa legacy adapter |
| Desktop/mobile | Responsive | Runtime responsive | Kiểm chứng 1440×900 và 390×844, xem ảnh |

## Cấu trúc và cleanup

- Trước: Admin import template từ `tools/legacy-analyzer/src/reference.ts`; reducer import toàn bộ `definition.ts`.
- Sau: `tools/go-auth/templates/{pc-apply,gakki-apply}.ts` sở hữu mẫu Admin; analyzer chỉ phân tích source read-only. Boundary mới cấm Studio/templates import analyzer.
- `packages/form-engine/src/dependencies.ts` chứa graph/order helpers dùng chung; `definition.ts` giữ lowering/validation, reducer chỉ import helpers cần thiết.
- Với extended runtime, IR validation vẫn bắt buộc trước render nhưng đặt cùng enhancement module đã pin/hash. Non-extended vẫn assert trực tiếp. Compiler/Go admission và immutable verification giữ nguyên.
- Xóa đường dẫn template cũ sau khi đổi toàn bộ import; **di chuyển**, không bỏ tính năng. Không xóa thêm source chưa rõ dependency hoặc công việc có sẵn của user.
- Python API/worker/venv đã vắng mặt trước lượt này. Guard `no-python.test.ts`, launcher Go-only và dependency checks xác minh lại; không nhận công retire trước đó là thay đổi mới.

| Nhóm | Phân loại | Quyết định |
| --- | --- | --- |
| Go API/BFF, React/Studio, TS compiler/runtime/workflow | ACTIVE_RUNTIME | Giữ |
| Contracts/golden/security/boundaries/tooling | ACTIVE_BUILD_OR_TEST | Giữ |
| Exact plugin compatibility pins | REQUIRED_COMPATIBILITY | Giữ |
| `var` releases, migration baseline, audit, backups; evidence cũ | IMMUTABLE_EVIDENCE | Giữ; 902 file gốc không đổi |
| Đường dẫn template analyzer sau di chuyển | DEAD_CODE | Bỏ path cũ; import đến module mới |
| Cache `.playwright-cli` đang dùng | ACTIVE_BUILD_OR_TEST | Giữ; dry-run chỉ báo mục này |
| Component chưa đủ bằng chứng unused | UNKNOWN_DEPENDENCY | Không xóa |

Không di chuyển toàn repo chỉ để đổi tên thư mục; `pnpm local:master` vẫn là entrypoint. Không Git mutation/GitHub/AWS/production calls.

## Verification

- Các gate của `pnpm verify`: PASS — **654 PASS + 15 expected fail**, 38 files; format/lint/typecheck/generated/schema/boundary/synthetic/secrets đều qua. [Log](verify.txt).
- React: **17 PASS**, lint/typecheck/build PASS. [Tests](react-tests.txt), [build](react-build.txt).
- Go `test -count=1 ./...`: PASS. [Log](go-tests.txt).
- Go `test -race -count=1 ./...`: PASS. [Log](go-race.txt).
- Go vet: PASS. [Log](go-vet.txt).
- TS/Go semantic parity: **284 cases PASS**, gồm 13 instrument cases. [Log](semantic-parity.txt).
- Gitleaks: working/index `unresolved=0`; govulncheck: không có vulnerability. [Go scan](govulncheck.txt).
- Inspector: SQLite `ok`, **902 original immutable files unchanged**. [Evidence](integrity.json).
- Canonical release build cho Gakki, PC, Sports PASS, không tăng budgets. [Số đo](bundle-metrics.json). Initial JS gzip tương ứng 10660 / 10604 / 11423 bytes; total JS gồm async chunks được ghi riêng.

Lần chạy cuối dùng `pnpm test --maxWorkers=2` cho toàn suite; assertions và timeout không đổi. Lần chạy parallel mặc định trong lúc browser đang mở bị timeout 5s ở hai lint tests; giữ [log](verify-parallel-timeout.txt). Toàn suite đã chạy lại PASS với hai workers.

Security smoke fixture cũ dùng access-key lặp một ký tự, dưới ngưỡng entropy của detector, nên đôi khi chỉ được phát hiện nhờ random secret generic-match. Đã thay bằng ID giả có entropy ổn định; không đổi scanner/rule/allowlist hay bỏ assertion. [Detector test](security-detector-test.txt).

Full Go/race chạy lại sau khi sửa lỗi budget phát hiện trong vòng test đầu. Không dùng kết quả lỗi ban đầu làm PASS hoặc nới gate để bỏ lỗi. Một focused self-review và kiểm tra lại sau sửa correctness/build.

## Giới hạn

Legacy browser parity **NOT_VERIFIED**: reference thiếu native Rollup dependency; không sửa repo read-only. Không có ảnh legacy mới. Khác biệt còn thấy: native dropdown thay popup có icon; placeholder synthetic cố định; review JSON/synthetic receipt; chưa cart và mapping legacy production.

T12/K13 vẫn **VERIFICATION_PENDING**. Không claim production/ECS/PostgreSQL hay toàn bộ legacy supported. Không commit; diff đã có sẵn Tailwind/UI/user work, xem baseline và phạm vi lượt này trong change-scope.json.

## Demo và ảnh đã xác minh

- [Customer demo](http://127.0.0.1:4183/r/rel_lrn673wjhmxfxe3srrnnixketf/index.html).
- [Admin editable draft](http://localhost:4180/studio/sites/site_pc_synthetic/forms/frm_f40a425abd0b4524844001c78f67e850?lang=ja), bản v3.
- Review `review_s9dS1Qf6PmU8B9AF6ik-FrBU`: người tạo `synthetic-admin`, người duyệt `synthetic-approver`, trạng thái PUBLISHED. Source change đã buộc recheck đúng cơ chế trước khi approve.
- [Browser assertions và phạm vi](browser.json), [submission/replay](browser-submission.txt), [PC/Sports regression](browser-regression.txt).
- Ảnh trong `output/playwright/`: `gakki-desktop.png` (1440×900), `gakki-mobile.png` (390×844), `gakki-mobile-full.png`, `gakki-desktop-validation.png`, `gakki-published-admin.png`, `gakki-submission-complete.png`.
- Không có lỗi JS runtime trong browser scenarios. Favicon 404 và cảnh báo sandbox iframe là thông báo không chặn demo, không coi là pixel/browser parity legacy PASS.
