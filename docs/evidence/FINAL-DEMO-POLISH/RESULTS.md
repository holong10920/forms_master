# Final demo polish — READY_FOR_INTERNAL_DEMO

**Scope: the configurable Gakki multi-product internal demo. Not a claim of pixel-perfect parity, full personal-data restore, or specialist PC/camera/bicycle coverage.**

- [Final Customer v13](http://127.0.0.1:4183/r/rel_ckzoawdxgnwqnusqfgkvdecnhz/index.html) — `rel_ckzoawdxgnwqnusqfgkvdecnhz`
- [Admin](http://localhost:4180/studio/sites/site_pc_synthetic/forms/frm_330b2755e02d458c8420f072204ed44f?lang=ja) · [read-only legacy](http://localhost:8080/forms/apply/?site=gakki&step=1&pattern=a)
- Review `review_OTM-uceh2EqCkPx0RsZbcW8e`: distinct synthetic approver, then normal local publisher. [Publication](published-final.txt).

## Results

**14 targeted scenarios PASS / 0 FAIL**, with both 1440×900 desktop and 390×844 touch comparisons. Cases: Admin Save/reload; isolated Preview/clean content; review/approve/publish; initial state; filled geometry/styles; required validation; one-item confirmation; second-product add; edit/cancel; delete/cancel/stable identity; customer Back/preservation; actual progress stages; responsive/touch/no overflow; ordered full payload and Go submission **200**. [Final browser evidence](browser-comparison-final.txt).

The real legacy also passed Add/Edit/Cancel/Delete/Back for the same synthetic piano + keyboard fixtures. Browser Back was used for legacy edit cancellation; Form Master provides an explicit cancel action. No legacy business submission was sent.

**No-Code 11/12 groups fully demonstrated**, using the preceding review's denominator: header/logo and progress now join catalog, dependent rules, maker/model, condition, notes, piano floor, carry-out, single-item confirmation and multi-item cart. Restore remains PARTIAL/public-only. This counts demonstrated components, not all specialist category forms or every imaginable style.

## What changed

- Reusable full-width fixed branding, 36px desktop / 30px mobile logo; mobile logo and progress use separate rows. Desktop header 56px; mobile header 84px.
- Compact progress reads the actual engine step plus the staged editor/confirmed group lifecycle: **商品情報 → 商品確認 → お客様情報**. Add/Edit activates entry; confirmation/cancel activates list; customer Back returns to list. Completed/current/inactive states are derived, not relabeled over a wrong workflow. [Transition tests](../../../tools/legacy-analyzer/test/journey.test.ts), [Preview transitions](preview-flow.txt).
- Card width/padding/radius: desktop **600/24/12px**, top 80px; mobile **358/16/12px**, top 96px. No horizontal overflow.
- Bounded green border/focus/selected tokens, radio cards, badges, control backgrounds/heights, Japanese fallback fonts and compact summaries. Summary fields affect presentation only: payload retains floor, carry-out and notes in item order.
- Admin exposes the optional variants, sizes/colors, summary fields and accessible hidden labels. Dependent category retains a screen-reader label. `(QA)` labels and synthetic example/helper copy were cleaned through UI; the mandatory local synthetic notice remains discreetly visible.
- New metadata is optional and backward-compatible; no arbitrary CSS/script input, second workflow engine, RBAC bypass, PII retention expansion or Motion-none relaxation.

Authoring evidence: [clean labels/summary](admin-clean-content.txt), [style configuration/Save/reload](admin-style.txt), [successful isolated Preview](preview-initial.txt), [accessible label Save/reload/Preview](admin-label-access.txt), [public pinned IR](published-ir.json). Initial failed Preview/publish attempts are retained in raw logs; final v13 is the successful result.

## Screenshot pairs — no cropping

| State | Desktop legacy / final | Mobile legacy / final |
|---|---|---|
| Initial | [legacy](../../../output/playwright/final-polish/legacy-desktop-initial.png) / [v13](../../../output/playwright/final-polish/master-desktop-initial.png) | [legacy](../../../output/playwright/final-polish/legacy-mobile-initial.png) / [v13](../../../output/playwright/final-polish/master-mobile-initial.png) |
| Filled | [legacy](../../../output/playwright/final-polish/legacy-desktop-filled.png) / [v13](../../../output/playwright/final-polish/master-desktop-filled.png) | [legacy](../../../output/playwright/final-polish/legacy-mobile-filled.png) / [v13](../../../output/playwright/final-polish/master-mobile-filled.png) |
| Validation | [legacy](../../../output/playwright/final-polish/legacy-desktop-validation.png) / [v13](../../../output/playwright/final-polish/master-desktop-validation.png) | [legacy](../../../output/playwright/final-polish/legacy-mobile-validation.png) / [v13](../../../output/playwright/final-polish/master-mobile-validation.png) |
| One-item confirmation | [legacy](../../../output/playwright/final-polish/legacy-desktop-confirmation.png) / [v13](../../../output/playwright/final-polish/master-desktop-confirmation.png) | [legacy](../../../output/playwright/final-polish/legacy-mobile-confirmation.png) / [v13](../../../output/playwright/final-polish/master-mobile-confirmation.png) |
| Two-item cart | [legacy](../../../output/playwright/final-polish/legacy-desktop-cart.png) / [v13](../../../output/playwright/final-polish/master-desktop-cart.png) | [legacy](../../../output/playwright/final-polish/legacy-mobile-cart.png) / [v13](../../../output/playwright/final-polish/master-mobile-cart.png) |
| Edit | [legacy](../../../output/playwright/final-polish/legacy-desktop-edit.png) / [v13](../../../output/playwright/final-polish/master-desktop-edit.png) | [legacy](../../../output/playwright/final-polish/legacy-mobile-edit.png) / [v13](../../../output/playwright/final-polish/master-mobile-edit.png) |
| Customer | [legacy](../../../output/playwright/final-polish/legacy-desktop-customer.png) / [v13](../../../output/playwright/final-polish/master-desktop-customer.png) | [legacy](../../../output/playwright/final-polish/legacy-mobile-customer.png) / [v13](../../../output/playwright/final-polish/master-mobile-customer.png) |
| Back | [legacy](../../../output/playwright/final-polish/legacy-desktop-back.png) / [v13](../../../output/playwright/final-polish/master-desktop-back.png) | [legacy](../../../output/playwright/final-polish/legacy-mobile-back.png) / [v13](../../../output/playwright/final-polish/master-mobile-back.png) |

Before/after Form Master: [v10 desktop](../../../output/playwright/close-parity/master-final-desktop.png) → [v13 desktop](../../../output/playwright/final-polish/master-desktop-filled.png); [v10 mobile](../../../output/playwright/close-parity/master-final-mobile.png) → [v13 mobile](../../../output/playwright/final-polish/master-mobile-filled.png). Full-page filled/cart images are supplementary; viewport images remain uncropped.

Remaining meaningful differences: native pickers/radio focus ring versus legacy custom modal/bottom-sheet controls, text Edit/Delete buttons instead of icons, some spacing/CTA placement, 50px controls versus legacy 52px desktop / 48px mobile, and small font/background differences. Add still starts with the configured Gakki default whereas legacy opens the empty category modal. These do not block the demonstrated flow. Full PII restore and specialist forms remain explicit follow-ups.

## Verification and safe closure

- TS: **664 PASS + 15 expected-fail + 1 skipped**; React **17 PASS**. Go targeted engine/studio race and vet PASS. TS/Go semantic parity **290 PASS**.
- Compiler tests cover canonical budget, invalid summary references, determinism, isolated PC/Sports profiles and Motion-none. PC/Sports published browser smoke PASS. Lint/typecheck/build/schema/generated/boundaries/format and secret/synthetic checks PASS.
- Initial performance checks correctly blocked oversized attempts. Optional presentation moved into the pinned enhancement; no budget was raised. Final canonical initial payload: **11,568 bytes JS / 16,334 bytes total gzip**, against unchanged **12,288 / 16,384** limits. [Metrics](performance.json).
- No Customer JS exceptions/failed requests in final compared flows. Three legacy analytics scripts are intentionally blocked by the local CSP. CSP/Go permission/validation checks remain intact.
- Reference remains read-only: **1,328 files, zero changes**. T12/K13 remain VERIFICATION_PENDING. Applications remain running.
- **19 source/generated/test files** changed in this polish iteration; zero new deletions, zero staged files, no commit/GitHub/AWS writes. [Exact source scope/hashes](change-scope.json), [polish-only patch](incremental.patch).
- Safe proposal: preserve the older cleanup/refactor work; review the prior [33-file parity delta](../CLOSE-LEGACY-PARITY/incremental.patch) separately; then review this polish delta as `feat: configure compact customer branding and staged journey presentation`. These patches use actual preserved working-tree snapshots, not a blanket HEAD diff. Shared files must not be staged wholesale. No commit is performed.
