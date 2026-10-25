# S1-CP1 — V1 + V2 candidate

Baseline `a312998`, branch `codex/p03-s1-workflow-engine`. Candidate, not committed.
G2 CONDITIONAL GO local synthetic S1; G9/G10 blocked. T12 environment exception
unchanged, due before S2 acceptance. ADR-013/014 remain PROPOSED outside D1–D3.

## Executed verification (2026-10-25)

- `pnpm verify`: PASS, exit 0. Node 24.22.1, pnpm 12.15.0, Python 3.13.15.
- TS: 573 passed, 15 declared expected-fail, 1 intentional optional Gitleaks skip.
- Python: 706 passed. Socket isolation remains enabled. Boundary negative fixtures pass.
- Format, lint, strict TS/mypy, generation drift, schema keyword lint, TS/Python
  import boundaries, synthetic checks: PASS.
- Alternative secret scanner: detect-secrets==1.5.0, 27 default detectors,
  --no-verify, JSON results examined by existing scanner; no unresolved findings.
  Coverage: relevant tracked source plus new source, and exact staged index snapshot.
  Docs/lock/vendor excluded from working-source scan but included when staged.
  Gitleaks NOT_EXECUTED; no scanner-equivalence claim; no online secret verification.
- `pnpm engine:parity`: PASS 220 golden/seeded cases, seed 20261025,
  Node ICU 78.3 / Unicode 17.0. Same IR evaluated by TS and Python.
- All 26 P0 operators plus missing/negation/lazy-choose cases share 29 independent
  expected-value fixtures consumed by both runtimes.
- `pnpm engine:demo --scenario pc-branch`: PASS. Actual store preview
  `{ "purchaseMethod": "store", "store": "fictional-store" }`; round-trip
  delivery preview `{ "purchaseMethod": "takuhai", "packingKit": "yes" }`.
  `packingKitPreserved: true`, `secretCleared: true`.

## Supported and pending

Implemented: canonical executable definition/IR subset; semantic ID/reference/type,
transition/default/reachability/forward-reference guards; combined dependency DAG;
finite P0 pure operators and safe-integer overflow; active-only calculation, validation
and projection; stable group item IDs/order/error paths; clear/preserve; CLI branch demo;
BE parity evaluator ignores client calculated values. Unsupported definition constructs
are rejected, not silently ignored. Core cannot import Node/store/tools or use clock/random.

Pending CP2: complete async navigation/validation/capability guards, IME and structured
canonicalization, trusted backend submission projection, release-pinned draft persistence,
TTL/CAS and restart demo. No HTTP service, real plugin lookup/prefill, UI, Compiler or
submission admission/ledger. No claim full S1 or container verification PASS.

Self-review completed once; no independent reviewer. Logs retained locally in
`/tmp/forms-s1-cp1-final.log`, `/tmp/forms-s1-cp1-demo.json`,
`/tmp/forms-s1-cp1-parity.json` (temporary evidence, summarized here).
