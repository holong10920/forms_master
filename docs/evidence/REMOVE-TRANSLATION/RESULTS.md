# Remove form-content translation management — 2026-10-27

Removed the feature entirely: sidebar link, page/markup, Studio mode, editor module (`studio/translations.js`), auto-translation calls, validation state, Tailwind recipes, feature-only UI copy and React/Go login return allowlists. No replacement translation page exists. The generic application JA/VI language selector remains for Workspace/Studio chrome. Existing stored form content and immutable releases are preserved.

Previous `/translations` and scoped translation URLs resolve to Dashboard. Go rejects these OAuth return targets with HTTP 400. The nonexistent `/api/translate` operation returns HTTP 404; no translation provider or fallback was added. Generated Studio assets have been rebuilt without translation-management code.

Executed checks:

- Root lint and recursive typecheck: PASS (`lint.txt`, `typecheck.txt`).
- Root Vitest with Gitleaks available: 651 passed, 15 expected fail (`ts-tests.txt`).
- React tests: 17 passed; production build: PASS (`react-tests.txt`, `react-build.txt`).
- Go auth tests and Go vet: PASS (`go-auth-tests.txt`, `go-vet.txt`).
- Real browser: removed menu/page/bundle code; screenshot URL redirects to Dashboard; direct API 404; OAuth target 400; Builder works; JA/VI chrome works; mobile no overflow; zero page errors (`browser.txt`).

Screenshots: `output/playwright/translation-removed-desktop.png` and `output/playwright/translation-removed-mobile.png`.

README updated. Earlier translation evidence is historical and superseded by this removal. Other Kiro changes and Tailwind styling remain. No Git staging/commit/push or AWS writes.
