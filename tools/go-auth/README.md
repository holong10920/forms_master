# Unified Form Master Workspace

Open **http://localhost:4180/**. Sign in once through the Go OIDC BFF, then choose Form Builder in the shared sidebar. The real existing Studio is mounted directly in React, with shared locale/account/session and deep links under `/studio/sites/:siteId/forms/:formId`. The editor itself is not inside an iframe. Only untrusted Preview uses an isolated frame.

Authenticated pages use the sidebar for navigation and the single JA/VI language control; the redundant Workspace header is removed. Form-content translation management has been removed completely, including its page, navigation, editor module and login return targets. Previous translation URLs return to the Dashboard. The sidebar language control changes application chrome only. Members remain read-only unless an explicit server capability grants editing.

Compiler releases retain supported JA/VI content and validation messages. Isolated Preview receives the sidebar language through the existing origin-checked handshake, with a validated `lang` URL fallback when browser storage is blocked. Preview has no language-switch buttons. Public runtime can select a supported language using `?lang=ja` or `?lang=vi`; unsupported languages fall back to Japanese. Existing immutable releases are unchanged; new compilation is required to include updated runtime behavior.

## Tailwind styling

Workspace, Studio and Customer/Preview use Tailwind CSS 4.3.0. Component recipes live in `web/src/recipes.ts`, `studio/recipes.js` and `packages/static-runtime/src/recipes.ts`; React and the DOM helpers apply complete static utility strings. Semantic class hooks remain for behavior and tests. Shared recipe composition lives in `@fb/ui-styles`.

The three handwritten `style.css` files are removed. The only application CSS source files are Tailwind entries: `web/src/tailwind.css` (imports, explicit sources, theme/animation configuration) and `packages/static-runtime/src/tailwind.css` (utilities and explicit runtime source). Do not add a parallel stylesheet or construct Tailwind classes from Business User values. Typed No-Code appearance values continue through validated CSS variables and the approved theme-token generator.

The compiler runs Tailwind locally, assigns compact deterministic utility names through a CSS selector AST, and pins the CSS/HTML/JS together. Semantic hooks stay intact. Runtime root classes are carried by compiled HTML and copied from the verified bootstrap document into isolated Preview. Existing releases retain their original artifacts. Sports initial budgets and Motion-none isolation remain enforced; no Tailwind browser CDN/runtime or CSS compiler is shipped to customers.

## Start locally

From repository root, using Node 24.22.1 and the pinned pnpm 12.15.0:

```sh
export PATH="$PWD/.tools/bin:$PATH"
pnpm install --frozen-lockfile
pnpm --dir tools/go-auth/web --ignore-workspace install --frozen-lockfile
pnpm local:master
```

The launcher pins Go 1.27.3, builds the Go binaries, prepares the existing editor bundle, snapshots existing P0 data or initializes fresh synthetic SQLite data in Go on first run, starts owned children, performs health checks, reports URLs and stops children on Ctrl+C. It refuses occupied ports and never kills their owners. No Docker or AWS prerequisite. Local execution retains the verified macOS kernel network sandbox; unsupported environments fail closed. The Go API also cross-compiles for Linux, but Linux/ECS runtime deployment is not verified.

| Function            | URL                                          |
| ------------------- | -------------------------------------------- |
| Workspace / Login   | http://localhost:4180/                       |
| Dashboard           | http://localhost:4180/dashboard              |
| Form Builder        | http://localhost:4180/studio                 |
| Profile             | http://localhost:4180/settings/profile       |
| Admin-only overview | http://localhost:4180/admin                  |
| Go BFF/business API | loopback 4181, same-origin Vite `/api` proxy |
| Synthetic OIDC      | http://127.0.0.1:4182/                       |
| Customer runtime    | http://127.0.0.1:4183/forms/:siteId/:formId/ |
| Isolated Preview    | http://127.0.0.1:4185/                       |

## Local identities and capabilities

The IdP offers synthetic accounts only, with no passwords. Application roles remain exactly ADMIN and MEMBER. Business permissions come from explicit site memberships, rechecked by Go; legacy viewer/editor/reviewer/publisher labels are UI projections.

| Identity           | App role | Site capabilities                                                                            |
| ------------------ | -------- | -------------------------------------------------------------------------------------------- |
| synthetic-admin    | ADMIN    | PC + Sports: read/create/edit/review/publish/rollback, submissions read, security management |
| synthetic-member   | MEMBER   | PC form read only; no editing, approval, publishing, rollback or submissions access          |
| synthetic-approver | ADMIN    | PC + Sports: form read/review only                                                           |

No membership means deny, including other-site IDs. Approval still requires a different identity from the review author. Use the separate approver identity in a separate browser context to complete that P0 four-eyes flow; entering Studio does not require a second login.

