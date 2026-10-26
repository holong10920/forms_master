# S2 CP2 proposed commit scope

Baseline: `079d2864bf2a6cf240eaf58605f810fc6f94e4a2`.

Proposed message: `feat(compiler): PC plugin isolation, Motion and local publication`

79 files, **not staged or committed**. User approval required before commit.

Includes finite approved plugin/Motion schema subset + generated types, trusted Store Selector
browser/server facets, SDK/presets/adapter, compiler resolver/hash/audit/literal bindings,
local mock validation and immutable publish/CAS/rollback, narrowly required authoritative-rejection
engine integration + regression, fixtures/boundary tests, pinned dependencies/workspaces and evidence.
No Admin, lookup/prefill, production backend, AWS or GitHub. Runtime output and local DB excluded.

Full verification and remaining acceptance: [RESULTS.md](RESULTS.md). Before commit rerun
exact-index alternative scan, confirm scope and use normal hooks. T12/canonical K13 pending.

```text
.dependency-cruiser.cjs
contracts/fixtures/engine/pc-plugin.json
contracts/fixtures/engine/sports-subtle.json
contracts/schemas/engine-ir/v1.schema.json
contracts/schemas/form-definition/v1.schema.json
docs/CURRENT_STATUS.md
docs/evidence/P07/CP2/PROPOSED-SCOPE.md
docs/evidence/P07/CP2/RESULTS.md
docs/evidence/P07/CP2/artifact-scan-manifest.json
docs/evidence/P07/CP2/artifact-secret-scan.json
docs/evidence/P07/CP2/browser-proof.json
docs/evidence/P07/CP2/browser-proof.txt
docs/evidence/P07/CP2/frozen-install.txt
docs/evidence/P07/CP2/pc-plugin-candidate-manifest.json
docs/evidence/P07/CP2/pc-plugin-capability-lock.json
docs/evidence/P07/CP2/pc-plugin-chunk-manifest.json
docs/evidence/P07/CP2/pc-plugin-local-integrity.json
docs/evidence/P07/CP2/performance.json
docs/evidence/P07/CP2/publication.json
docs/evidence/P07/CP2/source-secret-scan.json
docs/evidence/P07/CP2/sports-candidate-manifest.json
docs/evidence/P07/CP2/sports-capability-lock.json
docs/evidence/P07/CP2/sports-chunk-manifest.json
docs/evidence/P07/CP2/sports-local-integrity.json
docs/evidence/P07/CP2/sports-subtle-candidate-manifest.json
docs/evidence/P07/CP2/sports-subtle-capability-lock.json
docs/evidence/P07/CP2/sports-subtle-chunk-manifest.json
docs/evidence/P07/CP2/sports-subtle-local-integrity.json
docs/evidence/P07/CP2/verification.txt
docs/superpowers/plans/2026-10-25-s2-compiler-static-runtime.md
eslint.config.js
package.json
packages/contracts/src/generated/engine-ir.v1.ts
packages/contracts/src/generated/form-definition.v1.ts
packages/contracts/src/generated/schemas.ts
packages/form-engine/src/canonical.ts
packages/form-engine/src/definition.ts
packages/form-engine/src/model.ts
packages/form-engine/src/runtime.ts
packages/form-engine/test/navigation.test.ts
packages/motion-adapter/package.json
packages/motion-adapter/src/index.tsx
packages/motion-adapter/tsconfig.json
packages/motion-presets/package.json
packages/motion-presets/src/index.ts
packages/motion-presets/tsconfig.json
packages/sdk-browser/package.json
packages/sdk-browser/src/index.ts
packages/sdk-browser/tsconfig.json
packages/static-runtime/package.json
packages/static-runtime/src/index.ts
packages/static-runtime/src/ports.ts
plugins/store-selector/browser/index.tsx
plugins/store-selector/package.json
plugins/store-selector/plugin.manifest.json
plugins/store-selector/server/store_selector_server.py
plugins/store-selector/tsconfig.json
pnpm-lock.yaml
pnpm-workspace.yaml
pyproject.toml
python/fb_engine/src/fb_engine/canonical.py
python/fb_engine/tests/test_compiler_integration.py
tools/boundaries/fixtures/plugin-violations/packages/form-engine/src/index.ts
tools/boundaries/fixtures/plugin-violations/packages/motion-adapter/src/index.ts
tools/boundaries/fixtures/plugin-violations/plugins/store-selector/browser/index.ts
tools/boundaries/fixtures/plugin-violations/plugins/store-selector/server/index.ts
tools/boundaries/test/rules.test.ts
tools/compiler/__init__.py
tools/compiler/local_publish.py
tools/compiler/migrations/0001_local_publications.sql
tools/compiler/package.json
tools/compiler/server_adapter.py
tools/compiler/src/bindings.ts
tools/compiler/src/build.ts
tools/compiler/src/cli.ts
tools/compiler/src/publish.ts
tools/compiler/src/resolve.ts
tools/compiler/src/server.ts
tools/compiler/test/isolation.test.ts
```
