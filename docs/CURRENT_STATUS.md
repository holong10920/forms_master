# Current Status

> Cập nhật lần cuối: 2026-10-24 (phiên 3, spec #1 revision 3 sau review #2; bắt đầu brainstorm spec #2)

| Mục | Giá trị |
|---|---|
| Phase đang chạy | **P01 Discovery/Design IN_PROGRESS**. Spec #1 rev 3: CONDITIONALLY ACCEPTED FOR DESIGN CONTINUATION (review #2), **chưa duyệt hoàn toàn**. Đang brainstorm spec #2 (Plugin Contracts & Capability Registry). |
| Plan đang active | Không có. `writing-plans` chỉ chạy sau G1. |
| Git | local branch `p00-discovery`. Các commit WIP của P01 xem bằng `git log` (`21baa8c` = spec #1 rev 2; commit không có nghĩa là đã duyệt). Checkpoint P00 = `0d4fe7b`. Chưa push. Push bị gate bởi G9 (ADR-007). |
| Remote | repo GitHub cá nhân, **PUBLIC**. G9 BLOCKED; user đang xử lý. |
| AWS | **KHÔNG GHI**, và chưa gọi AWS API nào. Chưa chọn profile (ADR-006). |
| Môi trường | macOS local; Node 20.20.2; Python 3.9.6; Docker 29.1.3 |
| Scope đã duyệt | G0: ADR-001..007. Nguyên tắc của spec #1: ADR-008..012, ADR-015, ADR-016. Design direction: ADR-017 (OD-01), ADR-018 (OD-14), ADR-019 (OD-02), ADR-020 (OD-04), ADR-021 (OD-07), ADR-022 (OD-12). ADR-013/014 + addenda vẫn PROPOSED. (không phải là duyệt architecture). **G1 NOT APPROVED. G9 BLOCKED. G10 BLOCKED.** |
| URLs | không có |

## Đã xong (có evidence)
- P00-01..07 → xem `docs/PROJECT_CHECKLIST.md` (mục PHASE 00) và `docs/discovery/P00_DISCOVERY.md`
- Đã ghi G0 → gate log trong `docs/DECISIONS.md` + ADR-001..007
- SP-01 → `docs/evidence/P01/superpowers-install.txt` + `docs/evidence/P01/superpowers-verify-session2.txt` (đã invoke brainstorming ở phiên 2)

## Đang làm
- P01-01 / SP-02: brainstorming spec #1. Các câu trả lời đã xác nhận của user được ghi trong `docs/discovery/P01_BRAINSTORM_NOTES.md`.
  - Đã ghi Answer #1 (As-Is/To-Be) và Answer #2 (người dùng, ranh giới no-code vs developer, nguyên tắc DSL, roles).
  - Đã ghi Answer #3 (versioning shared-block, đã review T-01..T-05) → ADR-008..010 (chỉ là nguyên tắc của spec #1, không phải G1).
  - Đã ghi Answer #4 (điều chỉnh T-06..T-08, khôi phục draft theo hướng privacy-first) → ADR-011, ADR-012.
  - Answer #5: đã thống nhất hướng đi của P-01..P-06 nhưng chưa duyệt. Đã ghi lại proposal v2 (R-01..R-08) và các proposal derived-state D-01..D-07, kèm EC-01..16 và AC-01..11.
  - Addendum ADR-011/012 và ADR-013 đang PROPOSED.
  - Answer #6: policy đổi branch đã được xác nhận sơ bộ và ghi trong ADR-014 (PROPOSED). Đã ghi lại proposal navigation N-01..N-08, EC-17..25 và AC-12..16.
  - Answer #7: user yêu cầu bổ sung navigation (A1..A5) → đề xuất N-09..N-13. Đã xác nhận Validation UX → ADR-015 (nguyên tắc được chấp nhận, contract V-01..V-09 đang đề xuất). Đã thêm EC-26..35 và AC-17..22.
  - Answer #8: đã ghi các điều chỉnh A1–A6 và ranh giới plugin → ADR-016 (nguyên tắc được chấp nhận, contract PL-01..10 đang đề xuất). User đã đóng phần Q&A.
  - **Proposal spec #1:** `docs/superpowers/specs/2026-10-23-form-schema-workflow-design.md`. Đã chạy builder check (subagent độc lập), kết quả ở §24.
  - **Review #1 của user (CHANGES / VERIFICATION REQUIRED):**
    - OD-01 (a) → ADR-017 và OD-14 (a) → ADR-018, cả hai APPROVED AS DESIGN DIRECTION.
    - Đã viết thêm vào spec:
      - §7.6 ngữ nghĩa dữ liệu
      - §8.7 navigation review (NR-01..11, T1–T3, E1–E10)
      - §12 bảng ranh giới contract với spec #2/#3
      - §21 Decision Matrix OD-02..13 (OPEN)
      - §25 kế hoạch Cross-Subsystem Review
      - §26 mức độ sẵn sàng
      - AC-29..33 về parity
    - Docs đã chuyển sang tiếng Việt theo CLAUDE.md. Riêng file evidence giữ nguyên vì là output gốc.

  - **Review #2 (CONDITIONALLY ACCEPTED FOR DESIGN CONTINUATION):**
    - OD-02/04/07/12 → ADR-019..022, APPROVED AS DESIGN DIRECTION kèm điều kiện.
    - Spec #1 rev 3:
      - bỏ NFC cho văn bản tự do (phát hiện mất 異体字)
      - §7.6.9/§7.6.10, §7.7, §7.8
      - §8.7.6 race condition (INV-N1..N8, C1–C10)
      - §11, §16, AC-34..38
    - Chờ user review rev 3 trước khi chuyển sang READY_FOR_CROSS_REVIEW.
  - **Spec #2:** đã mở brainstorming. Các câu trả lời được ghi vào `docs/discovery/P01_BRAINSTORM_NOTES.md`.

## Bị chặn
- G9 (GitHub) và G10 (AWS): đang chờ user.

## Tiếp theo
1. Brainstorm spec #2 (Plugin Contracts & Capability Registry) với `superpowers:brainstorming`, mỗi lần một câu hỏi.
2. User review spec #1 rev 3. Nếu đồng ý thì spec #1 chuyển sang READY_FOR_CROSS_REVIEW (chỉ khi user xác nhận).
3. Tiếp theo là spec #3..#6 (compiler + bundle, Admin, API/persistence/publish, Motion). Spike phải qua gate riêng (ADR-018).
4. Cross-Subsystem Integration Review (spec #1 §25), rồi mới trình G1.
5. Trong P01 được phép: design review, kiểm chứng lý thuyết, viết test matrix. Không scaffold, không viết code.

## Câu hỏi mở cho G1 (đã ghi lại, không cần hỏi lại trước khi brainstorming)
- F-P0-13/16/18/19 giữ P0, xếp lịch sau vertical slice (ADR-004). Cần xác nhận.
- Spike bundle-isolation: đây là code dùng xong bỏ để đo tree-shaking, nên cần user approval trước khi chạy (không phải feature code, nhưng vẫn là code).

## Tests
- Không có. Chưa có code, điều này là đúng trước G1.
