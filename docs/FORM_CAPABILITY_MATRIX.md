# Form Capability Matrix (P00-04)

> **Checkpoint hiện hành 2026-10-27:** Go + React Workspace đã chạy; source Studio ở `tools/go-auth/studio`. Python/oracle/rollback host cũ đã retire theo yêu cầu user. Xem [CURRENT_STATUS](CURRENT_STATUS.md), [cleanup](evidence/SOURCE-CLEANUP/RESULTS.md), [Go route migration](../tools/go-auth/evidence/migration/ROUTE-MATRIX.md) và [legacy gap matrix](../tools/legacy-analyzer/evidence/CAPABILITY-MATRIX.md). Các bảng/checkpoint lịch sử dưới đây không phải khẳng định hệ thống vẫn ở design-only. T12/K13 vẫn VERIFICATION_PENDING; không nâng toàn bộ legacy thành supported.

> Góc nhìn ở mức capability về các form thu mua legacy. Xây dựng từ audit read-only ngày 2026-10-23.
> Theo ADR-001, file này **chỉ ở mức trừu tượng**: không có paths, endpoints, tên env, tên library, điểm yếu nội bộ, hay số bundle legacy. Các chi tiết đó nằm trong `docs/internal/`, thư mục bị gitignore.
> Status: `CONFIRMED` = đã quan sát trong hệ thống legacy · `ASSUMED` = suy luận · `UNKNOWN` = chưa kiểm tra.
> Cột **PoC** phản ánh các quyết định ở G0 (ADR-003/004). Mọi capability trong PoC đều là code mới chạy trên dữ liệu giả lập.

## 1. Cấu trúc flow

| Capability | Sports | PC | Gakki | Status | PoC |
|---|---|---|---|---|---|
| Steps: sản phẩm → danh sách sản phẩm → thông tin khách hàng → cảm ơn | ✔ | ✔ | ✔ | CONFIRMED | MVP (multi-step engine). Demo dùng một sản phẩm. |
| Item sản phẩm lặp lại được | ✔ | ✔ | ✔ | CONFIRMED | P1 (F-P1-01) |
| Drill-down theo category (select nhiều cấp) | ✔ | ✔ | ✔ | CONFIRMED | MVP |
| Field hiện/ẩn theo category | ✔ | ✔ (nhiều) | ✔ | CONFIRMED | MVP (rules AST) |
| Branch theo phương thức thu mua 店頭 / 宅配 / 出張 | chỉ 出張 | 店頭 / 宅配 (+ 出張 do server quyết định) | UNKNOWN | CONFIRMED (Sports, PC) | MVP: Sports chỉ 出張; PC 店頭/宅配 dưới dạng step branch. Logic đầy đủ là P1 (F-P1-03). |
| Sub-flow riêng theo phương thức (cửa hàng + ngày, khung giờ giao, bộ đóng gói) | — | ✔ | UNKNOWN | CONFIRMED (PC) | MVP rút gọn (select fields + `store-selector`). Date picker là P1. |
| Màn hoàn tất riêng theo phương thức | — | ✔ | UNKNOWN | CONFIRMED | MVP (một terminal step cho mỗi branch) |
| Biến thể A/B pattern | ✔ | ✔ | ✔ | CONFIRMED | P2 (F-P2-01) |
| Resume/prefill từ lần submit trước | ✔ | ✔ | ✔ | CONFIRMED | Ngoài PoC |

## 2. Loại field

| Loại field | Sports | PC | Gakki | Status | PoC |
|---|---|---|---|---|---|
| Text / textarea / select / radio / checkbox | ✔ | ✔ | ✔ | CONFIRMED | MVP (F-P0-04) |
| Checkbox array | — | ✔ | — | CONFIRMED | MVP |
| Email | ✔ | ✔ | ✔ | CONFIRMED | MVP (chỉ format) |
| Số điện thoại (format JP) | ✔ | ✔ | ✔ | CONFIRMED | MVP (pattern) |
| Mã bưu điện → tự điền địa chỉ | ✔ | ✔ | ✔ | CONFIRMED | P1 plugin `postal-code` (mock) |
| Chọn maker/model (catalog từ xa) | — | ✔ | — | CONFIRMED | P1 plugin `product-picker` (mock) |
| Chọn cửa hàng | — | ✔ | UNKNOWN | CONFIRMED | **MVP plugin `store-selector`** (cửa hàng hư cấu). Chỉ PC dùng; đây là bằng chứng cho plugin isolation. |
| Chọn ngày / khung giờ | — | ✔ | UNKNOWN | CONFIRMED | P1 |
| Upload ảnh / file | — | — | — | CONFIRMED không có | Tối đa P1 |
| Block nội dung hướng dẫn / modals | — | ✔ | UNKNOWN | CONFIRMED | P1 |

## 3. Validation và logic

| Capability | Status | PoC |
|---|---|---|
| Validation có điều kiện theo category | CONFIRMED | MVP: một contract có versioning cho FE + BE (ARCH-07) |
| Validation phía server | CONFIRMED | MVP: Python validate theo cùng contract |
| Lỗi từ server map ngược về field | CONFIRMED | MVP |
| Idempotency khi submit | xem `docs/internal/` | F-P0-18: idempotency key trong local stub |
| Hành vi riêng của site được cấu hình dưới dạng data (site registry) | xem `docs/internal/` | MVP: site registry (F-P0-01) |

## 4. Tích hợp

| Tích hợp | PoC |
|---|---|
| Backend submit/order | **Không bao giờ gọi.** Chỉ dùng local stub (F-P0-18, API-10). |
| Product catalog | Mock JSON (P1) |
| Danh sách store/center | Mock hư cấu (global rule: không bao giờ gọi endpoint thật) |
| Tra cứu mã bưu điện | Mock dictionary (P1) |
| Analytics, recommendation | Ngoài PoC (F-P1-08) |

## 5. Animation

| Capability | Status | PoC |
|---|---|---|
| Hiệu ứng enter/exit, modal và lỗi có animation | CONFIRMED | MVP: preset registry (`fade-slide`, `scale-spring`, cùng validation feedback) và reduced motion |
| Người không phải developer cấu hình được animation | CONFIRMED không có | MVP: cấu hình Motion preset trong Admin |

## 6. Build / delivery

| Capability | Status | PoC |
|---|---|---|
| Cô lập artifact theo từng form | CONFIRMED không có (nhiều site dùng chung một artifact) | MVP: một artifact cho mỗi form, kèm evidence từ analyzer (ADR-005) |
| Release có versioning + rollback pointer | xem `docs/internal/` | MVP: local publish/rollback (ngữ nghĩa API-07) |
| Performance baseline | không có baseline chính thức | ADR-005: chỉ dùng số đo trên PoC artifacts |
