# Quyết định (chỉ mục ADR)

Mỗi ADR ghi lại Bối cảnh · Phương án · Quyết định · Đánh đổi · Người duyệt · Ngày · Trạng thái (`PROPOSED` / `ACCEPTED` / `SUPERSEDED`).
Chỉ ADR được đánh dấu `ACCEPTED` với người duyệt là user mới có tính ràng buộc đối với việc triển khai.

## Nhật ký gate

| Gate | Kết quả | Người duyệt | Ngày | Hồ sơ |
|---|---|---|---|---|
| G0 Scope | **APPROVED WITH ADJUSTMENTS** | User (holong10920) | 2026-10-23 | ADR-003..ADR-007 |
| G1 Design | NOT APPROVED (chưa nộp). Chỉ trình sau khi đủ 6 spec và có Cross-Subsystem Integration Review (ADR-018). | — | — | ADR-018 |
| G9 GitHub | **BLOCKED**: user đang xử lý visibility của repo và quyền sở hữu source | — | — | ADR-007 |
| G10 AWS | **BLOCKED**: profile/account sẽ được xác nhận trước G10 | — | — | — |

## Chỉ mục ADR

| ID | Tiêu đề | Trạng thái | Người duyệt | Ngày |
|---|---|---|---|---|
| ADR-000 | Quản trị dự án bằng docs + gate ngay trong repo | ACCEPTED | Master prompt | 2026-10-23 |
| ADR-001 | Ghi chú audit lấy từ công ty chỉ nằm trong `docs/internal/` (gitignored) | ACCEPTED | User (G0 §4) | 2026-10-23 |
| ADR-002 | Định hướng kiến trúc: Hybrid Form Compiler | ACCEPTED ở mức định hướng; thiết kế chi tiết → G1 | User (G0) | 2026-10-23 |
| ADR-003 | Form demo: Sports + PC giả lập | ACCEPTED | User (G0 §1) | 2026-10-23 |
| ADR-004 | MVP = vertical slice; undo/redo chuyển sang P1 | ACCEPTED | User (G0 §2) | 2026-10-23 |
| ADR-005 | Khẳng định về hiệu năng phải dựa trên build artifact đã đo | ACCEPTED | User (G0 §3) | 2026-10-23 |
| ADR-006 | AWS: không chọn profile; không gọi API ghi | ACCEPTED | User (G0 §5) | 2026-10-23 |
| ADR-007 | Git: cho phép commit local với nội dung an toàn; không push remote trước G9 | ACCEPTED | User (G0 §4) | 2026-10-23 |
| ADR-008 | Người dùng và ranh giới: Admin no-code ưu tiên business, capability có kiểu do developer mở rộng, chỉnh sửa ≠ publish | ACCEPTED ở mức nguyên tắc spec #1; kiến trúc/triển khai → G1 | User (P01 Answer #2) | 2026-10-23 |
| ADR-009 | Mô hình tái sử dụng: shared block có version, pin theo từng form + clone cho form mới; không tự lan truyền | ACCEPTED ở mức nguyên tắc spec #1; kiến trúc/triển khai → G1 | User (P01 Answer #3) | 2026-10-23 |
| ADR-010 | Nguyên tắc kỹ thuật spec #1 T-01..T-05 (validator có tên, revision bất biến, field ẩn, bản địa hóa, repeatable group) | ACCEPTED ở mức nguyên tắc spec #1 (T-02/T-03 có điều chỉnh của user); kiến trúc/triển khai → G1 | User (P01 Answer #3) | 2026-10-23 |
| ADR-011 | Định danh thực thể: metadata của template, địa chỉ block-instance ổn định, lồng block một cấp (T-06..T-08) | ACCEPTED ở mức nguyên tắc spec #1; addendum A (R-01..R-08) **PROPOSED**; kiến trúc/triển khai → G1 | User (P01 Answer #4) | 2026-10-23 |
| ADR-012 | Khôi phục draft của khách hàng: từng bước, ưu tiên quyền riêng tư, gắn với revision, cô lập qua adapter | ACCEPTED ở mức nguyên tắc spec #1; addendum A (classification taint) **PROPOSED**; kiến trúc/triển khai → G1 | User (P01 Answer #4) | 2026-10-23 |
| ADR-013 | Derived state: `calculated` / `prefill-default` / `external lookup`, có giới hạn và cấu hình trực quan | **PROPOSED** (quyết định sơ bộ của user, P01 Answer #5); chấp thuận chính thức tại review spec #1 | User (sơ bộ) | 2026-10-23 |
| ADR-014 | Ngữ nghĩa điều hướng và activity: dữ liệu inactive chỉ giữ trong bộ nhớ, một hàm activity duy nhất, backend validate active path nghiêm ngặt | **PROPOSED** (quyết định sơ bộ của user, P01 Answer #6; addendum N-09..N-13 từ Answer #7); chấp thuận chính thức tại review spec #1 | User (sơ bộ) | 2026-10-23 |
| ADR-015 | Thời điểm hiển thị validation (UX) và trách nhiệm từng tầng (DSL / runtime / backend) | ACCEPTED ở mức nguyên tắc spec #1 (quyết định UX của user, P01 Answer #7); contract chi tiết V-01..V-09 **PROPOSED**; triển khai → G1 | User (P01 Answer #7) | 2026-10-23 |
| ADR-016 | Ranh giới plugin: plugin mở rộng capability; engine sở hữu lifecycle, điều hướng, điều phối validation và submit | ACCEPTED ở mức nguyên tắc spec #1 (P01 Answer #8); contract PL-01..PL-10 **PROPOSED**; triển khai → G1 | User (P01 Answer #8) | 2026-10-23 |
| ADR-017 | Parity FE/BE: evaluator TS ở FE + evaluator Python ở BE, một DSL semantic contract, conformance fixtures có version (OD-01) | **APPROVED AS DESIGN DIRECTION** (review #1 spec #1); điều kiện parity bắt buộc; triển khai → G1 | User (review #1) | 2026-10-23 |
| ADR-018 | G1 chỉ sau khi đủ 6 subsystem spec + Cross-Subsystem Integration Review; spike thực thi cần gate riêng (OD-14) | **APPROVED AS DESIGN DIRECTION** (review #1 spec #1) | User (review #1) | 2026-10-23 |

---

## ADR-000 — Quản trị dự án bằng docs + gate

- **Bối cảnh:** Dự án dài và trải qua nhiều phiên. Không được mất context và không được bỏ qua gate nào.
- **Quyết định:** Dùng bộ file CTX-02..CTX-08 cùng `docs/evidence/<PHASE>/`.
- **Người duyệt:** Master prompt (bắt buộc). **Ngày:** 2026-10-23.

## ADR-001 — Tách audit nội bộ khỏi mọi thứ có thể push

- **Bối cảnh:** Remote `holong10920/forms_master` là repository cá nhân và hiện đang **PUBLIC**. Audit hệ thống cũ được đọc từ một số repository của công ty, liệt kê trong `docs/internal/`.
- **Phương án:**
  - (a) Đặt audit chi tiết trong `docs/` thông thường.
  - (b) Chỉ giữ capability ở mức trừu tượng trong docs được track. Đặt chi tiết (paths, APIs, tên thư viện, điểm yếu của hệ thống cũ, số bundle cũ) trong `docs/internal/`, vốn được gitignore.
  - (c) Bỏ qua audit.
- **Quyết định:** (b). Docs được track không được mô tả điểm yếu bảo mật hay chi tiết nội bộ của hệ thống công ty.
- **Đánh đổi:**
  - Ưu: bảo vệ IP và bảo mật.
  - Nhược: một phiên Claude mới chỉ đọc được `docs/internal/` trên máy local này.
- **Người duyệt:** User. G0 §4 ghi "không upload tài liệu nội bộ". **Ngày:** 2026-10-23.

## ADR-002 — Định hướng kiến trúc: Hybrid Form Compiler

- **Bối cảnh:** Xem `docs/discovery/P00_ARCHITECTURE_OPTIONS.md`, so sánh A Runtime / B Codegen / C Hybrid.
- **Quyết định:** Theo định hướng **C. Hybrid**: JSON có version + một engine dùng chung + một compiler sinh entrypoint cho từng form và chỉ import những capability mà form đó dùng.
- **Chưa quyết định (G1):** định dạng schema, workflow DSL, plugin contract, chiến lược compiler/bundler, kiến trúc Admin, phiên bản stack, performance budget.
- **Người duyệt:** User (G0, "đồng ý tiếp tục dự án theo định hướng Hybrid Form Compiler Architecture"). **Ngày:** 2026-10-23.

## ADR-003 — Form demo

- **Quyết định:** Hai form **giả lập**. Không form nào tích hợp API production, dùng dữ liệu thật hay phụ thuộc vào hệ thống công ty.
  - **Sports:**
    - Luồng 出張
    - Field điều kiện theo danh mục
    - Tình trạng Junk → mô tả lỗi hỏng trở thành bắt buộc
    - Motion `fade-slide`
    - Một biến thể không có Motion
  - **PC:**
    - Field điều kiện theo loại thiết bị
    - Rẽ nhánh 店頭 / 宅配
    - Plugin `store-selector`
    - Trạng thái hoàn tất riêng cho từng nhánh
    - Motion `scale-spring`
- Gakki là tùy chọn và không nằm trong MVP hiện tại.
- **Người duyệt:** User (G0 §1). **Ngày:** 2026-10-23.

## ADR-004 — MVP = vertical slice

- **Bối cảnh:** Triển khai toàn bộ nền tảng cùng lúc có rủi ro cao. PoC phải chứng minh được luồng end-to-end trước.
- **Quyết định:** MVP chứng minh slice **Admin → JSON → Preview → Compiler → Static Artifact → Runtime → Local Publishing/Rollback**.
- **Các capability P0 được ưu tiên:**
  - quản lý site/form cơ bản
  - editor field/section
  - workflow nhiều bước
  - logic điều kiện
  - validation
  - cấu hình theme
  - cấu hình Motion preset
  - JSON schema validation
  - lưu trữ draft + version
  - preview
  - static compiler
  - cô lập plugin
  - publish/rollback local
- **UX-06 undo/redo → P1.** Ràng buộc kiến trúc: state của builder phải là một document bất biến, và mọi chỉnh sửa phải đi qua typed command/patch để sau này có thể thêm history stack mà không phải refactor.
- **Roadmap không thay đổi.** Các capability nâng cao vẫn nằm trong master prompt.
- **Cách hiểu cần xác nhận tại G1:**
  - Bốn mục P0 không có trong danh sách ưu tiên: F-P0-13 Auth/Roles, F-P0-16 Audit, F-P0-18 Submit Simulation và F-P0-19 Docs/CI.
  - Chúng **không bị hạ xuống P1**. Chúng vẫn là P0 và được xếp lịch sau vertical slice, vì DOD-01/04/06 vẫn phụ thuộc vào chúng.
  - Nếu user muốn hoãn chúng, cần một ADR mới.
- **Người duyệt:** User (G0 §2). **Ngày:** 2026-10-23.

## ADR-005 — Hiệu năng cần bằng chứng định lượng

- **Quyết định:** Các khẳng định sau phải được kiểm chứng trên build artifact thật:
  - Form không có Motion không tải Motion runtime.
  - Artifact Sports không chứa `store-selector`.
  - PC chỉ tải những capability cần thiết.
  - Kích thước được đo theo raw / gzip / Brotli.
  - Chunk và dependency graph được kiểm tra.
- Số bundle cũ (mang tính tham khảo) **không** phải baseline chính thức.
- Performance budget được đặt dựa trên số đo và duyệt tại G1. Không được tuyên bố cải thiện hiệu năng khi chưa có bằng chứng định lượng.
- **Người duyệt:** User (G0 §3). **Ngày:** 2026-10-23.

## ADR-006 — AWS

- **Quyết định:**
  - Claude không chọn AWS profile và không thực hiện bất kỳ lệnh ghi AWS nào.
  - Việc xác nhận account/profile diễn ra trước G10.
  - Điều này không chặn brainstorming hay phát triển local.
- **Người duyệt:** User (G0 §5). **Ngày:** 2026-10-23.

## ADR-007 — Git chỉ local

- **Quyết định:**
  - Cho phép phát triển local và **commit local** khi nội dung an toàn: không có chi tiết nội bộ công ty, không có secret, không có code công ty.
  - Không được push, thay đổi remote hay thay đổi remote settings cho đến G9.
  - Source có nguồn gốc từ công ty phải được kiểm tra quyền sử dụng trước khi đưa lên bất kỳ remote nào, kể cả remote private.
- **Triển khai:**
  - `docs/internal/` được gitignore.
  - File master prompt được gitignore cho đến khi user review, vì nó nhắc tới môi trường AWS nội bộ. User có thể bỏ ignore sau khi review.
- **Người duyệt:** User (G0 §4). **Ngày:** 2026-10-23.
- **Addendum (2026-10-23):**
  - User đã duyệt commit local của P00 (`0d4fe7b`) và cho phép thao tác git trong repo này.
  - User đã tự sửa global hook `~/.claude/hooks/block-git-commit-push.sh` để chỉ cho phép commit/push khi cwd là `forms_master`. Claude không được phép sửa nó (Self-Modification).
  - **Push vẫn BLOCKED cho đến G9.** Về mặt kỹ thuật hook cho phép, nhưng gate vẫn có hiệu lực.

## ADR-008 — Người dùng và ranh giới no-code / developer

- **Bối cảnh:** Brainstorming P01, spec #1. Schema/DSL cần biết ai cấu hình form và cấu hình dừng ở đâu. Nguồn: `docs/discovery/P01_BRAINSTORM_NOTES.md` (Answer #2).
- **Phương án:**
  - (a) Admin hướng developer (expression, JSON, regex).
  - (b) Admin no-code ưu tiên business, kèm một tầng mở rộng cho developer.
- **Quyết định:** (b).
  - Người dùng dài hạn là business user, PO/PM và operator không biết code. Trong MVP, developer có thể vận hành Admin, nhưng Admin không được đòi hỏi kiến thức React, JavaScript, JSON hay regex.
  - Developer chỉ mở rộng nền tảng thông qua capability được đăng ký với typed contract.
  - Admin không bao giờ được upload hay chạy JavaScript tùy ý.
  - Khi DSL không diễn đạt được một yêu cầu, chọn giữa một capability khai báo (declarative) mới và một plugin của developer. Không bao giờ thêm operator hay expression không giới hạn chỉ vì một edge case.
  - Vai trò: Business Editor, Reviewer/Publisher, Developer, Platform Admin. Spec #1 không yêu cầu RBAC đầy đủ, nhưng thiết kế không được giả định editor có quyền publish.
  - Chỉ số thành công mang tính định tính cho đến khi có baseline (chưa có mục tiêu bằng số).
- **Đánh đổi:**
  - Ưu: DSL luôn có giới hạn, phân tích được và an toàn.
  - Nhược: một số yêu cầu sẽ cần plugin của developer thay vì một expression nhanh.
- **Phạm vi:** chỉ là nguyên tắc cho spec #1. Không duyệt kiến trúc hay triển khai (G1 NOT APPROVED).
- **Người duyệt:** User (P01 Answer #2). **Ngày:** 2026-10-23.

## ADR-009 — Mô hình tái sử dụng: shared block có version + clone

- **Bối cảnh:** Hàng chục site phải dùng chung các phần phổ biến (ví dụ thông tin khách hàng) mà không tái tạo coupling giữa các site. Nguồn: P01 Answer #3.
- **Phương án:**
  - (A) Chỉ sao chép bằng clone.
  - (B) Kế thừa template trực tiếp (live).
  - (C) Shared block có version được pin theo từng form, cộng với clone để tạo form mới.
- **Quyết định:** (C).
  - Mỗi form pin một revision bất biến của shared block. Revision mới của block không bao giờ thay đổi các form đang chạy.
  - Admin thấy có revision mới hơn, kèm diff và phân tích ảnh hưởng. Admin hoặc Reviewer chủ động opt-in, tạo ra một draft revision mới của form. Nó chỉ được publish sau khi validation, test và được duyệt.
  - Clone tạo ra một form có lifecycle độc lập. Các tham chiếu block đã pin được giữ nguyên, và chỉnh sửa local không bao giờ thay đổi block gốc.
  - Compiler resolve toàn bộ dependency graph thành một release manifest bất biến. Không có `latest` và không có wildcard.
  - Contract của block:
    - block ID ổn định
    - revision ID bất biến
    - contract input/output khi cần
    - field ID có namespace
    - validation rule có version
    - tham chiếu dependency
    - metadata về tương thích
    - theo dõi việc sử dụng
  - Bản sửa lỗi bảo mật không bao giờ được áp dụng âm thầm. Một revision có thể bị đánh dấu vulnerable hoặc deprecated, việc publish nó bị chặn, và nâng cấp/rollback khẩn cấp tuân theo quy trình quản trị release.
  - Áp dụng hàng loạt (usage, danh sách lỗi thời, diff, ảnh hưởng, đề xuất hàng loạt, regression, publish theo nhóm) là P1. Mô hình dependency của P0 không được cản trở điều đó.
  - Sáu thực thể được giữ tách biệt, mỗi thực thể có quy tắc riêng về sở hữu, lifecycle và tương thích:
    1. Form Template
    2. Shared Form Block
    3. Form Definition
    4. Published Form Revision
    5. Code Plugin / Capability
    6. Release Manifest
  - Shared block không được trở thành một cơ chế kế thừa mới.
- **Đánh đổi:**
  - Ưu: không có regression lan giữa các site do thay đổi dùng chung, và release có thể tái tạo được.
  - Nhược: cập nhật 30 form đòi hỏi công opt-in tường minh (sẽ được giảm nhẹ sau này bằng áp dụng hàng loạt ở P1).
- **Phạm vi:** chỉ là nguyên tắc cho spec #1. G1 NOT APPROVED.
- **Người duyệt:** User (P01 Answer #3). **Ngày:** 2026-10-23.

## ADR-010 — Nguyên tắc kỹ thuật spec #1 T-01..T-05

- **Bối cảnh:** Các giả định kỹ thuật do Claude đề xuất trong P01 và được user review (Answer #3).
- **Quyết định:**
  - **T-01 (đã duyệt):** kiểm tra định dạng là các validator có tên trong registry của developer. Admin chọn một validator và chỉ đặt các tham số được phép. Không có regex thô trong Admin.
  - **T-02 (đã duyệt kèm yêu cầu bảo mật):**
    - Revision đã publish là bất biến.
    - Submission được gắn với `formId` + `revision` + `schemaVersion`.
    - Backend xác minh revision với registry có thẩm quyền của nó và không tin metadata do client khai báo.
    - Không có server secret trong runtime.
  - **T-03 (đã duyệt kèm điều chỉnh):**
    - Field ẩn chỉ giữ giá trị trong phiên tương tác hiện tại, để có thể khôi phục. Nó không được validate hay submit khi đang ẩn.
    - Cần có policy cho dữ liệu nhạy cảm, draft được lưu trữ và việc backend revalidate.
    - Không bao giờ tin field ẩn phía client.
  - **T-04 (đã duyệt):** locale mặc định là `ja`, có hỗ trợ bản địa hóa và quy tắc fallback/thiếu bản dịch tường minh.
  - **T-05 (đã duyệt):**
    - Data model hỗ trợ repeatable group ngay từ đầu, với định danh item ổn định và địa chỉ field lồng nhau.
    - UI của repeatable group là P1.
- **Phạm vi:** chỉ là nguyên tắc cho spec #1. G1 NOT APPROVED.
- **Người duyệt:** User (P01 Answer #3). **Ngày:** 2026-10-23.

## ADR-011 — Định danh thực thể và địa chỉ (T-06..T-08)

- **Bối cảnh:** P01 Answer #4 đã review các giả định T-06..T-08 của Claude.
- **Quyết định:**
  - **T-06:** Form Template được tạo từ một published revision bất biến. Nó có định danh và metadata riêng: `templateId`, `templateVersion`, `sourceRevision`, quyền sở hữu. Clone là một Form Definition độc lập, không có kế thừa trực tiếp. P0 không yêu cầu Template Management đầy đủ.
  - **T-07:**
    - Địa chỉ dùng định danh block-instance ổn định, không bao giờ dùng tên hiển thị. Một block có thể xuất hiện nhiều lần trong một form.
    - Định danh là duy nhất trong mỗi form, tham chiếu ổn định, và đổi tên label không bao giờ thay đổi định danh.
    - Path có cấu trúc cho dữ liệu lồng nhau và lặp lại. Item lặp lại có định danh ổn định.
    - Trùng lặp và tham chiếu không hợp lệ là lỗi compile-time.
    - Thiết kế cụ thể cho alias-rename và path-migration được đề xuất trong spec và chưa được duyệt.
  - **T-08:**
    - P0 cho phép lồng block một cấp; block không thể chứa block.
    - Lồng block tách biệt với dữ liệu lồng nhau và repeatable group, là những thứ data model phải hỗ trợ.
- **Phạm vi:** chỉ là nguyên tắc cho spec #1. G1 NOT APPROVED.
- **Người duyệt:** User (P01 Answer #4). **Ngày:** 2026-10-23.
- **Addendum A — PROPOSED (2026-10-23, P01 Answer #5), chưa được duyệt:**
  - Thiết kế cụ thể R-01..R-08 trong `docs/discovery/P01_BRAINSTORM_NOTES.md` (đề xuất v2):
    - R-01: định danh field = (`blockInstanceId`, `fieldDefId`)
    - R-02: các lớp compatible / contract-change / breaking, trong đó breaking nghĩa là định danh mới
    - R-03: definition ref vs runtime address vs payload (mảng có thứ tự với `_itemId`)
    - R-04: key ledger chỉ thêm (append-only), với key được giữ chỗ theo từng định danh
    - R-05: pin chính xác
    - R-06: kiểm tra của compiler
    - R-07: migration chỉ trên Admin-draft, có preview, idempotent, atomic
    - R-08: ngữ nghĩa aggregate cho collection rỗng
  - User đồng ý với định hướng nhưng chưa duyệt chính thức.

## ADR-012 — Khôi phục draft của khách hàng (ưu tiên quyền riêng tư)

- **Bối cảnh:** khách hàng không nên phải nhập lại toàn bộ form sau khi lỡ reload hoặc đóng tab (P01 Q4).
- **Phương án:**
  - (a) Không khôi phục.
  - (b) Khôi phục từng bước phía trình duyệt, chỉ cho các field không nhạy cảm.
  - (c) Draft phía server với khả năng tiếp tục trên thiết bị khác.
- **Quyết định:** (b) cho P0. (c) có thể đến ở P1 nếu business cần, kèm authN, bảo vệ dữ liệu, thời hạn lưu giữ và phân quyền khôi phục.
  - **Reload:** khôi phục form/revision, bước hiện tại nếu vẫn hợp lệ, và các field được phép lưu trữ. Đánh giá lại toàn bộ. Không bao giờ tin state đã serialize của trình duyệt.
  - **Mở lại:** draft chưa hết hạn sẽ đưa ra lựa chọn Tiếp tục hoặc Bắt đầu lại. Không bao giờ tự động thay thế form đang điền. Không cần đăng nhập. Khôi phục ở mức best effort khi storage bị xóa hoặc bị chặn.
  - **PII:**
    - Trong P0, không lưu PII lâu dài trong bất kỳ storage nào của trình duyệt. Tên, số điện thoại, địa chỉ chi tiết và file upload mặc định chỉ nằm trong bộ nhớ.
    - Việc mất dữ liệu sau reload được giải thích trên UI.
    - Mỗi field mang một phân loại dữ liệu và policy lưu trữ do nền tảng kiểm soát. Business Editor không thể nới lỏng nó.
  - **Tương thích:**
    - Draft được gắn với chính xác `formId`, revision, `schemaVersion` và định danh config.
    - Không migration âm thầm. Revision cũ còn được hỗ trợ thì tiếp tục được dùng.
    - Revision không còn được hỗ trợ dẫn tới hướng dẫn bắt đầu lại hoặc một migration đã được kiểm chứng. Không bao giờ ánh xạ phỏng đoán.
  - **Lifecycle:**
    - TTL
    - lưu theo debounce hoặc checkpoint
    - hoạt động được khi không có storage
    - chỉ xóa sau khi backend xác nhận submit thành công, và giữ lại khi thất bại
    - T-03 áp dụng cho field ẩn
    - backend luôn revalidate
  - **Kiến trúc:** việc lưu trữ nằm sau một adapter riêng (`DraftPersistenceAdapter` hoặc tương đương). Engine chạy hoàn toàn trong bộ nhớ, và localStorage không bao giờ là nguồn có thẩm quyền.
- **Đánh đổi:**
  - Ưu: không có PII lưu trữ trong trình duyệt, và engine thuần khiết.
  - Nhược: phải nhập lại PII sau khi reload, và không có tiếp tục trên thiết bị khác trong P0.
- **Phạm vi:** chỉ là nguyên tắc cho spec #1. G1 NOT APPROVED.
- **Người duyệt:** User (P01 Answer #4). **Ngày:** 2026-10-23.
- **Addendum A — PROPOSED (2026-10-23, P01 Answer #5), chưa được duyệt:**
  - Giá trị derived hoặc prefill kế thừa mức phân loại dữ liệu cao nhất trong các input của nó (taint), được tính tại compile time.
  - Giá trị dẫn xuất từ PII cũng là PII, nên không bao giờ được lưu trong storage của trình duyệt cho prefill hay derived state.

## ADR-013 — Derived state (PROPOSED)

- **Bối cảnh:** P01 Q5. Form cần các giá trị được tính toán hoặc điền từ câu trả lời khác mà không biến DSL thành một ngôn ngữ lập trình.
- **Quyết định sơ bộ của user (Answer #5):**
  - Builder cần các giá trị derived, chia thành ba loại:
    - `calculated`: các phép toán có giới hạn như count, sum, concat, so sánh
    - `prefill/default`: policy tường minh về khả năng chỉnh sửa và ghi đè
    - `external lookup`: thông qua API hoặc plugin
  - Logic nghiệp vụ phức tạp, ví dụ ước tính giá thu mua, được đưa vào plugin hoặc backend.
  - Chỉ cấu hình qua UI trực quan.
  - Có dependency tracking, phát hiện vòng lặp và đánh giá tất định (deterministic).
  - Backend validate hoặc tính lại, và không tin kết quả từ client.
  - ADR-012 được áp dụng.
  - Mỗi giá trị derived khai báo nó được submit hay chỉ để hiển thị.
  - Không có ngôn ngữ đa dụng.
- **Đề xuất của Claude (chưa duyệt):** D-01..D-07 trong `docs/discovery/P01_BRAINSTORM_NOTES.md`:
  - catalog operator hữu hạn, không có phép chia trong P0
  - `overwrite` = `ifEmpty` | `untilEdited` | `always`
  - lookup chỉ thông qua capability đã đăng ký, có async state và fallback nhập tay
  - một dependency graph duy nhất với đánh giá theo thứ tự topo
  - backend tính lại với fixture tuân thủ dùng chung FE/BE
  - classification taint
- **Đánh đổi:**
  - Ưu: đáp ứng các nhu cầu tự điền và count/sum phổ biến mà không cần code, và vẫn phân tích tĩnh được.
  - Nhược: mọi thứ vượt ngoài catalog cần plugin của developer, và evaluator FE và BE phải luôn đồng bộ (giảm nhẹ bằng fixture dùng chung).
- **Trạng thái:** PROPOSED. Chấp thuận chính thức tại review spec #1. G1 NOT APPROVED.

## ADR-014 — Ngữ nghĩa điều hướng và activity (PROPOSED)

- **Bối cảnh:** P01 Q6. Khách hàng đổi nhánh (ví dụ 宅配 → 店頭) sau khi đã nhập dữ liệu.
- **Quyết định sơ bộ của user (Answer #6):**
  1. Dữ liệu của nhánh inactive được giữ trong bộ nhớ trong phiên form hiện tại.
  2. Field và bước inactive không tham gia validation, tính toán hiệu lực hay submit.
  3. Khi quay lại, dữ liệu được khôi phục, sau đó revalidate và tính lại.
  4. Không có gì inactive được lưu qua reload hay đóng tab (ADR-012).
  5. `clearOnDeactivate` tồn tại cho dữ liệu không bao giờ được khôi phục (OTP, token, auth nhạy cảm, dữ liệu bị nghiệp vụ vô hiệu hóa).
  6. Thay đổi dependency quyết định giữ, reset hay fetch lại. Không bao giờ dùng kết quả async đã cũ.
  7. Backend validate nhánh active cho đúng published revision và không bao giờ chấp nhận dữ liệu inactive.
  8. Một policy duy nhất bao trùm visibility của field, bước có điều kiện và điều hướng nhánh.
- **Ví dụ chấp nhận của user:** UA-1..UA-6 trong `docs/discovery/P01_BRAINSTORM_NOTES.md`.
- **Đề xuất của Claude (chưa duyệt):** N-01..N-08:
  - thuật ngữ: `hidden` (nguyên nhân), `inactive` (trạng thái bao trùm), `disabled` (active, ngữ nghĩa read-only), `unreachable` (compile-time), `cleared` (sự kiện)
  - một hàm activity dùng chung cho FE, preview và BE
  - "bỏ qua bước" trong Admin được hạ xuống thành các cạnh của graph
  - step graph P0 là DAG, với các transition có thứ tự, match đầu tiên thắng, và bắt buộc có default
  - Back đi theo lịch sử khách hàng đã đi qua, không validate
  - 422 nghiêm ngặt cho dữ liệu inactive
  - vô hiệu hóa dependency dựa trên provenance, với lookup có fingerprint và latest-wins
  - bắt buộc `clearOnDeactivate` cho dữ liệu `secret`
- **Đánh đổi:**
  - Ưu: tất định, test được ở cả FE và BE, và khôi phục được mà không rò rỉ dữ liệu qua các lần reload.
  - Nhược: graph chỉ là DAG loại trừ các luồng dạng vòng lặp trong P0 (repeatable group đảm nhận "thêm mục khác").
  - Nhược: 422 nghiêm ngặt khiến bug phía client lộ ra thành lỗi submit.
- **Trạng thái:** PROPOSED. G1 NOT APPROVED.
- **Addendum (P01 Answer #7), PROPOSED:** user đồng ý về nguyên tắc với N-01..N-08 và yêu cầu A1..A5. Claude đề xuất N-09..N-13:
  - `readOnly` / `pending` / `disabled` chỉ ở runtime / `inactive` là khác nhau
  - deep link chỉ được chấp nhận nếu mọi bước trước đó trên path đã hoàn tất, nếu không thì redirect tới bước chưa hoàn tất đầu tiên
  - `unreachable` chỉ khi chắc chắn tại compile time (cấu trúc, hằng false, bị che khuất)
  - rời 確認 sẽ tính lại toàn bộ closure phía sau trên path
  - lookup không bao giờ chặn 次へ, 0 lần tự retry trong P0 cộng nút 再試行 thủ công, kết quả đến muộn chỉ được áp dụng khi fingerprint khớp, target đang active và chưa bị user chỉnh sửa
  - ~~async validation dùng `failOpen` (mặc định) / `failClosed` theo từng validator~~ → **bị thay thế bởi Answer #8 A5**: `advisory` / `authoritative` (xem addendum ADR-015)

- **Addendum 2 (P01 Answer #8), các điều chỉnh của user áp dụng cho N-09..N-13:**
  - A1: `pending` không bao giờ khóa input, và lookup không bao giờ ghi đè chỉnh sửa của khách hàng. **Đã duyệt về nguyên tắc.**
  - A2: trạng thái hoàn tất cho deep link hoặc reload được tính từ dữ liệu thực sự còn tồn tại cộng với validation hiện tại, không phải từ một flag đã lưu.
  - A3: `unreachable` chỉ chặn khi compiler chứng minh được.
  - A4: lookup đang pending không chặn 次へ, nhưng field bắt buộc không hợp lệ thì có. Cho phép nhập tay khi lookup timeout hoặc thất bại.
  - A6: IME composition không kích hoạt validation, và input vẫn hiển thị bình thường.
  - Kiểm tra builder (2026-10-23), quyết định của Claude, đề xuất:
    - Path là một hàm thuần `derivedPath(values)`, được tính lại ngay (eager). Không có history lưu trữ; Back = bước liền trước trên `derivedPath`.
    - Trạng thái bước `pending` được đổi tên thành `upcoming`.
    - `skipWhen` được giới hạn cho các bước chỉ có default (spec #1 §8.1–§8.2).
  - ADR-014 vẫn **PROPOSED**.

## ADR-015 — Validation UX và trách nhiệm

- **Bối cảnh:** P01 Q7. Khi nào và bằng cách nào khách hàng thấy lỗi validation, và tầng nào sở hữu phần nào.
- **Quyết định (user, Answer #7):**
  - **Field văn bản:**
    - Validate khi blur sau khi đã tương tác.
    - Không báo lỗi ở lần gõ phím đầu tiên.
    - Khi lỗi đã hiển thị, cập nhật trực tiếp khi khách hàng chỉnh sửa.
  - **Field lựa chọn** cập nhật khi change.
  - **次へ** validate mọi field active, ở lại khi có lỗi, và focus vào đúng vị trí.
  - **戻る** không bao giờ validate hay chặn, và giữ lại input không hợp lệ.
  - **確認 / Submit** kiểm tra lại toàn bộ dữ liệu active, và backend là kết luận cuối cùng.
  - **Field inactive** không bao giờ hiển thị lỗi hay chặn.
  - **Field được kích hoạt lại** revalidate theo state hiện tại.
  - **IME tiếng Nhật:** không báo lỗi trong lúc composition.
  - **Async validation** có pending, timeout, retry và bảo vệ chống kết quả cũ.
  - **Thông báo** dễ hiểu, được bản địa hóa, và không bao giờ chỉ dựa vào màu sắc.
  - **Các tầng:**
    - DSL sở hữu rule, dependency và tính hợp lệ
    - runtime sở hữu thời điểm hiển thị lỗi, focus, scroll và accessibility
    - backend revalidate theo published revision
    - Business Editor cấu hình qua UI mà không cần code
- **Đề xuất của Claude (chưa duyệt):** V-01..V-09 trong `docs/discovery/P01_BRAINSTORM_NOTES.md`:
  - quy tắc hiển thị `pristine` / `touched` / `dirty` + `submitAttempted`
  - IME commit tại `compositionend`
  - tóm tắt lỗi qua `aria-live`
  - thông báo mặc định từ registry, có override theo từng field
  - lỗi backend được key theo external path, điều hướng tới bước có lỗi đầu tiên
- **Trạng thái:** quyết định UX được ACCEPTED ở mức nguyên tắc spec #1. Contract chi tiết là PROPOSED. G1 NOT APPROVED.
- **Người duyệt:** User (P01 Answer #7). **Ngày:** 2026-10-23.
- **Addendum (P01 Answer #8, A5):**
  - `failOpen` **không** phải là mặc định.
  - Validation được chia thành `advisory` và `authoritative`.
  - Nếu backend không kiểm tra được một điều kiện nghiệp vụ bắt buộc, dữ liệu không bao giờ được coi là hợp lệ.
  - Đề xuất của Claude (chưa duyệt) nằm trong spec #1 §11:
    - authoritative = mặc định chặn 次へ kèm 再試行, hoặc `deferToSubmit` do developer khai báo
    - backend thất bại = từ chối có thể retry

## ADR-016 — Ranh giới plugin

- **Bối cảnh:** P01 Q8. Phần mở rộng của developer dừng ở đâu và quyền sở hữu của engine bắt đầu từ đâu.
- **Quyết định (user, Answer #8):**
  - Plugin mở rộng capability. Form Engine sở hữu lifecycle, điều hướng, điều phối validation và submit pipeline.
  - **P0 cho phép:**
    - custom field type có kiểu
    - validator đã đăng ký
    - lookup/connector có phân quyền
    - Motion preset thông qua animation lifecycle
    - hàm derived có giới hạn với contract FE/BE
    - template field/block/step dạng khai báo được Editor chèn vào, không bao giờ sửa graph đang chạy
  - **P0 cấm:**
    - tạo, xóa hoặc sắp xếp lại bước tại runtime
    - override điều hướng hoặc submit
    - thay đổi ngữ nghĩa activity
    - JavaScript tùy ý từ Editor
    - gửi PII vượt quá quyền đã khai báo
    - ghi vào phần nội bộ của engine ngoài các API được phép
  - P0 không cần một hệ thống plugin đầy đủ, chỉ cần các extension point rõ ràng.
- **Đề xuất của Claude (chưa duyệt):** contract PL-01..PL-10 trong `docs/superpowers/specs/2026-10-23-form-schema-workflow-design.md` §12:
  - registry, id và semver
  - schema cho config, value và IO
  - permissions manifest
  - hook được phép theo từng loại
  - error boundary, giới hạn timeout, `AbortSignal`, fallback
  - ánh xạ input tĩnh
  - capability authoritative yêu cầu một module BE
  - pin chính xác
  - các kiểm tra chặn publish
  - chỉ input đã ánh xạ cộng taint, với network chỉ thông qua connector do server sở hữu
- **Trạng thái:** nguyên tắc được ACCEPTED cho spec #1. Contract là PROPOSED. G1 NOT APPROVED.
- **Người duyệt:** User (P01 Answer #8). **Ngày:** 2026-10-23.

## ADR-017 — Parity frontend/backend: hai evaluator, một semantic contract

- **Bối cảnh:** spec #1 OD-01. FE (TypeScript) và BE (Python) phải đánh giá definition giống nhau: activity, rule, derived, validation, chuẩn hóa. Node vẫn chạy phía server trong publish pipeline (analyzer/compiler), nhưng không nằm trên đường submit của khách.
- **Phương án:**
  - (a) Evaluator TS ở FE, evaluator Python ở BE, cả hai đánh giá Normalized IR.
  - (b) Python API gọi Node validation service cho mỗi submit.
- **Quyết định (user, review #1): (a), APPROVED AS DESIGN DIRECTION.**
  - Lý do: backend Python không phải gọi Node cho mỗi submission, runtime dependency và failure domain đơn giản hơn, phù hợp kiến trúc hiện tại.
- **Điều kiện bắt buộc:**
  - Có **một** DSL semantic contract duy nhất (spec #1 §7.4, §7.6, §8.7).
  - FE và BE dùng chung conformance fixtures **có version**.
  - Phải kiểm tra: null/missing, type coercion, comparison, Unicode, normalization, validation và errors. Hành vi số phải tương đương.
  - Có golden fixtures, boundary tests và differential tests (spec #1 AC-29..AC-33).
  - Backend kiểm tra theo authoritative published revision.
  - Việc hai evaluator cùng PASS test đơn giản **không** là bằng chứng đủ về parity.
- **Đường lui:** nếu dual evaluator tạo chi phí bảo trì không chấp nhận được thì **mở lại ADR này kèm evidence**. Không tự chuyển sang Node service.
- **Trạng thái:** APPROVED AS DESIGN DIRECTION. Triển khai → G1 (G1 NOT APPROVED).
- **Người duyệt:** User (review #1 spec #1). **Ngày:** 2026-10-23.

## ADR-018 — Thời điểm G1 và chính sách spike

- **Bối cảnh:** spec #1 OD-14. Có thể mở việc implement lõi headless sau spec #1–#3 hay phải chờ đủ cả 6 spec.
- **Quyết định (user, review #1): (a), APPROVED AS DESIGN DIRECTION.**
  - G1 chỉ được trình sau khi hoàn thành **đủ 6 subsystem spec** và **Cross-Subsystem Integration Review**. Review này kiểm các cặp:
    - Schema ↔ Plugin Registry
    - Schema ↔ Admin Editor
    - Workflow Engine ↔ Python Evaluator
    - Plugin Registry ↔ Compiler
    - Form Revision ↔ Backend Submission
    - Compiler ↔ Release Manifest
    - Publishing ↔ Rollback
    - Motion ↔ Runtime Lifecycle
    - Draft Recovery ↔ Published Revision
  - Review phải đánh dấu mọi contract conflict, circular dependency và quyết định chưa giải quyết.
  - **Không** mở quyền scaffold hoặc implement feature code sau spec #1–#3.
  - Trong P01 được phép: design review, kiểm chứng lý thuyết, viết test matrix.
  - Spike thực thi (để kiểm một giả thuyết) phải được đề xuất thành **gate riêng**, ghi rõ scope, mục đích, output và cleanup policy. Chỉ chạy sau khi user phê duyệt.
- **Trạng thái:** APPROVED AS DESIGN DIRECTION. G1 NOT APPROVED.
- **Người duyệt:** User (review #1 spec #1). **Ngày:** 2026-10-23.
