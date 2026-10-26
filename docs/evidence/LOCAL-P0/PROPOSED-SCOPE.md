# Pending local P0 checkpoint scope

Baseline HEAD: `079d2864bf2a6cf240eaf58605f810fc6f94e4a2`.
Branch: `codex/p03-s1-workflow-engine`. Staged diff is empty.

135 files; not staged or committed. Includes prior uncommitted S2 CP2 plus the
local Admin/customer vertical slice and actual evidence. Proposed message:
`feat(local-p0): no-code Admin and synthetic publish-submit flow`

Compiler/host/shared-runtime changes depend on each other and form one runnable checkpoint.
No spikes, runtime output/SQLite data, local secrets, GitHub or AWS. Scope implementation is
authorized; separate stage/commit exception is still required by current Git approval policy.
After approval: confirm this hash snapshot, stage exact files, scan exact index, inspect diff,
commit with normal hooks. Do not treat source/candidate scan as a staged-index scan.

Full results and remaining work: [RESULTS.md](RESULTS.md). This is not full P0 DONE.

```text
.dependency-cruiser.cjs
contracts/fixtures/engine/pc-plugin.json
contracts/fixtures/engine/sports-subtle.json
contracts/schemas/engine-ir/v1.schema.json
contracts/schemas/form-definition/v1.schema.json
docs/CONTEXT_HANDOFF.md
docs/CURRENT_STATUS.md
docs/evidence/LOCAL-P0/CANDIDATE-SNAPSHOT.json
docs/evidence/LOCAL-P0/PROPOSED-SCOPE.md
docs/evidence/LOCAL-P0/RESULTS.md
docs/evidence/LOCAL-P0/artifact-secret-scan.json
docs/evidence/LOCAL-P0/local-p0-admin-preview.png
docs/evidence/LOCAL-P0/local-p0-customer-complete.png
docs/evidence/LOCAL-P0/local-p0-rollback.png
docs/evidence/LOCAL-P0/mock-effect.json
docs/evidence/LOCAL-P0/network-node.json
docs/evidence/LOCAL-P0/network-python.json
docs/evidence/LOCAL-P0/no-code-browser.json
docs/evidence/LOCAL-P0/no-code-definition.json
docs/evidence/LOCAL-P0/numeric-browser.json
docs/evidence/LOCAL-P0/pc-plugin-candidate-manifest.json
docs/evidence/LOCAL-P0/pc-plugin-capability-lock.json
docs/evidence/LOCAL-P0/pc-plugin-chunk-manifest.json
docs/evidence/LOCAL-P0/pc-plugin-local-integrity.json
docs/evidence/LOCAL-P0/performance.json
docs/evidence/LOCAL-P0/reference-browser.json
docs/evidence/LOCAL-P0/references.json
docs/evidence/LOCAL-P0/security-http.json
docs/evidence/LOCAL-P0/source-secret-scan.json
docs/evidence/LOCAL-P0/sports-candidate-manifest.json
docs/evidence/LOCAL-P0/sports-capability-lock.json
docs/evidence/LOCAL-P0/sports-chunk-manifest.json
docs/evidence/LOCAL-P0/sports-local-integrity.json
docs/evidence/LOCAL-P0/sports-subtle-candidate-manifest.json
docs/evidence/LOCAL-P0/sports-subtle-capability-lock.json
docs/evidence/LOCAL-P0/sports-subtle-chunk-manifest.json
docs/evidence/LOCAL-P0/sports-subtle-local-integrity.json
docs/evidence/LOCAL-P0/verification.txt
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
python/fb_engine/tests/local_p0/test_control.py
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
tools/local_p0/README.md
tools/local_p0/__init__.py
tools/local_p0/config.py
tools/local_p0/control.py
tools/local_p0/environment.json
tools/local_p0/guard.ts
tools/local_p0/host.ts
tools/local_p0/network.sb
tools/local_p0/package.json
tools/local_p0/probe.py
tools/local_p0/probe.ts
tools/local_p0/rpc.py
tools/local_p0/seed.py
tools/local_p0/start.sh
tools/local_p0/test/browser-flow.txt
tools/local_p0/test/numeric-browser.txt
tools/local_p0/test/reference-browser.txt
tools/local_p0/test/security_http.py
tools/local_p0/tsconfig.json
tools/local_p0/web/admin.js
tools/local_p0/web/index.html
tools/local_p0/web/preview.js
tools/local_p0/web/style.css
```
