# Proposed local commit scope — no staging performed

Branch: `codex/p03-s1-workflow-engine`. HEAD: `693969a8a226af3227ed3bb0e4cd49994126f12c`.

Staged diff: **0 files**. Working changes: **155 files** including tracked modifications
and individual untracked files. Exact paths/status/content SHA-256: `FILE-SNAPSHOT.json`.
The two self-describing scope files are excluded from their own hashes.

## Group A — integrated functional checkpoint (142 files)

Proposed message: `feat(local-p0): OIDC, partial preview and canonical host releases`

Includes existing uncommitted CP2/shared-block/rules/autosave/localization implementation,
S1 extensions, compiler/runtime, local Admin/control/auth, test regressions, setup/build notes,
and LOCAL-P0-CP2 plus LOCAL-P0-CLOSURE execution evidence. Existing JA/VI code is retained.
Keeping integrated source and its tests together avoids splitting shared files into artificial
partial commits. No runtime data, generated public releases, credentials, node_modules or spikes.

- `contracts/schemas/engine-ir/v1.schema.json`
- `contracts/schemas/form-definition/v1.schema.json`
- `docker/builder/README.md`
- `packages/contracts/src/generated/engine-ir.v1.ts`
- `packages/contracts/src/generated/form-definition.v1.ts`
- `packages/contracts/src/generated/schemas.ts`
- `packages/form-engine/src/definition.ts`
- `packages/form-engine/src/index.ts`
- `packages/form-engine/src/runtime.ts`
- `packages/static-runtime/src/index.ts`
- `packages/static-runtime/src/style.css`
- `python/fb_engine/src/fb_engine/core.py`
- `python/fb_engine/tests/local_p0/test_control.py`
- `python/fb_engine/tests/test_compiler_integration.py`
- `tools/compiler/local_publish.py`
- `tools/compiler/server_adapter.py`
- `tools/compiler/src/build.ts`
- `tools/compiler/src/cli.ts`
- `tools/compiler/src/resolve.ts`
- `tools/compiler/src/server.ts`
- `tools/local_p0/README.md`
- `tools/local_p0/control.py`
- `tools/local_p0/host.ts`
- `tools/local_p0/network.sb`
- `tools/local_p0/rpc.py`
- `tools/local_p0/test/browser-flow.txt`
- `tools/local_p0/test/numeric-browser.txt`
- `tools/local_p0/test/reference-browser.txt`
- `tools/local_p0/tsconfig.json`
- `tools/local_p0/web/admin.js`
- `tools/local_p0/web/index.html`
- `tools/local_p0/web/preview.js`
- `tools/local_p0/web/style.css`
- `tools/security/src/scan.ts`
- `tools/security/test/alternative-scan.test.ts`
- `contracts/fixtures/blocks/blk_customer_info@r1.json`
- `contracts/fixtures/blocks/blk_customer_info@r2.json`
- `contracts/fixtures/blocks/registry.json`
- `docs/evidence/LOCAL-P0-CLOSURE/FILE-SNAPSHOT.json`
- `docs/evidence/LOCAL-P0-CLOSURE/PROPOSED-SCOPE.md`
- `docs/evidence/LOCAL-P0-CLOSURE/RESULTS.md`
- `docs/evidence/LOCAL-P0-CLOSURE/blocked-preview-browser.json`
- `docs/evidence/LOCAL-P0-CLOSURE/builder-cache-node-version.txt`
- `docs/evidence/LOCAL-P0-CLOSURE/canonical-final-byte-tests.log`
- `docs/evidence/LOCAL-P0-CLOSURE/closure-blocked-preview.png`
- `docs/evidence/LOCAL-P0-CLOSURE/closure-oidc-admin.png`
- `docs/evidence/LOCAL-P0-CLOSURE/closure-partial-preview.png`
- `docs/evidence/LOCAL-P0-CLOSURE/closure-partial-stop.png`
- `docs/evidence/LOCAL-P0-CLOSURE/closure-pc-store.png`
- `docs/evidence/LOCAL-P0-CLOSURE/closure-sports-customer.png`
- `docs/evidence/LOCAL-P0-CLOSURE/full-browser-e2e.json`
- `docs/evidence/LOCAL-P0-CLOSURE/local-p0-admin-preview.png`
- `docs/evidence/LOCAL-P0-CLOSURE/local-p0-customer-complete.png`
- `docs/evidence/LOCAL-P0-CLOSURE/local-p0-rollback.png`
- `docs/evidence/LOCAL-P0-CLOSURE/network-node.json`
- `docs/evidence/LOCAL-P0-CLOSURE/network-python.json`
- `docs/evidence/LOCAL-P0-CLOSURE/oidc-browser.json`
- `docs/evidence/LOCAL-P0-CLOSURE/partial-preview-browser.json`
- `docs/evidence/LOCAL-P0-CLOSURE/performance.json`
- `docs/evidence/LOCAL-P0-CLOSURE/public-artifact-secret-scan-raw.json`
- `docs/evidence/LOCAL-P0-CLOSURE/public-artifact-secret-scan.json`
- `docs/evidence/LOCAL-P0-CLOSURE/publish-rollback-mock-effect.json`
- `docs/evidence/LOCAL-P0-CLOSURE/reauth-draft-browser.json`
- `docs/evidence/LOCAL-P0-CLOSURE/reference-browser.json`
- `docs/evidence/LOCAL-P0-CLOSURE/references.json`
- `docs/evidence/LOCAL-P0-CLOSURE/scanner-negative-tests.log`
- `docs/evidence/LOCAL-P0-CLOSURE/source-secret-scan.json`
- `docs/evidence/LOCAL-P0-CLOSURE/sports-release/attestation.json`
- `docs/evidence/LOCAL-P0-CLOSURE/sports-release/chunk-plan.json`
- `docs/evidence/LOCAL-P0-CLOSURE/sports-release/host-final-verification.json`
- `docs/evidence/LOCAL-P0-CLOSURE/sports-release/lrm.json`
- `docs/evidence/LOCAL-P0-CLOSURE/sports-release/provenance.json`
- `docs/evidence/LOCAL-P0-CLOSURE/sports-release/semantic-fixtures.json`
- `docs/evidence/LOCAL-P0-CLOSURE/verification-summary.json`
- `docs/evidence/LOCAL-P0-CLOSURE/verification.log`
- `docs/evidence/LOCAL-P0-CP2/693969a-index-secret-scan.json`
- `docs/evidence/LOCAL-P0-CP2/RESULTS.md`
- `docs/evidence/LOCAL-P0-CP2/WORKING-SCOPE.txt`
- `docs/evidence/LOCAL-P0-CP2/alternative-scanner-negative-tests.txt`
- `docs/evidence/LOCAL-P0-CP2/autosave-browser.json`
- `docs/evidence/LOCAL-P0-CP2/clone-settings-browser.json`
- `docs/evidence/LOCAL-P0-CP2/ct26.txt`
- `docs/evidence/LOCAL-P0-CP2/local-p0-admin-preview.png`
- `docs/evidence/LOCAL-P0-CP2/local-p0-admin-viewport.png`
- `docs/evidence/LOCAL-P0-CP2/local-p0-cas-conflict.png`
- `docs/evidence/LOCAL-P0-CP2/local-p0-clone-settings.png`
- `docs/evidence/LOCAL-P0-CP2/local-p0-customer-complete.png`
- `docs/evidence/LOCAL-P0-CP2/local-p0-named-rules.png`
- `docs/evidence/LOCAL-P0-CP2/local-p0-preview-form.png`
- `docs/evidence/LOCAL-P0-CP2/local-p0-preview-revoked.png`
- `docs/evidence/LOCAL-P0-CP2/local-p0-preview-viewport.png`
- `docs/evidence/LOCAL-P0-CP2/local-p0-rollback.png`
- `docs/evidence/LOCAL-P0-CP2/local-p0-shared-blocks.png`
- `docs/evidence/LOCAL-P0-CP2/mock-effect.json`
- `docs/evidence/LOCAL-P0-CP2/named-rules-browser.json`
- `docs/evidence/LOCAL-P0-CP2/no-code-browser.json`
- `docs/evidence/LOCAL-P0-CP2/performance.json`
- `docs/evidence/LOCAL-P0-CP2/preview-revocation-browser.json`
- `docs/evidence/LOCAL-P0-CP2/reference-browser.json`
- `docs/evidence/LOCAL-P0-CP2/references.json`
- `docs/evidence/LOCAL-P0-CP2/security-http.json`
- `docs/evidence/LOCAL-P0-CP2/shared-block-browser.json`
- `docs/evidence/LOCAL-P0-CP2/source-secret-scan.json`
- `docs/evidence/LOCAL-P0-CP2/verification-summary.json`
- `docs/evidence/LOCAL-P0-CP2/verification.txt`
- `docs/evidence/LOCAL-P0-CP2/viewport-screenshots.json`
- `packages/form-engine/src/preview.ts`
- `packages/form-engine/test/preview.test.ts`
- `python/fb_engine/tests/local_p0/test_contracts.py`
- `python/fb_engine/tests/local_p0/test_ct26.py`
- `python/fb_engine/tests/local_p0/test_form_clone.py`
- `python/fb_engine/tests/local_p0/test_key_contract_ack.py`
- `python/fb_engine/tests/local_p0/test_oidc.py`
- `python/fb_engine/tests/local_p0/test_operations.py`
- `python/fb_engine/tests/local_p0/test_review_lifecycle.py`
- `python/fb_engine/tests/local_p0/test_translation.py`
- `tools/compiler/src/blocks.ts`
- `tools/compiler/src/l10n.ts`
- `tools/compiler/src/reference-labels.ts`
- `tools/compiler/src/release.ts`
- `tools/compiler/src/themes.ts`
- `tools/compiler/test/blocks.test.ts`
- `tools/compiler/test/l10n.test.ts`
- `tools/compiler/test/release.test.ts`
- `tools/compiler/test/themes.test.ts`
- `tools/local_p0/blocks.py`
- `tools/local_p0/clone.py`
- `tools/local_p0/oidc.ts`
- `tools/local_p0/oidc_store.py`
- `tools/local_p0/test/autosave-browser.txt`
- `tools/local_p0/test/blocked-preview-browser.txt`
- `tools/local_p0/test/clone-settings-browser.txt`
- `tools/local_p0/test/l10n-browser.txt`
- `tools/local_p0/test/oidc-browser.txt`
- `tools/local_p0/test/oidc.test.ts`
- `tools/local_p0/test/partial-preview-browser.txt`
- `tools/local_p0/test/preview-revocation-browser.txt`
- `tools/local_p0/test/reauth-draft-browser.txt`
- `tools/local_p0/test/rules-browser.txt`
- `tools/local_p0/test/shared-block-browser.txt`
- `tools/local_p0/translation.py`
- `tools/local_p0/web/i18n.js`

