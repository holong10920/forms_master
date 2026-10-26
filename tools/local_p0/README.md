# Local Form Studio (synthetic P0)

From repository root on macOS:

```sh
export PATH="$PWD/.tools/bin:$PATH"
export UV_CACHE_DIR=/tmp/forms-master-uv-cache
pnpm install --frozen-lockfile
uv sync --locked
pnpm local:p0
```

Open **http://localhost:4174/** with Chromium. Admin uses a Secure/HttpOnly/SameSite=Strict
`__Host-session` cookie; verified on Chromium 156.0.8078.47 over localhost. Preview is a separate
origin **http://127.0.0.1:4175/**; Customer is **http://127.0.0.1:4173/**. The launcher applies
`network.sb` and passes a clean environment to the host/children. Unsupported kernel sandbox
fails startup; do not bypass it for a risk-bearing demo. Only approved loopback ports are allowed.
No SMTP, external business connector, AWS or GitHub calls. No real data or credentials.

Mock IdP accounts: `synthetic-editor`, `synthetic-reviewer`, `synthetic-publisher`,
`synthetic-other` (other site only), `synthetic-security`. This account picker is deliberately a
local mock, not production authentication or Cognito/OIDC verification. Membership and roles
are read from SQLite by the server, never from browser role claims.

## No-code scenario

1. Log in as editor, select site, create form. Add choice/text/number fields from Palette.
2. Select fields on Canvas. Inspector edits labels, keys, required, inactive clearing, classification,
   numeric/length/item validation, visibility, options and supported calculated dependencies.
3. Add another step, move fields with Inspector. On first step add a choice-equality branch
   to review; default continues to the next input step. Diagnostics enforce DAG/reference rules.
4. Save/reload. Preview creates a short-lived session, hands it to a separate-origin iframe by
   exact-origin/source postMessage, and executes the compiled shared engine. Preview writes no
   submissions/outbox. Plugin code never loads in authenticated Admin.
5. Request review. Switch to a different reviewer; inspect immutable snapshot/Data Contract,
   approve. Switch publisher and publish. Customer URL is shown in release history.
6. Complete synthetic customer flow. Receipt/idempotency and outbox/mock effect are persisted
   atomically in local SQLite. Effects contain receipt IDs only, no email/SMS or business writes.
7. Editor changes field label/rule, requests another review; reviewer approves, publisher publishes.
   Roll back from release history. Existing explicit revision URLs stay pinned.

Draft save uses expected version; conflict returns 409 without overwriting. To resolve, reload
before editing again. Published form deletion is refused. Session role change clears data for
sites outside the new membership and revokes old Preview sessions. Preview cannot use Admin
cookies. Customer serves published artifacts only in this integrated host.

## Approved reference fixtures

In a second terminal, build then activate the already approved G3 references through mock
editor/reviewer/publisher roles (CLI requires the local repository OS owner):

```sh
PATH="$PWD/.tools/bin:$PATH" sandbox-exec -f tools/local_p0/network.sb node tools/compiler/src/cli.ts build > /tmp/forms-local-references.jsonl
FB_NETWORK_SANDBOX=required sandbox-exec -f tools/local_p0/network.sb .venv/bin/python -m tools.local_p0.seed < /tmp/forms-local-references.jsonl
```

Sports none is restored active after Sports subtle is published. PC guided uses pinned trusted
Store Selector 1.0.0. Re-run prints the current immutable URLs and increments pointer versions.
Use `local:p0` for the integrated app; `compiler:serve` remains an explicit developer candidate
server and should not run alongside it. Mutable local data remains in ignored `var/`; no reset
or cleanup is required to rerun verification or the demo.

## Verification

`pnpm verify` covers types/lint/format, pure-engine golden parity, backend recompute, compiler
integrity/isolation, store and local-control regressions. `test/browser-flow.txt`,
`test/reference-browser.txt`, `test/numeric-browser.txt` are actual Playwright CLI run-code
scenarios. Run with Playwright CLI against this host. Last execution/evidence, measured sizes,
security gates and remaining scope: `docs/evidence/LOCAL-P0/RESULTS.md`.

The local `dev_` candidate profile and account picker do not establish canonical REL/LRM/FRA,
production authorization or container reproducibility. T12/canonical K13 remain pending.
