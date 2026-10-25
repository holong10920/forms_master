# S1 reference closure — proposed commit scope

Base: `2db4562822344c3aa66d8a424ffa8b8873c58ea1`. CP2 was already committed
with exactly its 45 approved files. This is a separate 19-file candidate, not staged or committed.

Proposed message: `test(engine): complete Sports and PC reference acceptance`

Scope: two core reference definitions, 12 golden/reference combinations and CLI backend
projection, minimal independent revision/site/expired-CAS regressions, evidence/status docs.
One S0 test file corrects a reproduced retry-reporting oracle and adds deterministic regression;
S0 store implementation is unchanged. No lookup/prefill merge or Compiler.

Full verify PASS; [G3 package and limitations](S1-EXIT.md). Requires scope/commit approval.
G3 remains PENDING user decision; no S2 implementation started.

- `README.md`
- `contracts/fixtures/engine/golden.json`
- `contracts/fixtures/engine/pc-reference.json`
- `contracts/fixtures/engine/sports.json`
- `docs/CONTEXT_HANDOFF.md`
- `docs/CURRENT_STATUS.md`
- `docs/PROJECT_CHECKLIST.md`
- `docs/evidence/P03/S1-EXIT-SCOPE.md`
- `docs/evidence/P03/S1-EXIT-parity.json`
- `docs/evidence/P03/S1-EXIT-reference-demo.json`
- `docs/evidence/P03/S1-EXIT.md`
- `python/fb_engine/tests/test_local_drafts.py`
- `python/fb_store/tests/test_migrations.py`
- `tools/engine-demo/adapter.py`
- `tools/engine-demo/src/cli.ts`
- `tools/engine-demo/src/parity.ts`
- `tools/engine-demo/src/reference.ts`
- `tools/engine-demo/test/parity.test.ts`
- `tools/engine-demo/test/references.test.ts`
