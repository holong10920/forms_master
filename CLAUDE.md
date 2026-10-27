# CLAUDE.md — Multi-Site Form Builder PoC

Trạng thái vận hành mới nhất: [README](README.md), [CURRENT_STATUS](docs/CURRENT_STATUS.md). Go + React là đường chạy hiện hành; Python đã được gỡ ngày 2026-10-27 theo yêu cầu user. Tài liệu/spec/evidence cũ chỉ mô tả thời điểm lịch sử. User instructions hiện hành có ưu tiên cao hơn các ghi chú dưới đây.

Master contract: [MASTER_PROMPT_MULTI_SITE_FORM_BUILDER_AWS_TRAINING.md](MASTER_PROMPT_MULTI_SITE_FORM_BUILDER_AWS_TRAINING.md). Không sửa mục tiêu trong master; thay đổi scope phải qua ADR + user approval.

## Bắt buộc mỗi phiên (CTX-10)

1. Đọc theo thứ tự: `docs/CONTEXT_HANDOFF.md` → `docs/CURRENT_STATUS.md` → `docs/PROJECT_CHARTER.md` → `docs/PROJECT_CHECKLIST.md` → `docs/DECISIONS.md` → plan đang active (ghi trong CURRENT_STATUS).
2. Báo cáo ngắn: `vị trí hiện tại → checkpoint tiếp theo → điều kiện phê duyệt`.
3. Chỉ sau đó mới sửa code/docs.

## Gates (không được bỏ qua)

| Gate | Điều kiện | Trước gate KHÔNG được |
|---|---|---|
| G0 | ✅ APPROVED WITH ADJUSTMENTS 2026-10-23 (ADR-001..007) | — |
| G1 | User duyệt design specs (`docs/superpowers/specs/`) | scaffold app, viết feature code |
| G9 | User xác nhận ownership + repo GitHub target | push remote, tạo repo, đổi visibility |
| G10 | User approval bằng văn bản: account, region, resources, cost limit | bất kỳ AWS mutating API nào |

## Hard rules

- **AWS: read-only** (`describe/list/get/logs`, `sts get-caller-identity`). Cấm `deploy/apply/bootstrap/s3 sync/create-*/put-*/delete-*/invalidation` trước G10. Không in credentials. Không chạm tài nguyên sẵn có trong account (master §3.1).
- **Không đoán AWS account từ tên profile.** Máy có 3 local profiles (tên trong `docs/internal/evidence/P00/`), không profile nào tên `aws-training`; user xác nhận trước G10 (ADR-006).
- **Git/GitHub:** cấm toàn bộ truy cập GitHub và Git mutation theo chỉ thị hiện hành của user. Không `gh`, GitHub API/website, fetch/pull/push, commit/stage/branch/worktree/reset/stash. Local read-only Git inspection chỉ khi user đã yêu cầu trong cuộc hội thoại. Ngoại lệ lịch sử không phải quyền thường trực.

- **Company source/IP:** chỉ đọc repo công ty để audit capability; không copy code. Chi tiết nội bộ (paths, APIs, tên thư viện, điểm yếu hệ thống cũ, số bundle cũ) chỉ đặt trong `docs/internal/` (gitignored) — ADR-001. File master prompt cũng gitignored chờ user review.
- **MVP:** vertical slice (ADR-004); undo/redo là P1. **Performance:** chỉ số đo trên artifact thật (ADR-005).
- **Data:** chỉ mock/dữ liệu giả; không gọi API thu mua thật, không PII. Store/center data trong PoC là mock hư cấu hoàn toàn; không gọi endpoint center/shop list thật.
- **Evidence:** chỉ đánh `[x]` khi có file/commit + command + kết quả thực tế. Test fail/skip phải báo đúng.
- **Hosting:** không đề xuất Vercel. Target = AWS training isolated PoC sau G10; mặc định = local demo.

## Cuối mỗi phase/phiên

Cập nhật `docs/PROJECT_CHECKLIST.md`, `docs/CURRENT_STATUS.md`, `docs/CONTEXT_HANDOFF.md`, `docs/REQUIREMENTS_TRACEABILITY.md`; lưu evidence vào `docs/evidence/<PHASE>/`; báo cáo theo format master §0.2.

## Ngôn ngữ

Báo cáo/docs: tiếng Việt. Code/API/identifiers: tiếng Anh. Nội dung form mẫu: tiếng Nhật.
