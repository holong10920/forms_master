# Form Master — Go + React Workspace

No-Code Form Builder chạy local với **Go modular monolith**, React/TypeScript và SQLite. TypeScript Workflow Engine, Compiler và Customer Runtime được giữ lại. **Python runtime, oracle, rollback host và môi trường uv đã được gỡ theo yêu cầu ngày 2026-10-27.**

> Checkpoint cleanup: backend và các gate độc lập đã qua. Một phiên khác đang sửa UI; integration Studio mới nhất đang chờ chốt, không kế thừa browser PASS của bản trước. Xem [báo cáo](docs/evidence/SOURCE-CLEANUP/RESULTS.md).

## Chạy local

Yêu cầu Node **24.22.1**, pnpm **12.15.0**, Go toolchain **1.27.3** và macOS với kernel network sandbox. Không cần Docker hoặc AWS.

```sh
export PATH="$PWD/.tools/bin:$PATH"
pnpm install --frozen-lockfile
pnpm --dir tools/go-auth/web --ignore-workspace install --frozen-lockfile
pnpm local:master
```

Mở **http://localhost:4180/**, đăng nhập qua mock OIDC bằng `synthetic-admin` hoặc `synthetic-member`. Admin mở Form Builder tại `/studio`; Member chỉ có quyền đọc PC được cấp trên server. `synthetic-approver` duyệt review độc lập. Không có mật khẩu thật hoặc token trong browser storage.

| Thành phần                     | Địa chỉ                                              |
| ------------------------------ | ---------------------------------------------------- |
| Workspace / Dashboard / Studio | http://localhost:4180/                               |
| Go API/BFF                     | loopback 4181, truy cập qua proxy `/api` cùng origin |
| Mock OIDC                      | http://127.0.0.1:4182/                               |
| Customer đã publish            | http://127.0.0.1:4183/r/RELEASE_ID/index.html        |
| Preview cô lập                 | http://127.0.0.1:4185/                               |

Launcher kiểm tra port, build Go và Studio, health-check các dịch vụ, in URL và dừng child process bằng Ctrl-C. Lần đầu sẽ snapshot SQLite cũ nếu còn, hoặc khởi tạo ba draft synthetic bằng Go nếu không có dữ liệu cũ; không cần Python. Không tự giết tiến trình chiếm port. Go phục vụ business API, session/RBAC, review/publish/rollback, submission/outbox và mock effects. Không khởi động backend Python.

## Source hiện hành

| Thư mục                                           | Vai trò                                                                            |
| ------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `tools/go-auth/cmd`, `internal`                   | Go API/BFF, engine validation, persistence, business modules và verifier           |
| `tools/go-auth/web/src`                           | React Workspace, login và lifecycle Studio                                         |
| `tools/go-auth/studio`                            | Source editor No-Code duy nhất; được bundle/mount trong React, không iframe editor |
| `tools/compiler`                                  | TypeScript compiler, release integrity và build isolation; semantic gate gọi Go    |
| `packages/form-engine`, `packages/static-runtime` | Workflow và runtime customer dùng chung                                            |
| `contracts`                                       | Schema, generated contracts và golden fixtures                                     |
| `plugins`                                         | Trusted browser plugin và metadata/pin contract; thực thi server bằng Go           |
| `tools/legacy-analyzer`                           | Analyzer AST read-only, import nháp và mẫu PC                                      |
| `tools/security`, `tools/verify`                  | Security checks, toolchain và cleanup có giới hạn                                  |
| `docs`                                            | Tài liệu hiện tại, lịch sử và bằng chứng                                           |
| `var`                                             | Database, immutable releases, khóa local và backup; không phải source thừa         |
| `output/playwright`                               | Ảnh kiểm chứng đã được dẫn trong báo cáo                                           |

Không xóa `node_modules`/`.tools/bin` khi đang chạy. `dist` và Studio public bundle là đầu ra tái tạo; source editor không nằm ở `tools/local_p0/web` nữa. Thư mục `tools/local_p0` đã được gỡ.

## Kiểm chứng

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm gen:check
pnpm schemas:lint
pnpm boundaries
pnpm --dir tools/go-auth/web test
pnpm --dir tools/go-auth/web build
cd tools/go-auth
./go-local.sh test ./...
./go-local.sh test -race ./...
./go-local.sh vet ./...
```

`pnpm secrets` dùng **Gitleaks 8.30.1** native, không `uvx`/detect-secrets. Cần scanner đúng version trong PATH, `.tools/bin/gitleaks`, hoặc `FB_GITLEAKS_BIN`. Thiếu scanner làm security gate fail; không tải tool từ GitHub. Scanner chỉ báo path/dòng/rule, không in giá trị secret. Kết quả Python 798 PASS trong báo cáo trước đây là lịch sử, không phải test suite hiện hành.

Dọn cache/output thử nghiệm theo allowlist, sau khi dừng test/browser automation:

```sh
pnpm clean:local          # dry-run
pnpm clean:local --apply  # xóa các mục được liệt kê
```

Lệnh này không xóa source, database, release, backup, screenshot, dependency đang dùng hoặc Git state. Chi tiết quyết định giữ/xóa và kiểm chứng: [cleanup report](docs/evidence/SOURCE-CLEANUP/RESULTS.md).

## Trạng thái và giới hạn

Local Go Workspace và các luồng P0 đã có bằng chứng thực thi; đây không phải chứng nhận production/ECS/PostgreSQL. T12/K13 vẫn **VERIFICATION_PENDING**. Không GitHub/Git mutation, AWS write, production API hoặc PII.

Mở rộng legacy hiện là prototype PC một sản phẩm desktop/notebook; 14/34 nhóm capability trong audit được hỗ trợ đầy đủ. Chưa hỗ trợ toàn bộ Apply/Add/Entry/Raiten; còn giỏ hàng nhiều sản phẩm, catalog động và mapping payload legacy. Không dùng tên “migration complete” cho phần capability này.

- [Trạng thái hiện tại](docs/CURRENT_STATUS.md)
- [Bàn giao](docs/CONTEXT_HANDOFF.md)
- [Go routes/modules/security](tools/go-auth/README.md)
- [Route migration matrix](tools/go-auth/evidence/migration/ROUTE-MATRIX.md)
- [Legacy capability/evidence](tools/legacy-analyzer/evidence/RESULTS.md)
- [Responsive verification](tools/go-auth/evidence/responsive/RESULTS.md)