## Data migration and rollback

Original P0 data remains at `var/s2-publication/`; Go refuses to open that DB or its symlink/hardlink aliases for business writes. Its consistent SQLite snapshot, blobs and immutable objects live separately at `var/master/`. Original form IDs, versions, review/release IDs and audit references are retained. Old session/Preview handles are invalidated only in the new copy; Go sessions remain in `var/go-auth/auth.sqlite3`.

The explicit migration refuses an existing destination rather than overwriting it:

```sh
cd tools/go-auth
./go-local.sh run ./cmd/migrate
./go-local.sh run ./cmd/inspect
```

The snapshot verified 67 releases and 902 immutable files. The inspector confirms that all original copied bytes still match the preserved source. SQL migrations are versioned and checksummed. SQLite verification does not establish PostgreSQL compatibility.

The Python rollback runtime has been retired at the user's request (2026-10-27). Keep the original immutable data and migration report for integrity inspection; there is no `local:p0` launcher. Application release rollback remains implemented in Go.

## Runtime boundaries

One Go modular business backend owns forms/sites, permissions, review/workflow, Preview, releases, submissions, outbox and audit. The same Go process owns the isolated Customer/Preview listeners and synthetic worker. No Python API/worker proxy is in the unified path. Python source, oracle, standalone host and environment have been removed.

The TypeScript compiler and Customer runtime remain authoritative for their existing responsibilities. Go invokes a fixed compiler IPC adapter with bounded JSON input/output, timeouts, a clean environment and process-group cancellation. Canonical compilation and tests use the Go semantic verifier by default. New Store Selector locks pin `internal/studio/store_adapter.go`. Existing immutable 1.0.0 metadata retains its original descriptor/digest as historical provenance, mapped only by an exact compatibility pin to the same synthetic Go implementation. No Python package is loaded or executed.

The generated Studio bundle is derived from `tools/go-auth/studio/`, with explicit integration seams for routing, locale and the Go BFF. It has a React-owned lifecycle, scoped DOM/CSS, dirty/save navigation guards, recovery on expiry, and cleanup of timers/listeners/observers. Generated editor assets are ignored; the existing editor is the single source rather than a fork.

## Security

Opaque 256-bit sessions store SHA-256 verifiers only. PKCE S256, browser-bound single-use state, nonce, RS256 signature, issuer, audience and expiry checks remain enforced. Successful authentication rotates/revokes the prior session. No ID/access token enters browser storage. Mutation/API POSTs require exact Origin and the session CSRF verifier. Roles/identity headers are ignored.

HTTPS auth defaults use Secure/HttpOnly/__Host- cookies and SameSite=Lax. The explicit `FM_LOCAL_HTTP=1` exception accepts only loopback HTTP origins and differently named non-Secure cookies. Never use that exception in production. Preview/Customer use 127.0.0.1 rather than the Admin cookie host localhost, omit Admin credentials, and cannot access Admin cookies/tokens. Plugin executables remain outside the Admin origin.

Admission gates, idempotency and outbox writes remain transactional; effects are synthetic receipt-ID records only. Release reads/writes reject symlinks, immutable collisions and corrupted manifests/assets/locks/attestations/semantic fixtures. Logs omit codes, tokens, cookies and payload values. Network evidence records path/method/status only.

## Verification

```sh
cd tools/go-auth
./go-local.sh test ./...
./go-local.sh test -race ./...
./go-local.sh vet ./...
cd web
pnpm --ignore-workspace lint
pnpm --ignore-workspace typecheck
pnpm --ignore-workspace test
pnpm --ignore-workspace build
```

From repository root run `pnpm test`; semantic and nested-payload tests call Go. The retired Python regression counts remain historical evidence. Use the new cleanup report for post-retirement verification.

[Migration route matrix](evidence/migration/ROUTE-MATRIX.md), [execution report](evidence/migration/RESULTS.md), [original Phase 1 evidence](evidence/RESULTS.md). T12/K13 remains `VERIFICATION_PENDING`. No GitHub access, Git mutations, commits or AWS writes were performed.

Production work remains: real IdP and HTTPS registration, PostgreSQL migration/testing, durable multi-task artifact storage, shared rate limiting, deployment/secret provisioning, audit retention and ECS runtime verification. None is claimed by the local cutover.

## Legacy compatibility expansion

The Workspace now offers reviewed draft import and a PC Apply single-item prototype, with reusable styles, contact/date validation, native choice controls and synthetic lookup. See [legacy analyzer setup and limitations](../legacy-analyzer/README.md). This does not close the remaining legacy cart/catalog/payload/parity gaps or T12/K13.
