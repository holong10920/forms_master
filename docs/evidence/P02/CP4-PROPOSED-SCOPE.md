# Phạm vi đề xuất CP4 / chuẩn bị CP5

Scope CP4 được user APPROVE; CP5 vẫn tách riêng. CP3 baseline `090c537`.

CP4 hoàn thành: T9, T11, Volta fix; alternative T10 ACCEPTED cho S0 local synthetic P0. T12 chỉ có offline build specification; container image/build/test
`BLOCKED_BY_ENVIRONMENT`, không đưa vào kết luận DONE.

Đề xuất message cho phần đã thực hiện:
`chore(s0): CP4 boundaries, security and performance tooling`

## File CP4 (53)

- `.dependency-cruiser.cjs`
- `.gitignore`
- `.gitleaks.toml`
- `.prettierignore`
- `docker/builder/README.md`
- `docs/engineering/PERF_MEASUREMENT_METHOD.md`
- `docs/engineering/SECURITY_BOUNDARIES_P0.md`
- `docs/evidence/P02/CP4-PROPOSED-SCOPE.md`
- `docs/evidence/P02/S0-T10-gitleaks-skip.txt`
- `docs/evidence/P02/S0-T10-security.txt`
- `docs/evidence/P02/S0-T11-perf-method.txt`
- `docs/evidence/P02/S0-T12-builder-image.txt`
- `docs/evidence/P02/S0-T9-boundaries.txt`
- `eslint.config.js`
- `packages/contracts/package.json`
- `pnpm-lock.yaml`
- `pyproject.toml`
- `python/fb_store/tests/test_import_contracts.py`
- `tools/boundaries/fixtures/control/packages/contracts/scripts/named.ts`
- `tools/boundaries/fixtures/control/packages/contracts/src/helper.ts`
- `tools/boundaries/fixtures/control/packages/contracts/src/index.ts`
- `tools/boundaries/fixtures/control/packages/other/package.json`
- `tools/boundaries/fixtures/control/packages/other/src/index.ts`
- `tools/boundaries/fixtures/violations/packages/contracts/scripts/cross.ts`
- `tools/boundaries/fixtures/violations/packages/contracts/scripts/tool.ts`
- `tools/boundaries/fixtures/violations/packages/contracts/src/cycle-a.ts`
- `tools/boundaries/fixtures/violations/packages/contracts/src/cycle-b.ts`
- `tools/boundaries/fixtures/violations/packages/contracts/src/design.ts`
- `tools/boundaries/fixtures/violations/packages/contracts/src/node.ts`
- `tools/boundaries/fixtures/violations/packages/contracts/test/helper.ts`
- `tools/boundaries/fixtures/violations/packages/other/src/index.ts`
- `tools/boundaries/fixtures/violations/tools/util/index.ts`
- `tools/boundaries/package.json`
- `tools/boundaries/test/rules.test.ts`
- `tools/boundaries/tsconfig.json`
- `tools/lint-fixtures/package.json`
- `tools/perf/package.json`
- `tools/perf/src/cli.ts`
- `tools/perf/src/sizes.ts`
- `tools/perf/test/sizes.test.ts`
- `tools/perf/tsconfig.json`
- `tools/security/gitleaks.sh`
- `tools/security/package.json`
- `tools/security/src/scan.ts`
- `tools/security/src/secrets.ts`
- `tools/security/src/synthetic-data-check.ts`
- `tools/security/test/alternative-scan.test.ts`
- `tools/security/test/gitleaks.test.ts`
- `tools/security/test/no-network.test.ts`
- `tools/security/test/synthetic-data-check.test.ts`
- `tools/security/tsconfig.json`
- `tools/test-setup/no-network.ts`
- `vitest.config.ts`

## File dùng chung — cần tách hunk theo checkpoint

- `package.json`: CP4 = dependency-cruiser pin, boundaries/py:imports/secrets/secrets:gitleaks/
  synthetic:check scripts. CP5 = preflight và verify scripts; không tự gộp vào commit CP4.
- `pnpm-lock.yaml` nằm trong CP4: dependency-cruiser và dependencies/peer resolution của nó;
  các workspace tool mới không có dependency riêng, không làm phát sinh importer cho verify.

## File CP5 preliminary (8)

- `README.md`
- `docs/engineering/CONVENTIONS.md`
- `docs/evidence/P02/S0-CP45-local-verification.txt`
- `docs/evidence/P02/S0-T13-verify-clean-clone.txt`
- `tools/verify/package.json`
- `tools/verify/src/preflight.ts`
- `tools/verify/test/preflight.test.ts`
- `tools/verify/tsconfig.json`

Verification: workspace và clean clone CP3 + candidate overlay đều PASS pnpm verify;
518 TS pass / 15 expected fail / 1 optional Gitleaks skip; 674 Python pass.
S0/G2 chưa PASS. User đã duyệt scope CP4 và chấp nhận alternative security gate;
container evidence T12 vẫn thiếu. Không push/GitHub/AWS, không bypass hooks.
