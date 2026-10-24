# Requirements Traceability

`Requirement ID → Design → Implementation → Tests → Evidence → Status`

> Bảng này chỉ theo dõi requirement mang tính sản phẩm/kỹ thuật (F-*, UX-*, ARCH-*, BUILD-*, MOTION-*, API-*, PERF-*, TEST-*, SEC-*, CICD-*, DOD-*). Checklist quy trình (CTX/SAFE/GIT/SP/Pxx) theo dõi ở `PROJECT_CHECKLIST.md`.
> Cột Design điền sau G1 (đường dẫn spec), Implementation/Tests sau G1. Trước đó mọi dòng là `TODO`.

## Tính năng P0

| Req | Design | Implementation | Tests | Evidence | Status |
|---|---|---|---|---|---|
| F-P0-01 Site Management | — | — | — | — | TODO |
| F-P0-02 Form Management | — | — | — | — | TODO |
| F-P0-03 Visual Form Builder | — | — | — | — | TODO |
| F-P0-04 Basic Field Library | — | — | — | — | TODO |
| F-P0-05 Multi-step Flow | — | — | — | — | TODO |
| F-P0-06 Validation | — | — | — | — | TODO |
| F-P0-07 Conditional Logic | — | — | — | — | TODO |
| F-P0-08 Theme/Branding | — | — | — | — | TODO |
| F-P0-09 Motion Animation | — | — | — | — | TODO |
| F-P0-10 Preview | — | — | — | — | TODO |
| F-P0-11 JSON Definitions | — | — | — | — | TODO |
| F-P0-12 Persistence | — | — | — | — | TODO |
| F-P0-13 Basic Auth + Roles | — | — | — | — | TODO |
| F-P0-14 Publish/Build | — | — | — | — | TODO |
| F-P0-15 Rollback | — | — | — | — | TODO |
| F-P0-16 Audit | — | — | — | — | TODO |
| F-P0-17 Demo Forms | `docs/discovery/P00_DISCOVERY.md` §4; ADR-003 (đã duyệt ở G0) | — | — | — | TODO (scope đã duyệt) |
| F-P0-18 Submit Simulation | — | — | — | — | TODO |
| F-P0-19 Docs + CI/Tests | — | — | — | — | TODO |

## Architecture / build / motion / API

| Nhóm req | IDs | Design | Status |
|---|---|---|---|
| Schema & workflow | ARCH-01..10 | `docs/superpowers/specs/2026-10-23-form-schema-workflow-design.md` rev 3.1 §6–§16, §19 (PROPOSED; design direction ADR-017..022; chưa duyệt hoàn toàn). ARCH-09/ARCH-10 chi tiết → `docs/superpowers/specs/2026-10-24-plugin-contracts-capability-registry-design.md` rev 2 §5–§13 (PROPOSED; ADR-023..035). | TODO (design đang review) |
| Compiler & isolation | BUILD-01..10 | Contract isolation (BUILD-02/04/05/06/08): spec #2 rev 2 §9–§11 (PROPOSED). Bundling, release, reproducible build: `docs/superpowers/specs/2026-10-24-compiler-bundle-release-design.md` rev 2 (PROPOSED; ADR-036..042). Bằng chứng mức spike (không phải implementation): `docs/evidence/P01/spike-gate-01/`. Bundling, Release Manifest: spec #3 (P01-04). | TODO |
| Motion | MOTION-01..07 | — (P01-06) | TODO |
| Backend & publishing | API-01..10 | `docs/superpowers/specs/2026-10-24-api-persistence-publishing-design.md` rev 2 (PROPOSED; ADR-054..060; READY_FOR_CROSS_SPEC_REVIEW) | TODO (design xong, chờ cross-spec review) |
| Admin UX | UX-01..05, UX-07 | `docs/superpowers/specs/2026-10-24-admin-form-builder-design.md` rev 2.3 (PROPOSED; ADR-046..053, ADR-061; test matrix §19 gồm 4Z01–4Z15; READY_FOR_CROSS_SPEC_REVIEW) | TODO (design đang review) |
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
| VG-04 | pnpm: tái hiện lỗi optional-peer của npm 10.8.2 bằng fixture; pnpm cài fixture thành công; resolve workspace; frozen lockfile; React peer singleton; pin `packageManager` | ADR-044 | P02 | OPEN |
| VG-05 | Node.js 24 LTS: image pin digest; tương thích Vite/Rolldown/plugin; chạy lại tái lập (A/B) và isolation; ghi khác biệt với spike | ADR-045 | P02 | OPEN |
| VG-06 | Tái lập khác kiến trúc CPU (ví dụ x86_64 vs arm64) | spec #3 §12, §21 | khi có runner | OPEN |
| VG-07 | Safari thật (không phải Playwright WebKit): prefetch reuse, retry `import()` | ADR-043 | trước G1 hoặc khi có thiết bị | OPEN |
| VG-08 | Phục hồi lỗi evaluate trên WebKit: UI phục hồi người dùng thấy được, giữ pinned release, không tự reload | ADR-043, spec #3 §15.3 | verification runtime | OPEN |
| VG-09 | Isolation của preset Motion theo từng form (preset chỉ có trong form dùng nó) | spike limitation EXP-05, spec #3 §7.3–§7.4, spec #6 | sau spec #6 | OPEN |
| VG-10 | Hành vi cache CDN và trình duyệt thật (stable entry, immutable asset, activation) | spec #3 §16, spec #5 | sau G10 | OPEN |
| VG-11 | S3 conditional write (`If-None-Match`/`If-Match`) cho release store và entry; CopyObject có điều kiện chưa dùng; DynamoDB transaction conflict/throughput thật | spec #5 §6.2, §6.4, §10.3, §11.2 | sau G10 | OPEN |
| VG-12 | Throughput và tỉ lệ `TransactionConflict` của submission admission gate (gate FBK dùng chung, shard `S`) trên DynamoDB thật | spec #5 §9.3 | sau G10 | OPEN |
| — | OD2-08, OD2-09 và các decision còn mở của spec #1/#2 | spec #2 §22, spec #1 §21 | theo hạn từng mục | OPEN |
