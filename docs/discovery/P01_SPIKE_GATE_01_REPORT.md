# SPIKE-GATE-01 — Compiler Feasibility Spike: báo cáo kết quả

> ADR-042 (APPROVED WITH LIMITED SCOPE). Ngày chạy: 2026-10-24. **Không phải implementation.** Code spike là code dùng xong bỏ, nằm ở `spikes/compiler-feasibility/` trên branch local `spike/compiler-feasibility` (chưa commit; chờ user duyệt commit). Không merge, không cherry-pick.
>
> Tiêu chí PASS/FAIL/INCONCLUSIVE của từng thí nghiệm đã được commit **trước khi chạy** (commit `22ecfaf`, `P01_BRAINSTORM_NOTES.md`, Session 3: Spec #3 Review #1). Báo cáo này đánh giá theo đúng tiêu chí đó; không sửa tiêu chí sau khi xem kết quả.
>
> Evidence (đã che đường dẫn tuyệt đối của máy): `docs/evidence/P01/spike-gate-01/`. Evidence đầy đủ và source tái hiện: `spikes/compiler-feasibility/evidence/`.

## 0. Tóm tắt

| EXP | Kết quả | Một dòng |
|---|---|---|
| EXP-01 Build isolation | **PASS** | Sports không có Store Selector; Sports Motion-none không có Motion; PC chỉ tải chunk ở nhánh 店頭; 宅配 không request; không design/server; một React; không vòng — trên Chromium, Firefox, WebKit. |
| EXP-02 Reproducible build | **PASS** | Hai build sạch độc lập trong container pin digest: 46/46 file giống hệt từng byte, cùng `releaseId`, không path tuyệt đối. |
| EXP-03 Conditional exports | **FAIL** (hai điều kiện đã chốt bị vi phạm) | `exports` chặn đúng `./design` và đường dẫn server qua package path, nhưng **import tương đối** đưa được design (n2) và cả file `.py` (n4) vào build khách. L3 và quét canary bắt đúng mọi negative fixture. |
| EXP-04 Dynamic import failure | **PASS**, kèm **một giả định thiết kế FAIL** | Hành vi các kịch bản ghi được trên cả ba engine; retry bằng URL có query hoạt động khi lỗi là tạm thời; reload về đúng release và giữ dữ liệu không-PII. Nhưng trên WebKit (Playwright), reload **không** phục hồi được lỗi evaluate; nguyên nhân chưa rõ. |
| EXP-05 Performance | **PASS** (đã đo; LAB-ONLY) | Thu được T1/T2/T3, byte, request, cold/warm với throttling ghi rõ. TTFB không đo có ý nghĩa bằng CDP emulation. |

**OD3-01 (bundler):** Vite 8.3.5 + Rolldown 1.2.15 đáp ứng các yêu cầu cứng ở spec #3 §9 **đã được kiểm** trong spike (chunk group `core`, export condition, module graph, tái lập byte-for-byte, chạy không mạng, tên file hex khi cấu hình). **Chưa kiểm:** resolve plugin từ release store (spike resolve từ `node_modules` workspace) và plugin L1b. Khuyến nghị chọn có điều kiện: hai mục này phải pass ở verification đầu của implementation. Quyết định thuộc user.

## 1. Môi trường

| Mục | Giá trị |
|---|---|
| Máy | macOS, darwin-arm64; Docker 29.1.3 (Docker Desktop) |
| Canonical image | `node@sha256:2cf067cfed83d5ea958367df9f966191a942351a2df77d6f0193e162b5febfc0` (`node:20.20.2-bookworm-slim`, linux/arm64) |
| Node / npm | 20.20.2 / 10.8.2 (host và image giống nhau) |
| Bundler | Vite 8.3.5, Rolldown 1.2.15 (Vite khai `rolldown ~1.2.14`; lockfile pin 1.2.15) |
| Runtime | React 19.3.1, React DOM 19.3.1, motion 14.6.0 |
| Test | Playwright 1.64.1; Chromium 156.0.8078.4, Firefox 157.0, WebKit 27.2 |
| Ghi chú cài đặt | `npm install` với npm 10.8.2 lỗi arborist (`Cannot read properties of null (reading 'edgesOut')`) khi resolve optional peer trong workspace; spike dùng `legacy-peer-deps=true` (`.npmrc`). Ảnh hưởng tới quyết định package manager ở P02. |

## 2. Spike làm gì (và không làm gì)

- **Fixture:** `sports-demo`, `sports-demo-nomotion`, `pc-demo` (rev7), `pc-demo-rev8`; plugin giả `@platform/store-selector` có browser, design, contract, server (Python), fixtures, mỗi phần có canary riêng; negative fixture `neg-design-relative`, `neg-server-relative` và control `neg-control`.
- **Giả lập K7–K12 tối thiểu:** chunk plan theo spec #3 §7.2, codegen chỉ có specifier literal, build Vite+Rolldown, Chunk Manifest với module id chuẩn hóa, IR asset = JCS(IR), LRM → `releaseId` → `index.html` → attestation.
- **Mini runtime** (không phải workflow engine): render IR, `awaitingCapability`, phân loại lỗi tải, retry hai bậc, draft không PII, performance mark.
- **Không làm:** production compiler, engine, Admin, backend, status API (spec #5), AWS, push.

## 3. Kết quả từng thí nghiệm

### 3.1. EXP-01 — Build isolation

- **Giả thuyết:** chunk plan + codegen + Rolldown cho artifact chỉ chứa đúng capability của form, và browser chỉ tải chunk của nhánh được đi.
- **Lệnh:** `node tools/build-all.mjs && node tools/verify-isolation.mjs && npx playwright test tests/exp01-network.spec.mjs`
- **Quan sát:**

| Kiểm tra | Sports | Sports Motion-none | PC rev7 / rev8 |
|---|---|---|---|
| (a) module/marker Store Selector | 0 / 0 file | 0 / 0 | 3 module, marker chỉ ở `g-stp_store.<h>.js` |
| (b) module Motion; `import()` tới Motion | 156 (chỉ trong `motion.*`) | **0; 0** | 156 (chỉ trong `motion.*`) |
| (e) module/canary design, server, fixture; tên handler server; file `.py` | 0 | 0 | 0 |
| (f) React | `react`, `react-dom` 19.3.1, `scheduler` 0.28.0, chỉ trong `core` | như trên | như trên |
| (g) vòng import tĩnh giữa chunk | 0 | 0 | 0 |
| Path tuyệt đối (file phục vụ / private) | 0 / 0 | 0 / 0 | 0 / 0 |
| Topology | `core`, `entry`, `motion` | `core`, `entry` | `core`, `entry`, `g-stp_store` (+CSS), `motion` |

| Network (Playwright) | Chromium | Firefox | WebKit |
|---|---|---|---|
| (c) PC: request `g-stp_store` trước khi chọn 店頭 | 0 | 0 | 0 |
| PC: sau khi chọn 店頭 (prefetch), module chưa khởi tạo | 2 request (JS, CSS), chưa khởi tạo | như Chromium | như Chromium |
| PC: tổng request `g-stp_store` tới khi vào step | 2 (dùng lại cache prefetch) | 2 | **4** (prefetch không được dùng lại) |
| (d) PC 宅配 tới 確認: request `g-stp_store` | 0 | 0 | 0 |
| Sports Motion-none tới 確認: request `motion.*` hoặc `g-*` | 0 | 0 | 0 |
| `saveData`: prefetch bị bỏ; vẫn lazy-load khi tới step | ✔ | ✔ | ✔ |

- **Kết quả:** **PASS** — (a)–(g) đều đúng, có đủ evidence G, I, N, R.
- **Evidence:** `exp01/graph-inventory-report.json`, `exp01/network-<engine>-*.json`.
- **Giới hạn:** fixture nhỏ; một plugin; mini runtime thay cho engine thật.
- **Ảnh hưởng tới spec #3:** xác nhận §7.1 (`core` tránh vòng), §7.2, §8, §10, §15.2. Hai phát hiện:
  1. Rolldown mặc định sinh tên file có chữ hoa và `_` (`core.tL1u5uYc.js`), **vi phạm** quy tắc path `[a-z0-9._/-]` (§11.1). Phải cấu hình `output.hashCharacters: 'hex'` và `[hash:12]`.
  2. **WebKit không dùng lại** response của prefetch bằng `fetch()` cho lần tải module: JS và CSS bị tải hai lần.

### 3.2. EXP-02 — Reproducible build

- **Giả thuyết:** trong canonical environment, hai build sạch độc lập từ cùng input cho artifact giống hệt từng byte.
- **Lệnh:** `sh tools/repro.sh A && sh tools/repro.sh B && node tools/compare.mjs evidence/exp02/run-A evidence/exp02/run-B A-vs-B`. Mỗi run: volume Docker mới; copy input (không `node_modules`, `out`, `gen`); `npm ci` từ lockfile; build với `--network none`, `TZ=UTC`, `LANG/LC_ALL=C.UTF-8`, umask 022.
- **Quan sát:** A vs B: 46/46 file (release phục vụ, platform bootstrap, private LRM/Chunk Plan/Chunk Manifest/attestation; provenance loại trừ vì có thời điểm theo từng build) **giống hệt**; cùng tập file; cùng 4 `releaseId`; 0 path tuyệt đối; tên file tất định.
- **Quan sát thêm (ngoài tiêu chí):**
  - Run C với thư mục làm việc **trong container** là `/build-alt` (đổi path mà toolchain thấy): giống hệt A → test path independence kiểu TM-B14 PASS cho fixture này.
  - Build native trên macOS host (darwin-arm64) giống hệt container Linux (linux-arm64).
  - Khi source engine đổi (sửa cho EXP-05), `releaseId` đổi, đúng kỳ vọng. Evidence của lần so sánh trước khi sửa không được giữ lại, nên chỉ lần chạy cuối được dùng làm bằng chứng.
  - Khác biệt với spec: spike ghi `attestation.json` trong từng lần build; spec ghi attestation một lần ở K14 sau K13.
- **Kết quả:** **PASS.**
- **Evidence:** `exp02/compare-A-vs-B.json`, `compare-A-vs-C-path.json`, `compare-A-vs-HOST-darwin.json`, `run-A-builds.json`.
- **Giới hạn:** chỉ arm64 (chưa thử x86_64); fixture nhỏ; minifier/bundler native của Rolldown có thể khác giữa kiến trúc CPU — chưa kiểm.
- **Ảnh hưởng:** xác nhận §11, §12; giữ mục tiêu byte-for-byte. Lockfile cần chứa binding native cho nền tảng của builder (npm đã tự ghi).

### 3.3. EXP-03 — Conditional exports và guard

- **Giả thuyết:** export condition `design` làm build khách không resolve được design; guard L3/L5 bắt đúng vi phạm; conditional exports không phải boundary duy nhất.
- **Lệnh:** `node tools/exp03.mjs`
- **Quan sát:**

| ID | Thử | Kết quả | Lý do / chi tiết |
|---|---|---|---|
| n1 | build khách import `@platform/store-selector/design` | build **fail** | `"./design" is not exported under the conditions ["browser", "module", "production", "import"]` — đúng lý do |
| c1 | build khách import `/browser` | thành công, 0 canary | control |
| d1 | build **design** import `/design` | thành công, có canary design | build design resolve được |
| n2 | build khách dùng plugin có browser facet **import tương đối** `../design/index.js` | build **thành công**, canary design **có trong entry** | `exports` không áp cho import tương đối trong package |
| c2 | control cùng cấu trúc, không vi phạm | thành công, 0 canary | control |
| n3 | build khách import `…/server/…/__init__.py` qua package path | build **fail** | `is not exported` — đúng lý do |
| n4 | browser facet import tương đối `../server/handler.py` | build **thành công**, canary server **có trong entry** | Rolldown coi `.py` là module JS; dòng Python `CANARY_SERVER = "…"` tình cờ là JS hợp lệ nên bị bundle như code (file Python thông thường nhiều khả năng gây lỗi parse; cả hai đều không phải guard có chủ đích) |
| L3 | `store-selector`, `neg-control` | 0 vi phạm | control |
| L3 | `neg-design-relative` | `E-BOUNDARY-VIOLATION browser->design@design/index.js` | đúng một luật, đúng lý do |
| L3 | `neg-server-relative` | `browser->server@server/handler.py`, `browser->python@…` | đúng lý do |
| Quét canary (thay cho L5) | quét chuỗi canary trên output n2, n4 | phát hiện canary design / server | chỉ là quét canary của harness, không phải L5 đầy đủ trên module graph |

- **Đánh giá theo tiêu chí đã chốt:**
  - Build khách không resolve `./design` qua exports (đúng lý do): ✔.
  - Build design resolve được: ✔.
  - Mỗi negative fixture làm guard tương ứng fail đúng lý do, control pass: ✔.
  - Server marker không vào build khách: ✔ với plugin hợp lệ (EXP-01), **✘ ở mức bundler** với n4.
  - Điều kiện FAIL "build khách resolve được design": **xảy ra** với n2 (đường dẫn tương đối).
- **Kết quả:** **FAIL** — hai điều kiện đã chốt bị vi phạm: điều kiện FAIL "build khách resolve được design" xảy ra (n2), và điều kiện PASS "server marker không vào build khách" không đạt ở mức bundler (n4). Giả thuyết "L1 (conditional exports) tự nó giữ design/server khỏi build khách" bị bác bỏ. Điều kiện "negative fixture làm guard fail đúng lý do" chỉ đạt khi tính L3 và quét canary; riêng guard `exports` thì không bắt được n2, n4.
- **Evidence:** `exp03/report.json`.
- **Giới hạn:** L3 trong spike quét import bằng regex; production cần parser thật.
- **Ảnh hưởng tới spec #3/#2:** cần thêm lớp **L1b — resolve allowlist trong bundler** (plugin của compiler từ chối mọi module resolve ra ngoài: facet được phép của FBK trong lock, engine/core, shared externals, module sinh ra; và từ chối đuôi file không phải JS/CSS). Bằng chứng thực nghiệm cho nguyên tắc "conditional exports không là boundary duy nhất".

### 3.4. EXP-04 — Dynamic import failure

- **Giả thuyết:** retry `import()` cùng URL không chắc tạo request mới; retry bằng URL có query hoạt động; reload về đúng pinned release là đường phục hồi cuối; chunk release cũ vẫn tải đúng.
- **Lưu ý về kịch bản:** "Request chậm" dùng timeout của harness (1 s), không phải timeout mạng của trình duyệt. "Reset một lần" không gây lỗi (trình duyệt tự gửi lại), nên chỉ là quan sát. Mọi phục hồi bằng query đều trong điều kiện lỗi **tạm thời** (server đã hết lỗi); lỗi evaluate lặp lại ở mọi lần thì không token nào phục hồi được.
- **Lệnh:** `npx playwright test tests/exp04-dynamic-import.spec.mjs` (server chèn lỗi theo URL).
- **Quan sát — hành vi gốc** (lỗi xảy ra ở lần import đầu → server phục hồi → retry):

| Kịch bản | Lỗi lần đầu | Retry **cùng URL** | Retry URL có query | Chromium 156 | Firefox 157 | WebKit 27.2 |
|---|---|---|---|---|---|---|
| HTTP 404 | `TypeError` | **có request mới**, thành công | thành công | ✔ | ✔ | ✔ |
| HTTP 503 | `TypeError` | **có request mới**, thành công | thành công | ✔ | ✔ | ✔ |
| Mạng lỗi kéo dài (reset) | `TypeError` | có request mới, thành công | thành công | ✔ (2 request ở lần đầu) | ✔ (10) | ✔ (4) |
| Module throw khi evaluate | `Error: spike-eval-throw` | **không** request; ném lại lỗi cũ | thành công | ✔ | ✔ | ✔ |
| Request chậm (timeout của harness 1s, server trả sau 3s) | timeout ở harness | import lần hai dùng chung request đang bay, thành công | — | 1 request | 1 | 1 |
| Reset một lần | **không lỗi** — trình duyệt tự gửi lại | — | — | 2 request | 2 | 2 |

- **Quan sát — tích hợp với runtime:**

| Kịch bản | Chromium | Firefox | WebKit |
|---|---|---|---|
| Chunk thiếu (404 kéo dài): giữ step, giữ giá trị, phân loại | `missing-asset`, giữ `stp_method`, 店頭 vẫn chọn | như Chromium | như Chromium |
| Lỗi mạng tạm thời → retry bậc 1 (query) | `network` → phục hồi | như Chromium | như Chromium |
| Lỗi evaluate → bậc 1 vẫn lỗi → reload về pinned release (rev8 đã active) | về đúng rev7, giữ 店頭 (không PII), **chunk tải được** | như Chromium | về đúng rev7, giữ 店頭, nhưng **lỗi evaluate lặp lại** dù đã có request mới trả 200 với nội dung đúng (nguyên nhân chưa rõ); bậc 1 sau reload (token mới) → **phục hồi** |
| PII trong draft | không có tên/điện thoại trong `localStorage` | như Chromium | như Chromium |
| Tab đang mở rev7 khi rev8 được activate | chunk tải từ thư mục rev7; khách mới nhận rev8 | như Chromium | như Chromium |

- **Kết quả:** **PASS** theo tiêu chí đã chốt (ghi được hành vi 6 kịch bản mỗi engine; retry bậc 1 hoạt động trên cả ba; reload về đúng release và giữ dữ liệu không-PII; chunk release cũ tải đúng).
  - **Giả định FAIL (đã đo):** "reload (bậc 2) là đường phục hồi luôn đúng" — sai trên WebKit 27.2 của Playwright với lỗi evaluate. Chưa kiểm trên Safari thật.
  - **Không đo được, chỉ là suy luận:** "`?retry=<bộ đếm>` có thể không đủ". Harness chỉ dùng token theo thời gian. Spec dùng token duy nhất như một biện pháp phòng ngừa, không phải kết quả đo.
- **Minh bạch về harness:** lần chạy 1 có hai lỗi harness: kịch bản reset một lần không gây lỗi vì trình duyệt tự gửi lại, và rule lỗi khớp cả file CSS. Evidence lần 1 giữ nguyên ở `exp04/run1-original-harness/`. Lần 2 sửa harness (lỗi kéo dài trong lần đầu, chỉ áp cho JS), không đổi tiêu chí.
- **Evidence:** `exp04/raw-<engine>.json`, `exp04/integrated-*.json`, `exp04/old-release-*.json`, `exp04/draft-*.json`, `exp04/run1-original-harness/`.
- **Giới hạn:** kịch bản "incompatible release" và "security suspension" cần status API (spec #5), chưa có trong spike; 503 chỉ thử ở mức gốc; WebKit là bản của Playwright, không phải Safari.
- **Ảnh hưởng tới spec #3 §15.3:** viết lại cơ chế retry theo bảng trên (§4, D4).

### 3.5. EXP-05 — Performance (LAB-ONLY)

- **Lệnh:** `npx playwright test tests/exp05-perf.spec.mjs --project=chromium` và `node tools/sizes.mjs`.
- **Profile:** Chromium 156, CDP: độ trễ 150 ms, 1.6 Mbps xuống, 750 Kbps lên, CPU chậm 4x; server local có gzip; 5 lần, trung vị; cold = context mới, warm = trang mới trong cùng context.
- **Quan sát (trung vị, ms):**

| Form | T1 shell (FCP) | T2 form visible | T3 form ready | LCP | CLS | Request tới T3 | JS truyền tới T3 (gzip) | Warm T2 / T3 | Warm JS truyền |
|---|---|---|---|---|---|---|---|---|---|
| sports-demo-nomotion | 208 | 947 | 954 | 952 | 0 | 6 | 73 045 B | 309 / 321 | 0 |
| sports-demo | 208 | 949 | 970 | 968 | 0 | 6 | 73 857 B | 326 / 338 | 0 |
| pc-demo | 212 | 965 | 970 | 968 | 0 | 6 | 73 999 B | 329 / 337 | 0 |

- **Kích thước (byte raw / gzip -9 / Brotli q11):**
  - `core` 227 226 / 70 862 / 61 048 (React 19 + engine)
  - bootstrap 2 339 / 1 063 / 846
  - `entry` PC 2 310 / 1 174 / 1 047; Sports-nomotion 262 / 231 / 179
  - `g-stp_store` 716 / 505 / 419
  - `motion` 62 936 / 22 709 / 20 793
- **Toàn luồng PC 店頭 (cold):** 6 request JS, 97 813 B truyền (296 243 B giải nén).
- **Phát hiện:**
  1. Lần đo 1 có CLS **0.28** ở mọi form, vì shell bị gỡ **sau** khi form đã vẽ. Gỡ shell trong cùng commit với lần render đầu (`useLayoutEffect`) cho CLS **0**, T2/T3 không đổi. Evidence lần 1: `exp05/perf-lab-run1-shell-removed-after-paint.json`.
  2. Bootstrap external tạo thêm một bước tuần tự (khoảng một RTT, ~160 ms ở profile này) trước khi tải `core`/`entry`/IR. Đây là chi phí đã đo của phương án B (ADR-039).
  3. CDP emulation cộng độ trễ **sau** `responseStart`, nên TTFB đo được (~1.4 ms) **không có ý nghĩa**. Cần throttling ở tầng mạng (proxy) nếu muốn đo TTFB.
- **Kết quả:** **PASS** (đã thu đủ mốc theo tiêu chí; không có ngưỡng). **Không** kết luận Core Web Vitals đạt; INP chỉ là proxy từ một cú click (ngưỡng quan sát 16 ms).
- **Evidence:** `exp05/perf-lab.json`, `exp05/sizes.json`, `exp05/perf-lab-run1-shell-removed-after-paint.json`.
- **Giới hạn:** chỉ Chromium; localhost; fixture nhỏ; không CDN; chưa có thiết bị thật. Preset Motion theo từng form **chưa** được kiểm: spike dùng một module `motion.js` chung xử lý cả hai preset lúc runtime, nên `motion.*` giống hệt giữa Sports và PC.

## 4. Thay đổi thiết kế đề xuất (đã đưa vào spec #3 rev 2, spec #2 rev 2.4)

| ID | Từ | Thay đổi |
|---|---|---|
| D1 | EXP-01 | Compiler cấu hình bundler: `hashCharacters: 'hex'`, `[hash:12]`; kiểm tên file ở K10 (đã có) |
| D2 | EXP-01 | Prefetch bằng `fetch()` không hiệu quả trên WebKit → **OD3-03** |
| D3 | EXP-03 | Thêm **L1b resolve allowlist** trong bundler (K9): cho phép facet được phép (gồm `contract`), engine/core, Motion của core (chỉ group `motion`), shared externals, module sinh ra, và danh sách module ảo của bundler; đuôi JS/CSS/JSON; spec #2 §11.2 |
| D4 | EXP-04 | Retry: lỗi fetch → retry cùng URL được; lỗi evaluate (tạm thời) → chỉ URL có **token duy nhất**; sau reload vẫn đề xuất bậc 1; reload không được coi là chắc chắn phục hồi; thêm loại lỗi `evaluation` |
| D5 | EXP-05 | Gỡ Loading Shell trong cùng commit với lần render form đầu |
| D6 | EXP-05 | Measurement contract: không dùng TTFB từ CDP emulation; dùng throttling tầng mạng nếu cần TTFB |
| D7 | EXP-05 | Ghi chi phí đo được của bootstrap external; giữ B, xem lại khi có số đo thật |
| D8 | EXP-04 | Trình duyệt tự gửi lại khi kết nối bị reset (1–9 lần tùy engine) → timeout tải group phải tính cả thời gian này |
| D9 | cài đặt | Lỗi npm 10.8.2 với workspace → lựa chọn package manager ở P02 cần kiểm (OD3-04) |
| D10 | EXP-04 | Retry bậc 1 bỏ qua helper preload của Vite → runtime tự nạp CSS của group |

## 5. Rủi ro còn mở → chuyển tới implementation plan / verification gate

- x86_64 và các CPU khác chưa kiểm tính tái lập.
- Plugin thật nặng hơn; nhiều group; budget chưa có (sau baseline, ADR-005).
- L3 cần parser thật; L1b chưa được hiện thực trong spike.
- Kịch bản incompatible/suspended cần status API (spec #5).
- Prefetch trên WebKit (OD3-03).
- Đo trên thiết bị thật, CDN thật: sau G10.
