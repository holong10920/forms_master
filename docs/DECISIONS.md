# Decisions (ADR index)

Each ADR records Context · Options · Decision · Trade-offs · Approver · Date · Status (`PROPOSED` / `ACCEPTED` / `SUPERSEDED`).
Only an ADR marked `ACCEPTED` with the user as approver is binding on implementation.

## Gate log

| Gate | Result | Approver | Date | Record |
|---|---|---|---|---|
| G0 Scope | **APPROVED WITH ADJUSTMENTS** | User (holong10920) | 2026-10-23 | ADR-003..ADR-007 |
| G1 Design | NOT APPROVED (not yet submitted) | — | — | — |
| G9 GitHub | **BLOCKED**: the user is handling repo visibility and source ownership | — | — | ADR-007 |
| G10 AWS | **BLOCKED**: profile/account will be confirmed before G10 | — | — | — |

## ADR index

| ID | Title | Status | Approver | Date |
|---|---|---|---|---|
| ADR-000 | Govern the project with docs + gates inside the repo | ACCEPTED | Master prompt | 2026-10-23 |
| ADR-001 | Company-derived audit notes live only in `docs/internal/` (gitignored) | ACCEPTED | User (G0 §4) | 2026-10-23 |
| ADR-002 | Architecture direction: Hybrid Form Compiler | ACCEPTED as direction; detailed design → G1 | User (G0) | 2026-10-23 |
| ADR-003 | Demo forms: synthetic Sports + PC | ACCEPTED | User (G0 §1) | 2026-10-23 |
| ADR-004 | MVP = vertical slice; undo/redo moves to P1 | ACCEPTED | User (G0 §2) | 2026-10-23 |
| ADR-005 | Performance claims require measured build artifacts | ACCEPTED | User (G0 §3) | 2026-10-23 |
| ADR-006 | AWS: do not pick a profile; no write API calls | ACCEPTED | User (G0 §5) | 2026-10-23 |
| ADR-007 | Git: local commits allowed for safe content; no remote push before G9 | ACCEPTED | User (G0 §4) | 2026-10-23 |

---

## ADR-000 — Govern the project with docs + gates

- **Context:** The project is long and spans many sessions. Context must not be lost and no gate may be skipped.
- **Decision:** Use the CTX-02..CTX-08 file set plus `docs/evidence/<PHASE>/`.
- **Approver:** Master prompt (mandatory). **Date:** 2026-10-23.

## ADR-001 — Keep the internal audit separate from anything that can be pushed

- **Context:** The remote `holong10920/forms_master` is a personal repository and is currently **PUBLIC**. The legacy audit was read from several company repositories, listed in `docs/internal/`.
- **Options:**
  - (a) Put the detailed audit in the regular `docs/`.
  - (b) Keep only abstract capabilities in tracked docs. Put details (paths, APIs, library names, weaknesses of the legacy system, legacy bundle numbers) in `docs/internal/`, which is gitignored.
  - (c) Skip the audit.
- **Decision:** (b). Tracked docs must not describe security weaknesses or internal details of company systems.
- **Trade-offs:**
  - Pro: protects IP and security.
  - Con: a fresh Claude session can only read `docs/internal/` on this local machine.
- **Approver:** User. G0 §4 states "không upload tài liệu nội bộ". **Date:** 2026-10-23.

## ADR-002 — Architecture direction: Hybrid Form Compiler

- **Context:** See `docs/discovery/P00_ARCHITECTURE_OPTIONS.md`, which compares A Runtime / B Codegen / C Hybrid.
- **Decision:** Follow direction **C. Hybrid**: versioned JSON + a shared engine + a compiler that generates per-form entrypoints and imports only the capabilities the form uses.
- **Not yet decided (G1):** schema format, workflow DSL, plugin contract, compiler/bundler strategy, Admin architecture, stack versions, performance budgets.
- **Approver:** User (G0, "đồng ý tiếp tục dự án theo định hướng Hybrid Form Compiler Architecture"). **Date:** 2026-10-23.

## ADR-003 — Demo forms

- **Decision:** Two **synthetic** forms. Neither integrates a production API, uses real data, or depends on company systems.
  - **Sports:**
    - 出張 flow
    - Conditional fields by category
    - Junk condition → the defect description becomes required
    - Motion `fade-slide`
    - A variant without Motion
  - **PC:**
    - Conditional fields by device type
    - 店頭 / 宅配 branching
    - `store-selector` plugin
    - A separate completion state per branch
    - Motion `scale-spring`
- Gakki is optional and not in the current MVP.
- **Approver:** User (G0 §1). **Date:** 2026-10-23.

## ADR-004 — MVP = vertical slice

- **Context:** Implementing the whole platform at once is high-risk. The PoC has to prove the end-to-end path first.
- **Decision:** The MVP proves the slice **Admin → JSON → Preview → Compiler → Static Artifact → Runtime → Local Publishing/Rollback**.
- **Prioritized P0 capabilities:**
  - basic site/form management
  - field/section editor
  - multi-step workflow
  - conditional logic
  - validation
  - theme config
  - Motion preset config
  - JSON schema validation
  - draft + version persistence
  - preview
  - static compiler
  - plugin isolation
  - local publish/rollback
- **UX-06 undo/redo → P1.** Architectural constraint: builder state must be an immutable document, and every edit must go through typed commands/patches so a history stack can be added later without refactoring.
- **The roadmap is unchanged.** Advanced capabilities stay in the master prompt.
- **Interpretation to confirm at G1:**
  - Four P0 items are missing from the priority list: F-P0-13 Auth/Roles, F-P0-16 Audit, F-P0-18 Submit Simulation and F-P0-19 Docs/CI.
  - They are **not demoted to P1**. They stay P0 and are scheduled after the vertical slice, because DOD-01/04/06 still depend on them.
  - If the user wants them deferred, that needs a new ADR.
- **Approver:** User (G0 §2). **Date:** 2026-10-23.

## ADR-005 — Performance requires quantitative evidence

- **Decision:** These claims must be verified on real build artifacts:
  - A Motion-free form does not load the Motion runtime.
  - The Sports artifact does not contain `store-selector`.
  - PC loads only the capabilities it needs.
  - Sizes are measured as raw / gzip / Brotli.
  - Chunks and the dependency graph are inspected.
- The legacy bundle numbers (indicative) are **not** an official baseline.
- Performance budgets are set from measurements and approved at G1. No performance improvement may be claimed without quantitative evidence.
- **Approver:** User (G0 §3). **Date:** 2026-10-23.

## ADR-006 — AWS

- **Decision:**
  - Claude does not pick an AWS profile and makes no AWS write calls.
  - Account/profile confirmation happens before G10.
  - This does not block brainstorming or local development.
- **Approver:** User (G0 §5). **Date:** 2026-10-23.

## ADR-007 — Git local-only

- **Decision:**
  - Local development and **local commits** are allowed when the content is safe: no internal company details, no secrets, no company code.
  - Push, remote changes, and remote settings changes are not allowed until G9.
  - Company-derived source must be checked for usage rights before it goes to any remote, including a private one.
- **Implementation:**
  - `docs/internal/` is gitignored.
  - The master prompt file is gitignored until the user reviews it, because it mentions the internal AWS environment. The user can unignore it after review.
- **Approver:** User (G0 §4). **Date:** 2026-10-23.
