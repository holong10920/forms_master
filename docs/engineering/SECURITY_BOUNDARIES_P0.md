# Ranh giới bảo mật local hiện hành

Chỉ synthetic data và local mock connectors. Không PII, production API, GitHub access, Git mutation hoặc AWS write. Các quy định user hiện hành mạnh hơn ngoại lệ lịch sử. [Bản S0 lịch sử](../archive/2026-10-26-SECURITY_BOUNDARIES_P0.md) giữ để truy vết, không dùng làm hướng dẫn scanner/runtime mới.

- Go OIDC/BFF: Code + PKCE S256, state/nonce/replay, RS256 issuer/audience/expiry checks, opaque verifier sessions và server-owned membership/capability authorization.
- Cookie HTTPS Secure/HttpOnly; ngoại lệ HTTP chỉ cho loopback được cấu hình tường minh. Mutation cần CSRF token và exact Origin. Member không nhận quyền edit/publish từ header/payload.
- Admin localhost:4180; Customer 127.0.0.1:4183; Preview 127.0.0.1:4185. Plugin executable không chạy trong authenticated Admin canvas. Preview không nhận cookie Admin.
- Go xử lý admission, server validation/recompute, submission idempotency, transactional outbox và receipt-only mock effects. Không Python interpreter/API/worker trong đường chạy hoặc kiểm thử hiện hành.
- Compiler vẫn TypeScript; input/output và command adapter cố định, timeout, source/module allowlist và artifact checks giữ nguyên. Semantic gate gọi Go verifier.
- Store Selector 1.0.0 metadata lịch sử có descriptor cũ. Không import/execute descriptor đó. New lock pin source Go; old immutable release chỉ được ánh xạ bằng digest compatibility chính xác. Mọi pin khác bị từ chối.
- `pnpm secrets`: Gitleaks **8.30.1** native, config `.gitleaks.toml` kế thừa default rules. Không `uvx`/detect-secrets hoặc network verification. Thiếu/sai version scanner làm gate fail.
- Working source và Git index được export riêng bằng thao tác đọc; staged files phải có trong manifest. Findings công khai chỉ gồm path/dòng/rule, không Match/Secret. Tests sinh credential/private key synthetic rồi kiểm scanner và redaction. Không tuyên bố Gitleaks có cùng 27 detector với scanner Python trước đây.
- `pnpm synthetic:check` kiểm reserved email domains, không phải DLP toàn diện. `pnpm test` chặn fetch trong Vitest worker; đó không phải sandbox cho mọi syscall/subprocess. Launcher local vẫn dùng kernel network sandbox.
- `pnpm boundaries` chặn server/Node/core imports trong browser-safe modules. Regex schema chỉ cho các host token pattern cố định tại đúng vị trí; không cho người dùng đưa regex/CSS/JS tùy ý.
- Dữ liệu, migrations đã áp, audit, immutable release, migration baseline, backup và screenshot có bằng chứng không được xóa như cache. Cleanup chỉ theo allowlist.

Go/TS/browser/security logs mới ở [SOURCE-CLEANUP](../evidence/SOURCE-CLEANUP/RESULTS.md). SQLite local không chứng minh production/PostgreSQL security. T12/container và K13 vẫn pending; không tự đóng security risks hoặc production gates.
