# Context Handoff

> Dành cho một phiên Claude mới. Đọc file này trước, sau đó đến `CURRENT_STATUS.md`. Cập nhật 2026-10-23, phiên 2. **Commit cuối: `1e73312` trên branch `p00-discovery` (local, chưa push).**

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
- **Spec #1 Architecture Proposal (revision 2):** `docs/superpowers/specs/2026-10-23-form-schema-workflow-design.md`.
  - Đã áp dụng review #1 của user (CHANGES / VERIFICATION REQUIRED) và đang chờ user review lại.
  - OD-01 → ADR-017 và OD-14 → ADR-018, cả hai APPROVED AS DESIGN DIRECTION.
  - OD-02..OD-13 còn OPEN (Decision Matrix ở §21). Mức độ sẵn sàng ở §26.
- Các ADR từ P01:
  - ADR-008..012, 015 và 016 được chấp nhận **chỉ ở mức nguyên tắc của spec #1**.
  - Addenda ADR-011/012, ADR-013, ADR-014 và các contract chi tiết đang **PROPOSED**.

**Bước đầu tiên ở phiên tiếp theo:**
1. Đọc phản hồi của user về spec #1 revision 2 và OD-02..OD-13. Không nâng bất kỳ mục PROPOSED/OPEN nào nếu chưa có approval rõ ràng.
2. Áp dụng phản hồi vào spec, ADR, checklist và traceability.
3. Khi OD-02/04/07/12 đã được quyết, brainstorm spec #2 (plugin contracts + capability registry) bằng `superpowers:brainstorming`, mỗi lần một câu hỏi.
4. Giữ G1 NOT APPROVED, G9 BLOCKED, G10 BLOCKED. Không code trước G1. G1 chỉ được trình sau khi đủ 6 spec và có Cross-Subsystem Review (ADR-018). Spike phải qua gate riêng.

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
