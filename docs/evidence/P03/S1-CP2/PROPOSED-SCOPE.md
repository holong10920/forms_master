# S1-CP2 proposed local commit scope

Base `9d9e104`, branch `codex/p03-s1-workflow-engine`.

Proposed message: `feat(engine): S1-CP2 async navigation and release-pinned local drafts`

45 files. Stage only this list. Commit requires user approval. No spikes, S0 store changes,
GitHub or AWS. Evidence and limitations: [RESULTS.md](RESULTS.md).

- `README.md`
- `contracts/fixtures/engine/calculated.json`
- `contracts/fixtures/engine/canonical.json`
- `contracts/fixtures/engine/golden.json`
- `contracts/fixtures/engine/groups.json`
- `contracts/fixtures/engine/operators.json`
- `contracts/fixtures/engine/pc.json`
- `contracts/schemas/engine-ir/v1.schema.json`
- `contracts/schemas/form-definition/v1.schema.json`
- `docs/evidence/P03/S1-CP2/PROPOSED-SCOPE.md`
- `docs/evidence/P03/S1-CP2/RESULTS.md`
- `docs/evidence/P03/S1-CP2/demo-branch.json`
- `docs/evidence/P03/S1-CP2/demo-restore.json`
- `docs/evidence/P03/S1-CP2/parity.json`
- `package.json`
- `packages/contracts/src/generated/engine-ir.v1.ts`
- `packages/contracts/src/generated/form-definition.v1.ts`
- `packages/contracts/src/generated/schemas.ts`
- `packages/form-engine/src/canonical.ts`
- `packages/form-engine/src/definition.ts`
- `packages/form-engine/src/expression.ts`
- `packages/form-engine/src/groups.ts`
- `packages/form-engine/src/index.ts`
- `packages/form-engine/src/model.ts`
- `packages/form-engine/src/navigation.ts`
- `packages/form-engine/src/restore.ts`
- `packages/form-engine/src/runtime.ts`
- `packages/form-engine/src/validators.ts`
- `packages/form-engine/test/engine.test.ts`
- `packages/form-engine/test/navigation.test.ts`
- `packages/form-engine/test/operators.test.ts`
- `packages/form-engine/test/restore.test.ts`
- `pyproject.toml`
- `python/fb_engine/src/fb_engine/canonical.py`
- `python/fb_engine/src/fb_engine/core.py`
- `python/fb_engine/tests/test_local_drafts.py`
- `python/fb_engine/tests/test_operators.py`
- `python/fb_engine/tests/test_submission.py`
- `tools/engine-demo/local_adapter.py`
- `tools/engine-demo/migrations/0001_synthetic_drafts.sql`
- `tools/engine-demo/src/cli.ts`
- `tools/engine-demo/src/parity.ts`
- `tools/engine-demo/src/restore.ts`
- `tools/engine-demo/test/demo.test.ts`
- `tools/engine-demo/test/parity.test.ts`
