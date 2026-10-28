# Requirements Traceability

> **Checkpoint hiện hành 2026-10-27:** Go + React Workspace đã chạy; source Studio ở `tools/go-auth/studio`. Python/oracle/rollback host cũ đã retire theo yêu cầu user. Xem [CURRENT_STATUS](CURRENT_STATUS.md), [cleanup](evidence/SOURCE-CLEANUP/RESULTS.md), [Go route migration](../tools/go-auth/evidence/migration/ROUTE-MATRIX.md) và [legacy gap matrix](../tools/legacy-analyzer/evidence/CAPABILITY-MATRIX.md). Các bảng/checkpoint lịch sử dưới đây không phải khẳng định hệ thống vẫn ở design-only. T12/K13 vẫn VERIFICATION_PENDING; không nâng toàn bộ legacy thành supported.


> UX-PREMIUM (2026-10-26): F-P0 Admin UX đã được triển khai và kiểm tra local synthetic:
> shell/structure, Canvas/Inspector, required + AND/OR, reorder, theme/Motion, JA/VI,
> Preview/review/publish/rollback. Evidence: `docs/evidence/UX-PREMIUM/RESULTS.md`.
> Style chỉ là approved themes; không thêm DSL/CSS injection. G2/T12/K13 không đổi.


`Requirement ID → Design → Implementation → Tests → Evidence → Status`

> Bảng này chỉ theo dõi requirement mang tính sản phẩm/kỹ thuật (F-*, UX-*, ARCH-*, BUILD-*, MOTION-*, API-*, PERF-*, TEST-*, SEC-*, CICD-*, DOD-*). Checklist quy trình (CTX/SAFE/GIT/SP/Pxx) theo dõi ở `PROJECT_CHECKLIST.md`.
> Cột Design trỏ tới spec (PROPOSED, chưa G1). Các cột P0 bên dưới đã cập nhật theo local implementation; LOCAL_VERIFIED không phải production/T12/K13 acceptance. Các phần design group lịch sử cần truy vết riêng, không dùng để phủ nhận implementation hiện hành.

## Tính năng P0

