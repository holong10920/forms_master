# Unified Go + React cutover — execution report

Verified locally on 26–27 October 2026. These results apply to the synthetic SQLite P0 and the documented macOS launcher.

| Milestone                      | Result | Executed evidence                                                                                                                                                        |
| ------------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| UNIFIED_WORKSPACE_COMPLETE     | PASS   | Admin OIDC login → Dashboard → real Studio in the shared shell; PC/Sports listing, deep links, refresh/back, JA/VI, create/edit/autosave/reload and isolated Preview     |
| GO_FORM_BACKEND_MIGRATED       | PASS   | Native Go contracts, transaction/CAS and authorization tests, bounded retained TS compiler, 236 evaluation and 24 submission parity cases, copied-data integrity         |
| END_TO_END_GO_CUTOVER_VERIFIED | PASS   | Two canonical releases, separate approver, Customer submit/idempotency, Go mock effect, rollback and immutable pinned second release with old Python-backed ports closed |

Open **http://localhost:4180/**. Form Builder is **http://localhost:4180/studio**. Start from repository root with `pnpm local:master`; installation, exact toolchain, identities, ports and rollback commands are in [README](../../README.md).

## Implementation and permission boundary

`cmd/api` starts one Go modular backend. `internal/auth`, `internal/persistence` and `internal/platform` retain the OIDC BFF, hashed opaque sessions, users, HTTP lifecycle and trusted-origin/CSRF boundary. `internal/studio` owns sites/forms, authorization, review, Preview, releases, submissions, outbox and audit; `internal/engine` owns the ported evaluator; `internal/compiler` is the bounded Node/TypeScript adapter. `cmd/migrate`, `cmd/inspect` and `cmd/engine-oracle` are fixed local tools. The complete [old-to-new route matrix](ROUTE-MATRIX.md) records inputs, outputs, storage, side effects and verification.

The existing Studio source is bundled and mounted directly inside React. It is not a second application link or editor iframe. Only the existing untrusted Preview uses a separate-origin frame. Workspace routes, locale, account, session and dirty-state navigation are shared. Generated assets are ignored, and the original editor source remains authoritative.

| Synthetic identity | Application role | Explicit site permissions                                                                 |
| ------------------ | ---------------- | ----------------------------------------------------------------------------------------- |
| synthetic-admin    | ADMIN            | PC/Sports read/create/edit/review/publish/rollback/submissions and P0 security management |
| synthetic-approver | ADMIN            | PC/Sports read/review only; provides the existing distinct-author approval requirement    |
| synthetic-member   | MEMBER           | PC read only                                                                              |

Unknown membership defaults to deny. No new application role was introduced. Go re-reads capabilities and user status; a client role header/payload cannot grant access. Compiler completion revalidates the parent session and current actor before privileged work continues. The browser proved Member read 200 and save/publish/submissions/other-site/Admin API 403; Admin missing CAS returned 400, missing CSRF 403, unknown site 403 and logged-out dashboard 401.

## Automated verification

| Check                              | Result                                        | Log                                                                                                       |
| ---------------------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Go 1.27.3 `test ./...`             | PASS                                          | [go-tests.txt](go-tests.txt)                                                                              |
| Go `test -race ./...`              | PASS                                          | [go-race.txt](go-race.txt)                                                                                |
| Go `vet ./...`                     | PASS, exit 0                                  | [go-vet.txt](go-vet.txt)                                                                                  |
| Shared TS/Go/Python evaluation     | 236 cases PASS                                | [engine-parity.txt](engine-parity.txt)                                                                    |
| Go/Python submission validation    | 24 cases PASS                                 | [engine-parity.txt](engine-parity.txt)                                                                    |
| Existing root TS suite             | 638 passed, 15 expected failures, 1 skipped   | [p0-ts-regression.txt](p0-ts-regression.txt)                                                              |
| Existing Python oracle/regression  | 798 passed                                    | [p0-python-regression.txt](p0-python-regression.txt)                                                      |
| React component suite              | 14 passed                                     | [react-tests.txt](react-tests.txt)                                                                        |
| Root/Node/React lint and typecheck | PASS                                          | repo-lint.txt, repo-typecheck.txt, node-lint.txt, node-typecheck.txt, react-lint.txt, react-typecheck.txt |
| React production build             | PASS                                          | [react-build.txt](react-build.txt)                                                                        |
| Go Linux amd64 cross-build         | PASS, exit 0; executable not run on Linux     | [linux-build.txt](linux-build.txt)                                                                        |
| govulncheck                        | No vulnerabilities found                      | [govulncheck.txt](govulncheck.txt)                                                                        |
| pnpm dependency audit              | 0 advisories                                  | [pnpm-audit.json](pnpm-audit.json)                                                                        |
| Accepted Gitleaks 8.30.1           | No leaks in new module and changed root files | [gitleaks.txt](gitleaks.txt)                                                                              |

Go tests cover OIDC signature/issuer/audience/expiry/state/nonce/PKCE/replay, fixation, expiry/logout, authoritative role changes, disabled users, Origin/CSRF, concurrency, copied-data CAS/membership, immutable corruption/symlink rejection, four-eyes publish/clone/rollback/submission, Preview expiration and capability/plugin revocation, admission holds, idempotency and retry/once-only synthetic effects. React tests include session bootstrap/guards/navigation/logout/expiry/locales and the mounted editor lifecycle, including pending work after teardown.

## Browser and network evidence

Real headed Chrome ran the committed-to-file Playwright scripts in this directory. JSON traces contain only route, method, status and synthetic result identifiers, not authorization codes, tokens, cookies or CSRF values.

