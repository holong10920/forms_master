# S0 (P02) Engineering Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **Trạng thái:** **APPROVED WITH TARGETED ADJUSTMENTS** (user, 2026-10-25). Thực thi: **native sole-writer** (một Claude chính viết theo thứ tự phụ thuộc) + **independent checkpoint review** bắt buộc sau CP2, CP3, CP5 (reviewer chỉ đọc snapshot/diff cố định, chạy verification, báo finding; MAJOR thật phải sửa trước khi làm phần phụ thuộc). G1 APPROVED cho local synthetic P0 (ADR-078); G9 BLOCKED; G10 BLOCKED.
>
> **Scope control (user):** S0 chỉ là engineering foundation. Không Workflow Engine, không evaluator nghiệp vụ Python đầy đủ, không Compiler K0–K14, không Admin UI, không publishing state machine, không customer runtime, không tích hợp thật. Fixture semantic nào cần engine chưa thuộc S0 → chuyển sang S1, không viết business logic tạm. SQLite chỉ cung cấp primitive; transaction flow chi tiết làm ở slice tương ứng.

**Goal:** Dựng nền móng kỹ thuật tối thiểu để S1/S2 viết code ngay: monorepo pnpm + uv, TypeScript strict, Python tooling, contract dùng chung (JSON Schema canonical + JCS/SHA-256) có parity TS/Python, SQLite local foundation, release/blob store write-once trên filesystem, kiểm package boundary, kiểm bảo mật cơ bản, và phương pháp đo hiệu năng (VG-21).