| Req | Design | Implementation | Tests | Evidence | Status |
|---|---|---|---|---|---|
| F-P0-01 Site Management | spec #5 §5.1–§5.2, §7.5 | internal/studio/http.go | Go/TS unit + browser logs | tools/go-auth/evidence/migration; SOURCE-CLEANUP | IN_PROGRESS — site membership/listing; chưa có site CRUD |
| F-P0-02 Form Management | spec #4 §4–§5; spec #5 §5.4, §7.2 | internal/studio/forms.go | Go/TS unit + browser logs | tools/go-auth/evidence/migration; SOURCE-CLEANUP | LOCAL_VERIFIED |
| F-P0-03 Visual Form Builder | spec #4 §6–§12 | studio/editor.js | Go/TS unit + browser logs | tools/go-auth/evidence/migration; SOURCE-CLEANUP | LOCAL_VERIFIED |
| F-P0-04 Basic Field Library | spec #1 §7; spec #2 §7.1; spec #4 §10 | studio/editor.js + contracts | Go/TS unit + browser logs | tools/go-auth/evidence/migration; SOURCE-CLEANUP | LOCAL_VERIFIED — core P0; không mọi legacy control |
| F-P0-05 Multi-step Flow | spec #1 §8; spec #4 §11–§12 | packages/form-engine + internal/engine | Go/TS unit + browser logs | tools/go-auth/evidence/migration; SOURCE-CLEANUP | LOCAL_VERIFIED |
| F-P0-06 Validation | spec #1 §11; spec #5 §10.2 | internal/engine + packages/form-engine | Go/TS unit + browser logs | tools/go-auth/evidence/migration; SOURCE-CLEANUP | LOCAL_VERIFIED |
| F-P0-07 Conditional Logic | spec #1 §7.4, §8; spec #4 §11 | studio/rules.js + internal/engine | Go/TS unit + browser logs | tools/go-auth/evidence/migration; SOURCE-CLEANUP | LOCAL_VERIFIED |
| F-P0-08 Theme/Branding | spec #4 §16 (chọn theme; token editor P1) | studio/appearance.js + tools/compiler | Go/TS unit + browser logs | tools/go-auth/evidence/migration; SOURCE-CLEANUP | LOCAL_VERIFIED — typed bounded style |
| F-P0-09 Motion Animation | spec #6 §4, §7, §10 | packages/motion-* + studio/editor.js | Go/TS unit + browser logs | tools/go-auth/evidence/migration; SOURCE-CLEANUP | LOCAL_VERIFIED — approved presets |
| F-P0-10 Preview | spec #4 §14; spec #5 §7.3; spec #6 §10 | internal/studio/public.go + studio/preview.js | Go/TS unit + browser logs | tools/go-auth/evidence/migration; SOURCE-CLEANUP | LOCAL_VERIFIED |
| F-P0-11 JSON Definitions | spec #1 §7, §7.7 | contracts + tools/legacy-analyzer | Go/TS unit + browser logs | tools/go-auth/evidence/migration; SOURCE-CLEANUP | IN_PROGRESS — validated import; không arbitrary React conversion |
| F-P0-12 Persistence | spec #5 §5, §11 | internal/studio/forms.go + persistence | Go/TS unit + browser logs | tools/go-auth/evidence/migration; SOURCE-CLEANUP | LOCAL_VERIFIED — SQLite only |
| F-P0-13 Basic Auth + Roles | spec #5 §7.5–§7.6 (ADR-056) | internal/auth + internal/studio/policy.go | Go/TS unit + browser logs | tools/go-auth/evidence/migration; SOURCE-CLEANUP | LOCAL_VERIFIED |
| F-P0-14 Publish/Build | spec #3; spec #5 §6, §6.8 | tools/compiler + internal/studio/releases.go | Go/TS unit + browser logs | tools/go-auth/evidence/migration; SOURCE-CLEANUP | LOCAL_VERIFIED — T12/K13 pending |
| F-P0-15 Rollback | spec #5 §6.2, §6.5–§6.6 | internal/studio/releases.go | Go/TS unit + browser logs | tools/go-auth/evidence/migration; SOURCE-CLEANUP | LOCAL_VERIFIED |
| F-P0-16 Audit | spec #5 §12 | internal/studio/store.go | Go/TS unit + browser logs | tools/go-auth/evidence/migration; SOURCE-CLEANUP | LOCAL_VERIFIED |
| F-P0-17 Demo Forms | `docs/discovery/P00_DISCOVERY.md` §4; ADR-003 (đã duyệt ở G0) | contracts/fixtures/engine | Go/TS unit + browser logs | tools/go-auth/evidence/migration; SOURCE-CLEANUP | LOCAL_VERIFIED — synthetic Sports/PC only |
| F-P0-18 Submit Simulation | spec #4 §14.1; spec #5 §7.3 | internal/studio/public.go | Go/TS unit + browser logs | tools/go-auth/evidence/migration; SOURCE-CLEANUP | LOCAL_VERIFIED — mock effects only |
| F-P0-19 Docs + CI/Tests | test matrix của từng spec; CI sau G9 | README + tools/go-auth/evidence | Go/TS unit + browser logs | tools/go-auth/evidence/migration; SOURCE-CLEANUP | IN_PROGRESS — local tests; CI/production chưa verified |

## Architecture / build / motion / API

