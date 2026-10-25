# S2 checkpoint 1 — Sports Motion-none static candidate

G3 closure `161fef2ba5b65e4fdc6c3ac867e9449350022f19` committed exactly 19 approved files;
G3 APPROVED / P03 DONE by explicit user decision. S1 reference CLI has four runs but three
unique terminal states: Sports golf/Junk and racket/used share `stp_done_shuccho`; the two
PC runs end at store and takuhai terminals respectively.

S2 source is an uncommitted local candidate on top of G3. No automatic S2 commit.
Plan: `docs/superpowers/plans/2026-10-25-s2-compiler-static-runtime.md`.

## Runnable artifact

- `pnpm compiler:build`, then `pnpm compiler:serve` (loopback 127.0.0.1:4173).
- Open `/r/dev_x6kt4acujizzs4r6rpek3fmsvp/index.html`.
- Compiler consumes the approved Sports executable reference definition, uses S1 structural
  and semantic guards, freezes canonical IR/Data Contract, bundles a literal runtime entry
  with Vite 8.3.5 / Rolldown 1.2.15. Engine functions are imported from `@fb/form-engine`;
  no second workflow evaluator, global plugin registry or definition-derived import paths.
- HTML/JS/CSS/IR are actual static files. HTML pins candidate/form/site/revision, JS/CSS use SRI,
  IR SHA-256 is checked before interpretation; URL pin mismatch/tampered IR disables the form.
  Strict same-origin CSP, no unsafe-eval, no API/business effects, no customer-data persistence.
- Renderer is a minimal DOM adapter for supported scalar Sports fields, not the final
  React/plugin BrowserHostApi implementation. Canonical IR is structurally checked at build;
  runtime calls semantic `assertIR` after integrity/pin checks. Ajv is absent from the bundle.
- Public candidate files and private graph/inventory are separate. Reuse compares exact file
  membership and bytes, rejects tampering/extra files; compilation does not change an active
  pointer, publish a canonical release or call AWS. Publish/rollback integration is a later slice.

## Execution evidence

- `pnpm verify`: PASS, exit 0. TS **618 passed**, 15 declared expected-fail, 1 intentional
  optional Gitleaks skip. Python **724 passed**. Format/lint/types/schema drift/boundaries/
  socket-isolation/synthetic checks PASS. Frozen offline pnpm install PASS with no downloads.
- Eight compiler tests cover independent clean-workdir byte/identity equality, identity change
  on definition change, write-once/tamper/unexpected-file rejection, unsupported profile and
  negative Motion/store/dynamic-import/source-map/path controls. New runtime boundary fixture
  rejects Node imports and the engine depending on presentation.
- Alternative source scan: detect-secrets==1.5.0, 27 defaults, --no-verify, JSON results checked,
  0 unresolved in working source and committed index. Exact-index scan required before any
  future S2 commit. Gitleaks NOT_EXECUTED. One Base32 alphabet false positive was removed by
  equivalent character generation; no detector or classification policy was weakened.
- Direct artifact scan also covered all four emitted files using the same 27 detectors. Four
  findings were classified with evidence: three recomputed SRI/IR digests and one minified
  JavaScript program span caught by the keyword detector; 0 unresolved. See `artifact-secret-scan.json`.
- Actual headed Chromium Playwright run: golf/Junk and racket/used reach synthetic completion;
  required category/Junk description, Back/preserve and inactive payload exclusion verified.
  Negative pin mismatch and IR hash mismatch stop interaction. No normal page errors.
  Every captured request was to the pinned loopback candidate. See `browser-proof.json`. Chromium 156.0.8078.47.
  Reproducer: open candidate with Playwright CLI, then pass `browser-proof.txt` as run-code.
- Bundle graph is normalized, has one entry chunk and zero Motion/Store Selector/Ajv modules;
  zero dynamic imports, zero Motion code bytes. Readable private-manifest copies are serialized for evidence; authoritative candidate bytes
  remain canonical JCS under `var/s2-candidates/private/`. Actual graph + inventory plus browser network
  proof establish Motion-none for this local candidate, not merely animation visibility.
  Negative module fixtures prove the artifact gate rejects Motion and Store Selector.
- Five separate Node build processes use fresh temporary input workdirs and produce the same
  candidate ID. Median **519 ms** excluding install; this is local/macOS evidence, not K13.
  Two independent output roots are also compared byte-for-byte by automated test.

## Measured bytes / proposed budget (not approved)

| File group | Actual raw | Actual gzip | Proposed ceiling |
|---|---:|---:|---|
| Initial JS | 30,002 B | 9,783 B | 40 KiB raw / 12 KiB gzip |
| All initial files | 34,572 B | 11,595 B | 48 KiB raw / 16 KiB gzip |
| Motion modules / bytes / imports | 0 | 0 | Exactly 0 |

Gzip level 9 / Brotli quality 11, per-file compression; these are compressed file sizes,
not claimed HTTP transfer bytes (the diagnostic server serves uncompressed). Node/zlib/Brotli
versions and file breakdown: `artifact-sizes.json`. Build times: `local-build-times.json`.
A single unthrottled browser-ready mark is diagnostic only; no CWV/Slow4G/latency PASS.
Numeric byte ceilings are a proposal for user approval; no invented accepted budget.
Full three-session/latency/performance acceptance remains pending before S2 DONE.

## T12 and remaining acceptance

**T12 VERIFICATION_PENDING / BLOCKED_BY_ENVIRONMENT:** no verified builder image digest,
container build/test or two-container K13 evidence. No registry/debugging retries were made.
This slice emits `localCandidateFormat:1` with `dev_...` identity, includes actual compiler
source/config/IR/graph/lockfile hashes, and pins that local candidate URL. It does not emit an
accepted LRM/FRA or claim canonical `rel_...` release verification. No fabricated digest.

Still pending: complete approved LRM/toolchain inputs and K13/K14 attestation, shared-block
expansion, plugin facet resolution/React host and PC lazy group loading, actual Preview vs
published conformance, publish/rollback handoff/integration and final performance budgets.
No lookup/prefill merge, Admin Builder or production infrastructure was implemented.
**S2 NOT DONE.** G9/G10 BLOCKED; synthetic only. One self-review; no independent review loop.
