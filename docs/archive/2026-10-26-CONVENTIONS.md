# Quy ước S0 local

| Lệnh | Mục đích |
|---|---|
| `pnpm preflight` | Node 24.22.1, pnpm 12.15.0 và pin files |
| `pnpm verify` | Toàn bộ kiểm local, fail ở bước đầu không đạt |
| `pnpm gen:check`, `pnpm schemas:lint` | Không drift generated schema, chỉ keyword cho phép |
| `pnpm boundaries`, `pnpm py:imports` | Năm luật TS và chiều store → contracts |
| `pnpm synthetic:check`, `pnpm secrets` | Synthetic email domains và scanner thay thế pinned |
| `pnpm secrets:gitleaks` | Scanner cũ tùy chọn, chưa PASS khi thiếu CLI |
| `uv run python -m fb_store init --data-dir var` | Khởi tạo dữ liệu synthetic local |

Nguồn schema ở `contracts/`, TS ở `packages/`, Python ở `python/`, công cụ ở `tools/`.
Thêm schema: schema file → `pnpm gen` → fixture valid/invalid → parity tests hai runtime.
Không sửa tay generated output. Thêm package: Volta extends root, tsconfig strict, boundary
cùng negative fixture; dùng tên package khi import qua ranh giới, không relative path.

SQLite dùng `autocommit=True`, explicit `BEGIN IMMEDIATE`, mỗi migration nguyên tử cùng
checksum/bookkeeping. Chỉ read-only PRAGMA trong allowlist được phép trong migration.
Không transaction control/ATTACH/DETACH. Không sửa migration đã áp. Bảng domain của slice sau
phải STRICT, khóa tương ứng PK/SK, cân nhắc WITHOUT ROWID khi khóa ghép; không PII trong khóa.
Write và condition check phải qua Tx.action/require_one/check; query chỉ đọc. Giới hạn 100
act / 4 MB params / 400 KB item áp ở primitive; sizing JSON không chứng minh sizing DynamoDB
chính xác, SQLite lock toàn DB không chứng minh conflict hay throughput DynamoDB.

Mã lỗi: E-JCS-UNSUPPORTED-VALUE, E-PAYLOADREF-*, E-DIGEST-FORMAT, E-STORE-KEY-INVALID,
E-DIGEST-MISMATCH, E-TRANSACTION-TOO-LARGE, E-ITEM-TOO-LARGE, E-MIGRATION và
E-PAYLOAD-INTEGRITY (spec #5). Store local write-once không overwrite khác nội dung.

Evidence ghi command/output thật, skip/fail/blocker rõ ràng và che local user path; không secret,
PII hay chi tiết công ty. Candidate snapshot có manifest SHA-256, không chứa host dependencies,
data hoặc ignored files. Local clean clone dùng origin filesystem, tuyệt đối không fetch/push.
CP4 đã commit tại `292df4b024ecbd66c7ebe786e2e6103abeafaec9`. Candidate overlay trước đó chỉ là evidence preliminary.
CP5 phải có commit được duyệt rồi clone local và chạy từ committed source, không overlay.
Không gọi candidate-only verification là committed verification.

Mỗi commit cần user duyệt phạm vi, không bypass hook. G9/G10 BLOCKED; không GitHub, không AWS.
Alternative scanner ACCEPTED cho S0 synthetic P0; Gitleaks NOT_EXECUTED và không bắt buộc
đóng T10 trong phạm vi này. T12 chưa có container evidence; S0/G2 chưa PASS.
