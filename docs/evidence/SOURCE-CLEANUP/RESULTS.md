# Source cleanup — 2026-10-27

## Kết quả

| Phần | Trạng thái | Bằng chứng |
| --- | --- | --- |
| Gỡ Python runtime/oracle/host rollback | PASS | 73 file `.py` thuộc source dự án đã retire; không còn `python/`, `.venv`, `pyproject.toml`, `uv.lock`, `.python-version` hoặc `tools/local_p0` |
| Chuyển source editor về Go Workspace | PASS khi di chuyển | [SHA-256 từng file](studio-move.json); chuyển nguyên byte từ `tools/local_p0/web` sang `tools/go-auth/studio`, không fork editor |
| Go-only cold initialization | PASS | [fresh init](fresh-init.json), [read-only inspect](fresh-inspect.json), [test](bootstrap-tests.txt); 3 draft synthetic, từ chối overwrite |
| Kiểm chứng độc lập | PASS tại checkpoint ghi log | [pnpm verify](verify.txt), [Go tests](go-tests.txt), [race](go-race.txt), [vet](go-vet.txt), [React](react-tests.txt), [build](react-build.txt) |
| Studio mới nhất | BLOCKED_BY_CONCURRENT_UI_CHANGES | User xác nhận phiên khác sửa UI và yêu cầu giữ nguyên; [blocker](ui-integration-blocker.json) |

Không Git mutation/staging/commit, không GitHub/AWS/production API. T12/K13 vẫn **VERIFICATION_PENDING**. Không nâng coverage legacy thành hoàn tất.

## Đã xóa hoặc retire

- Toàn bộ `python/`: packages `fb_contracts`, `fb_engine`, `fb_store` và test suite chỉ dành cho implementation Python.
- Python adapters trong `tools/compiler`, `tools/engine-demo`, `plugins/store-selector/server`.
- Old standalone host/OIDC/control/rpc và browser harness của `tools/local_p0`; source editor được chuyển đi trước khi xóa host.
- Demo SQLite restore Python, standalone compiler server/publication wrapper gọi Python và các script `py:*`, `local:p0`, `compiler:serve`, `compiler:publish-demo`.
- `.python-version`, `pyproject.toml`, `uv.lock`, `.venv`, `.tools/uv-cache`, `.tools/uv-tools`.
- Cache root `.import_linter_cache`, `.mypy_cache`, `.pytest_cache`, `.ruff_cache`, `.pnpm-store` cũ và `.playwright-cli` cũ.
- `spikes/compiler-feasibility` chỉ còn generated output/dependencies/test-results, không có source; đã xóa và bỏ các thư mục rỗng.

[Danh sách file retire](python-retired-files.json), [dry-run cache ban đầu](cleanup-plan.json), [lần apply sau yêu cầu gỡ Python](cleanup-applied.json). `.playwright-cli` có thể được tạo lại bởi kiểm chứng/browser của phiên UI đang hoạt động; không tiếp tục xóa trong lúc phiên khác dùng. Store pnpm hiện hành nằm dưới `node_modules`, không phải root store cũ đã xóa.

Không giữ một bản runtime Python trong archive. Docs/evidence lịch sử có thể còn chữ Python và kết quả 798 PASS tại thời điểm cũ; đó là hồ sơ lịch sử, không phải source chạy được hoặc test suite hiện hành.

## Logic được giữ hoặc chuyển sang Go

