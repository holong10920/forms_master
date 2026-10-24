# Context Handoff

> Dành cho một phiên Claude mới. Đọc file này trước, sau đó đến `CURRENT_STATUS.md`. Cập nhật 2026-10-24, phiên 3 (spec #3 review #1 → ADR-041/042; SPIKE-GATE-01 đang chạy). Commit cuối xem `git log` trên branch `p00-discovery` (local, chưa push).

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
- **Spec #1 (revision 3.3):** `docs/superpowers/specs/2026-10-23-form-schema-workflow-design.md`.
  - Review #2: CONDITIONALLY ACCEPTED FOR DESIGN CONTINUATION. Spec **chưa duyệt hoàn toàn**.
  - Design direction đã duyệt: ADR-017..022 (OD-01, OD-14, OD-02, OD-04, OD-07, OD-12).
  - OD-03, OD-05, OD-06, OD-08..11, OD-13 vẫn OPEN.
  - Mức độ sẵn sàng ở §26.
- **Spec #2 (Plugin Contracts & Capability Registry):** rev 2.3 ở `docs/superpowers/specs/2026-10-24-plugin-contracts-capability-registry-design.md` (rev 2 + đồng bộ ADR-037, ADR-038 và spec #3). Review #1: CHANGES REQUIRED — DESIGN DIRECTION ACCEPTED; OD2-01..07 đã quyết (ADR-029..035). Rev 2 chờ user review. OPEN: OD2-08, OD2-09 (§22). §19 là Cross-Spec Interface Matrix #1 ↔ #2.
- **Spec #1** đã thành rev 3.3: chỉ đồng bộ plugin contract (spec #2), draft/release pinning (ADR-037) và `awaitingCapability` (C11, INV-N9; ADR-040), không có review mới.
- **Spec #3 (Compiler & Bundle Architecture):** đang brainstorm. Q3-1 → ADR-036 (self-contained form release). Answer #2 → ADR-037 (session-pinned revision, stable/immutable URL); đề xuất S3-P01..P11 + TM-R01..R14 nằm trong notes, sẽ chuyển vào tài liệu spec #3. Answer #3 → ADR-038 (CSR + Loading Shell; đề xuất S3-P12..P16, trong đó S3-P12 thay định nghĩa `releaseId` cũ). Answer #4 → ADR-039. Answer #5 → ADR-040. **Spec #3 Architecture Proposal rev 1** ở `docs/superpowers/specs/2026-10-24-compiler-bundle-release-design.md` (thay thế S3-P01..P21 trong notes), review #1: CONDITIONALLY ACCEPTED FOR TECHNICAL VERIFICATION. OD3-01 → ADR-041 (Vite + Rolldown là ứng viên đánh giá), OD3-02 → ADR-042 (**SPIKE-GATE-01**, phạm vi giới hạn: chỉ EXP-01..05, code dùng xong bỏ trên branch local `spike/compiler-feasibility`, không merge, không production code). Tiêu chí PASS/FAIL đã chốt trong notes trước khi chạy. Lịch sử ở cuối `docs/discovery/P01_BRAINSTORM_NOTES.md`. Việc pending cho spec #5: notes S3-P11. Input từ spec #2: §9.2 (Capability Lock), §9.4 (tiêu thụ release), §10.2 (nội dung Release Manifest), §11 (INV-F1..F7, L1–L6), §11.4 (React singleton).
- Các ADR từ P01:
  - ADR-008..012, 015, 016: nguyên tắc spec #1.
  - ADR-017..022: design direction.
  - ADR-023..025, ADR-027, ADR-028: nguyên tắc spec #2 (ACCEPTED). ADR-026: APPROVED AS DESIGN DIRECTION WITH ADJUSTMENTS. ADR-029..035: quyết định OD2-01..07 (review #1). ADR-036..040: spec #3. ADR-041, ADR-042: bundler đánh giá và spike gate.
  - ADR-013, ADR-014, các addendum và mọi cơ chế chi tiết của spec #1/#2: **PROPOSED**.

**Bước đầu tiên ở phiên tiếp theo:**
1. Invoke `superpowers:brainstorming` và tiếp tục spec #3 từ câu hỏi OPEN cuối cùng trong notes (tiếp tục/hoàn tất SPIKE-GATE-01; báo cáo; spec #3 rev 2; rồi brainstorm spec #4). Mỗi lần một câu hỏi. Spec #3 phải khớp spec #2 §9–§11 và chịu trách nhiệm bằng chứng isolation thật (C5/L5).
2. Nếu user review spec #2 rev 2: ghi vào notes + ADR, ra rev 3. Mọi thay đổi chạm interface #1 ↔ #2 phải cập nhật spec #2 §19 và spec #1 trong cùng thay đổi. Không tự đổi OD2-08/09 thành APPROVED.
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
