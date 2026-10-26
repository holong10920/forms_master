# S2 CP2 — PC/plugin, Motion and local publication

CP1 committed exactly 34 approved files at `079d2864bf2a6cf240eaf58605f810fc6f94e4a2`
with approved message. CP2 remains uncommitted, pending scope approval. Single writer;
no GitHub, AWS, Admin or lookup/prefill merge. S2 IN PROGRESS; T12/canonical K13 pending.

## Runnable artifacts

Run `pnpm compiler:build`, then `pnpm compiler:serve` (loopback 4173).

- Sports none: http://127.0.0.1:4173/r/dev_ctfxeqd7kkgar7pe7b5ws5csqu/index.html
- Sports subtle: http://127.0.0.1:4173/r/dev_zuubq7acqk6han4weplex5coxp/index.html
- PC guided/store-selector: http://127.0.0.1:4173/r/dev_wsgiigw5akq5supbliez3gzbb7/index.html
- Sports active alias after publication demo: http://127.0.0.1:4173/forms/site_sports_synthetic/frm_sports/

Shared S1 engine owns state/navigation/validation. Plugin receives FieldProps and opaque
callbacks; local server derives site/form/IR from the verified candidate and recomputes
submission. Store query/validation are synthetic read-only mocks. Cross-site store IDs fail.
Manifest 1.0.0 is digest-pinned; browser/server facet keys and source hashes are locked;
server facet mismatch fails closed. Unsupported manifests/versions fail compilation.

Motion adapter uses pinned React/Motion and approved subtle/guided preset recipes. It receives
value-free notices, not form values or engine access. Core owns focus. Reduced motion avoids
Motion fetching on initial load. The local profile retains the small DOM core and loads React
with presentation facets; canonical React core/shared-externals layout is not claimed complete.

## Execution evidence

- Full `pnpm verify`: **exit 0**, **622 TS passed**, **727 Python passed**, 15 declared expected
  failures, one intentional optional Gitleaks test skip. Format/lint/type/schema generation drift/
  boundaries/synthetic/socket isolation PASS. See `verification.txt`.
- `pnpm install --frozen-lockfile --offline`: exit 0 using populated user pnpm cache.
- Compiler tests compare actual variant module graphs, repeat PC byte/identity equality, one
  pinned React version, no server/design/Python/data modules in client, and negative facet/version
  controls. Existing independent-output-root/hash/tamper tests remain PASS.
- Headed Chromium **156.0.8078.47**: Sports none, subtle, subtle/reduced, PC delivery and PC
  store complete. Inactive store field/module/query absent from delivery. Capability 503 stays on
  current step; retry succeeds. Authoritative 422 returns to field and preserves correction/retry.
  Cross-site store is rejected. No normal page errors. `browser-proof.json` contains requests;
  `browser-proof.txt` reproduces via Playwright CLI run-code against the three built candidates.
- Entire Sports-none emitted graph: **0 Motion modules/imports/chunks** and 0 store modules;
  browser requests agree. Sports subtle has no Store Selector. Motion-enabled graphs have 229
  Motion modules; PC has one store browser module. No source-size/tree-shaking inference used.
- `pnpm compiler:publish-demo`: immutable A then B, CAS pointer then rollback A; existing pinned
  B remains usable. See `publication.json` (versions are monotonic and vary on rerun). OS-owner
  CLI only; no privileged HTTP write endpoint. Tests cover stale CAS, wrong-site rollback,
  unauthorized actor, tampering and pointer preservation. Publication uses S0 write-once store
  and SQLite transaction ports. No customer payload persists.
- One self-review completed; corrected PC HTML title and closed plugin metadata pin; no
  independent review round. Engine rejection handling has a focused navigation regression.

## Approved P0 budget: actual emitted bytes

Gzip level 9, each resource independently compressed; `performance.json` lists raw/gzip/Brotli,
actual filenames, static initial closure and lazy resources. Fonts/images: none.

| Variant | Initial JS gzip | HTML + CSS + JS gzip | IR gzip, separate | Whole artifact gzip, including lazy JS/IR |
|---|---:|---:|---:|---:|
| Sports none | 11,216 B | 12,460 B | 718 B | 13,178 B |
| Sports subtle | 11,907 B | 13,227 B | 909 B | 111,241 B |
| PC guided | 12,053 B | 13,484 B | 1,249 B | 112,715 B |

Sports none counted resources: `index.html` **777 B**, `assets/entry.33ba83cdc600.css`
**467 B**, `assets/entry.4b6c5fead2d8.js` **11,216 B** gzip. Total **12.17 KiB**;
JS **10.95 KiB**. Approved local P0 ceilings (12 KiB JS / 16 KiB HTML+CSS+JS) met.
IR is separately reported; including IR gives 13,178 B. These are measured local candidate
results, not full canonical performance PASS. Motion lazy cost is material (~97 KiB gzip
including React), explicitly visible in graph/size evidence; no Motion-enabled budget approved.

## Security coverage

Alternative scanner **detect-secrets==1.5.0**, all **27 default detectors**, `--no-verify`;
JSON results examined. Working source 239 files and index 208 files: **0 unresolved**;
no staged CP2 files yet. Exact staged scan remains required before CP2 commit. Existing negative
scanner/synthetic/boundary/network tests PASS. Gitleaks **NOT_EXECUTED**; accepted alternative
for local synthetic P0, not a claim of scanner equivalence.

Direct scan of all **16 public emitted files**: 24 findings, **0 unresolved**. Nineteen are
recomputed public asset/SRI digests. Five are minified JavaScript program spans (core field
handling/runtime actions or pinned React DOM event code), not credentials. `artifact-secret-scan.json`
and per-file SHA-256 `artifact-scan-manifest.json` record coverage/classification without values.
Scanner is heuristic, has no online credential validation, and cannot prove absence of secrets.
No detectors disabled; no source classification rules weakened.

## Remaining acceptance

T12 builder image digest/container build and canonical K13 remain **VERIFICATION_PENDING** /
**BLOCKED_BY_ENVIRONMENT**; no registry debugging, invented digest or canonical result.
All URLs/publication use `dev_` / localCandidateFormat1, not canonical REL/LRM/FRA/activation.
Canonical provenance/ledger/security activation, shared-block compilation and full Preview/artifact
conformance still require S2 work. Local publication is explicitly OS-owner/synthetic, not
production authorization. Do not mark S2 DONE or full performance PASS.
