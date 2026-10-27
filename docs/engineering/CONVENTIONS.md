# Quy ước hiện hành — Go + React

Đường chạy chuẩn: `pnpm local:master`, Admin http://localhost:4180/. Python, uv và host `local:p0` đã retire theo yêu cầu user. [Bản S0 lịch sử](../archive/2026-10-26-CONVENTIONS.md) không phải hướng dẫn vận hành mới.

| Lệnh | Mục đích |
| --- | --- |
| `pnpm preflight` | Pin Node 24.22.1 và pnpm 12.15.0 |
| `pnpm verify` | Format/lint/typecheck/test/schema/boundaries/synthetic/secret checks; fail khi gate không đạt |
| `pnpm --dir tools/go-auth/web test` / `build` | React tests và production build |
| `tools/go-auth/go-local.sh test ./...` trong module Go | Go tests; thêm `-race` và `vet` khi phù hợp |
| `pnpm gen`, `pnpm gen:check`, `pnpm schemas:lint` | Sinh contracts và kiểm schema drift/keyword |
| `pnpm boundaries` | TS/browser/module dependency guards |
| `pnpm synthetic:check`, `pnpm secrets` | Synthetic domains và native Gitleaks 8.30.1 |
| `pnpm clean:local [--apply]` | Dry-run/xóa cache, môi trường đã retire và output prototype theo allowlist |

Source Go ở `tools/go-auth`, React ở `tools/go-auth/web/src`, editor ở `tools/go-auth/studio`, shared compiler/runtime ở `tools/compiler` và `packages`, schema/golden fixtures ở `contracts`. Chỉ có một source editor. Không sửa tay `web/public/studio` hoặc generated contracts.

SQLite transaction/authorization nằm trong Go. Không sửa migration đã áp hoặc checksum của `001_legacy.sql`; tên legacy là lịch sử schema, không phải Python runtime. Kiểm tra version/CAS và quyền trên server, không dùng frontend role header làm authority. PostgreSQL/ECS chưa được chứng minh bởi SQLite local.

Compiler dùng bounded Node IPC và semantic verifier Go. Builder inputs và immutable artifacts phải giữ integrity/reproducibility checks. Mọi form/customer/plugin script vẫn chạy ở origin cô lập. Không raw CSS/JS tùy ý từ Inspector.

Không GitHub access hoặc Git mutation, không AWS writes, không real customer data. Chỉ ghi PASS khi có command/log đã thực thi. T12/K13 vẫn VERIFICATION_PENDING.
