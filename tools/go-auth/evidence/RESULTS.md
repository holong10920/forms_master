# Phase 1 verification — 2026-10-26 (Asia/Ho_Chi_Minh)

Implemented and exercised on localhost. No deployment, GitHub access, Git mutations or AWS operations.

## Entry points and demos

- React: http://localhost:4180/login (Japanese), http://localhost:4180/login?lang=vi (Vietnamese).
- Go API: loopback 4181, accessed through the same-origin Vite /api proxy. Direct requests must preserve Host: localhost:4180.
- Synthetic IdP: http://127.0.0.1:4182. Sign in from React, then choose `synthetic-admin` or `synthetic-member`. No password or real identity is involved.
- P0 remains on 4173–4176. Its fixed OIDC client/callback and six-identity model cannot serve this new client without modification, so the new module has its own IdP, keys, SQLite file and sessions. This is isolated local integration, not production identity assurance.

## Implemented permission matrix

| Action                               | ADMIN                | MEMBER               | Anonymous |
| ------------------------------------ | -------------------- | -------------------- | --------- |
| Start OIDC login                     | Yes                  | Yes                  | Yes       |
| Current user / own profile           | 200                  | 200                  | 401       |
| Dashboard API                        | 200                  | 200                  | 401       |
| Admin overview API                   | 200                  | 403                  | 401       |
| Logout with same Origin + valid CSRF | 204, session revoked | 204, session revoked | 401       |

Go queries role and active status from storage on every authenticated request. Client role headers/payloads do not grant permissions. React hides Admin navigation and displays the API's 403 on manual Admin navigation.

## Structure

```text
cmd/api                 Go BFF entrypoint
cmd/local-idp           fixed loopback synthetic identity provider
internal/auth           OIDC, session middleware, CSRF, RBAC, configuration
internal/persistence    SQLite store + embedded 001_init.sql migration
internal/platform       environment helpers, timeouts, graceful shutdown
internal/localidp       synthetic issuer, one-use codes, S256, RS256/JWKS
web/src                 React/strict TypeScript shell, login, JA/VI, tests
```

Backend endpoints: GET /api/v1/auth/login, GET /api/v1/auth/callback, GET /api/v1/auth/me, POST /api/v1/auth/logout, GET /api/v1/dashboard, GET /api/v1/admin/overview.

## Executed automated checks

| Check                             | Result                        | Evidence                                 |
| --------------------------------- | ----------------------------- | ---------------------------------------- |
| Go 1.27.3 formatting              | PASS                          | go fmt ./...; final files formatted      |
| Go unit + integration             | PASS, 23 test/subtest events  | go-test.txt                              |
| Go race detector                  | PASS                          | go-race.txt                              |
| Go vet                            | PASS (empty diagnostics)      | go-vet.txt                               |
| govulncheck                       | PASS, no vulnerabilities      | govulncheck.txt, govulncheck-verbose.txt |
| React lint                        | PASS                          | react-lint.txt                           |
| React strict typecheck            | PASS                          | react-typecheck.txt                      |
| React tests                       | PASS, 11 tests                | react-test.txt                           |
| React production build            | PASS                          | react-build.txt                          |
| Frontend dependency audit         | 0 advisories                  | pnpm-audit.json                          |
| Gitleaks 8.30.1 on new module     | PASS, no leaks                | gitleaks.txt                             |
| Existing P0 TypeScript OIDC tests | PASS, 3 tests                 | p0-oidc-ts.txt                           |
| Existing P0 Python OIDC tests     | PASS, 2 tests                 | p0-oidc-python.txt                       |
| Existing running P0 HTTP smoke    | 200 on http://localhost:4174/ | Executed with curl                       |

Go tests cover Admin/Member identity, invalid nonce/state/PKCE, signature/issuer/audience/expiry/future iat, expired flow, one-use flow and authorization codes, disabled users, 401/403/200 behavior, expiry, logout revocation, fixation/rotation, trusted Origin and CSRF requirements, forged role headers, concurrent reads/callbacks, immediate role/status changes, rate limits, redirect rejection, secure production cookie attributes, persistence across a reopened database, and hashed session storage. HTTPS mode rejects HTTP and the local HTTP exception rejects non-loopback and HTTPS origins.

