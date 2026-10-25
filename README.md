# Multi-Site Form Builder PoC

Local synthetic P0, S0 engineering foundation. Chưa có Workflow Engine, Compiler nghiệp vụ,
Admin UI hoặc AWS deployment. S0 chưa DONE; xem các gate còn mở bên dưới.

## Setup trên macOS

Cần Volta, Node **24.22.1**, pnpm **12.15.0** qua Corepack, Python **3.13.x**, uv **≥0.13.5**.
Giữ Node mặc định của máy; chỉ `volta fetch`, không `volta install`.

```sh
volta fetch node@24.22.1
export PATH="$HOME/.volta/bin:$PATH"
node -v
```

Corepack phải thuộc toolchain Node 24; lệnh `corepack` trần có thể trỏ vào nvm/Node khác.
Dùng đường dẫn runtime đã resolve qua Volta. Nếu file Corepack chưa có, cài đúng version
bằng npm của Node 24 (không đổi Node mặc định).

```sh
FB_NODE24_BIN="$(dirname "$(node -p 'process.execPath')")"
# Chỉ nếu Corepack chưa có trong toolchain này:
# "$FB_NODE24_BIN/node" "$FB_NODE24_BIN/npm" install --global corepack@0.36.0
"$FB_NODE24_BIN/node" "$FB_NODE24_BIN/corepack" --version
mkdir -p .tools/bin
"$FB_NODE24_BIN/node" "$FB_NODE24_BIN/corepack" enable --install-directory "$PWD/.tools/bin" pnpm
export PATH="$PWD/.tools/bin:$HOME/.volta/bin:$PATH"
pnpm --version
pnpm preflight
pnpm install --frozen-lockfile
uv sync --locked
```

Mỗi package workspace dùng `volta.extends` về root. `node` phải resolve qua Volta shim;
Homebrew Node đứng trước Volta trong PATH sẽ không áp project pin. Không chạy install với
Node ngoài pin. `pnpm preflight` kiểm Node/pnpm và file pin nhất quán trước `pnpm verify`.

Scanner thay thế pin **detect-secrets==1.5.0**, chạy isolated bằng uvx/PyPI, không sửa dependency
runtime. Provision trước khi chạy tests (negative fixtures chạy scanner offline):

```sh
export UV_CACHE_DIR="$PWD/.tools/uv-cache"
export UV_TOOL_DIR="$PWD/.tools/uv-tools"
export UV_TOOL_BIN_DIR="$PWD/.tools/uv-bin"
uvx --from detect-secrets==1.5.0 detect-secrets scan --help >/dev/null
pnpm verify
uv run python -m fb_store init --data-dir var
```

`pnpm verify` chạy format, lint, typecheck, test, schema drift/lint, TS/Python boundaries,
synthetic fixtures và alternative secret scan. Lần đầu cần mạng cho dependency provisioning;
unit tests không dùng mạng. Có thể dùng cache ở `/tmp` khi sandbox không cho ghi cache mặc định.

## Coverage và gate còn mở

`pnpm secrets` scan source hiện tại, candidate source chưa track và toàn bộ Git index riêng
bằng 27 detector mặc định, không network verification. Báo file/dòng/type, không giá trị secret.
Digest fixture chỉ được phân loại false positive khi recompute khớp; chuỗi script scanner phải
khớp chính xác command cố định. Docs lịch sử, vendor, lockfile và file ignored nằm ngoài source coverage; mọi file added/modified/renamed trong staging vẫn được scan từ index, không áp source exclusions.
Xem [security boundary](docs/engineering/SECURITY_BOUNDARIES_P0.md).

`pnpm secrets:gitleaks` là kiểm tùy chọn chưa chạy được; test Gitleaks chủ đích SKIP khi thiếu
CLI 8.30.1. Gitleaks NOT_EXECUTED. Alternative scanner đã được user ACCEPTED cho S0 local synthetic P0; không còn bắt buộc tải Gitleaks để đóng T10 trong phạm vi này. Không tuyên bố hai scanner tương đương.

T12 container: `BLOCKED_BY_ENVIRONMENT` khi local cache không có Node 24 với digest hợp lệ.
Không có container build PASS, không có A/B reproducibility claim. Budget/perf artifact thuộc S2.
G9/G10 BLOCKED: không GitHub/push, không AWS write. Không tự chuyển S0 DONE hoặc G2 PASS.
