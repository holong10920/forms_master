# Tailwind application migration — 2026-10-27

The active Workspace, Studio and Customer/Preview styling now uses Tailwind CSS 4.3.0. No Git mutation, GitHub access, AWS write or production call was performed. Other Kiro behavior was preserved.

## Source cleanup and implementation

Removed the three handwritten stylesheets (4,500 lines total):

- `tools/go-auth/web/src/style.css`
- `tools/go-auth/studio/style.css`
- `packages/static-runtime/src/style.css`

The only active application CSS source files remaining are:

- `tools/go-auth/web/src/tailwind.css`: Tailwind imports, explicit source discovery, font/animation theme configuration.
- `packages/static-runtime/src/tailwind.css`: Tailwind utilities import and explicit runtime recipe source.

These 59 lines are Tailwind entry/configuration, rather than a parallel set of component selector rules. Built CSS, third-party dependency CSS and immutable release artifacts remain necessary and are not deleted.

Complete static utilities are applied by component recipes in `web/src/recipes.ts`, `studio/recipes.js` and `packages/static-runtime/src/recipes.ts`. React class names and Studio DOM helpers apply the recipes; semantic hooks stay available for behavior and tests. `@fb/ui-styles` composes Admin variants without duplicate property growth. Customer recipes use named static exports to preserve optional chunk isolation. Business User values remain validated declarative CSS variables, not arbitrary generated Tailwind classes.

The compiler runs Tailwind and compresses utility names deterministically using a CSS selector AST. CSS, HTML and JS use the same mapping before Vite calculates final asset names; emitted files retain the existing SRI/content-integrity contracts. Compiled HTML carries runtime root classes; isolated Preview copies them from its verified bootstrap document. Existing immutable releases were not rewritten.

## Executed verification

| Check | Result | Evidence |
| --- | --- | --- |
| `pnpm verify` | PASS: format, lint, recursive typecheck, 651 tests + 15 expected fail, generated contracts, schemas, boundaries, synthetic-data check, secrets | `verify.txt` |
| React tests | PASS: 16 | `react-tests.txt` |
| React production build | PASS | `react-build.txt` |
| Go test ./... | PASS | `go-tests.txt` |
| Go test -race ./... | PASS | `go-race.txt` |
| Go vet ./... | PASS, no diagnostics | `go-vet.txt` |
| Dependency audit, root and standalone web lockfiles | PASS: zero reported vulnerabilities | `dependency-audit.json`, `web-dependency-audit.json` |
| Compiler isolation, JA/VI, canonical release, extended forms | PASS, unchanged initial budgets and deterministic output | `compiler-tests.txt`, `verify.txt` |
| Workspace browser E2E | PASS: header absent, sidebar JA/VI/Translations, save/reload, deep links and Back/Forward | `browser-workspace.txt`, `browser-validation.txt` |
| Responsive Workspace | PASS: 1440×900, 1280×800, 768×1024, 390×844, no document overflow | `browser-workspace.txt` |
| Login desktop/mobile | PASS, no overflow | `browser-login.txt` |
| Preview JA/VI | PASS: isolated origin 4185, no language buttons, no Admin cookies | `browser-preview.txt` |
| Member authorization | PASS: readonly UI, forged Admin save → 403 | `browser-member.txt` |
| Typed styling and mobile drawers | PASS: padding/background/columns/field padding respond to approved CSS variables; Structure and Inspector drawers open/close | `browser-rendering.txt` |
| Review → independent approval → publish | PASS, self-approval → 403 | `browser-publish.txt` |
| Published Customer flows | PASS: desktop shop, laptop delivery, mobile deferred choice; validation/branch clearing/restore/address/search/review/submission; three HTTP 200 synthetic receipts | `browser-customer.txt` |
| Published Customer Vietnamese | PASS on mobile | `browser-public-vi.txt` |

Sports Motion-none retains zero Motion/React/store imports. Initial JS ≤12 KiB gzip and initial HTML/JS/CSS ≤16 KiB remain enforced by the original tests and production compiler. Early migration attempts hit these limits; the final implementation passes without increasing a budget or weakening a test.

The separate synthetic verification form is `frm_locale_cff3b217c3fd4e3a9d51c5d806c677eb`. Its new local release is `rel_kzrz7awpwrsmkbqvsosrnhihsp`. Real customer information and effects were not used.

## Browser demos and screenshots

- Admin: http://localhost:4180/studio/sites/site_pc_synthetic/forms/frm_locale_cff3b217c3fd4e3a9d51c5d806c677eb?lang=vi
- Customer: http://127.0.0.1:4183/r/rel_kzrz7awpwrsmkbqvsosrnhihsp/index.html?lang=vi
- Screenshots: `output/playwright/tailwind-*` (Workspace, login, Preview, mobile drawers, review/publish and Customer states).
- Before/after computed layout evidence: `layout-before.txt`, `layout-after.txt`, `layout-comparison.json`. Checked main panel dimensions and styles match at all four viewports; the full scrollable canvas content is 14px shorter. This is not a pixel-perfect parity claim.
- Reproducible browser scripts and sanitized method/path/status network summaries are included here; no auth codes, session cookies, CSRF verifiers or Preview handles are persisted in evidence.

## Changed scope and proposed commit

- CSS removal and recipes: the three application source areas above.
- Shared Admin composition: `packages/ui-styles/{package.json,tsconfig.json,src/index.ts,test/recipes.test.ts}`.
- React wiring: `web/src/{App.tsx,Login.tsx,Studio.tsx,main.tsx}`.
- Studio wiring: `studio/{admin.js,editor.js,state.js,ui.js,index.html,preview.js}` and `generate-studio.ts`.
- Runtime wiring: `packages/static-runtime/src/{index.ts,enhancements.ts}`.
- Compiler: `tools/compiler/src/{build.ts,tailwind.ts}`, compiler regression test, package dependencies and lockfile.
- Build peer resolution, root Tailwind dependency, browser-safe boundary coverage, README and this evidence directory.

Suggested local commit: `refactor: unify application styling with Tailwind`. No staging or commit was performed.

T12/K13 container verification remains pending. Host canonical-release tests do not establish container/ECS deployment verification. Previously published releases keep their original CSS/JS until a new release is deliberately published.
