# Final local synthetic P0 closure — 2026-10-26

Branch `codex/p03-s1-workflow-engine`; HEAD `693969a8a226af3227ed3bb0e4cd49994126f12c`.
Single writer. Existing CP2 and JA/VI work preserved. Index empty; no stage/commit, GitHub access
or AWS writes. This package describes the executed localhost synthetic scope.

| Acceptance | Verdict | Execution evidence |
| --- | --- | --- |
| OIDC/PKCE | PASS, local mock | Code redirect, S256, cookie-bound state, nonce, fixed redirect/client, RS256 issuer/audience/time checks, encrypted server tokens, replay denial, opaque Secure/HttpOnly/Strict session, Lax transaction cookie, logout/end-session, Viewer/editor/publisher isolation |
| Partial Preview | PASS, local | Shared engine projection; missing paths stop with Back, no Next/submit; diagnostics; saved draft unchanged; invalid review rejected; valid simulation retained |
| SR-08 | PASS, local | Live revocation unmount; manual reopen placeholder; zero Store chunks; stable across two polls; partial submit endpoint denies 403 |
| Canonical host release | PASS, host scope | `rel_` identity from JCS LRM, formats, pinned lock and dependency bytes, Chunk Plan/Manifest, SRI bootstrap, immutable private attestation/provenance, generated TS/Python semantic fixtures; independent final LRM/HTML/inventory bytes match; publish/rollback and corruption negatives |
| Canonical container K13 | PENDING | Host proof is not canonical container proof |
| T12 | BLOCKED_BY_ENVIRONMENT | Local cached Playwright image has Node 24.14.1; exact approved pin is 24.22.1; no compatible verified builder selected |
| Complete browser journey | PASS | Create/edit → save/reload → Preview → review/approve → compile/publish → submit/idempotency → mock effect → second publish → rollback; old explicit revision remains pinned |
| LOCAL_POC_FUNCTIONALLY_COMPLETE | YES | Local synthetic/mock profile only |
| LOCAL_POC_VERIFIED | NO | T12/canonical container K13 outstanding; no full G2/S2 PASS |

## Live demo

- Admin: http://localhost:4174/
- Sports active: http://127.0.0.1:4173/forms/site_sports_synthetic/frm_sports/
- PC active: http://127.0.0.1:4173/forms/site_pc_synthetic/frm_pc_reference/
- Pinned Sports: http://127.0.0.1:4173/r/rel_w4fuidge7q34tu3xwmivd2cc2d/index.html
- Pinned PC: http://127.0.0.1:4173/r/rel_ayic5cin2i4bsabicpnzewvuw5/index.html

Run `pnpm local:p0`; mock OIDC issuer listens on 127.0.0.1:4176, Preview on 4175 and customer
on 4173. Setup and no-code scenario: `tools/local_p0/README.md`. Browser evidence used Chromium
156.0.8078.47. Select `synthetic-editor`, create fields/steps/rules, then use different reviewer
and publisher accounts. Viewer cannot save; `synthetic-other` cannot access Sports/PC.

The normal UI label picker now enters the real local OIDC redirect/code exchange. No browser
token exchange or ID/access token storage was observed. Server keys are ignored local runtime
files with mode 0600 and are absent from the proposed commit. Existing expired/unauthorized
regressions remain. A forced expired-save HTTP response plus real OIDC re-auth regression proves
unsaved form schema survives re-auth and subsequent save/reload; token TTL rejection itself is
also exercised against SQLite. No Cognito, external IdP or cross-domain production cookie result
is claimed.

Partial Preview reuses the S1 engine and compiler. Projection is pure and keeps the source draft
intact. `PREVIEW_ONLY_UNCONFIGURED_PATH` cannot advance or submit. Gate-preview errors such as
cycles/unsafe references still refuse interactive execution. Preview-only artifacts cannot be
activated. For revoked plugin reopening, no plugin executable chunk is emitted, only a host-owned
placeholder. The original pinned source digest, parent session, scope/version and live gates
remain checked. This is not a second rule engine or renderer.

