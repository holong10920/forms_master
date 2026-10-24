# Security Risk Register (P0, synthetic PoC)

> Danh sách rủi ro bảo mật đã biết của thiết kế P0. Trạng thái theo phân loại của Cross-Subsystem Review: **ACCEPTED_RISK** (user đã chấp nhận có điều kiện, có ADR), **VERIFICATION_PENDING** (thiết kế có cơ chế, chưa kiểm chứng), **DESIGN_RESOLVED** (đã sửa trong spec, chưa có test chạy), **OPEN** (chưa có quyết định). Không mục nào được coi là đã giải quyết khi chưa có quyết định hoặc evidence tương ứng.
> Cập nhật: 2026-10-25 (vòng sửa C1, ADR-068..073).

## Accepted risks (có owner, phạm vi, enforcement, điều kiện xem lại, escalation)

| ID | Rủi ro | ADR | Owner | Phạm vi | Enforcement / kiểm chứng | Hết hiệu lực / xem lại khi | Escalation |
|---|---|---|---|---|---|---|---|
| SR-01 | **G-EXEC TOCTOU**: adapter (kể cả read-only) có thể bắt đầu sau commit của revocation nếu lần đọc gate trước commit | ADR-063 | vai trò platform-security | chỉ PoC synthetic | điều kiện synthetic-only có kế hoạch kiểm chứng (spec #5 §9.6, TM-5X01..05) — **phải PASS trước mọi demo/đánh giá dựa vào ADR-063**; TM-5G18 ghi nhận hành vi | bất kỳ điều kiện nào đổi; trước tích hợp thật (security gate riêng) | user (project owner) quyết; incident record |
| SR-03 | Revocation browser facet nhiều form **không nguyên tử** toàn cục; tab đã mở không ngừng ngay | ADR-069 | platform-security | chỉ synthetic P0, không khách thật | M2 chặn release mới; `PRKUSE` liệt kê chính xác; M5 từng form idempotent; tiến độ N/M; reconcile (spec #5 §9.3.8; TM-5I06); backend admission fail closed | trước rollout khách thật (security review riêng) | user; incident record |
| SR-05 | `previewSessionId` là bearer capability hẹp | ADR-071 | platform-security | chỉ synthetic P0 | gắn snapshot/`platformReleaseId`; TTL 30 phút; thu hồi; Origin/scope check; không URL/log (spec #5 §7.3; TM-5V01..05, spec #4 4Z13) | preview nối dữ liệu thật; trước rollout | user |
| SR-06 | Cache thông tin ≤ 60 s khi store không khả dụng | ADR-057 | platform | chỉ query thông tin | không dùng cho quyết định bảo mật; nhãn freshness (spec #5 §9.3.10) | danh sách query thông tin mở rộng | user |

## Verification pending / design resolved / open

| ID | Rủi ro | Nguồn | Trạng thái | Ghi chú |
|---|---|---|---|---|
| SR-02 | Race giữa thay đổi policy plugin và gate FBK | spec #5 §9.3.2–§9.3.5 (C1: `CAPSTATUS` là trạng thái policy hiệu lực; gate tạo đủ ở ingestion; không `Query` trong đường quyết định; M3 là nguồn) | **VERIFICATION_PENDING** | CT-26 + TM-5I01..04 — post-G1 implementation verification gate; DynamoDB thật sau G10 |
| SR-04 | JavaScript plugin trong origin Admin | ADR-070; C1: **presentation khai báo do host sở hữu**, Admin build không có code plugin (spec #2 rev 2.11 INV-A1; spec #4 §9) | **DESIGN_RESOLVED — chờ user xác nhận đề xuất** | nếu user không chấp nhận phương án khai báo → quay lại NOT ACCEPTED (ADR-070); kiểm chứng 4C03, 4Z10 sau G1 |
| SR-07 | Contention gate dùng chung làm revocation commit chậm | spec #5 §9.3.9; VG-12 | VERIFICATION_PENDING (sau G10) | `GATEINTENT` có hạn; retry không giới hạn |
| SR-08 | Code plugin đã revoke trong Admin / Preview | CSR-07 | DESIGN_RESOLVED (Admin không có code plugin; Preview `blockedPrks`, build sau loại `revoked`) | giới hạn còn lại: iframe đang mở tới khi phiên bị thay/hết hạn (≤ 30 phút) |
| SR-09 | Local same-site / `__Host-` trên HTTP / mock IdP vs Cognito | MINOR-12 | DESIGN_RESOLVED (ba origin khác site: `localhost`, `127.0.0.1`, `[::1]`; cookie PKCE `Lax`) + VERIFICATION_PENDING (trình duyệt demo; Cognito sau G10) | |
| SR-10 | `GATEINTENT` bị bỏ lại | MINOR-03 | DESIGN_RESOLVED (`expiresAt` 60 s, logical expiration, reconciler) | |
| SR-11 | Miễn trừ deploy gate race với mở lại gate | MINOR-02 | DESIGN_RESOLVED (spec #5 §9.3.4 b, §9.3.5 #10) | |
| SR-12 | Xóa/sửa trái phép `CAPSTATUS#`/`GATE#`; thu hồi session theo user | CSR-01, MINOR-08 | DESIGN_RESOLVED (không có thao tác xóa; IAM deny sau G10; repair dưới CAS; GSI theo user) | IAM chỉ kiểm được sau G10 |
