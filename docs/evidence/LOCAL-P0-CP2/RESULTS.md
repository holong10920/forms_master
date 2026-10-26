# Local P0 continuation — 2026-10-26

Baseline: `693969a8a226af3227ed3bb0e4cd49994126f12c`.
Single writer; working changes remain uncommitted. The latest user policy prohibits Git mutations.
No GitHub access, remote Git operations or AWS writes. Existing SQLite data and releases retained.
The baseline exact-index alternative scan is recorded separately in `693969a-index-secret-scan.json`.

## Executed functionality

- Two pinned customer-info block instances: independent aliases and nested payloads, required
  validation, backend acceptance, r1 → r2 upgrade of one instance, explicit Data Contract ACK.
  Block code does not execute in Admin. Constant inputs resolve before shared-engine evaluation.
- One-level typed AND/OR rule controls, named conditions, required/visible conditions, ordered
  transitions, only current/prior-step fields and public block exports. Existing unsupported
  expressions remain intact. Named AND + integer comparison/required rule tested through UI.
- Default 1.5-second autosave debounce, serialized persistence, edits retained on CAS failure,
  read-only server/local comparison, manual reload. Real two-tab conflict verified.
- Persistent form titles, same-site cloning from immutable published snapshots with new IDs,
  editable cloned steps, finite site-owned pinned themes, Motion preset/categories/speed controls,
  read-only flow overview. Clone/settings and emitted Preview theme verified in browser.
- Review rejection/recheck/staleness, permanent key ownership and identity/type checks,
  write-once blob-backed draft/review documents, publication operation fencing/cancellation/
  recovery, independent outbox admission. Regression tests cover these paths.
- Preview polling checks the pinned candidate and live gates. Revocation removed the iframe in
  5,327 ms without automatically creating a new session. Session-owner checks and old-token
  invalidation have integration regressions. This is not proof of the partial-preview placeholder
  behavior listed below.
- Current no-code browser scenario passed: create, required fields, branch, save/reload, Preview,
  denied self-approval, review/approve, publish, receipt/idempotency, revision two, rollback,
  pinned old revision, cross-site denial. Zero plugin runtime requests in authenticated Admin.

Seven JSON browser results and eleven screenshots accompany this report. Three viewport/element
captures supplement the full-page diagnostic captures; the isolated form itself is visibly rendered. No result was inferred
from source alone. Reference browser evidence includes Sports none/subtle/reduced and PC
store/delivery, failed capability retry and authoritative validation correction.

## Local security scope

Alternative scanner is detect-secrets 1.5.0, all 27 default detectors, no verification requests.
Only exact block-registry findings whose SHA-256 recomputes from the pinned fixture bytes are
classified as fixture digests. Modified bytes remain unresolved in the negative test. Existing
synthetic credentials/private-key negative tests remain enabled. Gitleaks NOT_EXECUTED.
Final `pnpm verify` exited 0: 627 TS passes, 15 declared expected failures, one intentional
optional Gitleaks skip, and 793 Python passes. Format/lint/typecheck/generated/schema/boundaries/
synthetic checks passed. Alternative source scan covered 283 working files and 263 index files,
with zero unresolved findings. Source/index scan and verification summaries accompany this report.
No staged changes exist; this is not an exact-index scan of the uncommitted checkpoint.

CT-26 §9.3.5 rows 1–13 plus 11a are represented by 23 passing local tests, including both ordered
commits for independent form/release incident holds, stale CAS rejection/retry and no lost holds.
Trusted ledger sequence and deployed adapter inputs are fixtures. This is SQLite-domain
concurrency evidence, not actual Git-ledger ingestion, DynamoDB or AWS verification. Global
VG-13 is not declared PASS. HTTP revocation: query/submit 423, zero new submissions, resumed
query 200, unauthenticated Preview 403. The existing synthetic-only/kernel-network conditions
for VG-17 are retained; production or container networking is not claimed.

## Emitted performance

Sports Motion-none: initial JS gzip 11,597 bytes; HTML + CSS + JS gzip 13,063 bytes, measured
from emitted resources listed in `performance.json`, within the 12/16 KiB P0 targets. Font/image
bytes zero. Entire graph: zero Motion modules; compiler isolation audit also checks imports and
chunks. Sports does not contain Store Selector modules. Motion profiles are measured separately;
the Motion-none limit is not applied to guided/subtle profiles. Canonical K13 remains pending.

## Remaining acceptance work

This is a runnable local MVP continuation, not LOCAL_POC_FUNCTIONALLY_COMPLETE,
LOCAL_POC_VERIFIED, S2 DONE or a full G2 PASS.

- T12/K13: BLOCKED_BY_ENVIRONMENT / VERIFICATION_PENDING. No verified Node builder image
  digest or container execution. The approved exception expires before S2 acceptance.
- Canonical REL/LRM/FRA, full provenance/attestation and published-artifact acceptance remain
  incomplete; current immutable releases use the explicitly local `dev_` candidate profile.
- Mock account/session RBAC works. The full specified OIDC Authorization Code + PKCE BFF
  path is NOT_IMPLEMENTED; account picking is not evidence of OIDC/Cognito integration.
- Partial/unconfigured Preview modes, blocked-plugin placeholder reopening, complete impact/
  source-conformance and all UX acceptance cases remain incomplete. Live valid Preview and
  revocation unmounting have execution evidence.
- Git-ledger operational ingestion is not implemented; current matrix uses trusted fixtures.
- Shared-block creation/editing and repeatable-group Builder UI are P1 exclusions; P0 shared-block
  insertion/pinning and S1 group engine fixtures are distinct and are not misreported as missing
  group Builder P0 work.

No new checkpoint commit was attempted under the current absolute Git mutation prohibition.
