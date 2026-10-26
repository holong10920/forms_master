# Local P0 fast-track checkpoint — 2026-10-25

Baseline: `079d2864bf2a6cf240eaf58605f810fc6f94e4a2` (S2 CP1 committed exactly 34 files).
Single writer. All further source/evidence remains uncommitted; no GitHub/AWS access/writes,
no reset/stash/clean or deletion of prior local data. This checkpoint delivers a runnable
no-code local vertical slice, not full G1 conformance or project DONE.

## Live URLs and setup

- Admin: http://localhost:4174/
- Sports none: http://127.0.0.1:4173/r/dev_5phun2ikn3s4yhgbkfslcawu53/index.html
- Sports subtle: http://127.0.0.1:4173/r/dev_xvpzzy6yk3js664citsenm5ous/index.html
- PC guided: http://127.0.0.1:4173/r/dev_j4qauvr3ej7eq5z6lakjkqcwck/index.html
- No-code form after rollback: http://127.0.0.1:4173/r/dev_3uab4klsq5jfoe3rjocory6i4g/index.html

Run `pnpm local:p0`. Setup/reproducer: `tools/local_p0/README.md`. Mock roles editor/reviewer/
publisher/security are separate users with server-owned SQLite membership. Other-site user
cannot read or mutate Sports/PC. Chromium localhost cookie is Secure, HttpOnly, SameSite=Strict;
flags recorded without values in `numeric-browser.json`.

## Batch A — local Compiler/Runtime

PC Store Selector trusted manifest/version/source pins, Motion guided/subtle and Sports none
are implemented using the shared S1 engine. Actual graph/hash checks, negative server/design
facet controls, two-output-root deterministic tests, modified-file/unexpected-file rejection
remain PASS. Immutable S0 object store, release history, CAS activation and rollback are local.
All identities remain `dev_` candidates, not canonical REL/LRM/FRA/activation attestations.

`reference-browser.json` has real Chromium 156.0.8078.47 runs for Sports none/subtle/reduced,
PC delivery/store, required validation, inactive exclusion, 503 capability retry, authoritative
422 correction, cross-site store rejection and pinned old revision after rollback. Entire none
graph has **0 Motion modules/imports/chunks**; Sports variants have **0 Store Selector modules**.
Delivery path fetches no store-specific code/query; shared React chunks can be loaded by Motion.

## Batch B — runnable Admin MVP

SQLite draft create/read/update/delete (unpublished only), expected-version CAS, membership/RBAC,
opaque sessions/CSRF/Origin/Host checks, audit of accepted state transitions, Canvas, Palette,
schema-backed Inspector subset, steps/equality branches, diagnostics, save/reload, isolated
Preview, immutable review snapshot/other-user approval, publish/history/rollback are implemented.

Admin serves host-owned static HTML/JS/CSS only; plugin runtime never loads there. Preview
origin is 127.0.0.1:4175, Admin is localhost:4174. Exact-origin/source handshake sends Preview
session into iframe memory; protected IR/API requires header token, expiry, parent session,
site/form/version and live plugin gate checks. Customer origin serves published artifacts only.
Preview uses compiled runtime/shared engine and read-only simulate-submit; no second evaluator.

Submission backend recomputes with S1 evaluator. Admission gates + idempotency + submission +
outbox commit in one SQLite transaction. Replay with identical release/values returns the
stored receipt; changed request returns 409. Mock worker checks gates and records only a local
receipt-linked effect, once. No email/SMS/external effects or production connectors.

## Batch C — execution evidence

`no-code-browser.json`: **allPassed true**. The form was created entirely through UI:
choice + required text, two input steps, no → review branch, save/reload, required/branch
Preview, rejected editor self-approval, other reviewer approval, publisher activation,
customer completion, identical/different idempotency retries, second revision, rollback,
old revision pinned, unauthorized cross-site 403. Screenshots: `local-p0-admin-preview.png`,
`local-p0-customer-complete.png`, `local-p0-rollback.png`. `no-code-definition.json` records the
saved definition; `mock-effect.json` proves receipt → DONE outbox → local effect.

`numeric-browser.json`: invalid decimal cannot advance and cannot submit a stale old number;
corrected integer reaches review as a JSON number. This fixes an actual typed-input issue.