- Go vẫn sở hữu authentication/RBAC/site membership, forms/CAS, review/four-eyes approval, Preview/revocation, publication/rollback, submission/idempotency, outbox/mock effects và audit.
- `tools/engine-demo` giữ golden/seed fixtures và các demo TS còn dùng; subprocess semantic/submission chuyển sang Go verifier. Demo restore cũ đã bỏ, không thay bằng một backend TS mới.
- `tools/compiler/src/release.ts` luôn kiểm semantic bằng Go, bỏ fallback Python. Test integrity gọi CLI Go dùng cùng verifier với public admission. Kiểm publish/rollback thực tế nằm ở Go integration tests.
- Store Selector server facet thực thi Go. New locks pin `internal/studio/store_adapter.go`. Metadata 1.0.0 còn descriptor lịch sử `pythonPackage` để giữ contract/digest đã pin; không import hoặc execute package đó. Old immutable release được hỗ trợ bằng đúng digest compatibility đã ghi, mọi pin lạ bị từ chối. Không viết lại artifact cũ chỉ để đổi ngôn ngữ.
- Native Gitleaks 8.30.1 thay scanner `uvx`/detect-secrets. Không còn Python dependency trong secret-check path. Không tuyên bố hai scanner tương đương hoặc Gitleaks có đúng 27 detector.
- Go `Bootstrap` áp schema/checksum hiện có và seed 3 draft vào thư mục staging riêng, từ chối destination có sẵn. Launcher dùng snapshot Go khi có dữ liệu cũ hoặc bootstrap Go khi chưa có baseline. Database hiện tại không bị reinitialize.

Các test chỉ dành cho implementation đã retire được gỡ theo yêu cầu user. **Không khẳng định đã port một-một toàn bộ 798 Python tests.** Contract/golden semantics, Go security/business integration và kiểm chứng browser có phạm vi được ghi dưới đây.

## Các thư mục còn lại đều có vai trò

| Mục | Quyết định / lý do |
| --- | --- |
| `contracts` | Giữ: schema, generated contracts, golden fixtures, release inputs |
| `packages` | Giữ: TS engine/compiler/runtime/motion; đang dùng, không phải backend Python cũ |
| `plugins` | Giữ: browser facet và immutable contract metadata; server thực thi Go |
| `tools/go-auth` | Giữ: Go API, React Workspace, editor source và local supervisor |
| `tools/compiler` | Giữ TS compiler, không còn Python business adapter/server |
| `tools/engine-demo` | Giữ semantic fixtures/parity và demo TS còn dùng, hiện gọi Go |
| `tools/security`, `verify`, `boundaries`, `lint-fixtures`, `perf`, `test-setup` | Giữ: kiểm chứng, toolchain và regression guards |
| `docs` | Cập nhật docs hoạt động; lưu lịch sử trong `docs/archive`/evidence, không giả sửa kết quả cũ thành PASS mới |
| `docker/builder` | Giữ đặc tả gate T12 đang pending, không phải backend cũ đã thay thế |
| `var` | Giữ DB, sessions/keys local, releases, audit, migration baseline và backup; không xóa như cache |
| `output/playwright` | Giữ bằng chứng có liên kết; không xóa ảnh của các phase trước như file rác |
| `node_modules`, `.tools/bin` | Giữ dependency/tool đang sử dụng; native Gitleaks được đặt trong `.tools/bin` |
| Root configs, `CLAUDE.md`, master prompt local | Giữ toolchain/governance; cập nhật chỉ dẫn Git/GitHub theo lệnh cấm hiện hành |

Migration SQL đã áp và tên `001_legacy.sql` là lịch sử schema/checksum được Go dùng, không phải Python runtime để xóa tùy ý.

## Docs đã cập nhật

Root README; Go Workspace README; CURRENT_STATUS; CONTEXT_HANDOFF; PROJECT_CHARTER; PROJECT_CHECKLIST; REQUIREMENTS_TRACEABILITY; FORM_CAPABILITY_MATRIX; CONVENTIONS; SECURITY_BOUNDARIES_P0; implementation checkpoint trong DECISIONS và chỉ dẫn CLAUDE. Các mục TODO/design-only P0 lỗi thời đã có mapping implementation/evidence mới; không đổi mục tiêu hoặc tự đóng production gates.

Bản CURRENT_STATUS/HANDOFF/CONVENTIONS/SECURITY trước cleanup được lưu trong `docs/archive`, không dùng như lệnh vận hành hiện hành. Không cần chạy `uv sync`, pytest hoặc old host nữa.