| Nhóm req | IDs | Design | Status |
|---|---|---|---|
| Schema & workflow | ARCH-01..10 | `docs/superpowers/specs/2026-10-23-form-schema-workflow-design.md` rev 3.7 §6–§17 (PROPOSED; design direction ADR-017..022; chưa duyệt hoàn toàn). ARCH-09/ARCH-10 chi tiết → `docs/superpowers/specs/2026-10-24-plugin-contracts-capability-registry-design.md` rev 2 §5–§13 (PROPOSED; ADR-023..035). | TODO (design đang review) |
| Compiler & isolation | BUILD-01..10 | Contract isolation (BUILD-02/04/05/06/08): spec #2 rev 2.13 §9–§11 (PROPOSED). Bundling, release, reproducible build: `docs/superpowers/specs/2026-10-24-compiler-bundle-release-design.md` rev 2.8 (PROPOSED; ADR-036..042). Bằng chứng mức spike (không phải implementation): `docs/evidence/P01/spike-gate-01/`. Bundling, Release Manifest: spec #3 (P01-04). | TODO |
| Motion | MOTION-01..07 | `docs/superpowers/specs/2026-10-24-motion-design.md` rev 2.2 (PROPOSED; ADR-062, ADR-064..067; truy vết requirement → test ở spec #6 §14). MOTION-01: engine/recipe hỗ trợ duration/delay/easing, UI P0 không mở tham số thấp cấp (ADR-067) — **không** DONE vì đổi scope | TODO (design) |
| Backend & publishing | API-01..10 | `docs/superpowers/specs/2026-10-24-api-persistence-publishing-design.md` rev 2 + C1 + C1b (PROPOSED; ADR-054..060, ADR-063, ADR-068..075) | TODO (design; chờ C1 closure review, ADR-075) |
| Admin UX | UX-01..05, UX-07 | `docs/superpowers/specs/2026-10-24-admin-form-builder-design.md` rev 2.7 (PROPOSED; ADR-046..053, ADR-061, ADR-074; test matrix §19) | TODO (design; C1 chờ re-review) |
| Undo/redo | UX-06 | ADR-004: P1; design phải chừa chỗ cho nó | DEFERRED P1 (G0) |

## Chất lượng

| Nhóm req | IDs | Status |
|---|---|---|
| Hiệu năng | PERF-01..07 | TODO — ADR-005: chỉ dùng số đo trên PoC artifacts; budget chốt ở G1 |
| Testing | TEST-01..11 | TODO |
| Bảo mật | SEC-01..08 | TODO (threat model ở P01-07) |
| CI/CD | CICD-01..10 | TODO (CD bị gate G10) |
| Definition of Done | DOD-01..10 | TODO |

## Verification gates (từ SPIKE-GATE-01, ADR-041..045)

Các mục spike chưa chứng minh hoặc chưa kiểm. **OPEN** cho tới khi có evidence; không đóng bằng suy luận. Chạy ở verification đầu của implementation (sau G1) hoặc tại P02 như ghi.

| ID | Kiểm chứng | Nguồn | Khi nào | Status |
|---|---|---|---|---|
| VG-01 | Compiler resolve browser facet từ **release store** theo FBK + hash (không từ workspace `node_modules`) | ADR-041, spec #2 §9.4, spec #3 §9 | trước khi chốt implementation compiler | OPEN |
| VG-02 | **L1b** resolve allowlist trong bundler: positive fixture (contract, Motion của core, module ảo) build được; negative fixture (import tương đối design/server/`.py`/fixtures) bị từ chối đúng lý do; control pass | ADR-041, spec #2 §11.2 rev 2.4, spec #3 §9/§10 | như trên | OPEN |
| VG-03 | Build graph + artifact isolation trên compiler thật, gồm import tương đối; conditional exports không là boundary duy nhất | ADR-041, spec #3 §19.1 (C15) | như trên | OPEN |
| VG-04 | pnpm: tái hiện lỗi optional-peer của npm 10.8.2 bằng fixture; pnpm cài fixture thành công; resolve workspace; frozen lockfile; React peer singleton; pin `packageManager` | ADR-044 | P02 | PASS — T1 evidence; npm error không tái hiện, pnpm/frozen/singleton PASS |
| VG-05 | Node.js 24 LTS: image pin digest; tương thích Vite/Rolldown/plugin; chạy lại tái lập (A/B) và isolation; ghi khác biệt với spike | ADR-045 | P02 | PARTIAL — host Node pin PASS; T12 BLOCKED_BY_ENVIRONMENT; A/B/isolation S2 OPEN |
| VG-06 | Tái lập khác kiến trúc CPU (ví dụ x86_64 vs arm64) | spec #3 §12, §21 | khi có runner | OPEN |
| VG-07 | Safari thật (không phải Playwright WebKit): prefetch reuse, retry `import()` | ADR-043, ADR-073 | **trước rollout cho khách thật** (không phải điều kiện G1); P0 dùng Playwright WebKit; không có môi trường → NOT VERIFIED, chặn rollout hoặc exception riêng | OPEN |
| VG-08 | Phục hồi lỗi evaluate trên WebKit: UI phục hồi người dùng thấy được, giữ pinned release, không tự reload | ADR-043, spec #3 §15.3 | verification runtime | OPEN |
| VG-09 | Isolation của preset Motion theo từng form (preset chỉ có trong form dùng nó) | spike limitation EXP-05, spec #3 §7.3–§7.4, spec #6 | sau G1 (P04/P07) | OPEN |
| VG-10 | Hành vi cache CDN và trình duyệt thật (stable entry, immutable asset, activation) | spec #3 §16, spec #5 | sau G10 | OPEN |
| VG-11 | S3 conditional write (`If-None-Match`/`If-Match`) cho release store và entry; CopyObject có điều kiện chưa dùng; DynamoDB transaction conflict/throughput thật | spec #5 §6.2, §6.4, §10.3, §11.2 | sau G10 | OPEN |
| VG-12 | Throughput và tỉ lệ `TransactionConflict` của submission admission gate (gate FBK dùng chung; P0 một item, sharding P1), độ trễ commit của revocation dưới tải trên DynamoDB thật | spec #5 §9.3 | sau G10 | OPEN |
| VG-13 | CT-26 + TM-5I01..04 + *(C1c)* TM-5L02: thay đổi policy plugin, gate FBK, ingestion/repair với interleaving commit có kiểm soát (V5-01, SR-02) | spec #5 §9.3.5 | sau G1 (SQLite + DynamoDB Local); DynamoDB thật sau G10 | OPEN |
| VG-14 | Ma trận tương thích evaluator Python × release trong `S` bằng semantic conformance fixtures (CSR-11) + differential TS/Python cùng version (ADR-017) | spec #5 §9.2; spec #3 §5.2 K14 | sau G1 | OPEN |
| VG-15 | Cổng đo Motion ở P04: bytes, INP, long task, CLS, reduced motion (ADR-064) | spec #6 §9, TM-6P01/P02 | P04 | OPEN |
| VG-16 | Checklist isolation của ADR-053 (4Z01..15) và Admin build không có code plugin (4Z10, 4C03) | spec #4 §19; spec #2 INV-A1 | sau G1 | OPEN |
| VG-17 | Điều kiện synthetic-only của ADR-063 (TM-5X01..05) | spec #5 §9.6 | sau G1, **trước mọi demo/đánh giá dựa vào ADR-063** | OPEN |
| VG-18 | Tích hợp Cognito (OIDC BFF) chạy thật; cookie PKCE `SameSite=Lax` cross-site | spec #5 §7.6 | sau G10 | OPEN |
| VG-19 | Contract test CT-01..26 trên DynamoDB thật (emulator không đủ) | spec #5 §11.2 | sau G10 | OPEN |
| VG-20 | *(C1c, ADR-076)* SR-08: Preview bị chặn khi capability bị revoke (TM-5V07, 4Z16) | spec #5 §7.3; spec #4 §14.7 | sau G1 | OPEN |
| VG-21 | *(ADR-078, ngoại lệ ADR-005)* Phương pháp đo (S0) và budget số từ artifact thật (S2); Sports Motion-none = 0 Motion bytes/imports/chunks | ADR-005, ADR-078; spec #3 §17 | S0 (phương pháp), **trước S2 DONE** (budget) | S0 method PASS (T11); S2 baseline/budget và Motion artifact vẫn OPEN |
| L10N-01 | *(ADR-080)* ja ⇄ vi: runtime/Preview/Published chuyển ngôn ngữ không reload, giữ dữ liệu, fallback ja, payload không đổi; Admin sửa song ngữ; dịch tự động không có provider | F-P1-06; ADR-048, ADR-080 | local synthetic P0 | Local PASS (`docs/evidence/L10N-JA-VI/`); provider dịch tự động OPEN |
| — | Decision còn mở của spec #1 (OD-06, OD-10, OD-13). OD2-08/09 đã đóng (ADR-057/058) | spec #1 §21 | theo hạn từng mục | OPEN |

> Cross-Subsystem Review (2026-10-24) MINOR-19: bảng này còn trích rev cũ và thiếu các gate sau G1/G10 (CT-26, ma trận TS/Python cross-version, cổng đo Motion P04, checklist ADR-053, Cognito, DynamoDB thật). **Đã cập nhật trong vòng sửa C1 (2026-10-25).**

### Checkpoint Gakki demo — 2026-10-27

Mẫu instrument Pattern A một sản phẩm, reset phụ thuộc và template boundaries đã triển khai; xem [bằng chứng mới](evidence/GAKKI-DEMO/RESULTS.md). Root 654 PASS + 15 expected fail; React 17 PASS; Go tests/race/vet PASS; TS/Go 284 cases PASS. Browser/review/publish xem `evidence/GAKKI-DEMO/browser.json`. Legacy browser parity NOT_VERIFIED; cart và production mapping chưa hỗ trợ. T12/K13 giữ VERIFICATION_PENDING. Không commit/GitHub/AWS writes.

### Real local legacy parity review

Đã chạy launcher legacy gốc qua overlay Docker synthetic/read-only và so sánh browser thật. Kết quả **NOT_READY cho full legacy parity**: 8/12 scenarios PASS, 4 FAIL; 4/12 nhóm No-Code được chứng minh đầy đủ. Đã sửa parent/child trong nhánh hỗ trợ, single-item confirmation, inline validation/scroll và container width. Còn catalog 12 nhóm, repeated cart/staged edit, header và committed-product restore. Xem [báo cáo thực chứng](evidence/REAL-LEGACY-PARITY/RESULTS.md), thay cho suy diễn từ checkpoint Gakki trước. T12/K13 không đổi.


### 2026-10-28 — multi-product internal demo closure

Corrected v10 is READY_WITH_KNOWN_GAPS for Gakki multi-product demo: 14/14 bounded browser checks PASS, catalog 12/12 parents, No-Code 9/12 groups fully demonstrated. Public-only session recovery retains no personal cells; full legacy personal restore and specialist non-Gakki forms are not certified. Review/approve/publish, desktop/mobile touch and Go 422/200 verified. T12/K13 remain VERIFICATION_PENDING. See [closure evidence](evidence/CLOSE-LEGACY-PARITY/RESULTS.md). No commit/GitHub/AWS writes.