## Group B — existing governance/localization documentation (13 files)

Proposed separate message: `docs(p0): update governance and localization evidence`

These paths were already modified/untracked at preflight and are preserved. Their inclusion
needs separate scope approval; they were not silently folded into the implementation group.

- `docs/CONTEXT_HANDOFF.md`
- `docs/CURRENT_STATUS.md`
- `docs/DECISIONS.md`
- `docs/PROJECT_CHECKLIST.md`
- `docs/REQUIREMENTS_TRACEABILITY.md`
- `docs/evidence/L10N-JA-VI/RESULTS.md`
- `docs/evidence/L10N-JA-VI/l10n-admin-ja.png`
- `docs/evidence/L10N-JA-VI/l10n-admin-vi.png`
- `docs/evidence/L10N-JA-VI/l10n-browser.json`
- `docs/evidence/L10N-JA-VI/l10n-customer-ja-review.png`
- `docs/evidence/L10N-JA-VI/l10n-customer-vi-complete.png`
- `docs/evidence/L10N-JA-VI/l10n-customer-vi-fallback.png`
- `docs/evidence/L10N-JA-VI/l10n-customer-vi-required.png`

## Gates before any future commit

Final `pnpm verify` PASS: 638 TS, 798 Python; 15 declared expected failures and one intentional
optional Gitleaks skip. Accepted detect-secrets 1.5.0/all 27 detectors: working/index 0 unresolved;
27 public artifact/Admin/Preview files, 36 classified findings, 0 unresolved. Browser evidence,
metrics and exact limitations are in RESULTS.md. T12/canonical container K13 remain pending.

No stage/commit is authorized by the latest absolute Git mutation policy. This is a reviewable
proposal only. A future authorized staging step must compare this snapshot, scan the exact new
index (current index only covers the committed baseline), and run hooks without bypass.
