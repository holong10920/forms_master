# Project Charter — Multi-Site Form Builder PoC

> Nguồn: master prompt §2–§3, §11. Văn bản này tóm tắt; khi mâu thuẫn, master thắng.
> Trạng thái: **ACTIVE — G0 APPROVED WITH ADJUSTMENTS (2026-10-23)**; xem `docs/DECISIONS.md`.

> Cập nhật triển khai 2026-10-27: local Go modular monolith + React Workspace; TS compiler/runtime được giữ. Python đã retire theo yêu cầu user. Tái tạo capability legacy dùng synthetic fixtures, không migrate website/production backend. Các mục tiêu tổng thể và T12/K13 không được tự nâng PASS. Xem CURRENT_STATUS và README.

## 1. Mục tiêu

Chứng minh cho PO/PM rằng một nền tảng có thể tạo **≥2 form thu mua khác flow** (mặc định Sports và PC) từ **JSON definition có version**, chỉnh qua Admin UI (kéo-thả, step/branch, validation, theme, Motion), compile thành **artifact static riêng per form** chỉ chứa capability được dùng, publish và **rollback** được — mà không viết React source mới cho từng form trong phạm vi capability registry hỗ trợ.

## 1a. MVP = vertical slice (G0, ADR-004)

`Admin → JSON → Preview → Compiler → Static Artifact → Runtime → Local Publishing/Rollback`, với 2 synthetic demo forms Sports + PC (ADR-003). Undo/redo là P1 (architecture phải sẵn đường). Mục tiêu dài hạn không đổi: nền tảng tạo hàng chục form thu mua riêng biệt, dễ bảo trì, tái sử dụng logic, static bundle tối ưu.

## 1b. Performance (G0, ADR-005)

Mọi kết luận performance phải từ build artifacts đo thực tế (raw/gzip/Brotli, chunk/dependency graph). Số bundle legacy chưa xác minh không phải baseline. Budgets duyệt tại G1.

## 2. Vấn đề cần giải quyết (từ hệ thống hiện tại)

1. Source chung phình to, coupling giữa nhiều form/component/business logic.
2. Mỗi site khác flow/validation/data/integration.
3. Nhiều developer → review khó, regression, ownership mờ.
4. Re-render và bundle chưa tối ưu; build không chọn lọc theo site/form.
5. Đổi field/flow phải nhờ developer.
6. Context quá lớn cho AI agent.

## 3. Non-goals (PoC)

- Không migrate website công ty; không chạm production hiện hữu (domain, CloudFront, bucket, API).
- Không kết nối backend thu mua thật, không PII, không dữ liệu khách hàng thật.
- Không xây ngôn ngữ lập trình no-code / arbitrary JavaScript trong JSON.
- Không làm P1/P2 trước khi MVP P0 đạt.
- Không dùng Vercel hoặc hosting khác ngoài AWS training isolated (sau G10) và local.

## 4. Constraints

| Loại | Ràng buộc |
|---|---|
| AWS | Read-only mặc định. Mọi write chỉ sau G10 với scope chính xác. Không chạm tài nguyên sẵn có/dùng chung trong account. Không long-lived keys, không public S3. |
| GitHub | Repo PoC phải **private**; không đưa source/docs nội bộ công ty lên GitHub cá nhân khi chưa được phép. |
| IP | PoC viết mới từ đầu. Repo công ty chỉ đọc để audit capability. |
| Security | Không `eval`/`new Function`, rules là data AST, connector allowlist (chống SSRF), auth/authz server-side. |
| Evidence | Mọi claim hoàn thành cần command + kết quả thực tế; số đo performance chỉ dùng số thật (lab-only ghi rõ). |
| Tooling local (đo ngày 2026-10-23) | Node 20.20.2, npm 10.8.2, Python 3.9.6 (system), Docker 29.1.3, AWS CLI 2.34.6, SAM 1.155.2; chưa có pnpm/uv/CDK/Terraform/Playwright. |

## 5. Định nghĩa thành công

PoC đạt **END-TO-END DEMO READY** khi toàn bộ DOD-01..DOD-10 (master §11) có evidence. Nếu AWS bị block: báo **LOCAL POC DONE / AWS DEPLOY BLOCKED**.

Tóm tắt DoD: Admin đăng nhập tạo form mới qua UI · 2 site mock khác workflow · Theme + Motion thể hiện ở preview và static output · draft persist, publish immutable, rollback có bằng chứng · analyzer chứng minh bundle isolation · unit/integration/Playwright chạy thật · CI có link/SHA (nếu GitHub được phép) · AWS URL smoke pass (nếu được phép) · không PII/secrets/writes trái phép · ADR, runbook, demo script, cost/perf report.

## 6. Stakeholders

| Vai trò | Người | Ghi chú |
|---|---|---|
| Requester / approver gates | User (holong10920) | Duyệt G0/G1/G9/G10 |
| Audience demo | PO/PM | Cần số đo thật, demo 5–8 phút |
| Executor | Claude Code | Theo master + CLAUDE.md |
