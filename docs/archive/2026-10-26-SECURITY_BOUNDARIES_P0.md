# Ranh giới bảo mật local synthetic P0

Chỉ dùng dữ liệu synthetic, cửa hàng hư cấu và endpoint mock. Cấm PII, credential thật,
source công ty và endpoint công ty. Không truy cập GitHub, không push (G9 BLOCKED), không
AWS write (G10 BLOCKED). Process demo phải bind `127.0.0.1`; dữ liệu local ở `var/` gitignored.

- `pnpm synthetic:check` kiểm email trong `contracts/fixtures`: chỉ domain reserved
  `example.com`, `example.jp`, `example.org`, `.invalid`, `.test`, `.example`; báo file/dòng,
  không in địa chỉ. Đây là kiểm domain email, không phải DLP tổng quát hay bằng chứng không có PII khác.
- `pnpm secrets` dùng **detect-secrets==1.5.0** qua isolated uvx/PyPI, 27 detector mặc định,
  không disable rule, không network verification. Export hai snapshot riêng: source working tree
  (gồm candidate source chưa track, bỏ untracked spike) và toàn bộ source trong Git index; staged
  files (kể cả docs/lock/vendor nếu được stage) phải nằm trong index manifest SHA-256; source exclusions không áp cho staged files. Đọc JSON findings, không lấy exit code làm PASS.
  Phạm vi: source/config/fixtures toàn repo; loại docs lịch sử/evidence, vendor, lockfiles,
  CLAUDE.md và file Git-ignored. Đây là static detection, không là DLP hoặc live credential audit.
- False positive chỉ tự phân loại ở hai file digest/JCS fixture khi giá trị trên dòng `sha256`
  đúng hash recompute từ input/canonical, đồng thời khớp fingerprint detector; hoặc chuỗi command
  scanner cố định trong root package.json. Mọi finding khác làm gate FAIL và chỉ báo vị trí/type.
  Negative tests chạy offline, bắt AWS-shaped key, password ngẫu nhiên và private key sinh tại runtime;
  thêm case hash fixture bị sửa để chứng minh không được bỏ qua tùy tiện.
- `pnpm secrets:gitleaks` giữ wrapper CLI **8.30.1** cũ. Integration test chủ đích SKIP nếu CLI
  chưa có: đó là kiểm tùy chọn, không phải scanner thay thế bị skip. Không gọi Gitleaks PASS.
  Alternative scanner ACCEPTED cho S0 local synthetic P0 theo quyết định user. Gitleaks
  NOT_EXECUTED; không còn bắt buộc tải Gitleaks để đóng T10 trong phạm vi này. Hai scanner
  không được tuyên bố tương đương hoàn toàn.
- `pnpm test` chặn `fetch` trong mọi Vitest worker. Không chặn `node:net`, subprocess hoặc mọi
  thư viện HTTP; code browser-safe bị cấm Node core bằng `pnpm boundaries`. Test không được
  dùng network để bypass guard. Python `pnpm py:test` chặn TCP socket, vẫn cho Unix socket.
- `pnpm boundaries` kiểm năm luật TS; `pnpm py:imports` giữ chiều `fb_store → fb_contracts`.
  Negative fixtures chứng minh từng luật bắt vi phạm; package mới phải thêm guard và fixture.

Theo ADR-063/071/076/078 và SR-01..12 trong SECURITY_RISK_REGISTER. S0 không kiểm chứng
hay đóng bất kỳ SR nào: admission, Preview isolation, SSRF, supply chain/runtime và các
biện pháp production cần slice tương ứng và evidence riêng. Không đưa secret/PII vào evidence.
