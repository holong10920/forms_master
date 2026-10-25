# S1 exit / G3 approval package — local synthetic

CP1: `9d9e1040015aebf96a5f149a9cb78d90691323b8`.
CP2: `2db4562822344c3aa66d8a424ffa8b8873c58ea1`, committed exactly the 45 files
approved by the user, without bypassing hooks. CP2 alternative scan: detect-secrets==1.5.0,
27 default detectors, exact index covered, 0 unresolved. No lookup/prefill merge in CP2.

The Sports/PC reference closure below is a separate working-tree candidate on top of CP2,
not included in that commit. No automatic additional commit or G3 approval.

## Exit assessment

| Criterion | Classification | Evidence |
|---|---|---|
| Definition/DAG and conditional branching | DONE | `packages/form-engine/test/engine.test.ts`, `groups.test.ts`; default/cycle/reachability/type/forward-reference guards and reference category/branch tests |
| Async navigation, Next/Back, validation | DONE (core/mock ports) | `packages/form-engine/test/navigation.test.ts`: correlation, stale callback/duplicate events, cancellation, capability failure, IME, submit retry; real loader/transport deferred |
| Inactive exclusion and clearOnDeactivate | DONE | `engine.test.ts`: 宅配→店頭→宅配, preserve ordinary values and clear secret; `groups.test.ts`: child clearing/retired IDs; reference Sports Junk→used and PC branch tests |
| TS/Python semantic parity | DONE (supported executable subset) | `tools/engine-demo/test/parity.test.ts`, shared golden/operator fixtures; includes both reference definitions |
| Backend recompute | DONE | `python/fb_engine/tests/test_submission.py`; reference CLI sends TS preview to Python trusted-IR projection before completion; client calculated values ignored, unknown/inactive/displayOnly/null rejected |
| Draft TTL/CAS, release pinning and restore | DONE | Existing `python/fb_engine/tests/test_local_drafts.py::test_restart_filtering_cas_expiration_and_pin` and `::test_storage_failure_keeps_input_and_previous_committed_document`; `packages/form-engine/test/restore.test.ts`. Minimal added parameterized test checks independent revision/site mismatch plus CAS rejection at exact 72h expiry; no persistence implementation changes |
| Sports and PC reference definitions / main branches | DONE (candidate core-engine fixtures) | `contracts/fixtures/engine/sports.json`, `pc-reference.json`; `tools/engine-demo/test/references.test.ts`: 4 Sports category/condition combinations, 8 PC device/method combinations, Junk required, branch round-trip and exclusive/consent rejection |
| Actual Preview vs published artifact equivalence | IMPLEMENTED_BUT_VERIFICATION_PENDING | Shared core contract/evaluator verified; actual Compiler/Static Runtime artifacts and Preview integration do not exist yet; S2 verification |
| Compiler block expansion, real Store Selector binding, plugin format validators/loader | NOT_IMPLEMENTED here | Explicit S2/plugin integration boundary, not evidence that two scalar fixtures implement plugins |
| Lookup/prefill merge/overwrite | NOT_IMPLEMENTED, not authorized | ADR-013/014 remain PROPOSED outside D1–D3. Not required to invent a merge policy for these engine reference flows |

PC reference matches the logical G1 example: laptop/tablet battery condition, defects and
calculated displayOnly count, peripheral skip, 店頭/宅配, customer review and separate
`stp_done_store` / `stp_done_takuhai` terminals. Sports uses 出張, category-specific product
fields, Junk requiring damage description, customer review and `stp_done_shuccho`.
Customer fields are explicitly expanded fixture nodes; this is not block resolution.
The G1 `plugin:storeSel` host is represented by an explicitly synthetic core choice in the
engine fixture. This does not change or implement the plugin contract. Store/plugin loading,
format validators, bundle isolation and shared-block compilation must be verified in S2.

## CLI and tests

