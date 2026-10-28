# Gakki v13 — internal demo guide

- **READY_FOR_INTERNAL_DEMO:** Gakki multi-product scope.
- **FULL_LEGACY_PARITY: NOT ACHIEVED.**
- **PRODUCTION_READY: NO.**

Frozen Customer: <http://127.0.0.1:4183/r/rel_ckzoawdxgnwqnusqfgkvdecnhz/index.html>

Release: `rel_ckzoawdxgnwqnusqfgkvdecnhz`. Keep this direct URL for the approved demo. Do not edit its files. T12/K13 remain pending.

## Run the demo

1. Open <http://localhost:4180/>, continue through the local identity provider as **synthetic-admin**, then open **フォームビルダー / Form Studio**.
2. Open [Gakki Studio](http://localhost:4180/studio/sites/site_pc_synthetic/forms/frm_330b2755e02d458c8420f072204ed44f?lang=ja). To replay authoring without changing the approved draft, use the v13 release's **この版から複製** in publication history and work on that separate draft. No clone is needed merely to view saved settings/Preview.
3. Configure the product group: parent/dependent choices, item fields, validation, item summary; configure the form's **スタイル** settings for header, logo, compact progress, width, typography and control colors. Use the UI; do not edit TSX/CSS/JSON.
4. Save and wait for **保存済み · vN** before reload. Open **プレビュー**; it runs separately on `127.0.0.1:4185`. Verify the chosen settings and real entry → cart → customer stages.
5. On the separate authoring draft only, request **レビュー依頼**. Sign in as **synthetic-approver** in another browser session and approve the concrete snapshot/Data Contract. Return as the publisher (**synthetic-admin**) and **ローカル公開 → 公開する**. A new release URL is created; the frozen v13 URL remains unchanged. Do not bypass stale-review or permission checks.
6. Open the frozen Customer URL for the approved walkthrough. Select 楽器 → ピアノ、エレクトーン, enter the synthetic fixture below, and click **次へ** to reach **商品確認**.
7. **商品を追加**: add the keyboard fixture. **編集** preserves item identity; save or use **商品一覧に戻る（変更を破棄）** to cancel. **削除** opens confirmation. Keep two items to show ordered confirmation. Continue to **お客様情報**, then **戻る** to show cart preservation.
8. For an optional end-to-end synthetic submission, enter the local test contact, continue to the final review, then **ローカル模擬受付**. Never submit real customer data or submit through the legacy reference API.

## Synthetic fixtures

| Item | Values |
|---|---|
| A | Piano; `合成楽器 Model A`; 中古; 2～3階; 階段作業が必要; `合成ケース付き` |
| B | Keyboard; `合成楽器 Model B`; 中古 |
| Contact | `カタカナ`; `synthetic@example.invalid`; `05012345678`; agree to the displayed policy |

A refresh retains only permitted public selections in the session. Names/models, notes and contact data require re-entry. This is bounded DEMO_RESTORE, not full legacy personal-data restore.

The legacy reference is [local Takaku Gakki](http://localhost:8080/forms/apply/?site=gakki&step=1&pattern=a), read-only with synthetic mocks and business save blocked. Native picker/radio details and some spacing/buttons still differ. Specialist forms and production readiness are outside this demo.