## Các kiểm tra đã thực thi

- `pnpm verify`: PASS; **648 tests PASS, 15 expected fail, 663 tổng**. Bao gồm format toàn source, lint, strict typecheck, schema allowlist, generated drift, dependency boundaries, synthetic domains và secret scan.
- Go `test ./...`, `test -race ./...`, `vet ./...`: PASS tại checkpoint source đã freeze. Bootstrap mới, membership read-only, adapter pins và integrity guards nằm trong các test này.
- TS/Go semantic evaluation: **271 cases**. Go submission boundaries: **24 negative/boundary cases và 231 complete TS projections accepted**. Đây không còn là Go/Python parity.
- React: **14 tests PASS**, production build và lint PASS. Các component tests không thay thế integration smoke cho source Studio đang được phiên khác sửa.
- Native scanner: working source **428 files**, index **308 files**, **0 unresolved**, staged coverage true. [Summary](security-summary.json). Không in secret values; index được đọc, không sửa.
- SQLite: integrity `ok`, **902 file immutable gốc không đổi**. [Inspection](integrity.json). DB Go hiện tại vẫn riêng với baseline.
- Cold-init thực thi vào `/tmp/forms-master-fresh-go-20261027-cleanup`: Go tạo 3 draft và read-only inspection PASS. Không overwrite store đang có.

Lỗi trong quá trình triển khai đã sửa: schema-lint chưa nhận fixed color/config token patterns; test mới thiếu metadata `$schema`/`$id`; seed PC fixtures dùng trùng form ID; bootstrap thiếu deployment gate seed. Không tắt các guard để làm test xanh. Một lần Go test gặp PLATFORM_CHANGED do source format trong lúc test chạy; đã chạy lại test/race sau checkpoint ổn định.

## Browser và giới hạn UI đồng thời

Trước thay đổi UI tiếp theo: [clone/Preview](browser-clone.json) → [review/approver riêng/publish](browser-publish.json) → [Customer 3 viewport](browser-customer.json) → [security](browser-security.json), [timeout/retry](browser-adapter-timeout.json) đều qua với Python/venv đã xóa. Self-approval 403, Member write 403, invalid format 422, replay 200 và changed-payload idempotency 409. Customer không có Admin cookie; mock effects được xử lý bằng Go.

Form kiểm chứng riêng: `frm_go_only_f2096d9e38ce40e18715e60349d6bb75`. Release kiểm chứng: `rel_655nayozhotalkuxkbrvf7sgl4`. Không dùng form người dùng đang sửa để thử publish.

Sau đó các file UI thay đổi ngoài lượt cleanup: `i18n.js` bị xóa, `index.html` bỏ `admin-locale`, trong khi generator còn inject import và admin.js còn đăng ký handler. Smoke mới nhất báo không tải được Studio. User xác nhận có phiên khác sửa UI và yêu cầu **giữ nguyên UI, chỉ chốt phần độc lập**. Vì vậy không khôi phục file, không sửa bridge và không restart launcher đang phục vụ phiên đó để thử đoán ý đồ refactor. [Handoff blocker](ui-integration-blocker.json).

Ảnh cleanup có prefix `cleanup-*` trong `output/playwright`. Script publish ban đầu dùng tên ảnh `legacy-reference-*` chung và đã cập nhật ba ảnh review/publish; bản cleanup đã được sao ra prefix riêng. Dùng JSON release/form ID và log để phân biệt checkpoint, không coi tên ảnh cũ là bằng chứng bất biến theo thời điểm.

Không tuyên bố latest-UI E2E PASS, ALL_LEGACY_FORMS_SUPPORTED, WCAG đầy đủ, PostgreSQL/ECS hoặc T12/K13 PASS. Phần UI cần writer đang refactor chốt generator/locale bridge rồi chạy smoke mới.
