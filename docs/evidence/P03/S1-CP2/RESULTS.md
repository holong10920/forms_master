# S1-CP2 — V3 + V4 local synthetic candidate

Baseline S1-CP1 `9d9e1040015aebf96a5f149a9cb78d90691323b8`, branch
`codex/p03-s1-workflow-engine`. Candidate pending scope approval; no automatic CP2 commit.
G1 approved, G2 CONDITIONAL GO local S1 only. ADR-013/014 remain PROPOSED outside D1–D3.
T12 BLOCKED_BY_ENVIRONMENT / VERIFICATION_PENDING, due before S2 acceptance. G9/G10 blocked.

## Implemented scope

| Task | Executable coverage |
|---|---|
| T1–T3 | CP1 definition/IR and dependency DAG, branching, pure P0 rules/calculated, repeatable groups. CP2 adds option availability dependencies, structured canonicalization and privacy floors. |
| T4 | Correlated validation/capability effect descriptors, stale/duplicate responses ignored, edit/input/back/jump cancel pending navigation, Next recalculated after success, load failure preserves inputs. Lazy guards apply to Next/Back/jump/restore; initial step fails closed unless bootstrap has loaded it. Back uses valid visited steps; branch changes prune forward history. Deep link cannot complete; incomplete links resolve through firstIncomplete. IME gates commits/Next, blur/touched and value-free validation notices. Submit locks inputs; uncertain failure retains snapshot for retry with the same injected idempotency key. Complete requires matching success. |
| T5 | Python projection from adapter-selected trusted IR; unknown/inactive/displayOnly/null/type errors, stable group item addresses, computed values recomputed. Required authoritative mock result unavailable/false fails closed; client cannot select IR via payload. |
| T6 | SQLite draft adapter using unchanged S0 migration/transaction/clock/size-limit primitives. Save filters active public/persist-allowed/non-calculated/non-displayOnly fields and group children. Binding pins site/form/release/revision, logical TTL 72h, version CAS. Restore reprojects, validates firstIncomplete and capability guards. Failure leaves caller inputs and previous committed draft intact. |

Privacy corrections before persistence: text/textarea and structured PII field types require
at least personal; calculated classification cannot downgrade inputs. PC packingKit is a
public yes/no choice, matching the G1 example. Other free-text fixture labels raised to personal.
Choice values are exact (no trim); free text only trims; textarea CRLF becomes LF. Structured
email/tel/postal/katakana transforms follow spec #1 §7.6.5 version 1. Numeric UI parsing is an
explicit adapter helper; typed evaluator and backend do not coerce string numbers.

Unavailable selected options remain in memory but are absent from effective data and produce
`E-OPTION-UNAVAILABLE`; navigation/submission fail until corrected. Empty-group predicates and
missing boolean item predicates have shared independent expected fixtures.

## Execution evidence

`pnpm verify`: PASS, exit 0 (2026-10-25). TS: 593 passed, 15 declared expected-fail,
1 intentional optional Gitleaks skip. Python: 721 passed. Format, lint, TS/mypy,
schema generation/keyword lint, import boundaries, network isolation tests and synthetic
checks PASS. Final added golden case rechecked by the parity test and CLI; no source
changes after verification. Local logs: `/tmp/forms-s1-cp2-final.log`,
`/tmp/forms-s1-cp2-parity-tests.log`.

Alternative scan PASS: detect-secrets==1.5.0, 27 default detectors, --no-verify;
JSON results have 0 unresolved findings. Working source scan covers 192 relevant files;
Final index scan covers 197 files, including all 45 staged files and staged docs/evidence;
`stagedCovered=true`, index and working unresolved counts both 0.
Gitleaks NOT_EXECUTED. Scanner is heuristic, not proof of absence or equivalent to Gitleaks.
No remote secret verification or container acceptance is claimed.

- `pnpm engine:demo --scenario pc-branch`: actual preview after round trip
  `{ "purchaseMethod": "takuhai", "packingKit": "yes" }`; store preview excludes kit.
- `pnpm engine:demo --scenario restore`: separate Python save/load processes; actual output
  `saved.version=1`, `status=restored`, `step=stp_takuhai`, above preview, `secretAbsent=true`.
- `pnpm engine:parity`: 224 golden/seeded differential cases, seed 20261025. Node 24.22.1,
  ICU 78.3 / Unicode 17.0; Python 3.13.15 / Unicode 15.1.0. Covered halfwidth-kana mapping
  is fixture-pinned; free-text compatibility/combining codepoints are preserved.
- Shared operator fixtures test every P0 operator, missing/negation/lazy-choose and empty groups.
- Draft tests reopen the database, enforce CAS on two connections, reject wrong release/form,
  expire exactly at 72h and preserve inputs/previous document on an actual read-only SQLite error.
- One scanner false positive was an identifier alphabet literal; replaced by equivalent ASCII
  character predicates. No detector, allowlist or scanner classification policy was weakened.

Self-review completed once. Tests are core/IPC tests; no DOM/focus, network integration,
production admission/ledger, container build or Compiler acceptance is claimed.

## Explicit remaining boundaries

Mock step-level ports are supplied by trusted bootstrap code; they are not a plugin registry,
lazy module loader, transport, or full capability lock implementation. Connectors and advisory
validation services are not called. Email/tel/postal/katakana format validators supplied by
plugins are not implemented by canonicalization; hiragana stays unchanged for the validator
to reject. Core built-in validators cover required, length/numeric/item limits, exclusiveOption
and mustBeTrue. No claim plugin format-validation acceptance.

Lookup/prefill merge/overwrite and provenance remain outside D1–D3 approval. Consequently
value-changing async scenarios C4/NR-06 via lookup are not claimed end-to-end; this candidate
exercises async validation/capability lifecycle without inventing lookup merge policies.
Start-over uses a fresh session; no migration between draft releases is performed. Item helpers
plus commit provide add/remove/move; no UI adapter exists. No full S1/S0/G2 PASS declaration.
