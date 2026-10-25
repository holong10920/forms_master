# Canonical builder S0 — T12 BLOCKED_BY_ENVIRONMENT

Chưa có image builder được build/verify. Không tuyên bố VG-05 PASS.

Yêu cầu của plan: base `node:24.22.1-bookworm-slim` phải pin digest được xác minh;
Node 24.22.1, pnpm 12.15.0 qua Corepack; UTC/C.UTF-8, umask 022, workdir `/build`.
Không dùng image tag floating để thay bằng chứng pin digest. Không push image.

Registry đã timeout trong phiên CP3; user yêu cầu ngừng debug Docker/downloads.
Tra cứu metadata Docker Hub qua web trong CP4 cũng không lấy được digest.
Vì vậy chưa tạo Dockerfile có digest chưa xác minh và chưa chạy container verification.

Khi có base image/digest hợp lệ trong local cache: tạo Dockerfile pin digest, build tag
`fb-builder:s0`, kiểm Node/pnpm/TZ, rồi chạy typecheck/test trên snapshot sạch. Snapshot
CP4 chưa commit có thể export theo manifest phạm vi đề xuất bằng file tools, bỏ `.git`,
`node_modules`, `.venv`, `spikes`, `var`, `.tools`. Không dùng Git checkout/reset/clone để
vượt lệnh cấm Git mutation. Không mount credential, home hay Docker socket vào builder.

T12 vẫn OPEN cho tới khi build và kiểm chứng thật; A/B reproducibility/isolation thuộc S2.

Kiểm local cache một lần trong vòng CP4/CP5:
`docker image ls --filter 'reference=node:24*' --format '{{.Repository}}:{{.Tag}} {{.Digest}} {{.ID}}'`
trả rỗng (exit 0). Không có image Node 24 để inspect digest/build/test offline.
Không gọi registry hay thử lại nguồn tải.

Đặc tả build có thể kiểm offline: Node 24.22.1 + Corepack 0.36.0, pnpm 12.15.0;
TZ=UTC, LANG=LC_ALL=C.UTF-8; cài devDependencies cho typecheck/test dù runtime production;
không dùng `--prod=false` (pnpm 12 không có cờ này). Copy source theo manifest scope,
không đưa cache/dependencies/data/home/credential vào build context.
Entrypoint áp umask 022 rồi exec command; workdir /build. Cấm tag floating thay digest.
Dockerfile/build vẫn chưa thực hiện vì không có digest được xác minh.
