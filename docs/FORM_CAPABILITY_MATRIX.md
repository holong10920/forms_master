# Form Capability Matrix (P00-04)

> Capability-level view of the legacy purchase forms. Built from a read-only audit on 2026-10-23.
> Under ADR-001 this file is **abstract only**: no paths, endpoints, env names, library names, internal weaknesses, or legacy bundle numbers. Those details live in `docs/internal/`, which is gitignored.
> Status: `CONFIRMED` = observed in the legacy system · `ASSUMED` = inferred · `UNKNOWN` = not checked.
> The **PoC** column reflects the decisions at G0 (ADR-003/004). Every capability in the PoC is new code that runs on synthetic data.

## 1. Flow structure

| Capability | Sports | PC | Gakki | Status | PoC |
|---|---|---|---|---|---|
| Steps: product → product list → customer info → thanks | ✔ | ✔ | ✔ | CONFIRMED | MVP (multi-step engine). The demo uses a single product. |
| Repeatable product items | ✔ | ✔ | ✔ | CONFIRMED | P1 (F-P1-01) |
| Category drill-down (multi-level select) | ✔ | ✔ | ✔ | CONFIRMED | MVP |
| Fields shown or hidden by category | ✔ | ✔ (heavy) | ✔ | CONFIRMED | MVP (rules AST) |
| Purchase-method branch 店頭 / 宅配 / 出張 | 出張 only | 店頭 / 宅配 (+ server-decided 出張) | UNKNOWN | CONFIRMED (Sports, PC) | MVP: Sports 出張 only; PC 店頭/宅配 as a step branch. Full logic is P1 (F-P1-03). |
| Method-specific sub-flow (store + date, delivery slot, packing kit) | — | ✔ | UNKNOWN | CONFIRMED (PC) | MVP simplified (select fields + `store-selector`). Date picker is P1. |
| Separate completion per method | — | ✔ | UNKNOWN | CONFIRMED | MVP (a terminal step per branch) |
| A/B pattern variants | ✔ | ✔ | ✔ | CONFIRMED | P2 (F-P2-01) |
| Resume/prefill from a previous submission | ✔ | ✔ | ✔ | CONFIRMED | Out of PoC |

## 2. Field types

| Field type | Sports | PC | Gakki | Status | PoC |
|---|---|---|---|---|---|
| Text / textarea / select / radio / checkbox | ✔ | ✔ | ✔ | CONFIRMED | MVP (F-P0-04) |
| Checkbox array | — | ✔ | — | CONFIRMED | MVP |
| Email | ✔ | ✔ | ✔ | CONFIRMED | MVP (format only) |
| Phone (JP format) | ✔ | ✔ | ✔ | CONFIRMED | MVP (pattern) |
| Postal code → address autofill | ✔ | ✔ | ✔ | CONFIRMED | P1 plugin `postal-code` (mock) |
| Maker/model picker (remote catalog) | — | ✔ | — | CONFIRMED | P1 plugin `product-picker` (mock) |
| Store selector | — | ✔ | UNKNOWN | CONFIRMED | **MVP plugin `store-selector`** (fictional stores). Only PC uses it; it is the plugin-isolation proof. |
| Date / time slot picker | — | ✔ | UNKNOWN | CONFIRMED | P1 |
| Image / file upload | — | — | — | CONFIRMED absent | P1 at most |
| Help content blocks / modals | — | ✔ | UNKNOWN | CONFIRMED | P1 |

## 3. Validation and logic

| Capability | Status | PoC |
|---|---|---|
| Conditional validation by category | CONFIRMED | MVP: one versioned contract for FE + BE (ARCH-07) |
| Server-side validation | CONFIRMED | MVP: Python validates against the same contract |
| Server errors mapped back to fields | CONFIRMED | MVP |
| Submission idempotency | see `docs/internal/` | F-P0-18: idempotency key in the local stub |
| Site-specific behavior configured as data (site registry) | see `docs/internal/` | MVP: site registry (F-P0-01) |

## 4. Integrations

| Integration | PoC |
|---|---|
| Submit/order backend | **Never called.** Local stub only (F-P0-18, API-10). |
| Product catalog | Mock JSON (P1) |
| Store/center list | Fictional mock (global rule: never call the real endpoints) |
| Postal-code lookup | Mock dictionary (P1) |
| Analytics, recommendation | Out of PoC (F-P1-08) |

## 5. Animation

| Capability | Status | PoC |
|---|---|---|
| Enter/exit reveals, animated modals and errors | CONFIRMED | MVP: preset registry (`fade-slide`, `scale-spring`, plus validation feedback) and reduced motion |
| Animation configurable by non-developers | CONFIRMED absent | MVP: Motion preset config in Admin |

## 6. Build / delivery

| Capability | Status | PoC |
|---|---|---|
| Per-form artifact isolation | CONFIRMED absent (many sites share one artifact) | MVP: one artifact per form, with analyzer evidence (ADR-005) |
| Versioned release + rollback pointer | see `docs/internal/` | MVP: local publish/rollback (API-07 semantics) |
| Performance baseline | not available as an official baseline | ADR-005: only numbers measured on PoC artifacts |
