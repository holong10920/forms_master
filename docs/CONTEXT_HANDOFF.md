# Context Handoff

> Dành cho một phiên Claude mới. Đọc file này trước, sau đó đến `CURRENT_STATUS.md`. Cập nhật 2026-10-24, phiên 3. Commit cuối xem `git log` trên branch `p00-discovery` (local, chưa push).

**Dự án:** PoC multi-site form builder.
- Form được định nghĩa bằng JSON có versioning.
- Admin UI dùng để chỉnh sửa form: fields/sections, steps/branches, rules, theme, Motion presets.
- Hybrid compiler biến mỗi form thành một static artifact riêng.
- Publish và rollback chạy local trước. Stack AWS training isolated chỉ được dùng sau G10.
- Master contract là `MASTER_PROMPT_*.md` ở repo root. File này bị gitignore và chỉ có trên máy local.

**Tình hình hiện tại:**
- **P00 DONE. G0 APPROVED WITH ADJUSTMENTS** (2026-10-23, `docs/DECISIONS.md`):
  - Demo forms là Sports và PC giả lập (ADR-003).
  - MVP là một vertical slice: Admin → JSON → Preview → Compiler → Static Artifact → Runtime → Local Publish/Rollback (ADR-004).
  - Undo/redo chuyển sang P1, nhưng design phải chừa chỗ cho nó.
  - Mọi khẳng định về performance chỉ dựa trên artifact đã đo: biến thể nomotion không có Motion, và Sports không chứa `store-selector` (ADR-005).
- **P01 IN_PROGRESS:** SP-01 DONE (Superpowers 7.0.0 đã verify ở phiên 2). Phần Q&A brainstorming cho spec #1 đã đóng (Answers #1..#8 trong `docs/discovery/P01_BRAINSTORM_NOTES.md`).
- **Spec #1 (revision 3):** `docs/superpowers/specs/2026-10-23-form-schema-workflow-design.md`.
  - Review #2: CONDITIONALLY ACCEPTED FOR DESIGN CONTINUATION. Spec **chưa duyệt hoàn toàn**.
  - Design direction đã duyệt: ADR-017..022 (OD-01, OD-14, OD-02, OD-04, OD-07, OD-12).
  - OD-03, OD-05, OD-06, OD-08..11, OD-13 vẫn OPEN.
  - Mức độ sẵn sàng ở §26.
- **Spec #2 (Plugin Contracts & Capability Registry):** đang brainstorm. Câu hỏi đang mở được ghi ở cuối `docs/discovery/P01_BRAINSTORM_NOTES.md`.
- Các ADR từ P01:
  - ADR-008..012, 015, 016: nguyên tắc spec #1.
  - ADR-017..022: design direction.
  - ADR-013, ADR-014, các addendum và contract chi tiết: **PROPOSED**.

**Bước đầu tiên ở phiên tiếp theo:**
1. Invoke `superpowers:brainstorming` và tiếp tục spec #2 từ câu hỏi OPEN cuối cùng trong notes. Mỗi lần một câu hỏi. Không hỏi lại những gì notes đã có.
2. Nguồn sự thật cho contract plugin chi tiết sẽ là spec #2 (spec #1 §12). Không tạo mâu thuẫn với ADR-016, ADR-020, ADR-021, ADR-022.
3. Không nâng bất kỳ mục PROPOSED/OPEN nào nếu chưa có approval rõ ràng. Spec #1 chỉ chuyển sang READY_FOR_CROSS_REVIEW khi user xác nhận.
4. Giữ G1 NOT APPROVED, G9 BLOCKED, G10 BLOCKED. Không code. Spike phải qua gate riêng (ADR-018).

**Các quyết định đã khóa:**
- Hướng Hybrid (ADR-002).
- Chi tiết audit lấy từ hệ thống công ty chỉ nằm trong `docs/internal/` (ADR-001).
- Được phép local commit với nội dung an toàn, trên local branch. Hook chỉ cho phép git commit/push trong repo này, và chỉ khi lệnh không dùng `cd` hoặc `-C` để trỏ sang nơi khác, nên hãy chạy `git commit` trực tiếp từ repo root. **Không push trước G9** (ADR-007), dù về mặt kỹ thuật hook vẫn cho phép.
- Không chọn AWS profile, và không ghi gì lên AWS (ADR-006).

**Không được:**
- implement trước G1
- push, hoặc đổi remote
- động vào AWS
- gọi API công ty
- copy code công ty
- ghi điểm yếu của hệ thống legacy vào tracked docs