**Architecture:** Một repo, hai hệ sinh thái. `pnpm` workspace cho TS (`packages/*`, `tools/*`); `uv` workspace cho Python (`python/*`). Nguồn sự thật của schema và fixture nằm ở thư mục trung lập `contracts/` (ADR-019): TS sinh type và module schema từ đó, Python đọc trực tiếp. Persistence chỉ dựng primitive (kết nối, transaction, migration, giới hạn kích thước, write-once FS), **không** dựng repository nghiệp vụ hay database framework (spec #5 §11.1, ADR-055).

**Tech Stack (đã duyệt D1–D9, xem cuối file):** Node.js 24.22.1 LTS, pnpm 12.15.0, TypeScript 6.0.3, ESLint 10.13.0 + typescript-eslint 8.72.0, Prettier 3.9.10, Vitest 5.0.5, Ajv 8.20.0, json-schema-to-typescript 16.0.0, canonicalize 5.1.0, dependency-cruiser 18.7.0; Python 3.13 (Homebrew 3.13.15), uv ≥ 0.13.5, jsonschema 4.26.0, rfc8785 0.1.4, pytest 9.1.1, pytest-socket 0.8.1, ruff 0.17.2, mypy 2.4.0, import-linter 2.15; gitleaks v8.30.1 (Docker image); SQLite 3.53.4 (stdlib của Python 3.13.15).

**Spec:** ADR-078 (phạm vi S0) và các spec baseline tại `6312f2b`:
- `docs/superpowers/specs/2026-10-23-form-schema-workflow-design.md` §4 (module), §7.7 (quản lý schema)
- `docs/superpowers/specs/2026-10-24-plugin-contracts-capability-registry-design.md` §11 (facet boundary, L1–L6)
- `docs/superpowers/specs/2026-10-24-compiler-bundle-release-design.md` §12.1 (môi trường chuẩn), §17 (measurement contract)
- `docs/superpowers/specs/2026-10-24-api-persistence-publishing-design.md` §3, §5.1–§5.4 (persistence, `PayloadRef`, giới hạn), §11 (port, contract test)
- `docs/DECISIONS.md` ADR-005, ADR-017, ADR-019, ADR-044, ADR-045, ADR-055, ADR-078; `docs/REQUIREMENTS_TRACEABILITY.md` VG-04, VG-05, VG-21

## Global Constraints

- Chỉ dữ liệu synthetic. Không PII, không gọi API công ty, không endpoint center/shop thật (CLAUDE.md, ADR-078).
- Không AWS (G10 BLOCKED). Không `git push`, không tạo PR, không đổi remote (G9 BLOCKED).
- Commit theo **5 checkpoint**: CP1 = T1–T3, CP2 = T4–T6, CP3 = T7–T8, CP4 = T9–T12, CP5 = T13. Mỗi commit tuân thủ hook và chính sách duyệt hiện hành (duyệt plan **không** là blanket approval cho commit). Làm trên branch local `p02-s0-foundation` tạo từ `p00-discovery` tại commit của plan này, không phải `main` (ADR-007). Không bypass hook (`--no-verify` bị cấm). Không trộn code S1/S2.
- Cài đặt toolchain giữ ở phạm vi project/local khi có thể: không đổi Node mặc định toàn cục, không đổi Python hệ thống, không cài Docker Desktop hay đổi thiết lập hệ thống.
- Không copy code từ branch `spike/compiler-feasibility`; chỉ đọc để tham khảo. Thư mục `spikes/` (rác build) không được stage.
- Không implement Workflow Engine (S1), Compiler K0–K14 (S2), Admin UI, API HTTP, repository nghiệp vụ.
- Version pin chính xác như "Tech Stack". Lockfile commit: `pnpm-lock.yaml`, `uv.lock`. Cài đặt luôn `--frozen-lockfile` / `--locked` sau Task 1.
- Không `eval`, `new Function`, `exec` (SEC-02). Test không truy cập mạng.
- JSON Schema: Draft 2020-12; chỉ keyword trong allowlist của spec #1 §7.7: `type`, `properties`, `required`, `additionalProperties`, `items`, `enum`, `const`, `minItems`, `maxItems`, `minLength`, `maxLength`, `minimum`, `maximum`, `$ref`, `$defs`, `oneOf`; annotation cho phép: `$schema`, `$id`, `title`, `description`, `$comment`. **Cấm `pattern` và `format`** (S0 chặt hơn spec: spec cho `format` làm annotation; S0 cấm hẳn, mở lại khi có nhu cầu).
- Giới hạn DynamoDB áp cả ở SQLite: item ≤ 400 KB (409 600 byte), transaction ≤ 100 action và ≤ 4 MB (4 194 304 byte) (spec #5 §3).
- Evidence: `docs/evidence/P02/S0-T<n>-<slug>.txt`, gồm lệnh + output thật; thay `$HOME` bằng `~`; không chứa chi tiết nội bộ công ty. Chỉ đánh `[x]` khi đã chạy thật. Fail/skip báo đúng (TEST-11).
- Docs tiếng Việt; code/identifier tiếng Anh.
- ADR-013/014 (PROPOSED) **không** được S0 dùng hay chốt.

## Review Focus

1. **JCS khác nhau giữa TS và Python ở input biên**: thứ tự key theo UTF-16 (emoji vs U+E000), `-0`, `1e-7`, `5e-324`, số vượt ±(2^53−1), lone surrogate trong key/value. Kỳ vọng: cùng byte hoặc cùng lỗi `E-JCS-UNSUPPORTED-VALUE`. → test ở Task 4.
2. **Hai writer ghi cùng key write-once đồng thời** (cùng hoặc khác nội dung) và file tạm còn sót sau crash. Kỳ vọng: đúng một nội dung tồn tại, writer cùng nội dung đều thành công, khác nội dung → `E-PAYLOAD-INTEGRITY`, không file ghi dở. → Task 7.
3. **Key độc hại vào release store**: `..`, đường dẫn tuyệt đối, `\`, segment bắt đầu bằng `.`, thư mục symlink trong root. Kỳ vọng: `E-STORE-KEY-INVALID`, không ghi/đọc ngoài root. → Task 7.
4. **SQLite tranh chấp ghi và lỗi giữa transaction**: `BEGIN IMMEDIATE` khi connection khác đang ghi → `Conflict` ngay (không treo); exception giữa chừng → không còn ghi một phần. → Task 8.
5. **Lệch vị trí lỗi schema giữa Ajv và python-jsonschema**: nhiều `required` thiếu, `additionalProperties`, root sai kiểu, nhiều lỗi cùng lúc; mã hóa JSON Pointer có `~`/`/`. Kỳ vọng: cùng tập `{instancePath, keyword}` sau chuẩn hóa. → Task 5.

---

## Cấu trúc file (khóa ở plan này)

```
package.json                     # root, private; scripts quy ước (Task 2, 13)
pnpm-workspace.yaml              # packages/*, tools/*
pnpm-lock.yaml
tsconfig.base.json
eslint.config.js
prettier.config.js / .prettierignore
vitest.config.ts
pyproject.toml                   # uv workspace root + ruff/mypy/pytest/import-linter config
uv.lock
.python-version                  # 3.13
.node-version                    # 24.22.1
.dependency-cruiser.cjs
.gitleaks.toml
contracts/                       # nguồn sự thật trung lập ngôn ngữ (ADR-019)
  schemas/payload-ref/v1.schema.json
  fixtures/jcs/cases.json
  fixtures/digest/sha256-hex.json
  fixtures/schema/payload-ref/v1/{valid,invalid}/*.json
  fixtures/semantic/payload-ref.json
  vendor/json-schema-test-suite/  # subset, commit pin, LICENSE, SKIPS.json
packages/contracts/              # @fb/contracts (browser-safe, không node:*)
  src/{index,jcs,digest,schema,payload-ref}.ts
  src/generated/{payload-ref.v1,schemas}.ts   # sinh tự động, commit
  scripts/{gen,lint-schemas}.ts
  test/*.test.ts
tools/boundaries/                # @fb/boundaries-tests: negative fixture cho dependency-cruiser
tools/security/                  # synthetic-data check, gitleaks wrapper
tools/perf/                      # @fb/perf-tools: đo byte raw/gzip/Brotli
tools/test-setup/no-network.ts
python/fb_contracts/             # pyproject + src/fb_contracts/{jcs,digest,schema,payload_ref}.py + tests/
python/fb_store/                 # pyproject + src/fb_store/{errors,clock,fsstore,sqlite,migrations,layout,__main__}.py + migrations/ + tests/
docker/builder/Dockerfile        # canonical builder image (Node 24, pin digest)
docs/engineering/{CONVENTIONS,SECURITY_BOUNDARIES_P0,PERF_MEASUREMENT_METHOD}.md
docs/evidence/P02/
```

Thứ tự và phụ thuộc:

```
T1 Toolchain ─┬─> T2 TS baseline ─┬─> T4 JCS/digest ─> T5 Schema pipeline ─> T6 JSTS subset
              │                   │        │                   │
              └─> T3 Py baseline ─┘        └─> T7 FS store <───┘ (PayloadRef)
                         └──────────────> T8 SQLite
T2 ─> T9 Boundaries (sau T5 để có graph thật) · T2+T3 ─> T10 Security · T2 ─> T11 Perf method
T1+T2 ─> T12 Builder image · tất cả ─> T13 verify + docs + governance
```

---

### Task 1: Toolchain provisioning và đánh giá (VG-04, VG-05 phần local)

**Mục tiêu:** Cài và pin Node 24.22.1, pnpm 12.15.0, uv, Python 3.13; chứng minh bằng evidence các điểm VG-04 và phần local của VG-05; ghi ADR toolchain.

**Dependencies:** D1–D5 đã duyệt (D2 modified: Corepack).

**Files:**
- Create: `package.json`, `pnpm-workspace.yaml`, `.node-version`, `.python-version`, `pyproject.toml` (chỉ phần `[tool.uv.workspace]`, `requires-python`), `docs/evidence/P02/S0-T1-toolchain.txt`, `docs/evidence/P02/toolchain/pnpm-peer-fixture/` (fixture nhỏ, chỉ `package.json`)
- Modify: `.gitignore` (thêm thư mục sinh ra của spike: `spikes/*/gen/`, `spikes/*/out/` — **không** ignore cả `spikes/`, D8; cộng `var/`, `*.sqlite3`, `.pnpm-store/`, `.mypy_cache/`, `.ruff_cache/`, `.pytest_cache/`), `docs/DECISIONS.md` (ADR-079)

**Interfaces:**
- Produces: `package.json` có `"private": true`, `"packageManager": "pnpm@12.15.0"`, `"engines": {"node": ">=24.22.1 <25"}`, `"volta": {"node": "24.22.1"}` (chỉ pin Node theo project; pnpm do Corepack cấp, không dùng tính năng pnpm thử nghiệm của Volta); `pnpm-workspace.yaml` với `packages: ["packages/*", "tools/*"]`, engine-strict bật, lifecycle script của dependency bị chặn (allowlist rỗng). `pyproject.toml` root: `requires-python = ">=3.13,<3.14"`, `[tool.uv.workspace] members = ["python/*"]`, `[tool.uv] required-version = ">=0.13.5"`.

- [ ] **Step 1:** `git switch -c p02-s0-foundation` từ `p00-discovery` (HEAD phải là commit của plan này, cha `10f09f4`). Kiểm `git status` chỉ có `?? spikes/`.
- [ ] **Step 2:** Cài toolchain ở phạm vi project: `volta fetch node@24.22.1` + `volta.node` trong `package.json` (không `volta install`, nên Node mặc định của project khác không đổi); pnpm 12.15.0 qua **Corepack của Node 24** theo `packageManager` (kiểm `pnpm -v` = `12.15.0` trong repo). Corepack không chạy đúng với pnpm 12 → dùng bản pnpm độc lập pin `12.15.0` (ví dụ binary standalone trong thư mục project-local), ghi lý do vào ADR-079; không tự viết lớp tương thích. uv: `brew install uv` (Python 3.13 do uv quản lý hoặc Homebrew sẵn có; không đổi Python hệ thống). Ghi `node -v`, `pnpm -v`, `uv --version`, `uv python find 3.13` vào evidence.
- [ ] **Step 3:** Viết các file root ở trên. Chạy `pnpm install` (sinh `pnpm-lock.yaml` rỗng dependency) và `uv lock`.
- [ ] **Step 4 (negative engine-strict):** Chạy `pnpm install` dưới Node 20 (`volta run --node 20.20.2 pnpm install`). Expected: FAIL vì engine. Ghi output.
- [ ] **Step 5 (VG-04 fixture):** Tạo trong scratchpad một workspace 2 package: `app` phụ thuộc `react@19.3.1`, `react-dom@19.3.1`, `motion@14.6.0` và package workspace `lib` (peer `react@19.3.1`). Chép `package.json` vào `docs/evidence/P02/toolchain/pnpm-peer-fixture/`. Chạy:
  - `volta run --node 20.20.2 --npm 10.8.2 npm install` → ghi kết quả (tái hiện hay không lỗi arborist `edgesOut`; **không** coi là FAIL nếu không tái hiện — ghi đúng như quan sát).
  - `pnpm install` → Expected: exit 0.
  - `pnpm install --frozen-lockfile` → Expected: exit 0.
  - `pnpm why react --json` → Expected: đúng một version `19.3.1`.
- [ ] **Step 6:** Ghi ADR-079 vào `docs/DECISIONS.md` (bảng chỉ mục + mục chi tiết): version đã pin, cách cấp pnpm (Corepack hay standalone, kèm kết quả evaluation), evidence path, VG-04 = PASS/FAIL theo kết quả, VG-05 = PARTIAL (A/B tái lập và isolation chạy ở S2 khi có compiler). Trạng thái **APPROVED** (D1–D5 đã duyệt 2026-10-25); nếu evaluation trái kỳ vọng thì ghi PROPOSED và **dừng, báo user**.
- [ ] **Step 7:** Không commit riêng; gộp vào **CP1** (sau T3).

**Acceptance criteria:** `node -v` = `v24.22.1`, `pnpm -v` = `12.15.0` trong repo; install với Node 20 bị từ chối; pnpm cài fixture thành công, frozen lockfile pass, một bản React; `uv run python -V` = `Python 3.13.x`.
**Verification commands:** `node -v && pnpm -v && uv run python -V && pnpm install --frozen-lockfile && uv sync --locked`
**Expected evidence:** `docs/evidence/P02/S0-T1-toolchain.txt`, fixture `package.json`.
**DoD:** commit có lockfile hai phía; ADR-079 ghi; VG-04 cập nhật theo kết quả thật.

---

### Task 2: TypeScript strict baseline + package `@fb/contracts` rỗng

**Mục tiêu:** Có `pnpm typecheck|lint|test|format:check` chạy thật trên một package, với cấu hình strict được chứng minh bằng negative test.

**Dependencies:** Task 1.

**Files:**
- Create: `tsconfig.base.json`, `eslint.config.js`, `prettier.config.js`, `.prettierignore`, `vitest.config.ts`, `packages/contracts/{package.json,tsconfig.json,src/index.ts,test/smoke.test.ts}`, `tools/lint-fixtures/eval-usage.ts`, `tools/lint-fixtures/README.md`, `tools/lint-fixtures/lint-fixtures.test.ts`
- Modify: root `package.json` (scripts, devDependencies)

**Interfaces:**
- Produces: `tsconfig.base.json` với `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`, `noImplicitOverride: true`, `noFallthroughCasesInSwitch: true`, `verbatimModuleSyntax: true`, `erasableSyntaxOnly: true` (để `node file.ts` chạy script bằng type stripping, không cần `tsx`), `allowImportingTsExtensions: true` + `noEmit: true` (import tương đối ghi đuôi `.ts`, vì Node không đổi `.js` → `.ts`), `module`/`moduleResolution`: `nodenext`, `target: es2024`, `lib: ["es2024", "dom"]`, `skipLibCheck: false`. Package `@fb/contracts`: `"type": "module"`, `exports: {".": "./src/index.ts"}` (P0 tiêu thụ source trong workspace; build `dist/` để S2 quyết), script `typecheck: "tsc -p tsconfig.json --noEmit"`.
- Root scripts: `lint` = `eslint . --max-warnings=0`; `format:check` = `prettier --check .`; `typecheck` = `pnpm -r --if-present typecheck`; `test` = `vitest run`.
- ESLint: flat config, `typescript-eslint` `strictTypeChecked`, cộng `no-eval`, `no-new-func`, `no-implied-eval` = error. Ignore: `spikes/**`, `docs/**`, `**/generated/**` (chỉ cho rule style), `tools/lint-fixtures/eval-usage.ts`, `contracts/vendor/**`, `var/**`.
- `.prettierignore`: `docs/`, `spikes/`, `contracts/vendor/`, `pnpm-lock.yaml`, `var/`, `MASTER_PROMPT_*`.

- [ ] **Step 1:** Viết test `packages/contracts/test/smoke.test.ts`: `expect(CONTRACTS_PACKAGE).toBe("@fb/contracts")` với `export const CONTRACTS_PACKAGE = "@fb/contracts"` chưa tồn tại. Chạy `pnpm test` → FAIL (import không có).
- [ ] **Step 2:** Thêm export vào `src/index.ts`. `pnpm test` → PASS.
- [ ] **Step 3:** Negative strict: `tools/lint-fixtures/lint-fixtures.test.ts` dùng ESLint Node API lint `eval-usage.ts` (chứa `eval("1")` và `new Function("return 1")`) với `ignore: false`; assert ruleId gồm `no-eval` và `no-new-func`. Thêm test thứ hai: chạy `tsc --noEmit` trên một chuỗi nguồn tạm (scratch dir, tsconfig kế thừa base) có `const xs: number[] = []; const n: number = xs[0];` → assert exit code ≠ 0 và output chứa `TS2322` (bằng chứng `noUncheckedIndexedAccess`).
- [ ] **Step 4:** Chạy `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test` → tất cả PASS. Ghi evidence.
- [ ] **Step 5:** Gộp vào **CP1**.

**Acceptance criteria:** bốn lệnh pass; negative test chứng minh `no-eval`, `no-new-func` và `noUncheckedIndexedAccess` có hiệu lực; `spikes/` không bị quét.
**Verification commands:** `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test`
**Expected evidence:** `docs/evidence/P02/S0-T2-ts-baseline.txt`.
**DoD:** commit; không warning ESLint.

---

### Task 3: Python baseline (uv workspace, ruff, mypy strict, pytest không mạng)

**Mục tiêu:** Hai package Python rỗng có lint/typecheck/test thật; test không thể mở socket mạng.

**Dependencies:** Task 1.

**Files:**
- Create: `python/fb_contracts/{pyproject.toml,src/fb_contracts/__init__.py,src/fb_contracts/py.typed,tests/test_smoke.py}`, `python/fb_store/{pyproject.toml,src/fb_store/__init__.py,src/fb_store/py.typed,tests/test_smoke.py,tests/test_network_blocked.py}`
- Modify: root `pyproject.toml` (dependency group `dev`, `[tool.ruff]`, `[tool.mypy]`, `[tool.pytest.ini_options]`), root `package.json` (scripts `py:*`)

**Interfaces:**
- Produces: package `fb_contracts` (deps: `jsonschema==4.26.0`, `rfc8785==0.1.4`), package `fb_store` (deps: `fb_contracts` workspace). Dev group: `pytest==9.1.1`, `pytest-socket==0.8.1`, `ruff==0.17.2`, `mypy==2.4.0`, `types-jsonschema==4.26.0.20261006`, `import-linter==2.15`. Build backend: `hatchling`, layout `src/`.
- Ruff: `target-version = "py313"`, `select = ["E","F","W","I","B","UP","S","SIM","RUF"]`, per-file-ignore `S101` cho `**/tests/**`. Mypy: `strict = true`, `files = ["python"]`. Pytest: `addopts = "--disable-socket --allow-unix-socket -q"`, `testpaths = ["python"]`, `--import-mode=importlib`.
- Root scripts: `py:lint` = `uv run ruff check python && uv run ruff format --check python`; `py:typecheck` = `uv run mypy`; `py:test` = `uv run pytest`.

- [ ] **Step 1:** Viết `tests/test_network_blocked.py`:
  ```python
  import socket
  import pytest
  from pytest_socket import SocketBlockedError

  def test_outbound_socket_is_blocked() -> None:
      with pytest.raises(SocketBlockedError):
          socket.create_connection(("127.0.0.1", 9))
  ```
  và smoke test `assert fb_store.__name__ == "fb_store"`, `assert fb_contracts.__name__ == "fb_contracts"`. Chạy `uv run pytest` trước khi cấu hình `addopts` → test mạng FAIL.
- [ ] **Step 2:** Thêm cấu hình pytest; `uv run pytest` → PASS.
- [ ] **Step 3:** `pnpm py:lint && pnpm py:typecheck && pnpm py:test` → PASS. `uv lock` cập nhật; `uv sync --locked` pass.
- [ ] **Step 4: CP1** — báo cáo checkpoint (tasks, files, kết quả lint/typecheck/test, lỗi, quyết định cần user), kiểm staged diff + secret scan, xin duyệt và commit `chore(s0): CP1 toolchain, TS strict and Python baselines`.

**Acceptance criteria:** ba lệnh pass; test chứng minh socket bị chặn; `uv.lock` commit.
**Verification commands:** `uv sync --locked && pnpm py:lint && pnpm py:typecheck && pnpm py:test`
**Expected evidence:** `docs/evidence/P02/S0-T3-py-baseline.txt`.
**DoD:** commit; mypy strict không lỗi, không `type: ignore`.

---

### Task 4: JCS + SHA-256 parity TS/Python

**Mục tiêu:** Một hàm canonical JSON (RFC 8785) và digest cho cả hai ngôn ngữ, cho cùng byte trên cùng fixture; định nghĩa tập giá trị bị từ chối.

**Dependencies:** Task 2, Task 3.

**Files:**
- Create: `contracts/fixtures/jcs/cases.json`, `contracts/fixtures/digest/sha256-hex.json`, `packages/contracts/src/{jcs,digest}.ts`, `packages/contracts/test/{jcs,digest}.test.ts`, `python/fb_contracts/src/fb_contracts/{jcs,digest}.py`, `python/fb_contracts/tests/{test_jcs,test_digest}.py`
- Modify: `packages/contracts/src/index.ts`, `packages/contracts/package.json` (dep `canonicalize@5.1.0`)

**Interfaces:**
- Produces (TS): `canonicalJson(value: unknown): string`; `canonicalJsonBytes(value: unknown): Uint8Array`; `class JcsError extends Error { readonly code: "E-JCS-UNSUPPORTED-VALUE" }`; `sha256Hex(data: Uint8Array): Promise<string>` (WebCrypto `globalThis.crypto.subtle`, không `node:crypto` để giữ browser-safe); `jcsSha256Hex(value: unknown): Promise<string>`; `isSha256Hex(s: string): boolean`.
- Produces (Python): `canonical_json(value: object) -> bytes`; `class JcsError(ValueError)` có `code = "E-JCS-UNSUPPORTED-VALUE"`; `sha256_hex(data: bytes) -> str`; `jcs_sha256_hex(value: object) -> str`; `is_sha256_hex(s: str) -> bool`.
- Luật từ chối (cả hai, kiểm trước khi serialize): số không hữu hạn; số có `|v| > 9007199254740991`; chuỗi hoặc key chứa lone surrogate; (TS) `undefined`, function, symbol, bigint, object không phải plain object/array; (Python) kiểu ngoài `dict[str, …]`, `list`, `str`, `int`, `float`, `bool`, `None`. `bool` Python không được coi là số.
- `isSha256Hex`: đúng 64 ký tự `[0-9a-f]`, toàn chuỗi (Python dùng `re.fullmatch`, không `$`).

- [ ] **Step 1: Viết fixture** `contracts/fixtures/jcs/cases.json` dạng `{"cases": [{"name", "input": "<JSON text>", "canonical": "<string>"} | {"name", "input", "error": "E-JCS-UNSUPPORTED-VALUE"}]}`. `input` là **chuỗi JSON text** để mỗi ngôn ngữ tự parse bằng parser chuẩn của nó. Các case bắt buộc (giá trị viết dưới dạng JSON escape trong file):

  | name | input (JSON text) | kỳ vọng |
  |---|---|---|
  | key-order-utf16 | `{"":1,"😀":2,"a":3}` | `{"a":3,"😀":2,"<U+E000>":1}` (U+E000 ghi literal, không escape; emoji đứng trước vì 0xD83D < 0xE000 theo UTF-16, dù code point lớn hơn) |
  | numbers | `[-0,-0.0,1.0,1E2,1e-7,0.000001,5e-324,9007199254740991,-9007199254740991]` | `[0,0,1,100,1e-7,0.000001,5e-324,9007199254740991,-9007199254740991]` |
  | nested-empty | `{"b":[],"a":{}}` | `{"a":{},"b":[]}` |
  | string-escapes | `{"s":"\u0008\t\n\u000c\r\u0001\u001f\"\\/\u007f"}` | `{"s":"\b\t\n\f\r\u0001\u001f\"\\/` + U+007F literal + `"}` |
  | unsafe-int | `9007199254740992` | error |
  | unsafe-float | `1e21` | error |
  | lone-surrogate-value | `"\ud800"` | error |
  | lone-surrogate-key | `{"\udc00":1}` | error |

  `contracts/fixtures/digest/sha256-hex.json`: `{"jcsDigests": [{"input": "{\"b\":[],\"a\":{}}", "sha256": "aeeba1e56a144077f89e26c930dad7cf933e9383cfb8e33ddff618233b29be76"}], "rawDigests": [{"utf8": "", "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"}], "isSha256Hex": [{"s": "<64 ký tự 'a'>", "ok": true}, {"s": "<64 ký tự 'A'>", "ok": false}, {"s": "<63 ký tự 'a'>", "ok": false}, {"s": "<64 ký tự 'a'>\n", "ok": false}, {"s": "<64 ký tự 'g'>", "ok": false}]}` (viết đủ ký tự trong file thật).
- [ ] **Step 2: Viết test hai phía** đọc chung fixture: với mỗi case, parse `input`, so `canonicalJson` với `canonical` hoặc assert ném `JcsError` có `code === "E-JCS-UNSUPPORTED-VALUE"`; digest: `jcsSha256Hex(JSON.parse(input)) === sha256`; `isSha256Hex` theo bảng. Python tương tự với `json.loads`. Chạy `pnpm test` và `pnpm py:test` → FAIL (chưa có module).
- [ ] **Step 3: Implement TS** — đi cây giá trị để áp luật từ chối rồi gọi `canonicalize`. **Implement Python** — đi cây tương tự rồi gọi `rfc8785.dumps`.
- [ ] **Step 4:** `pnpm test && pnpm py:test` → PASS. Nếu một case chỉ fail ở một ngôn ngữ: **dừng**, ghi output vào evidence, báo user (không sửa fixture cho khớp implementation).
- [ ] **Step 5:** Gộp vào **CP2**.

**Acceptance criteria:** mọi case cho cùng kết quả ở hai ngôn ngữ; fixture là nguồn kỳ vọng duy nhất.
**Verification commands:** `pnpm vitest run packages/contracts/test/jcs.test.ts packages/contracts/test/digest.test.ts && uv run pytest python/fb_contracts/tests/test_jcs.py python/fb_contracts/tests/test_digest.py -v`
**Expected evidence:** `docs/evidence/P02/S0-T4-jcs-parity.txt` (số case pass mỗi ngôn ngữ).
**DoD:** commit; không case nào bị skip.

---

### Task 5: Schema pipeline (allowlist lint, codegen TS, drift check, validator parity)

**Mục tiêu:** Dựng trọn quy trình ADR-019 trên schema thí điểm `payload-ref/v1` (spec #5 §5.3, không phụ thuộc ADR-013/014): một file schema canonical → type TS sinh tự động → Ajv và python-jsonschema cho cùng `{valid, errors[instancePath, keyword]}`; cộng lớp semantic của `PayloadRef`.

**Dependencies:** Task 4.

**Files:**
- Create: `contracts/schemas/payload-ref/v1.schema.json`, `contracts/fixtures/schema/payload-ref/v1/valid/*.json`, `contracts/fixtures/schema/payload-ref/v1/invalid/*.json`, `contracts/fixtures/semantic/payload-ref.json`, `packages/contracts/scripts/{gen,lint-schemas}.ts`, `packages/contracts/src/generated/{payload-ref.v1,schemas}.ts`, `packages/contracts/src/{schema,payload-ref}.ts`, `packages/contracts/test/{schema-lint,schema-parity,payload-ref}.test.ts`, `python/fb_contracts/src/fb_contracts/{schema,payload_ref}.py`, `python/fb_contracts/tests/{test_schema_parity,test_payload_ref,test_json_pointer}.py`
- Modify: `packages/contracts/package.json` (deps `ajv@8.20.0`; devDeps `json-schema-to-typescript@16.0.0`; scripts `gen`, `gen:check`, `lint:schemas`), root `package.json` (`gen`, `gen:check`, `schemas:lint`)

**Interfaces:**
- Schema `contracts/schemas/payload-ref/v1.schema.json`:
  ```json
  {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "https://schemas.forms-poc.invalid/payload-ref/v1.schema.json",
    "title": "PayloadRef v1",
    "type": "object",
    "properties": {
      "inline": {},
      "blobKey": { "type": "string", "minLength": 71, "maxLength": 71 },
      "sha256": { "type": "string", "minLength": 64, "maxLength": 64 },
      "size": { "type": "integer", "minimum": 0 },
      "format": { "const": "jcs-json" }
    },
    "required": ["sha256", "size", "format"],
    "additionalProperties": false
  }
  ```
- TS: `type SchemaId = "payload-ref/v1"`; `interface SchemaError { instancePath: string; keyword: string }`; `interface SchemaResult { valid: boolean; errors: SchemaError[] }`; `validateSchema(id: SchemaId, instance: unknown): SchemaResult`; `type PayloadRefV1` (sinh); `interface SemanticError { code: string; path: string }`; `checkPayloadRef(ref: PayloadRefV1): SemanticError[]`.
- Python: `SchemaError(NamedTuple): instance_path: str; keyword: str`; `SchemaResult(NamedTuple): valid: bool; errors: list[SchemaError]`; `validate_schema(schema_id: str, instance: object) -> SchemaResult`; `json_pointer(path: Iterable[str | int]) -> str`; `SemanticError(NamedTuple): code: str; path: str`; `check_payload_ref(ref: Mapping[str, object]) -> list[SemanticError]`; `CONTRACTS_DIR: Path` (tính từ `__file__` tới `<repo>/contracts`; đóng gói cho triển khai là việc sau G10).
- Cấu hình validator: Ajv `Ajv2020({ strict: true, allErrors: true, validateFormats: false })`; Python `Draft202012Validator(schema)` không `format_checker`, dùng `iter_errors`.
- **Chuẩn hóa lỗi (thuật toán khóa ở plan):** TS lấy `{instancePath, keyword}` của mọi lỗi Ajv, **bỏ** lỗi có `schemaPath` chứa `/oneOf/<số>/` (chỉ giữ lỗi `oneOf` cha). Python lấy lỗi cấp cao nhất của `iter_errors` (không đi vào `error.context`), `instance_path = json_pointer(error.absolute_path)`, `keyword = error.validator`. Hai phía: khử trùng, sắp theo `(instancePath, keyword)` tăng dần. `json_pointer`: `""` cho root; mỗi segment `str()`, thay `~`→`~0` rồi `/`→`~1`, nối bằng `/` có `/` đầu.
- Semantic `checkPayloadRef` (thứ tự kiểm cố định, trả mọi lỗi): đúng một trong `inline`/`blobKey` có mặt, sai → `{code: "E-PAYLOADREF-STORAGE", path: ""}`; `sha256` không qua `isSha256Hex` → `{code: "E-DIGEST-FORMAT", path: "/sha256"}`; có `blobKey` và `blobKey !== "sha256/" + sha256` → `{code: "E-PAYLOADREF-BLOBKEY", path: "/blobKey"}`. Ba mã này là mã nội bộ S0, ghi vào `docs/engineering/CONVENTIONS.md` (Task 13).
- `scripts/lint-schemas.ts`: duyệt mọi `contracts/schemas/**/*.schema.json`. Thăm schema object: với `properties`/`$defs` → thăm từng giá trị; `items`, `additionalProperties` (khi là object) → thăm; `oneOf` → thăm từng phần tử; bỏ qua nội dung của `enum`, `const`, `required`, `type`. Key không thuộc allowlist ∪ annotation → lỗi `{file, pointer, keyword}`, exit 1. Kiểm thêm: `$schema` đúng 2020-12; `$id` kết thúc bằng `/<name>/v<N>.schema.json` khớp đường dẫn file.
- `scripts/gen.ts [--check]`: với mỗi schema, sinh `src/generated/<name>.v<N>.ts` (json-schema-to-typescript, banner "GENERATED — do not edit") và `src/generated/schemas.ts` (`export const schemas = { "payload-ref/v1": <schema> } as const`). Output qua Prettier để tất định. `--check`: sinh trong bộ nhớ, so với file trên đĩa, khác → in danh sách file, exit 1.

- [ ] **Step 1: Fixture schema** — mỗi file `{"description": string, "instance": any, "expected": {"valid": bool, "errors": SchemaError[]}}`. Đặt `H` = chuỗi 64 ký tự `a`:
  - valid: `inline-object` `{"inline":{"k":1},"sha256":H,"size":7,"format":"jcs-json"}`; `blob` `{"blobKey":"sha256/"+H,"sha256":H,"size":0,"format":"jcs-json"}`.
  - invalid: `missing-required` `{"format":"jcs-json"}` → `[{"instancePath":"","keyword":"required"}]`; `additional-property` (blob + `"extra":1`) → `[{"","additionalProperties"}]`; `size-wrong-type` (`"size":"12"`) → `[{"/size","type"}]`; `size-negative` → `[{"/size","minimum"}]`; `format-wrong` (`"format":"json"`) → `[{"/format","const"}]`; `two-errors` (`size:-1`, `format:"x"`) → `[{"/format","const"},{"/size","minimum"}]`; `root-array` `[]` → `[{"","type"}]`.
  - `contracts/fixtures/semantic/payload-ref.json`: case không có cả hai → `E-PAYLOADREF-STORAGE`; có cả hai → `E-PAYLOADREF-STORAGE`; `sha256` = 64 ký tự `A` → `E-DIGEST-FORMAT`; `blobKey` = `"sha256/"+"b"*64` với `sha256` = H → `E-PAYLOADREF-BLOBKEY`; hai case hợp lệ → `[]`.
- [ ] **Step 2: Test lint** (`schema-lint.test.ts`): schema tạm có `pattern` → lỗi keyword `pattern`; có `format` → lỗi; `properties: {"pattern": {"type":"string"}}` (tên thuộc tính là `pattern`) → **không** lỗi; schema thật → 0 lỗi.
- [ ] **Step 3: Test parity** hai phía chạy mọi file trong `valid/`, `invalid/`, assert kết quả chuẩn hóa `===` `expected`. Python thêm `test_json_pointer`: `json_pointer(["a/b", "m~n", 0]) == "/a~1b/m~0n/0"`, `json_pointer([]) == ""`. Test semantic hai phía. Chạy → FAIL.
- [ ] **Step 4:** Implement `lint-schemas.ts`, `gen.ts`; chạy `pnpm gen`; implement `schema.ts`/`schema.py`, `payload-ref.ts`/`payload_ref.py`.
- [ ] **Step 5:** `pnpm schemas:lint && pnpm gen:check && pnpm test && pnpm py:test && pnpm typecheck && pnpm py:typecheck` → PASS. Drift negative: sửa tay một dòng trong `src/generated/payload-ref.v1.ts`, `pnpm gen:check` → exit 1; hoàn tác. Ghi cả hai vào evidence.
- [ ] **Step 6:** Gộp vào **CP2**.

**Acceptance criteria:** một schema canonical duy nhất; type TS sinh tự động, drift check bắt sửa tay; Ajv và python-jsonschema cho cùng kết quả chuẩn hóa trên 9 fixture; lint bắt `pattern`/`format`.
**Verification commands:** như Step 5.
**Expected evidence:** `docs/evidence/P02/S0-T5-schema-pipeline.txt`.
**DoD:** commit; nếu một fixture lệch giữa hai validator: **dừng** và báo (đổi quy tắc chuẩn hóa là quyết định của user vì spec #1 §7.7 yêu cầu cùng JSON Pointer + keyword).

---

### Task 6: JSON-Schema-Test-Suite subset trên hai validator

**Mục tiêu:** Bằng chứng ADR-019: validator FE và BE pass phần test suite chính thức ứng với allowlist.

**Dependencies:** Task 5.

**Files:**
- Create: `contracts/vendor/json-schema-test-suite/{LICENSE,README.md,SKIPS.json,tests/draft2020-12/*.json}`, `packages/contracts/test/jsts.test.ts`, `python/fb_contracts/tests/test_jsts.py`

**Interfaces:**
- Vendor từ `json-schema-org/JSON-Schema-Test-Suite` commit `89e83a74014617ffbe79a56d83d14d054cd11417` (MIT), chỉ các file: `type, properties, required, additionalProperties, items, enum, const, minItems, maxItems, minLength, maxLength, minimum, maximum, ref, defs, oneOf` `.json`. README ghi commit + ngày tải + license.
- `SKIPS.json`: `[{"file", "group", "test" | null, "reason"}]`. Chỉ được skip khi case cần remote ref, metaschema validation, hoặc keyword ngoài allowlist. Hai runner dùng **cùng** `SKIPS.json`.
- Runner dùng cùng cấu hình validator như Task 5, **trừ** Ajv `strict: false` (strict mode chỉ kiểm schema lúc compile như `strictTypes`, không đổi kết quả validate; nhiều schema của suite cố ý không khai `type`). Mỗi test assert `valid === expected`. In tổng `pass/fail/skip`.

- [ ] **Step 1:** Tải file (đọc GitHub raw, không ghi GitHub) vào vendor; ghi README.
- [ ] **Step 2:** Viết hai runner; chạy với `SKIPS.json` rỗng; ghi các case fail kèm lý do vào evidence.
- [ ] **Step 3:** Thêm vào `SKIPS.json` chỉ những case đúng ba lý do hợp lệ. Case fail vì hành vi validator khác chuẩn → **không** skip; dừng và báo.
- [ ] **Step 4:** Chạy lại → 0 fail ở hai phía, số skip giống nhau. 
- [ ] **Step 5: CP2** — independent targeted review (JCS/schema/parity TS-Python) trên diff cố định; sửa MAJOR; báo cáo checkpoint; xin duyệt và commit `feat(contracts): CP2 JCS, schema pipeline and TS/Python parity`.

**Acceptance criteria:** 0 fail; danh sách skip có lý do, giống nhau hai phía.
**Verification commands:** `pnpm vitest run packages/contracts/test/jsts.test.ts && uv run pytest python/fb_contracts/tests/test_jsts.py -v`
**Expected evidence:** `docs/evidence/P02/S0-T6-jsts.txt` (pass/fail/skip mỗi ngôn ngữ, commit của suite).
**DoD:** commit; evidence ghi số thật.

---

### Task 7: Write-once filesystem store (blob + release)

**Mục tiêu:** Hiện thực local của port `BlobStore` và `ReleaseObjectStore` (spec #5 §5.3, §11.1): ghi một lần bằng file tạm + `link()`, đọc có kiểm hash, chống path traversal.

**Dependencies:** Task 3, Task 5 (`check_payload_ref`, `is_sha256_hex`).

**Files:**
- Create: `python/fb_store/src/fb_store/{errors,fsstore}.py`, `python/fb_store/tests/{test_fsstore_blob,test_fsstore_release,test_fsstore_keys,test_fsstore_concurrency}.py`

**Interfaces:**
- `errors.py`: `class StoreError(Exception)` với thuộc tính `code: str`; `Conflict(code="CONFLICT")`, `TransactionTooLarge("E-TRANSACTION-TOO-LARGE")`, `ItemTooLarge("E-ITEM-TOO-LARGE")`, `PayloadIntegrityError("E-PAYLOAD-INTEGRITY")`, `InvalidStoreKey("E-STORE-KEY-INVALID")`, `DigestMismatch("E-DIGEST-MISMATCH")`, `MigrationError("E-MIGRATION")`.
- `class PutResult(enum.Enum): CREATED; ALREADY_EXISTS`.
- `FsBlobStore(root: Path)`: `put_if_absent(sha256: str, data: bytes) -> PutResult` (key `sha256/<hex>`); `get_verified(ref: Mapping[str, object]) -> bytes` — ref qua `check_payload_ref` trước (lỗi → `PayloadIntegrityError`); `inline` → trả `canonical_json(inline)` sau khi so hash; `blobKey` → đọc file, so `sha256` và `size`.
- `FsReleaseObjectStore(root: Path)`: `put_write_once(key: str, data: bytes, sha256: str) -> PutResult`; `read(key: str) -> bytes`.
- Ngữ pháp key release: segment đầu ∈ {`staging`, `releases`}; segment ngăn bằng `/`; mỗi segment khớp `[A-Za-z0-9_-][A-Za-z0-9._-]*` (không bắt đầu bằng `.`); không segment rỗng; tổng ≤ 1024 ký tự. Sai → `InvalidStoreKey`.
- Thuật toán ghi (chung): `sha256_hex(data) != sha256` → `DigestMismatch`, không ghi. Tạo thư mục cha; kiểm không thành phần nào từ root tới file là symlink (`os.lstat`) và đường dẫn resolve vẫn nằm trong root, sai → `InvalidStoreKey`. Ghi `data` vào file tạm `.tmp-<uuid4>` cùng thư mục, `fsync`, `os.link(tmp, final)`; `FileExistsError` → đọc file đích, cùng hash → `ALREADY_EXISTS`, khác → `PayloadIntegrityError`; `finally` xóa file tạm; file đích `chmod 0o444`.

- [ ] **Step 1: Viết test** (dùng `tmp_path`):
  - blob: put rồi `get_verified` trả đúng byte; put lần hai cùng byte → `ALREADY_EXISTS`; sửa byte file đích trên đĩa (chmod lại để ghi) → `get_verified` ném `PayloadIntegrityError`; `size` sai → `PayloadIntegrityError`; ref inline đúng → trả JCS bytes; `sha256` sai so với data khi put → `DigestMismatch` và không có file.
  - release: cùng key khác nội dung → `PayloadIntegrityError`, file gốc giữ nguyên; file đích có quyền `0o444`; `read` key không tồn tại → `FileNotFoundError`.
  - key: tham số hóa các key sai `"../x"`, `"/abs"`, `"staging/../releases/x"`, `"staging/a\\b"`, `"staging/.hidden"`, `"staging//x"`, `"other/x"`, `"staging/" + "a"*1100` → `InvalidStoreKey`; tạo symlink `root/staging/evil -> tmp_path/outside` rồi put `staging/evil/x` → `InvalidStoreKey` và không file nào trong `outside`.
  - concurrency: 8 thread cùng `put_write_once` một key cùng byte → 1 `CREATED`, 7 `ALREADY_EXISTS`; 2 thread khác byte → đúng một thành công, một `PayloadIntegrityError`, nội dung cuối bằng nội dung của bên thắng; sau mọi test không còn file `.tmp-*`.
  - crash leftover: tạo tay `root/staging/x/.tmp-dead` (giả lập crash giữa ghi) → put/read key hợp lệ `staging/x/a.js` không bị ảnh hưởng; key `staging/x/.tmp-dead` → `InvalidStoreKey` (file tạm không bao giờ đọc được qua API).
- [ ] **Step 2:** `uv run pytest python/fb_store/tests -k fsstore` → FAIL. Implement. → PASS.
- [ ] **Step 3:** `pnpm py:lint && pnpm py:typecheck` → PASS. Gộp vào **CP3**.

**Acceptance criteria:** mọi test trên pass; không có đường ghi ngoài root.
**Verification commands:** `uv run pytest python/fb_store/tests -k fsstore -v`
**Expected evidence:** `docs/evidence/P02/S0-T7-fsstore.txt`.
**DoD:** commit; không GC, không `BLOBTOUCH` (thuộc slice sau).

---

### Task 8: SQLite local persistence foundation

**Mục tiêu:** Primitive cho mọi repository sau này: mở DB đúng PRAGMA, transaction `BEGIN IMMEDIATE` có giới hạn DynamoDB, ánh xạ tranh chấp thành `Conflict`, retry có jitter, migration, đồng hồ giả, logical expiration, layout thư mục dữ liệu local.

**Dependencies:** Task 3, Task 7 (`errors.py`).

**Files:**
- Create: `python/fb_store/src/fb_store/{clock,sqlite,migrations,layout,__main__}.py`, `python/fb_store/src/fb_store/migrations/.keep`, `python/fb_store/tests/{test_sqlite_tx,test_sqlite_conflict,test_migrations,test_clock,test_layout}.py`, `python/fb_store/tests/migrations_fixture/{ok,broken,checksum}/*.sql`

**Interfaces:**
- `clock.py`: `class Clock(Protocol): def now(self) -> datetime`; `SystemClock`; `FakeClock(start: datetime)` với `advance(delta: timedelta) -> None`; mọi `datetime` là aware UTC, naive → `ValueError`; `is_expired(expires_at: datetime, now: datetime) -> bool` = `expires_at <= now` (spec #5 §5.2).
- `sqlite.py`: hằng `MAX_TX_ACTIONS = 100`, `MAX_TX_BYTES = 4_194_304`, `MAX_ITEM_BYTES = 409_600`.
  - `open_database(path: Path) -> sqlite3.Connection`: `sqlite3.connect(path, autocommit=True)`, `row_factory = sqlite3.Row`, PRAGMA `journal_mode=WAL`, `synchronous=FULL`, `foreign_keys=ON`, `busy_timeout=0`, `trusted_schema=OFF`.
  - `transaction(conn) -> ContextManager[Tx]`: `BEGIN IMMEDIATE`; thoát bình thường → `COMMIT`; exception → `ROLLBACK` rồi ném lại.
  - `Tx.action(sql: str, params: Sequence[object] = ()) -> sqlite3.Cursor`: đếm 1 action (ghi hoặc condition check); cộng byte của tham số `str` (UTF-8) và `bytes`; vượt `MAX_TX_ACTIONS` hoặc `MAX_TX_BYTES` → `TransactionTooLarge` (transaction bị rollback). `Tx.query(sql, params=()) -> list[sqlite3.Row]`: không đếm.
  - `check_item_size(item: Mapping[str, object]) -> int`: trả `len(canonical_json(item))`; > `MAX_ITEM_BYTES` → `ItemTooLarge`. (Xấp xỉ bảo thủ của cách DynamoDB tính kích thước item; ghi trong CONVENTIONS.)
  - Mọi `sqlite3.OperationalError` có `sqlite_errorcode` ∈ {`SQLITE_BUSY`, `SQLITE_LOCKED`} (ở BEGIN, statement hay COMMIT) → `Conflict` (`raise … from e`).
  - `with_conflict_retry(fn: Callable[[], T], *, attempts: int = 5, base_delay_s: float = 0.01, max_delay_s: float = 0.2, rng: random.Random | None = None, sleep: Callable[[float], None] = time.sleep) -> T`: chỉ retry `Conflict`; delay lần `i` (từ 0) = `rng.uniform(0, min(max_delay_s, base_delay_s * 2**i))` (full jitter); hết lượt → ném `Conflict` cuối.
- `migrations.py`: `apply_migrations(conn, migrations_dir: Path) -> list[str]` — file `NNNN_<name>.sql` (4 chữ số); bảng `schema_migrations(version TEXT PRIMARY KEY, sha256 TEXT NOT NULL, applied_at TEXT NOT NULL) STRICT`; áp theo thứ tự, mỗi file trong một transaction nguyên tử cùng dòng `schema_migrations`; đã áp mà sha256 file khác → `MigrationError`; file mới có version ≤ version lớn nhất đã áp → `MigrationError`; trả danh sách version vừa áp.
- `layout.py`: `DataLayout(root: Path)` với `sqlite_path = root / "fb.sqlite3"`, `blob_root = root / "blobs"`, `release_root = root / "release-store"`; `init_data_dir(root: Path) -> DataLayout` tạo thư mục (0o700), mở DB, áp migration của package. `__main__.py`: `python -m fb_store init --data-dir <path>` in JSON `{"dataDir", "sqlite", "appliedMigrations"}`.
- Quy ước bảng cho slice sau (ghi trong CONVENTIONS ở Task 13): mỗi loại item một bảng `STRICT`, khóa chính tương ứng `PK/SK` (`WITHOUT ROWID` khi khóa ghép), không PII trong khóa.

- [ ] **Step 1: Viết test:**
  - `test_sqlite_tx`: tạo bảng tạm `t(k TEXT PRIMARY KEY, v TEXT) STRICT`; ghi trong transaction rồi exception → 0 dòng; 100 `action` → commit được; action thứ 101 → `TransactionTooLarge` và 0 dòng; một tham số chuỗi 4 194 305 byte → `TransactionTooLarge`; `check_item_size({"v": "x" * 409_600})` → `ItemTooLarge`; `check_item_size({"v": "x" * 1000})` trả `1008` (`{"v":"` 6 byte + 1000 + `"}` 2 byte); PRAGMA `journal_mode` đọc lại = `wal`, `foreign_keys` = 1.
  - `test_sqlite_conflict`: connection A mở `BEGIN IMMEDIATE` và giữ; `with transaction(conn_b)` → `Conflict` trong < 1 s; `with_conflict_retry` với `fn` ném `Conflict` 2 lần rồi trả `"ok"`, `rng=random.Random(0)`, `sleep` ghi lại delay → kết quả `"ok"`, 2 delay, mỗi delay ≤ cận `min(0.2, 0.01 * 2**i)`; `fn` luôn `Conflict` → ném `Conflict` sau đúng 5 lần gọi.
  - `test_migrations`: thư mục `ok` (`0001_a.sql`, `0002_b.sql`) → trả `["0001","0002"]`, chạy lại → `[]`; `broken` (`0001_x.sql` có `CREATE TABLE x(...); CREATE TABLEE y;`) → `MigrationError`, bảng `x` không tồn tại, không dòng `schema_migrations`; sửa nội dung file đã áp → `MigrationError`; thêm `0001_late.sql` khi đã áp `0002` → `MigrationError`.
  - `test_clock`: `FakeClock` advance; `is_expired(t, t) is True`; naive datetime → `ValueError`.
  - `test_layout`: `init_data_dir(tmp_path / "var")` tạo đủ ba đường dẫn; chạy CLI bằng `subprocess` (`sys.executable -m fb_store init --data-dir …`) → exit 0, JSON hợp lệ, `appliedMigrations == []`.
- [ ] **Step 2:** Chạy → FAIL. Implement. Chạy → PASS.
- [ ] **Step 3:** `pnpm py:lint && pnpm py:typecheck && pnpm py:test` → PASS. 
- [ ] **Step 4: CP3** — independent targeted review (SQLite, storage, concurrency, path safety); sửa MAJOR; báo cáo; xin duyệt và commit `feat(store): CP3 write-once FS store and SQLite foundation`.

**Acceptance criteria:** test trên pass; không bảng nghiệp vụ nào được tạo; không ORM.
**Verification commands:** `uv run pytest python/fb_store/tests -k "sqlite or migrations or clock or layout" -v`
**Expected evidence:** `docs/evidence/P02/S0-T8-sqlite.txt`.
**DoD:** commit; CT-11/CT-17/CT-21 có primitive để slice sau viết contract test (chưa phải CT đầy đủ — ghi rõ).

---

### Task 9: Package boundaries (TS + Python), mỗi luật có negative fixture

**Mục tiêu:** P02-04: không vòng import, không import sai hướng, package browser-safe không dùng `node:*`; mỗi luật bị chứng minh bắt đúng lỗi (nguyên tắc L6, spec #2 §11.2).

**Dependencies:** Task 2, Task 5 (để graph có code thật), Task 8.

**Files:**
- Create: `.dependency-cruiser.cjs`, `tools/boundaries/{package.json,test/rules.test.ts}`, `tools/boundaries/fixtures/violations/packages/...` (mỗi file vi phạm đúng một luật), `tools/boundaries/fixtures/control/packages/...`, `python/fb_store/tests/test_import_contracts.py`
- Modify: root `package.json` (`boundaries`, `py:imports`, devDep `dependency-cruiser@18.7.0`), root `pyproject.toml` (`[tool.importlinter]`)

**Interfaces:**
- Luật dependency-cruiser (tên khóa ở plan):
  - `no-circular` — mọi vòng.
  - `browser-safe-no-node` — từ `^packages/contracts/src` tới module core của Node hoặc `^node:`.
  - `src-no-test-fixture-script` — từ `^packages/[^/]+/src` tới đường dẫn chứa `/(test|tests|fixtures|scripts)/`.
  - `no-relative-cross-package` — từ `^packages/([^/]+)/` tới `^packages/` khác package đó qua đường dẫn tương đối (phải import theo tên package).
  - `packages-not-import-tools` — từ `^packages/` tới `^tools/`.
- Import-linter: contract `layers`: `fb_store` trên `fb_contracts` (`fb_contracts` không được import `fb_store`).
- Quy tắc mở rộng (ghi trong CONVENTIONS): mỗi package mới (S1: engine, S2: compiler…) thêm luật của nó **cùng** một negative fixture; luật cho package chưa tồn tại không được viết trước.

- [ ] **Step 1: Viết test** `rules.test.ts` gọi API `cruise` của dependency-cruiser với `baseDir` = thư mục fixture: `violations` → tập tên luật vi phạm bằng đúng năm luật trên; `control` → 0 vi phạm. Python: test tạo hai package tạm `a`, `b` (`a` import `b`), viết config import-linter cấm `a → b`, chạy `lint-imports --config` bằng `subprocess` → exit ≠ 0.
- [ ] **Step 2:** Chạy → FAIL. Viết config và fixture → PASS.
- [ ] **Step 3:** Chạy trên repo thật: `pnpm boundaries` → 0 vi phạm; `pnpm py:imports` → contract KEPT. Gộp vào **CP4**.

**Acceptance criteria:** năm luật TS + một contract Python đều có negative fixture bị bắt; repo thật sạch.
**Verification commands:** `pnpm boundaries && pnpm py:imports && pnpm vitest run tools/boundaries`
**Expected evidence:** `docs/evidence/P02/S0-T9-boundaries.txt`.
**DoD:** commit.

---

### Task 10: Security boundaries cho local synthetic PoC

**Mục tiêu:** Biến ranh giới bảo mật P0 (ADR-078, `docs/SECURITY_RISK_REGISTER.md`) thành kiểm tự động ở mức S0: quét secret, fixture chỉ synthetic, test không mạng ở TS, tài liệu ranh giới.

**Dependencies:** Task 2, Task 3.

**Files:**
- Create: `.gitleaks.toml`, `tools/security/{package.json,gitleaks.sh,src/synthetic-data-check.ts,test/synthetic-data-check.test.ts,test/gitleaks.test.ts}`, `tools/test-setup/no-network.ts`, `tools/test-setup/no-network.test.ts`, `docs/engineering/SECURITY_BOUNDARIES_P0.md`
- Modify: `vitest.config.ts` (`setupFiles`), root `package.json` (`secrets`, `synthetic:check`)

**Interfaces:**
- `gitleaks.sh`: chạy `docker run --rm --network none -v "$PWD:/repo:ro" zricethezav/gitleaks:v8.30.1@sha256:<digest lấy ở Step 1> dir /repo --config /repo/.gitleaks.toml --redact --no-banner --exit-code 1`. `.gitleaks.toml`: `[extend] useDefault = true`; allowlist path: `node_modules`, thư mục sinh ra trong `spikes/*/` (`gen`, `out`, `test-results`) — source của spike vẫn bị quét (D8) —, `var/`, `contracts/vendor/`, `pnpm-lock.yaml`, `uv.lock`. Script nhận tham số thư mục tùy chọn (mặc định repo).
- `synthetic-data-check.ts`: `checkSyntheticData(rootDir: string): Finding[]` với `Finding { file: string; line: number; rule: "email-domain" }`; quét file text dưới `rootDir`, mọi địa chỉ email có domain ngoài {`example.com`, `example.jp`, `example.org`, đuôi `.invalid`, đuôi `.test`, đuôi `.example`} → finding. CLI: `node tools/security/src/synthetic-data-check.ts <dir>...` exit 1 khi có finding. Quét: `contracts/fixtures`.
- `no-network.ts`: thay `globalThis.fetch` bằng hàm ném `Error("network disabled in tests (S0 security boundary)")`. Giới hạn ghi trong tài liệu: không chặn `node:net` trực tiếp; luật boundary đã cấm `node:*` trong package browser-safe.
- `SECURITY_BOUNDARIES_P0.md` (≤ 1 trang): dữ liệu được phép (synthetic, cửa hàng hư cấu), cấm (PII, credential, endpoint công ty, AWS, push), process local bind `127.0.0.1`, thư mục dữ liệu `var/` gitignored, lệnh kiểm tương ứng, liên kết ADR-063/071/076/078 và SR-01..12; nêu rõ S0 **không** kiểm chứng SR nào.

- [ ] **Step 1:** `docker pull zricethezav/gitleaks:v8.30.1` rồi lấy digest (`docker image inspect --format '{{index .RepoDigests 0}}'`), ghi vào script + evidence.
- [ ] **Step 2: Viết test:** synthetic: thư mục tạm có `taro@example.com`, `hanako@shop.invalid` → 0 finding; `someone@gmail.com` → 1 finding đúng file/dòng. Gitleaks: tạo trong thư mục tạm một file chứa khóa AWS mẫu do test sinh lúc chạy (`"AKIA" + "Z".repeat(16)` cùng một secret 40 ký tự ngẫu nhiên), chạy `gitleaks.sh <tmpdir>` → exit 1; thư mục sạch → exit 0 (test bỏ qua có ghi lý do nếu Docker không chạy, và evidence ghi SKIP). No-network: `await expect(fetch("http://127.0.0.1:9")).rejects.toThrow("network disabled")`.
- [ ] **Step 3:** Chạy → FAIL. Implement. Chạy → PASS. `pnpm secrets` trên repo thật → 0 finding; `pnpm synthetic:check` → 0.
- [ ] **Step 4:** Gộp vào **CP4**.

**Acceptance criteria:** negative test chứng minh gitleaks và synthetic check bắt lỗi; repo thật sạch; tài liệu ranh giới có lệnh kiểm.
**Verification commands:** `pnpm secrets && pnpm synthetic:check && pnpm vitest run tools/security tools/test-setup`
**Expected evidence:** `docs/evidence/P02/S0-T10-security.txt` (gồm digest image gitleaks).
**DoD:** commit; không secret thật nào được ghi ra đĩa.

---

### Task 11: Phương pháp đo hiệu năng (VG-21, phần S0) + công cụ đo byte

**Mục tiêu:** Chốt phương pháp đo để S2 chỉ việc chạy; cung cấp công cụ đo byte tất định. **Không** đặt budget số (ADR-078).

**Dependencies:** Task 2.

**Files:**
- Create: `docs/engineering/PERF_MEASUREMENT_METHOD.md`, `tools/perf/{package.json,src/sizes.ts,src/cli.ts,test/sizes.test.ts}`

**Interfaces:**
- `measureBytes(data: Uint8Array): { raw: number; gzip: number; brotli: number }` — `zlib.gzipSync(data, { level: 9 })`, `zlib.brotliCompressSync(data, { params: { [BROTLI_PARAM_QUALITY]: 11, [BROTLI_PARAM_SIZE_HINT]: data.length } })`.
- `measureDir(dir: string): SizeReportFile[]` với `SizeReportFile { path: string; raw: number; gzip: number; brotli: number }`; `path` tương đối, dấu `/`, sắp tăng dần; không theo symlink (bỏ qua, liệt kê trong `skippedSymlinks`).
- CLI `node tools/perf/src/cli.ts sizes <dir> --out <file>` ghi `{ "tool": "fb-perf-sizes", "toolVersion": "0.1.0", "node": process.version, "zlib": process.versions.zlib, "brotli": process.versions.brotli, "settings": { "gzipLevel": 9, "brotliQuality": 11 }, "measuredAt": <ISO UTC>, "files": [...], "skippedSymlinks": [...], "totals": { "raw", "gzip", "brotli" } }`.
- Nội dung bắt buộc của `PERF_MEASUREMENT_METHOD.md`:
  1. Mốc T1/T2/T3 và chỉ số theo spec #3 §17.1–§17.2 (trích, không định nghĩa lại); `performance.mark("form:visible")`, `performance.mark("form:ready")`.
  2. Profile: `lab-slow4g-cdp` = Chromium CDP, độ trễ 150 ms, xuống 1.6 Mbps, lên 750 Kbps, CPU chậm 4x (giống spike để so được); `lab-unthrottled`. TTFB **không** báo từ CDP (spec #3 §17.2, EXP-05).
  3. Lặp: mỗi form × profile × {cold, warm}: 1 lần khởi động bỏ đi, rồi 10 lần đo; báo trung vị, min, max, n. Cold = browser context mới; warm = trang mới trong cùng context.
  4. Byte: chạy `fb-perf-sizes` trên thư mục artifact của `releaseId`; tách bootstrap, CSS đầu, `core` + `entry`, từng group, IR.
  5. Motion-none (Sports): ba điều kiện cùng phải đúng — (a) Chunk Manifest không có chunk chứa module thuộc tập Motion (thư viện `motion`, Motion Adapter, `@platform/motion-presets`); (b) tổng byte của module Motion trong mọi chunk = 0; (c) log mạng Playwright của Sports Motion-none không có request tới chunk Motion. Tập module Motion được S2 khóa từ Chunk Manifest thật.
  6. Envelope báo cáo: công cụ + version, Chromium version, profile, n, `releaseId`, commit, máy (CPU, RAM, OS), thời điểm, nhãn **lab-only**. Lưu `docs/evidence/<phase>/perf/<releaseId>/`.
  7. Quy trình budget S2: đo 3 phiên độc lập (build sạch + đo); trình user bảng trung vị; user chốt budget **trước** S2 DONE; CI fail khi vượt budget đã chốt (PERF-05). Không tự PASS khi chưa đo.
  8. Thời gian build local (PERF-02): `hyperfine`-style lặp 5 lần build sạch, trung vị; ghi máy.
- [ ] **Step 1: Viết test:** thư mục tạm có `b.js` (1000 byte `a`), `a/c.css` (rỗng) → `measureDir` trả path `["a/c.css","b.js"]`, `raw` = `[0, 1000]`, `gzip > 0`, `brotli > 0`; gọi hai lần cho cùng kết quả; symlink bị bỏ qua và liệt kê; `totals.raw` = 1000; CLI ghi file JSON có `settings.gzipLevel === 9`.
- [ ] **Step 2:** FAIL → implement → PASS.
- [ ] **Step 3:** Viết tài liệu. Gộp vào **CP4**.

**Acceptance criteria:** tài liệu đủ 8 mục, không có con số budget; công cụ tất định và có test.
**Verification commands:** `pnpm vitest run tools/perf`
**Expected evidence:** `docs/evidence/P02/S0-T11-perf-method.txt`.
**DoD:** commit; VG-21 cập nhật "phương pháp: DONE (S0); budget: OPEN (S2)".

---

### Task 12: Canonical builder image (Node 24, pin digest) — VG-05 phần S0

**Mục tiêu:** Image build chuẩn theo spec #3 §12.1 với Node 24.22.1 pin digest; chứng minh toolchain TS chạy được trong image. A/B tái lập và isolation là việc của S2.

**Dependencies:** Task 1, Task 2.

**Files:**
- Create: `docker/builder/Dockerfile`, `docker/builder/README.md`

**Interfaces:**
- `FROM node:24.22.1-bookworm-slim@sha256:<digest lấy ở Step 1>`; `ENV TZ=UTC LANG=C.UTF-8 LC_ALL=C.UTF-8 NODE_ENV=production`; `RUN corepack enable && corepack prepare pnpm@12.15.0 --activate`; `WORKDIR /build`; `umask 022` trong entrypoint; không cài công cụ thừa.
- Tag local: `fb-builder:s0`. Image không bao giờ push (G9/G10).

- [ ] **Step 1:** `docker pull node:24.22.1-bookworm-slim`, lấy digest, ghi Dockerfile + evidence.
- [ ] **Step 2:** `docker build -t fb-builder:s0 docker/builder` → exit 0. `docker run --rm fb-builder:s0 sh -c 'node -v && pnpm -v && echo $TZ'` → `v24.22.1`, `12.15.0`, `UTC`.
- [ ] **Step 3:** Chỉ đưa cây đã commit vào container (không kéo `node_modules`, `spikes/`, `var/` của host): `git archive --format=tar HEAD | docker run --rm -i fb-builder:s0 sh -c 'tar -x -C /build && pnpm install --frozen-lockfile --prod=false && test -x node_modules/.bin/tsc && pnpm typecheck && pnpm test'` → exit 0 (cài cả devDependencies dù `NODE_ENV=production`; nếu cờ của pnpm 12 khác thì dùng cờ tương đương và ghi lại).
- [ ] **Step 4: CP4** — báo cáo; xin duyệt và commit `chore(s0): CP4 boundaries, security checks, perf method, builder image`.

**Acceptance criteria:** image build được, version đúng, typecheck + test TS pass trong container.
**Verification commands:** Step 2–3.
**Expected evidence:** `docs/evidence/P02/S0-T12-builder-image.txt` (digest base image, digest image local).
**DoD:** commit; VG-05 = PARTIAL (image + toolchain); phần A/B tái lập, isolation, Vite/Rolldown chuyển S2.

---

### Task 13: `pnpm verify`, tài liệu quy ước, cập nhật governance

**Mục tiêu:** Một lệnh duy nhất tương đương CI (P02-03 khi chưa có G9); README, quy ước; cập nhật checklist/status/handoff/traceability; review toàn branch.

**Dependencies:** Task 1–12.

**Files:**
- Create: `docs/engineering/CONVENTIONS.md`, `docs/evidence/P02/S0-SUMMARY.md`
- Modify: root `package.json` (`verify`), `README.md`, `docs/PROJECT_CHECKLIST.md` (P02-01..05), `docs/CURRENT_STATUS.md`, `docs/CONTEXT_HANDOFF.md`, `docs/REQUIREMENTS_TRACEABILITY.md` (VG-04, VG-05, VG-21)

**Interfaces:**
- `verify` = `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm gen:check && pnpm schemas:lint && pnpm boundaries && pnpm py:lint && pnpm py:typecheck && pnpm py:imports && pnpm py:test && pnpm synthetic:check && pnpm secrets` (fail fast).
- `CONVENTIONS.md`: bảng lệnh; layout repo; cách thêm schema (file → `pnpm gen` → fixture valid/invalid → parity); cách thêm package (luật boundary + negative fixture); quy ước SQLite (Task 8); mã lỗi nội bộ S0 (`E-JCS-UNSUPPORTED-VALUE`, `E-PAYLOADREF-*`, `E-DIGEST-FORMAT`, `E-STORE-KEY-INVALID`, `E-DIGEST-MISMATCH`, `E-TRANSACTION-TOO-LARGE`, `E-ITEM-TOO-LARGE`, `E-MIGRATION`; `E-PAYLOAD-INTEGRITY` từ spec #5); evidence; commit cần duyệt.
- GitHub Actions: **không** tạo ở S0 (G9 BLOCKED, không chạy được để có evidence); `pnpm verify` là hợp đồng CI. P02-03 = PARTIAL.

- [ ] **Step 1:** Clone sạch vào scratchpad (`git clone <repo local> <scratch>/s0-clean && git -C … switch p02-s0-foundation`), `pnpm install --frozen-lockfile && uv sync --locked && pnpm verify` → exit 0. Ghi toàn bộ output vào evidence.
- [ ] **Step 2:** Viết `CONVENTIONS.md`, README (quickstart: yêu cầu toolchain, `pnpm install`, `uv sync`, `pnpm verify`, `python -m fb_store init --data-dir var`).
- [ ] **Step 3:** Cập nhật governance: P02-01 DONE (evidence T1–T3), P02-02 DONE (T4–T6), P02-03 PARTIAL (không CI GitHub do G9), P02-04 DONE (T9), P02-05 PARTIAL (data dir + init; chưa có demo fixtures form — thuộc S1/S2); VG-04 theo kết quả T1, VG-05 PARTIAL, VG-21 phương pháp DONE; CURRENT_STATUS/HANDOFF: tiếp theo planning S1.
- [ ] **Step 4:** Independent final review CP5 (đọc diff từ commit plan tới HEAD, kiểm DoD S0). Sửa BLOCKER/MAJOR; MINOR ghi backlog.
- [ ] **Step 5: CP5** — báo cáo theo master §0.2; xin duyệt và commit `docs(s0): CP5 verify entrypoint, conventions, governance`.

**Acceptance criteria:** xem "Acceptance criteria tổng thể S0".
**Verification commands:** `pnpm verify` trên clone sạch.
**Expected evidence:** `docs/evidence/P02/S0-T13-verify-clean-clone.txt`, `docs/evidence/P02/S0-SUMMARY.md`.
**DoD:** commit; không còn mục `[ ]` không có giải thích.

---

## Acceptance criteria tổng thể S0

1. Clone sạch + `pnpm install --frozen-lockfile && uv sync --locked && pnpm verify` → exit 0 trên Node 24.22.1 / pnpm 12.15.0 / Python 3.13, có output thật trong evidence.
2. TS strict và mypy strict không lỗi; ESLint 0 warning; negative test chứng minh luật strict và cấm `eval` có hiệu lực.
3. Parity TS/Python: JCS (8 case), digest, schema `payload-ref/v1` (9 fixture), semantic `PayloadRef` (6 case) cho cùng kết quả; JSON-Schema-Test-Suite subset 0 fail, skip giống nhau và có lý do.
4. Một nguồn schema; type TS sinh tự động; drift check bắt sửa tay.
5. Write-once FS store và SQLite foundation pass mọi test, gồm đồng thời, path traversal/symlink, tranh chấp ghi, rollback, giới hạn 100 action / 4 MB / 400 KB.
6. Boundary: 5 luật TS + 1 contract Python, mỗi luật có negative fixture bị bắt; repo thật 0 vi phạm, 0 vòng import.
7. Bảo mật: gitleaks 0 finding, synthetic check 0 finding, test không mạng (Python chặn socket; TS chặn `fetch`), tài liệu ranh giới.
8. `PERF_MEASUREMENT_METHOD.md` đủ 8 mục, không budget số; công cụ đo byte có test.
9. Builder image Node 24.22.1 pin digest chạy typecheck + test TS.
10. Không có code S1/S2/Admin/API; không AWS; không push; không code copy từ spike; ADR-013/014 không bị chạm.
11. Governance cập nhật: P02-01..05, VG-04/05/21, ADR-079, CURRENT_STATUS, HANDOFF.

## Technology decisions cần user xác nhận

| ID | Quyết định | Đề xuất | Lý do / bằng chứng |
|---|---|---|---|
| D1 | Node.js | **24.22.1** (LTS "Krypton", 2026-10-20) | ADR-045; Vitest 5 cần Node ≥ 22.12 (Node 20 không chạy); Node 26 chưa LTS ở 2026-10-25 |
| D2 | Package manager và cách cài | **MODIFIED:** pnpm 12.15.0 qua **Corepack của Node 24**; không dùng pnpm thử nghiệm của Volta; incompatibility thật → pnpm standalone pin version; kết quả vào ADR-079 | ADR-044 |
| D3 | Python và trình quản lý | **Python 3.13** (Homebrew 3.13.15 có sẵn) + **uv** (cài bằng `brew install uv`), `uv.lock` | uv cho lockfile + workspace; phương án thay: venv + pip-tools |
| D4 | TypeScript | **6.0.3**, không dùng 7.0.2 | typescript-eslint 8.72.0 yêu cầu `typescript >=4.8.4 <6.1.0`; lint có type-check cần TS 6 |
| D5 | Thư viện contract | Ajv 8.20.0 (TS) + jsonschema 4.26.0 (Python); canonicalize 5.1.0 (TS) + rfc8785 0.1.4 (Python); json-schema-to-typescript 16.0.0 | spec #1 §7.7 để builder chọn; Python chỉ validate, không sinh model (YAGNI) |
| D6 | Secret scan | **APPROVED WITH CONDITION:** gitleaks v8.30.1 qua Docker nếu Docker sẵn sàng; không cài Docker Desktop; không có Docker → trình phương án gitleaks CLI, ghi coverage thật; chưa scan thì security gate không PASS | thay vì tự viết scanner |
| D7 | CI GitHub Actions | **Hoãn tới G9**; `pnpm verify` là hợp đồng CI | không chạy được nên không có evidence |
| D8 | `spikes/` | **MODIFIED:** chỉ ignore thư mục sinh ra (`node_modules`, `out`, `gen`, `test-results`, cache); không ignore cả `spikes/` để source/evidence mới vẫn hiện; tool config (ESLint, Prettier, Vitest, dependency-cruiser, gitleaks) loại `spikes/` khỏi phạm vi quét code | không stage, không merge spike source |
| D9 | Duyệt commit | **MODIFIED:** 5 checkpoint CP1 (T1–T3), CP2 (T4–T6), CP3 (T7–T8), CP4 (T9–T12), CP5 (T13); mỗi commit theo hook/approval hiện hành | — |

**ADR-013/014:** S0 **không** phụ thuộc. Schema thí điểm là `PayloadRef` (spec #5 §5.3), không phải definition. Contract đầu tiên cần chốt sẽ xuất hiện ở S1: hàm activity duy nhất và việc giữ dữ liệu inactive (ADR-014, N-01..N-13), các loại derived state (ADR-013). Sẽ trình riêng khi lập plan S1.

## Rủi ro thực sự ảnh hưởng việc bắt đầu coding

| ID | Rủi ro | Ảnh hưởng | Xử lý đề xuất |
|---|---|---|---|
| R1 | Hook chặn `git commit` nếu user không duyệt trực tiếp | Dừng ở mỗi checkpoint (5 lần) | Đã chốt D9: 5 checkpoint |
| R2 | Cài toolchain (Node 24 theo project qua Volta, pnpm qua Corepack, uv qua Homebrew) | Thay đổi môi trường ngoài repo ở mức tối thiểu | Giữ phạm vi project; Corepack lỗi với pnpm 12 → pnpm standalone pin version |
| R3 | Lệch vị trí lỗi giữa Ajv và python-jsonschema ngoài các case đã thử (`oneOf`, `$ref` lồng) | Có thể phải đổi quy tắc chuẩn hóa | Task 5/6 dừng và báo nếu lệch; schema dùng `oneOf` đầu tiên (S1) phải thêm fixture vị trí lỗi |
| R4 | TypeScript bị giữ ở 6.0.x | Lệch với dòng TS 7 mới | Nâng khi typescript-eslint hỗ trợ TS 7; ghi trong ADR-079 |
| R5 | Cài dependency cần mạng (npm, PyPI, Docker Hub, GitHub raw) | Rủi ro supply chain | Pin version chính xác, lockfile, chặn lifecycle script của dependency, gitleaks chạy `--network none` |
| R6 | Python đọc schema theo đường dẫn repo (`contracts/`) | Chưa đóng gói được cho triển khai | Đủ cho local P0; đóng gói xử lý khi lập kế hoạch G10 |