## Tests and security

Final full `pnpm verify`: exit 0; **638 TS passed**, **15 declared expected failures**,
**one intentional optional Gitleaks skip**, **798 Python passed**. Format, lint, typecheck,
generated-file/schema checks, package boundaries, synthetic and network tests passed.
Negative coverage includes PKCE/state/code replay, signature/claims/expiry, viewer/cross-site
writes, corrupt index/LRM/attestation, plugin revocation, CAS and publication fencing. Existing
S1 semantic parity, backend recompute, draft TTL/CAS/release pinning and store tests were retained.
CT-26 uses SQLite domain interleavings and trusted ledger fixtures; it is not DynamoDB or live
Git-ledger ingestion verification. No broader VG-13 claim is added here.

Accepted alternative scan: detect-secrets 1.5.0, all **27 default detectors**, `--no-verify`.
302 working source files and 263 current-index source files: **0 unresolved**. Index has no
proposed checkpoint staged; this does not substitute for a future exact-index precommit scan.
27 emitted public/Admin/Preview files: **36 classified findings, 0 unresolved**. Public asset
integrity values were recomputed. Five keyword findings cover parsed JavaScript program spans,
not credential literals; AST proof counts are included. No detector was disabled. Scanner
limitations remain heuristic, without online verification; no equivalence to Gitleaks is claimed.
Gitleaks **NOT_EXECUTED**.

Two source-test findings were the public S256 example from
[RFC 7636 Appendix B](https://www.rfc-editor.org/rfc/rfc7636.html#appendix-B). Classification is
restricted to those exact public values and exact fixture/scanner paths; a generated credential
in the same test file still fails the negative test. No secret values are printed in reports.

Fresh kernel probes deny external IP traffic with EPERM while allowing approved localhost
traffic for Node and Python Form API/Preview/worker/adapter roles. The launcher passes a clean
synthetic-only environment. No real connector or external effect is enabled. These retain the
local VG-17 conditions of the accepted synthetic risk; they do not establish container or AWS
network isolation. A current receipt/outbox/effect join is included separately.

## Performance from emitted canonical host artifacts

Sports Motion-none initial JS gzip **11,613 B**, initial HTML+CSS+JS gzip **13,320 B**:
within the approved 12/16 KiB targets. Exact resources and sizes are in `performance.json`;
IR bytes are reported separately, fonts/images zero. Initial JS includes the SRI bootstrap and
its static entry graph. Entire emitted Sports-none graph has **0 Motion modules/imports/chunks**
and **0 Store modules**. Subtle/guided and actual lazy loading were verified separately.
No full canonical performance PASS is claimed without K13 in the approved builder.

## Remaining mandatory environment gate

No builder image digest is fabricated. Local release LRM records `HOST_ONLY` and the actual host
Node executable digest; it omits an unverified image digest. Attestation explicitly keeps
`canonicalK13: VERIFICATION_PENDING`. Local release IDs do not imply container verification. The additional
`sports-release/host-final-verification.json` record binds the current orchestrator digest and
proves the final canonical public file maps identical across independent runs. Original immutable
release attestations are retained; later successful rebuilds add verification records.
The supported Node 24.22.1/pnpm 12.15.0 builder must be pinned to a real verified digest and run
before canonical container K13 or full G2/S2 can pass. Dockerfile/container build has not been
claimed complete. No registry/download retry was made. The cached image test used
`--pull=never --network=none` and returned Node 24.14.1.

Owner: platform/build maintainer. Exception scope: localhost, synthetic/mock data, host-verified
local releases only. Exit criterion: exact supported builder verified by digest; frozen toolchain
and dependencies; full container verification and independent A/B K13 executed successfully.
Deadline: before S2 acceptance. G9/G10 remain blocked.

## Commit review

`PROPOSED-SCOPE.md` and `FILE-SNAPSHOT.json` enumerate the actual tracked/unstaged/untracked
files and proposed groups. Staged diff is empty. Existing governance/JA-VI evidence is identified
as carry-forward work. No Git hooks were bypassed and no new commit was attempted.
