# P00 — Báo cáo discovery

> Ngày: 2026-10-23 · Phase: P00 · Status: **DONE: G0 APPROVED WITH ADJUSTMENTS** (xem `docs/DECISIONS.md`, gate log)
> Mọi thao tác với hệ thống bên ngoài đều là read-only. Không gọi AWS API nào và không push gì.
> Theo ADR-001, các chi tiết lấy từ hệ thống công ty (paths, APIs, libraries, điểm yếu hệ thống legacy, số bundle legacy) chỉ nằm trong `docs/internal/`.

## 1. Môi trường (P00-01)

Evidence: `docs/evidence/P00/environment.txt`

| Mục | Kết quả |
|---|---|
| Repo | `forms_master`, branch `main`, initial commit `c3a01b8` |
| Remote | repository GitHub cá nhân, **visibility PUBLIC** → G9 BLOCKED (user đang xử lý) |
| Node / npm | v20.20.2 / 10.8.2 (Volta); chưa cài pnpm và yarn |
| Python | 3.9.6 (chỉ bản system); chưa cài uv và poetry |
| Docker | 29.1.3 |
| AWS CLI / SAM | 2.34.6 / 1.155.2; chưa cài CDK và Terraform |
| AWS profiles | ba local profile, không profile nào tên `aws-training`. Claude sẽ không tự chọn (ADR-006). |
| Superpowers | Chưa cài tại thời điểm P00. **Cập nhật 2026-10-23:** đã cài 7.0.0 (`docs/evidence/P01/superpowers-install.txt`) và đã verify `superpowers:brainstorming` ở phiên 2 (`docs/evidence/P01/superpowers-verify-session2.txt`) |

### SP-01: cài Superpowers

Hướng dẫn cài đã được đối chiếu với README chính thức tại `github.com/obra/superpowers` ngày 2026-10-23:

```text
/plugin install superpowers@claude-plugins-official
# or
/plugin marketplace add obra/superpowers-marketplace
/plugin install superpowers@superpowers-marketplace
```

Sau khi cài, danh sách skill của một phiên mới phải có `superpowers:brainstorming` thì mới bắt đầu P01. Ghi lại version đã cài (README không ghi release version).

## 2. Audit legacy (P00-03): tóm tắt

Chi tiết nằm trong `docs/internal/` (chỉ có ở local). Các capability ở mức trừu tượng nằm trong `docs/FORM_CAPABILITY_MATRIX.md`.

Audit xác nhận các vấn đề nêu trong master §2 bằng bằng chứng cụ thể:

1. Nhiều site được build và deploy chung trong một artifact (vấn đề 1 và 5).
2. Code được dùng chung giữa các site qua import trực tiếp giữa các module site (vấn đề 1).
3. Hành vi riêng của từng site bị hard-code, và không có site registry (vấn đề 2 và 6).
4. Validation rules được duy trì ở nhiều nơi (vấn đề 2), nên PoC cần một contract có versioning dùng chung cho FE và BE (ARCH-07).
5. Animation bị hard-code trong components và người không phải developer không cấu hình được (F-P0-09).
6. Các flow legacy có những pattern ổn định: drill-down theo category, field phụ thuộc category, rẽ nhánh theo phương thức thu mua, và màn hoàn tất riêng theo phương thức. Đây là cơ sở cho các demo form giả lập.

Số bundle legacy được ghi trong `docs/internal/` và **chỉ mang tính tham khảo**. Theo ADR-005, chúng **không** được dùng làm baseline.

## 3. Architecture (P00-06)

Hướng đi đã được duyệt: **C. Hybrid Form Compiler** (ADR-002). Phân tích nằm trong `docs/discovery/P00_ARCHITECTURE_OPTIONS.md`. Design chi tiết sẽ trình ở G1.

## 4. Demo forms (P00-05): APPROVED

Cả hai form đều là **giả lập**. Chúng dùng site hư cấu (`*.demo.local`), nội dung tiếng Nhật và dữ liệu giả. Không form nào tích hợp với hệ thống công ty.

### Sports demo: `sports-demo`

