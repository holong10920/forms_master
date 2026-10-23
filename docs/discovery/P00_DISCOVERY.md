# P00 — Discovery report

> Date: 2026-10-23 · Phase: P00 · Status: **DONE: G0 APPROVED WITH ADJUSTMENTS** (see `docs/DECISIONS.md`, gate log)
> All operations were read-only against external systems. No AWS API was called and nothing was pushed.
> Under ADR-001, company-derived details (paths, APIs, libraries, legacy-system weaknesses, legacy bundle numbers) live only in `docs/internal/`.

## 1. Environment (P00-01)

Evidence: `docs/evidence/P00/environment.txt`

| Item | Result |
|---|---|
| Repo | `forms_master`, branch `main`, initial commit `c3a01b8` |
| Remote | personal GitHub repository, **visibility PUBLIC** → G9 BLOCKED (the user is handling this) |
| Node / npm | v20.20.2 / 10.8.2 (Volta); pnpm and yarn not installed |
| Python | 3.9.6 (system only); uv and poetry not installed |
| Docker | 29.1.3 |
| AWS CLI / SAM | 2.34.6 / 1.155.2; CDK and Terraform not installed |
| AWS profiles | three local profiles, none named `aws-training`. Claude will not choose one (ADR-006). |
| Superpowers | **Not installed** (checked again after G0 on 2026-10-23) |

### SP-01: installing Superpowers

Install instructions verified against the official README at `github.com/obra/superpowers` on 2026-10-23:

```text
/plugin install superpowers@claude-plugins-official
# or
/plugin marketplace add obra/superpowers-marketplace
/plugin install superpowers@superpowers-marketplace
```

After installing, the skill list of a new session must include `superpowers:brainstorming` before P01 can start. Record the installed version (the README shows no release version).

## 2. Legacy audit (P00-03): summary

Details are in `docs/internal/` (local only). Abstract capabilities are in `docs/FORM_CAPABILITY_MATRIX.md`.

The audit confirms the problems listed in master §2 with concrete evidence:

1. Many sites are built and deployed together in one artifact (problems 1 and 5).
2. Code is shared across sites through direct imports between site modules (problem 1).
3. Site-specific behavior is hard-coded, and there is no site registry (problems 2 and 6).
4. Validation rules are maintained in several places (problem 2), so the PoC needs one versioned contract shared by FE and BE (ARCH-07).
5. Animation is hard-coded in components and cannot be configured by non-developers (F-P0-09).
6. Legacy flows have stable patterns: category drill-down, category-conditional fields, purchase-method branching, and method-specific completion. These are the basis for the synthetic demo forms.

Legacy bundle numbers are recorded in `docs/internal/` as **indicative only**. Under ADR-005 they are **not** used as a baseline.

## 3. Architecture (P00-06)

The direction is approved: **C. Hybrid Form Compiler** (ADR-002). The analysis is in `docs/discovery/P00_ARCHITECTURE_OPTIONS.md`. The detailed design goes to G1.

## 4. Demo forms (P00-05): APPROVED

Both forms are **synthetic**. They use fictional sites (`*.demo.local`), Japanese content, and fake data. Neither integrates with company systems.

### Sports demo: `sports-demo`

| Step | Content | Logic |
|---|---|---|
| 1. 商品カテゴリ | 自転車 / ゴルフ / 釣具 / その他 | 釣具 → 種類 (ロッド/リール/アクセサリー). ゴルフ → クラブ種別. |
| 2. 商品情報 | メーカー, 商品名, 状態, コメント | 状態 = ジャンク → 不具合内容 becomes required |
| 3. お客様情報 | 氏名, フリガナ, 電話, メール, 都道府県, 住所 | step-level validation |
| 4. 確認 | summary | back/edit |
| 5. 完了 (出張) | terminal | local submit stub |

Motion: `fade-slide`. A **`sports-demo-nomotion`** variant proves that the Motion runtime is not loaded.

### PC demo: `pc-demo`

| Step | Content | Logic |
|---|---|---|
| 1. 機種カテゴリ | デスクトップ / ノート / タブレット / 周辺機器 | fields depend on device type (CPU/メモリ/ストレージ, バッテリー, SIMロック) |
| 2. 状態 | 不具合 (checkbox array), 付属品 | 「なし」 is exclusive (cross-field) |
| 3. 買取方法 | 店頭 / 宅配 | **branch** |
| 4a. 店舗選択 | `store-selector` plugin (fictional stores) | PC-only plugin |
| 4b. 宅配情報 | 梱包キット, 集荷希望日 | address becomes required |
| 5. お客様情報 → 確認 → 完了 | separate completion per branch | |

Motion: `scale-spring`.

## 5. MVP scope (P00-06): ADJUSTED at G0 (ADR-004)

- **The MVP is a vertical slice:** Admin → JSON → Preview → Compiler → Static Artifact → Runtime → Local Publishing/Rollback.
- **Prioritized P0:**
  - site/form management
  - field/section editor
  - multi-step workflow
  - conditional logic
  - validation
  - theme
  - Motion presets
  - JSON schema validation
  - draft/version persistence
  - preview
  - static compiler
  - plugin isolation
  - local publish/rollback
- **Undo/redo → P1.** The architecture must leave room for it (immutable doc + typed commands).
- **Still P0, scheduled after the slice (to confirm at G1):** F-P0-13 Auth/Roles, F-P0-16 Audit, F-P0-18 Submit Simulation, F-P0-19 Docs/CI.
- **Mandatory performance evidence (ADR-005):** artifact tests showing the nomotion variant has no Motion and Sports has no `store-selector`. Measure raw/gzip/Brotli, analyze chunks, and set budgets at G1.
- **P1/P2:** stay in the roadmap.

## 6. Blockers / risks (P00-07): status after G0

| ID | Blocker/risk | Status |
|---|---|---|
| B-01 | Remote repo is PUBLIC | User is handling it. Push is BLOCKED until G9. |
| B-02 | Training AWS profile not identified | Confirm before G10. Does not block P01–P08. |
| B-03 | No AWS write permission | Expected; G10 |
| B-04 | Superpowers not installed | **Blocks P01-01.** User will install it. |
| B-05 | Python 3.9.6 | Decide at G1/P02 (Docker or 3.12) |
| B-06 | pnpm not installed | Decide at G1/P02 |
| B-07 | Legacy baseline | ADR-005: no unverified numbers. If needed, measure under a separate decision. |
| B-08 | The legacy mock files named in global rules are no longer on disk | PoC uses fully fictional mocks |

## 7. G0: decision recorded

**APPROVED WITH ADJUSTMENTS** (2026-10-23): ADR-001..ADR-007. G1/G9/G10 are **not** approved.
