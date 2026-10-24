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
| Compiler & isolation | BUILD-01..10 | Contract isolation (BUILD-02/04/05/06/08): spec #2 rev 2 §9–§11 (PROPOSED). Bundling (spec #3): đang brainstorm. Bundling, Release Manifest: spec #3 (P01-04). | TODO |
| Motion | MOTION-01..07 | — (P01-06) | TODO |
| Backend & publishing | API-01..10 | — (P01-05) | TODO |
| Admin UX | UX-01..05, UX-07 | — (P01-03) | TODO |
| Undo/redo | UX-06 | ADR-004: P1; design phải chừa chỗ cho nó | DEFERRED P1 (G0) |

## Chất lượng

| Nhóm req | IDs | Status |
|---|---|---|
| Hiệu năng | PERF-01..07 | TODO — ADR-005: chỉ dùng số đo trên PoC artifacts; budget chốt ở G1 |
| Testing | TEST-01..11 | TODO |
| Bảo mật | SEC-01..08 | TODO (threat model ở P01-07) |
| CI/CD | CICD-01..10 | TODO (CD bị gate G10) |
| Definition of Done | DOD-01..10 | TODO |
