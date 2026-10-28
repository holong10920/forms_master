# Workspace header / Translations / JA–VI verification

Verified locally on 2026-10-27. Scope: the three requested Kiro follow-up fixes; unrelated working changes were preserved. No Git mutation, GitHub access, AWS writes, deployment or production services.

## Result

- Authenticated Workspace header removed; a single accessible JA/VI selector lives in the sidebar. Login branding remains.
- Translation editing moved to `/translations` and `/translations/sites/:siteId/forms/:formId`. Builder mode tabs contain Build, Flow, Preview and Publish only.
- Builder ↔ Translations preserves site/form context, CAS/autosave, refresh, history and pending-change checks.
- Compiler retains bilingual IR content/messages. Runtime renders only supported JA/VI languages, falls back to Japanese, and has no in-form language switch buttons. Isolated Preview receives the sidebar locale through its origin-checked handshake and validated URL fallback.
- Invalid required Japanese translations block save/navigation until corrected. Member is read-only; forged Admin headers do not grant save permission.
- Existing immutable releases were not rewritten. Browser verification uses a separate synthetic clone: `frm_locale_cff3b217c3fd4e3a9d51c5d806c677eb`.

## Executed checks

| Check | Result | Evidence |
| --- | --- | --- |
| Root ESLint | PASS | `lint.txt` |
| Root recursive TypeScript typecheck | PASS | `typecheck.txt` |
| Root Vitest | PASS: 648 passed, 15 expected fail | `ts-tests.txt` |
| React component tests | PASS: 16 | `react-tests.txt` |
| React production build | PASS | `react-build.txt` |
| Go test ./... | PASS, including Studio integration | `go-tests.txt` |
| Go test -race ./... | PASS, including Studio integration | `go-race.txt` |
| Go vet ./... | PASS, exit 0 and no diagnostics | `go-vet.txt` |
| Targeted Prettier and git diff --check | PASS | Executed against changed source; no diagnostics |
| Browser Workspace | PASS: sidebar, JA/VI, selected form, save/reload, back/forward | `browser-workspace.txt` |
| Browser isolated Preview | PASS: JA/VI, HTTP 200, no language buttons, no Admin cookies, separate origin | `browser-preview.txt` |
| Browser Member | PASS: OIDC return to translation deep link, readonly, forged Admin save → 403 | `browser-member.txt` |
| Browser validation | PASS: invalid Japanese blocked navigation, correction saved | `browser-validation.txt` |
| Browser responsive | PASS: 1440×900, 1280×800, 768×1024, 390×844; no document overflow | `browser-workspace.txt` |

The first full Vitest run encountered the existing randomized Gitleaks negative-fixture failure (expected detection exit 1, got 0). Its isolated rerun and the full suite rerun passed without changing the scanner, fixture or test. Both results are retained in `ts-tests-first-run.txt`, `gitleaks-retest.txt` and `ts-tests.txt`; this remains a flaky test observation, not a suppressed failure.

Browser scripts are included with sanitized network summaries (method/path/status only); no cookies, authorization codes, CSRF verifiers or Preview session handles are stored in evidence.

## Screenshots

- [Desktop translations](../../../output/playwright/translation-fix-1440.png)
- [Laptop translations](../../../output/playwright/translation-fix-1280.png)
- [Tablet translations](../../../output/playwright/translation-fix-768.png)
- [Mobile translations](../../../output/playwright/translation-fix-390.png)
- [Builder without Translate tab](../../../output/playwright/translation-fix-builder.png)
- [Vietnamese Preview](../../../output/playwright/translation-fix-preview-vi.png)
- [Japanese Preview](../../../output/playwright/translation-fix-preview-ja.png)
- [Readonly Member](../../../output/playwright/translation-fix-member.png)

## Scope and limits

React shell, its route allowlist, Go OIDC return allowlist/tests, Studio route generation, dedicated translation/localization modules, translation save guards and styling, Preview locale handoff, runtime locale selection, bilingual compiler restoration and regression tests. Setup/routes documented in `tools/go-auth/README.md`.

Automatic translation still requires an approved provider and otherwise fails explicitly; manual translations work. Verification covered fresh Preview compilation, not publication of this browser clone. Existing releases keep their pinned runtime. No change to pending T12/K13 container verification.