- `pnpm engine:demo --scenario pc-branch`: inactive exclusion and memory/clear round-trip.
- `pnpm engine:demo --scenario restore`: separate Python processes save/reopen a SQLite draft.
- `pnpm engine:demo --scenario references`: actual Sports golf/Junk and racket/used complete
  at `stp_done_shuccho`; PC laptop/store completes at `stp_done_store`, peripheral/delivery
  at `stp_done_takuhai` while skipping condition. All four Python projections accepted;
  preview and recomputed payload agree. No HTTP or real business submission.
The CLI executes **4 demo runs with 3 distinct terminal states**, not four terminal states:

| Run | Input | Terminal |
|---|---|---|
| Sports 1 | golf / Junk | stp_done_shuccho |
| Sports 2 | racket / used | stp_done_shuccho |
| PC 1 | laptop / store | stp_done_store |
| PC 2 | peripheral / takuhai | stp_done_takuhai |

- `pnpm engine:parity`: includes independent expected payloads for all 12 reference combinations.
- Targeted engine/reference suite: 89 passed. Draft regression suite: 4 passed.
- Final `pnpm verify`: PASS, exit 0. TS 610 passed, 15 declared expected-fail,
  1 intentional optional Gitleaks skip. Python 724 passed. Format/lint/strict types,
  schema drift/keyword lint, boundaries, network-isolation and synthetic checks PASS.
- `pnpm engine:parity`: PASS, 236 cases, seed 20261025. Node 24.22.1,
  ICU 78.3 / Unicode 17.0; Python 3.13.15 / Unicode 15.1.0.
- Alternative scan: detect-secrets==1.5.0, 27 default detectors, --no-verify;
  196 relevant working-source files (including new untracked source), 192 committed-index
  source files, 0 unresolved in either snapshot. Closure is not staged; exact staged scan
  must be repeated when its commit is approved. Gitleaks NOT_EXECUTED.
- Local execution logs: `/tmp/forms-s1-exit-verify-final.log`,
  `/tmp/forms-s1-exit-migration-tests.log`. Retained reference CLI and parity outputs are
  `S1-EXIT-reference-demo.json` and `S1-EXIT-parity.json` beside this assessment.

One S0 concurrent migration test failed during the first full run. Its oracle assumed
`with_conflict_retry(apply_migrations)` returns every version committed across all attempts.
The documented runner returns only versions applied by the final call: a prior attempt can
commit file 0001 before contention on file 0002. A deterministic one-time contention test now
proves that case; the concurrency assertion checks exact durable history and a single row
in the migrated table instead of incorrectly requiring a complete aggregate return list.
Unexpected thread exceptions and duplicate returned versions still fail. Only the test was
corrected; no S0 persistence implementation changed. Focused migration/draft run: 70 passed;
subsequent full run: 0 unexpected failures.

## G3 decision request and S2 handoff

G3 criterion from the local master, phase P03: two sample JSON definitions run the engine,
with tests for the main branches. Those engine-level checks are implemented and locally
executable in the candidate. **G3 PENDING**: user approval and a committed reference-closure
snapshot are still required; no self-declaration of full S1/G3 PASS.

Proposed next scope after approval: Compiler/Static Runtime implementation plan, starting
with actual Sports Motion-none output consuming the existing IR and engine, then PC with
explicit plugin binding and lazy branch loading. Verify shared-block expansion and
Preview/published semantics on generated artifacts; no architecture brainstorming.
T12 verified image digest/container build and reproducibility acceptance remain pending
before S2 acceptance. G2 is still conditional for local S1 only; S2 execution needs the
user's go-ahead. G9/G10 remain BLOCKED; synthetic only.

## User G3 closure decision (2026-10-25)

Closure committed `161fef2ba5b65e4fdc6c3ac867e9449350022f19`, exactly 19 approved files; regression and exact-index scanner PASS. **G3 APPROVED / P03 DONE** by explicit user decision. Four demo runs have three distinct terminals as tabulated above. Preview/published artifact verification is assigned to S2 and is not a G3 prerequisite. User authorized local synthetic S2 code/tests; T12 remains required before S2 acceptance. Earlier candidate/pending wording above is historical evidence.