Final full `pnpm verify`: **exit 0**, **622 TS passed**, **748 Python passed**; 15 declared
expected-fail, one intentional optional Gitleaks skip. Format/lint/type/gen/schema/boundaries/
synthetic/socket isolation PASS. `verification.txt` has exact summaries. Frozen offline install
PASS, no dependency downloads. Self-review caught and corrected fail-fast S0 `Conflict` mapping
at host startup and unsafe missing-gate auto-recreation. Both have targeted regressions.

## Security gates and exact limits

- Alternative scan **detect-secrets==1.5.0**, all **27 default detectors**, `--no-verify`, JSON
  results examined: source/index **0 unresolved**. Source coverage exclusions and hash manifests
  in `source-secret-scan.json`. No checkpoint files staged yet; exact-index scan still required
  at the commit step. Gitleaks **NOT_EXECUTED**; alternative accepted for local synthetic P0.
- All 16 reference public emitted files plus 4 Admin/Preview static files scanned: **20 files**,
  **24 classified findings**, **0 unresolved**. Nineteen recomputed public integrity digests;
  five JS program spans (18,901–118,905 characters), not credential literals. No detector disabled.
  Heuristic/no online verification; not a claim of equivalence to Gitleaks or absolute absence.
- **VG-17 local synthetic conditions:** kernel `sandbox-exec` profile denies external IP with
  EPERM and permits approved loopback traffic for Node API/build and Python Form API/Preview/
  worker/adapter roles (`network-*.json`). Launcher passes clean environment, configuration
  permits only synthetic mode and two named mock connectors/effect. Tests reject real mode,
  external connectors/effects/credential env; every RPC security route fails closed on store
  unavailability. Mock effect is local SQLite only. Local conditions PASS; no container image
  or production-network proof claimed. Owner: local demo operator/platform-security; recheck
  before changing config, environment, connectors or data mode.
- **CT-26 / VG-13:** SQLite controlled revoke-before-submit and submit-before-revoke tests PASS;
  missing-gate denial, authorized repair preserving M3, source blocker preservation, stale CAS,
  no blind ingestion reopening, pre-ingestion override 404 and idempotent effect tested.
  `security-http.json`: actual revoked query/submit 423, zero new submissions, resume query 200;
  unauthorized Preview denied. These are a **subset**, not the complete §9.3.5 matrix or a
  DynamoDB Local/AWS result. **VG-13 remains PENDING.**

## Actual emitted performance

`performance.json` inventories measured resources with gzip level 9 / Brotli quality 11.
Sports none: initial JS **11,443 B**, initial HTML+CSS+JS **12,691 B**, under approved 12/16 KiB.
Counted: `assets/entry.2b2f6434f050.js`, `assets/entry.33ba83cdc600.css`, `index.html` (see JSON
for exact final filenames/bytes). IR reported separately; fonts/images none. Full lazy Motion
cost is included in whole-artifact totals, not hidden in the initial figure. Canonical K13 is
pending, so no full performance PASS.

## Completion/gate classification

| Item | Status |
|---|---|
| Requested no-code local vertical slice | Executed PASS; runnable MVP |
| LOCAL_POC_FUNCTIONALLY_COMPLETE for all G1 P0 | **NOT YET ASSERTED** — remaining scope below |
| LOCAL_POC_VERIFIED | **NO** |
| T12 / canonical K13 | **BLOCKED_BY_ENVIRONMENT / VERIFICATION_PENDING** |
| Full CT-26 / VG-13 | **IMPLEMENTED_BUT_VERIFICATION_PENDING** for tested admission subset; full matrix pending |
| Canonical release provenance/activation/registry ledger/deployment convergence | **NOT_IMPLEMENTED** beyond the explicit local candidate adapter |
| Group/repeatable/shared-block customer compilation and complete Preview conformance | **NOT_IMPLEMENTED** / pending; compiler fails closed on unsupported group profile |
| Full review reject/recheck/stale-reason and publish operation/reconciler lifecycle | **NOT_IMPLEMENTED** beyond MVP approval + atomic local activation |
| Mock IdP OIDC Code/PKCE/Cognito integration | **NOT_IMPLEMENTED**; current account picker is local mock only |

Local Docker cache checked, `node:24` absent; no verified required Node24 builder digest or
container result obtained. Builder README requires node:24.22.1-bookworm-slim digest. No registry
retry/download/debugging or fabricated digest. T12 must close before S2 acceptance; G2 remains
conditional, G9/G10 blocked. No S0/S2/full P0 DONE claim. Remaining non-container code is not
misclassified as an environment limitation. Commit approval is the next governance checkpoint;
implementation beyond this snapshot remains within the user's continuous P0 authorization.