React tests cover bootstrap, login/loading/error, role navigation, Admin API denial, profile, refresh, logout, expiry without redirects looping, JA/VI, retry, destination allowlisting, and stale responses arriving after logout.

The initial x/sys Windows-only module advisory was removed by upgrading to v0.47.0. The final scan reports no vulnerabilities. The Go proxy was configured with no `direct` fallback; no Git remote was contacted.

## Real Chrome browser evidence

- Admin login → dashboard → Admin page → refresh remains authenticated → logout → /me 401. Admin API 200.
- Member login → dashboard → refresh → manual /admin denied → direct Admin API with forged role headers 403. Admin navigation count zero.
- Active synthetic session deliberately expired in this module's isolated SQLite database → UI returns to /login with Vietnamese expiry feedback → re-login succeeds → logout → /me 401.
- Go API restarted with the final source; the existing session survived restart and browser refresh (200).
- Member dashboard and login tested at 390px; no horizontal overflow.
- Session cookie: HttpOnly, SameSite=Lax; Secure=false only in explicit local loopback HTTP mode. Production Secure/__Host- policy also checked by Go tests.
- localStorage and sessionStorage contained no entries in the inspected authenticated browser.

Sanitized network evidence: browser-admin.json, browser-member.json, browser-expiry.json, browser-restart.json. Only method, path and status are recorded. No authorization query values, tokens, cookie values or CSRF values are retained in these evidence files.

Screenshots under repository `output/playwright/`:

- go-auth-login-ja.png
- go-auth-login-vi.png
- go-auth-admin-dashboard.png
- go-auth-admin-page.png
- go-auth-member-dashboard.png
- go-auth-member-denied.png
- go-auth-member-mobile.png
- go-auth-session-expired.png
- go-auth-member-relogin.png
- go-auth-login-mobile.png

Browser-discovered issues corrected: the IdP uses same-origin Referrer-Policy so its form POST carries the expected Origin; its CSP explicitly permits the configured BFF origin for the post-authentication redirect. Vite polling prevents stale transformed modules in this environment. Self-review also added a session generation check to prevent a response already in flight from restoring the shell after logout, and hardened the local-only configuration guard.

Browser CLI initially hit macOS sandbox restrictions; an isolated profile was launched through the approved escalation mechanism. No automatic approval rejection occurred. Expected unauthenticated/forbidden HTTP requests produce Chrome network diagnostics; these are intentional 401/403 checks. No claim is made that the entire repository verification suite or production deployment was run.

## Preservation, changed files and proposed commit scope

Initial branch main, HEAD 7f86cd5, clean staged/unstaged/untracked state. Final inspection shows only the new tools/go-auth/ directory. No existing P0, Python, JA/VI, workflow, compiler, static runtime, root dependency manifest or root lockfile was edited. Process listing was denied by the sandbox, so writer absence could not be conclusively established; existing listeners were inspected and never stopped. All new work stayed in the isolated directory.

The standing absolute Git mutation prohibition prevented creating the requested branch/worktree. No branch, worktree or commit was created. Full inventory: changed-files.txt. Build/dependency output and local SQLite state are ignored; screenshots follow the repository's ignored output/playwright convention.

Proposed commit: `feat(auth): add isolated Go OIDC BFF and React Admin/Member shell` — tools/go-auth source, migration, independent dependency locks, tests, local setup and sanitized evidence. Review locally before any future Git action. G9 (GitHub push) and G10 (AWS writes) remain blocked.

## Remaining production boundaries

- Replace synthetic issuer with a registered real IdP; review its HTTPS discovery endpoints and provision credentials through the deployment environment. No password fallback exists.
- Migrate to and test against PostgreSQL. SQLite validation does not establish PostgreSQL compatibility.
- Add shared ingress rate limiting before multiple ECS tasks; the present bounded limiter is per process/direct peer.
- Configure HTTPS frontend hosting, host preservation, secret delivery, production session/audit retention and multi-task persistence. No ECS deployment or production hardening claim.
- User management, invitation, password reset, MFA, email and the rest of the Admin ecosystem remain out of scope.

Local setup and verification commands are in ../README.md. Go commands use go-local.sh to pin GOTOOLCHAIN=go1.27.3 and keep tool caches under /tmp.
