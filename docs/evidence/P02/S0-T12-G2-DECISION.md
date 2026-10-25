# T12 và quyết định G2 — chờ user

- Đã làm offline: build specification về Node 24.22.1/Corepack 0.36.0/pnpm 12.15.0,
  UTC/C.UTF-8, `/build`, umask 022, cài dev dependencies và loại data/credential/host cache
  khỏi context. User đã chấp nhận specification này. Chưa tạo Dockerfile có digest thật.
- Chưa làm: pin base digest được xác minh, build `fb-builder:s0`, kiểm version/TZ trong image,
  frozen install/typecheck/tests trong container. Không có container PASS hoặc A/B claim.
- Cache Node 24 kiểm một lần trả rỗng; digest **chưa xác minh**. Không retry Docker/registry.
  Trạng thái `BLOCKED_BY_ENVIRONMENT`.
- Nếu hoãn tới trước S2: host macOS PASS chưa chứng minh môi trường Linux chuẩn, path/FS,
  native tooling hoặc reproducible compiler artifacts. Không được dùng evidence host để
  kết luận release build/integrity đạt yêu cầu. T12 phải xong trước mọi compiler release
  acceptance; A/B và isolation thật vẫn là việc S2.
- **Đề xuất mặc định: giữ G2 BLOCKED**, S0 acceptance PENDING. Nếu cần tiếp tục S1 local
  synthetic, user có thể duyệt ngoại lệ riêng giới hạn S1: không compiler/release/publish,
  không bỏ VG-05, T12 bắt buộc trước S2, không đổi G9/G10. Đây chỉ là đề xuất, chưa APPROVED.