| Bước | Nội dung | Logic |
|---|---|---|
| 1. 商品カテゴリ | 自転車 / ゴルフ / 釣具 / その他 | 釣具 → 種類 (ロッド/リール/アクセサリー). ゴルフ → クラブ種別. |
| 2. 商品情報 | メーカー, 商品名, 状態, コメント | 状態 = ジャンク → 不具合内容 trở thành bắt buộc |
| 3. お客様情報 | 氏名, フリガナ, 電話, メール, 都道府県, 住所 | validation ở mức step |
| 4. 確認 | tóm tắt | quay lại/sửa |
| 5. 完了 (出張) | terminal | local submit stub |

Motion: `fade-slide`. Biến thể **`sports-demo-nomotion`** chứng minh Motion runtime không được load.

### PC demo: `pc-demo`

| Bước | Nội dung | Logic |
|---|---|---|
| 1. 機種カテゴリ | デスクトップ / ノート / タブレット / 周辺機器 | field phụ thuộc loại thiết bị (CPU/メモリ/ストレージ, バッテリー, SIMロック) |
| 2. 状態 | 不具合 (checkbox array), 付属品 | 「なし」 là lựa chọn loại trừ (cross-field) |
| 3. 買取方法 | 店頭 / 宅配 | **branch** |
| 4a. 店舗選択 | plugin `store-selector` (cửa hàng hư cấu) | plugin chỉ dành cho PC |
| 4b. 宅配情報 | 梱包キット, 集荷希望日 | địa chỉ trở thành bắt buộc |
| 5. お客様情報 → 確認 → 完了 | màn hoàn tất riêng cho từng branch | |

Motion: `scale-spring`.

## 5. MVP scope (P00-06): ADJUSTED ở G0 (ADR-004)

- **MVP là một vertical slice:** Admin → JSON → Preview → Compiler → Static Artifact → Runtime → Local Publishing/Rollback.
- **P0 ưu tiên:**
  - quản lý site/form
  - field/section editor
  - multi-step workflow
  - conditional logic
  - validation
  - theme
  - Motion presets
  - JSON schema validation
  - lưu draft/version
  - preview
  - static compiler
  - plugin isolation
  - local publish/rollback
- **Undo/redo → P1.** Architecture phải chừa chỗ cho nó (immutable doc + typed commands).
- **Vẫn là P0, xếp lịch sau slice (xác nhận ở G1):** F-P0-13 Auth/Roles, F-P0-16 Audit, F-P0-18 Submit Simulation, F-P0-19 Docs/CI.
- **Performance evidence bắt buộc (ADR-005):** test trên artifact chứng minh biến thể nomotion không có Motion và Sports không có `store-selector`. Đo raw/gzip/Brotli, phân tích chunk, và chốt budget ở G1.
- **P1/P2:** giữ trong roadmap.

## 6. Blockers / rủi ro (P00-07): trạng thái sau G0

| ID | Blocker/rủi ro | Status |
|---|---|---|
| B-01 | Remote repo đang PUBLIC | User đang xử lý. Push bị BLOCKED cho đến G9. |
| B-02 | Chưa xác định AWS profile training | Xác nhận trước G10. Không chặn P01–P08. |
| B-03 | Không có quyền ghi AWS | Đúng như dự kiến; G10 |
| B-04 | Chưa cài Superpowers | **RESOLVED 2026-10-23:** đã cài 7.0.0 và verify ở phiên 2 (`docs/evidence/P01/superpowers-verify-session2.txt`) |
| B-05 | Python 3.9.6 | Quyết định ở G1/P02 (Docker hoặc 3.12) |
| B-06 | Chưa cài pnpm | Quyết định ở G1/P02 |
| B-07 | Baseline legacy | ADR-005: không dùng số liệu chưa verify. Nếu cần, đo theo một quyết định riêng. |
| B-08 | Các file mock legacy được nêu trong global rules không còn trên disk | PoC dùng mock hoàn toàn hư cấu |

## 7. G0: quyết định đã ghi

**APPROVED WITH ADJUSTMENTS** (2026-10-23): ADR-001..ADR-007. G1/G9/G10 **chưa** được duyệt.