| Flow                                                                        | Result evidence                                                            | Screenshot in repository `output/playwright/`                              |
| --------------------------------------------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Admin login, shared shell, PC/Sports                                        | [browser-m1.json](browser-m1.json), [browser-edit.json](browser-edit.json) | master-studio-list.png, master-sports-list.png, master-existing-editor.png |
| Create/edit, conditional branch, autosave/reload                            | [browser-create.json](browser-create.json)                                 | master-created-conditional-form.png                                        |
| Conditional full Preview and non-submittable Partial Preview                | [browser-preview.json](browser-preview.json)                               | master-conditional-preview.png, master-partial-preview.png                 |
| Immutable review, self-approve denied, separate approver, publish           | [browser-review.json](browser-review.json)                                 | master-review-approved.png, master-published.png                           |
| Customer submission, exact replay 200, changed replay 409; no Admin cookies | [browser-customer.json](browser-customer.json)                             | master-customer-complete.png                                               |
| Second release → rollback first; second pinned URL remains intact           | [browser-second-release.json](browser-second-release.json)                 | master-second-release-rollback.png, master-pinned-second-release.png       |
| Logout401, Member read-only, direct API/site/Admin denial                   | [browser-member-security.json](browser-member-security.json)               | master-member-readonly.png, master-member-admin-denied.png                 |
| Final fresh Admin session validates after compiler session recheck          | [browser-final-guard.json](browser-final-guard.json)                       | master-final-workspace.png                                                 |

Customer release one: `rel_jwfteq3lijpb53sfvltt6vqa6g`. Release two: `rel_c5rldbzpclv4nxi3nctsdtu4wz`. Rollback restored the first active pointer without changing the second immutable release. Receipt `synthetic_IvGY1O84vikKsm548RKv02Jz` has a matching DONE mock effect in the [post-cutover inspector](post-cutover-integrity.json). Browser scripts reported no page errors. Chrome emitted the existing Preview sandbox warning while the empty frame was about:blank (allow-scripts plus allow-same-origin). Executable Preview content loads only on isolated 127.0.0.1:4185 with the retained origin/CSP checks; no plugin code loads in the Admin frame. Expected denial responses are retained in the traces.

## Persistence and cutover

[Snapshot evidence](data-snapshot.json) records 55 drafts, 54 reviews, 67 local releases, 53 managed releases, 25 active pointers, 58 submissions/outbox/effects and 470 audit rows. A Go `VACUUM INTO` snapshot plus immutable copy preserved IDs, revisions and references in isolated `var/master`. Go refuses the original DB and symlink/hardlink aliases. Old ephemeral identity/Preview handles were invalidated only in the copy; the source runtime/data remain available for rollback.

After browser operations the target contains 57 drafts, 56 reviews, 69 local releases, 55 managed releases, 26 active pointers, 59 submissions/outbox/effects and 488 audit rows. The two new drafts include one earlier synthetic browser attempt. SQLite integrity is `ok`; all **902 original immutable files remain byte-identical**. Source immutable digest is `5411e462b2c12f849f386a3a4f027b0eec7e5069d8fc3479a7738ca18033a1d8`.

The old P0 host was stopped before Customer submission, second publication and rollback. No listeners remain on 4173–4176 ([legacy-listeners.txt](legacy-listeners.txt)). The new launcher owns Go BFF/business, Go isolated Customer/Preview, Go mock worker, synthetic Go OIDC and Vite. No Python API/worker or permanent Python proxy is needed by this path. Canonical compiler semantic verification uses the Go oracle here. Python remains an optional test oracle and preserved rollback runtime. Original Python Store Selector source bytes remain a **read-only provenance dependency** for unchanged legacy lock digests; the actual query/validation executes in Go.

Rollback: stop `local:master`, run `pnpm local:p0`, open the preserved old 4174 application. New Go edits are retained separately and are not automatically merged back into the old SQLite database.

## Changed-file and proposed commit scope

[changed-files.txt](changed-files.txt) lists the reviewable source/evidence scope, excluding generated assets, dependency directories, local databases, screenshots and compiled binaries. The whole `tools/go-auth/` directory was already untracked Phase 1 work at task start; it now includes the unified migration additions. Do not treat all its files as newly authored in this migration.

Only four previously tracked files changed: root `package.json` and `pnpm-lock.yaml` for the launcher/workspace, `eslint.config.js` for generated asset exclusions, and the eight-line fixed Go semantic-oracle selection in `tools/compiler/src/release.ts`. Original Python business/editor, Workflow Engine, TypeScript runtime and compiler lowering sources were preserved.

Suggested review/commit scopes, subject to the user's future Git authorization:

1. Existing Go auth/BFF baseline and unified React Studio lifecycle/routes/capabilities.
2. Native Go business/evaluator, safe snapshot/immutable persistence, compiler oracle adapter and cutover launcher.
3. Contract/parity/security/regression/browser evidence and local setup/rollback documentation.

No staging, commit, branch/worktree creation, other Git mutation, GitHub access or AWS write occurred. Work remained single writer.

## Remaining gates and limitations

- **T12/K13 remains VERIFICATION_PENDING.** Local migration evidence does not close that independent gate.
- PostgreSQL compatibility, ECS/Linux runtime operation, real IdP registration, HTTPS deployment, shared rate limiting, durable multi-task artifact storage, production secrets and audit retention are not verified/deployed.
- The launcher requires the existing macOS network sandbox and fails closed elsewhere; Linux cross-compilation is not a Linux runtime test.
- Local HTTP cookie exceptions remain explicitly loopback-only. Preview/Customer use 127.0.0.1 separately from Admin localhost and never receive Admin cookies.
- Translation retains the prior explicit provider-unavailable refusal; no email, real connector or non-synthetic effect was introduced.
- Browser evidence exercises the required P0 lifecycle and targeted security cases, not every permutation of every legacy editor control. Shared regression/semantic suites provide the broader executable contract checks above.
