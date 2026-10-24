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
| ADR-019 | Quản lý schema: JSON Schema 2020-12 canonical, ba lớp validation, không có schema thứ hai (OD-02) | **APPROVED AS DESIGN DIRECTION** kèm điều kiện (review #2 spec #1); cơ chế chi tiết PROPOSED | User (review #2) | 2026-10-24 |
| ADR-020 | Block `exports` tường minh, chỉ tham chiếu được public export (OD-04) | **APPROVED AS DESIGN DIRECTION** (review #2 spec #1); cú pháp PROPOSED | User (review #2) | 2026-10-24 |
| ADR-021 | Classification: platform đặt mức tối thiểu, Editor chỉ được tăng (OD-07) | **APPROVED AS DESIGN DIRECTION** (review #2 spec #1); bảng mức tối thiểu PROPOSED | User (review #2) | 2026-10-24 |
| ADR-022 | `deferToSubmit` có giới hạn, không fail-open (OD-12) | **APPROVED AS DESIGN DIRECTION** kèm giới hạn (review #2 spec #1) | User (review #2) | 2026-10-24 |
| ADR-023 | Plugin governance: Centralized Governance + Distributed Contribution; trust model; versioning và pin chính xác | ACCEPTED ở mức nguyên tắc spec #2 (spec #2 Answer #1); kiến trúc chi tiết PROPOSED; triển khai → G1 | User (spec #2 Answer #1) | 2026-10-24 |
| ADR-024 | Capability family theo execution context (browser-ui / cross-runtime-pure / server-io / design-time), package nhiều facet (B), registry tĩnh + import sinh tường minh (R2) | ACCEPTED ở mức nguyên tắc spec #2 (spec #2 Answer #2); manifest và contract chi tiết PROPOSED | User (spec #2 Answer #2) | 2026-10-24 |
| ADR-025 | Phân loại action (UI interaction / query / authoritative validation / business command / post-commit effect) và yêu cầu sau submit của P0 | ACCEPTED ở mức nguyên tắc spec #2 (spec #2 Answer #2); thiết kế chi tiết → spec #2/#5 | User (spec #2 Answer #2) | 2026-10-24 |
| ADR-026 | Plugin manifest: capability identity duy nhất, resolve dependency pin chính xác, compatibility engine/server, JSON Schema hợp lệ, data flow security, ranh giới facet | **APPROVED AS DESIGN DIRECTION WITH ADJUSTMENTS** (spec #2 Answer #3); schema và cơ chế chi tiết PROPOSED (spec #2) | User (spec #2 Answer #3) | 2026-10-24 |
| ADR-027 | Query / Provisional Command / Final Command / Post-commit Effect; P0 không có business write trước submit; final submission 8 bước | ACCEPTED ở mức nguyên tắc spec #2 (spec #2 Answer #3); Provisional Command chỉ thiết kế (P1/P2) | User (spec #2 Answer #3) | 2026-10-24 |
| ADR-028 | Governance theo version: manifest bất biến + status ledger (`active` / `deprecated` / `vulnerable` / `revoked`), tách chặn publish khỏi xử lý form đã publish | ACCEPTED ở mức nguyên tắc spec #2 (spec #2 Answer #3); policy chi tiết PROPOSED / OPEN (OD2-04) | User (spec #2 Answer #3) | 2026-10-24 |
| ADR-029 | Server capability adapter theo version, resolve chính xác từ Capability Lock, deploy gate, fail closed (OD2-01) | **APPROVED WITH ADJUSTMENTS** (spec #2 review #1) | User (spec #2 review #1) | 2026-10-24 |
| ADR-030 | Immutable Plugin Release Store, provenance, 4 lớp workspace / release store / runtime deployment / form release (OD2-02) | **APPROVED** (spec #2 review #1) | User (spec #2 review #1) | 2026-10-24 |
| ADR-031 | Một resolved version mỗi `pluginId` trong một Form Release (OD2-03) | **APPROVED FOR P0** (spec #2 review #1) | User (spec #2 review #1) | 2026-10-24 |
| ADR-032 | Ngữ nghĩa `deprecated` / `vulnerable` / `revoked` có security governance; tách code status khỏi form availability (OD2-04) | **APPROVED (MODIFIED by user)** (spec #2 review #1); playbook chi tiết PROPOSED | User (spec #2 review #1) | 2026-10-24 |
| ADR-033 | Phạm vi capability kind P0 (5 kind + design binding), phần còn lại do core hoặc chỉ có contract; Motion vẫn P0 (OD2-05) | **APPROVED WITH P0 SCOPE** (spec #2 review #1) | User (spec #2 review #1) | 2026-10-24 |
| ADR-034 | Definition bind post-commit effect đã được platform approve; P0 chỉ mock; kiểm registry + permission + site policy (OD2-06) | **APPROVED WITH RESTRICTIONS** (spec #2 review #1) | User (spec #2 review #1) | 2026-10-24 |
| ADR-035 | Git-managed status ledger + emergency runtime override có kiểm soát (OD2-07) | **APPROVED WITH ADJUSTMENTS** (spec #2 review #1); failure policy chi tiết OPEN (OD2-08) | User (spec #2 review #1) | 2026-10-24 |
| ADR-036 | Self-contained Form Release ở P0: không có mutable shared runtime giữa các form (spec #3 Q3-1) | **APPROVED AS DESIGN DIRECTION** (spec #3 Q3-1); cơ chế PROPOSED (spec #3) | User (spec #3 Q3-1) | 2026-10-24 |
| ADR-037 | Session-pinned revision + Stable Entry URL + Immutable Release URL; active ≠ supported; resolver trước khi khởi tạo runtime (spec #3 Q3-2) | **APPROVED AS DESIGN DIRECTION** (spec #3 Answer #2); resolver, consistency model, error contract PROPOSED; activation chi tiết → spec #5 | User (spec #3 Answer #2) | 2026-10-24 |

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

## ADR-019 — Quản lý schema (OD-02)

- **Bối cảnh:** cần một chuẩn duy nhất để mô tả và validate cấu trúc Form Definition ở cả FE (TS) và BE (Python), tránh drift.
- **Quyết định (user, review #2):** JSON Schema Draft 2020-12, APPROVED AS DESIGN DIRECTION. **Điều kiện:**
  - Có schema canonical với version rõ ràng. Không duy trì nhiều schema độc lập giữa TS và Python.
  - Tách rõ Structural Validation, Semantic Validation và Runtime Evaluation. JSON Schema không thay thế Workflow DSL.
  - Business rule tùy biến chỉ nằm trong typed DSL hoặc registered capability. Admin không viết expression hay JavaScript.
  - Kiểm tra tương thích của validator JSON Schema ở FE và BE. Làm rõ `format` là annotation hay assertion.
  - Có schema fixture và conformance test dùng chung.
  - Definition đã publish không bị mutate khi schema lên version.
- **Đề xuất của Claude (PROPOSED, spec #1 §7.7):**
  - Mỗi `schemaVersion` có một bộ schema bất biến.
  - Type TS và model Python (nếu có) được **sinh** từ schema canonical, CI có drift check.
  - Chỉ dùng danh sách keyword được phép. Không dùng `pattern`, vì dialect regex của JS và Python khác nhau.
  - `format` chỉ là annotation, cấu hình tường minh ở cả hai phía.
  - Fixture `valid/` và `invalid/` so sánh theo JSON Pointer + keyword. Validator pass phần tương ứng của JSON-Schema-Test-Suite.
  - Definition đã publish được validate bằng schema của chính version của nó.
- **Trạng thái:** APPROVED AS DESIGN DIRECTION. Cơ chế chi tiết PROPOSED. Không implement trước G1.
- **Người duyệt:** User (review #2 spec #1). **Ngày:** 2026-10-24.

## ADR-020 — Block exports (OD-04)

- **Quyết định (user, review #2):** shared block khai báo `exports` tường minh, APPROVED AS DESIGN DIRECTION. **Yêu cầu:**
  - Export có định danh ổn định.
  - Rule của form bên ngoài chỉ tham chiếu được public export, không được truy cập tùy ý field nội bộ của block.
  - Export được resolve theo block instance identity và revision bất biến.
  - Có kiểm tra export trùng, tham chiếu không hợp lệ và thay đổi không tương thích.
  - Thay đổi public export contract phải thể hiện trong block versioning và impact analysis.
  - Không resolve động tới `latest` khi build form đã publish.
  - Phân biệt field export, plugin output và output của API integration.
- **Đề xuất của Claude (PROPOSED, spec #1 §7.8):**
  - Export là `{ id, field, type, classification }`. Bên ngoài tham chiếu bằng `inst:@id`.
  - Mã lỗi: `E-REF-NOT-EXPORTED`, `E-EXPORT-DUPLICATE`, `E-EXPORT-DANGLING`.
  - Changelog phân loại: thêm export là compatible, đổi classification là contract-change, xóa hoặc đổi kiểu là breaking.
  - Plugin output tham chiếu được nếu manifest khai báo. Output của integration không tham chiếu trực tiếp, chỉ được map vào field.
- **Trạng thái:** APPROVED AS DESIGN DIRECTION. Cú pháp PROPOSED.
- **Người duyệt:** User (review #2 spec #1). **Ngày:** 2026-10-24.

## ADR-021 — Classification dữ liệu (OD-07)

- **Quyết định (user, review #2):** Developer/Platform xác định chính sách classification tối thiểu. Business Editor chỉ được tăng mức bảo vệ, không được hạ dưới mức tối thiểu của platform. APPROVED AS DESIGN DIRECTION. **Yêu cầu:**
  - Field mới có classification mặc định an toàn. Component nhạy cảm có chính sách lấy từ registry.
  - Persistence policy và submission policy do platform và backend thực thi. JSON của Admin không vô hiệu hóa được.
  - P0 không lưu PII bền vững ở browser.
  - Không đưa PII vào compiler metadata, build manifest, log hay analytics.
  - Backend kiểm tra data policy dựa trên definition tin cậy và registry.
  - Thiết kế mở rộng được, nhưng không xây một security-policy language phức tạp trong MVP.
- **Đề xuất của Claude (PROPOSED, spec #1 §16):**
  - Thứ tự `public` < `personal` < `secret`.
  - Bảng mức tối thiểu theo field type. Văn bản tự do tối thiểu là `personal`. Field plugin dùng `minClassification` trong manifest. Giá trị dẫn xuất dùng taint.
  - Mã lỗi `E-CLASS-BELOW-MIN` và `E-STATIC-PII`.
  - P0 không có cơ chế ngoại lệ.
- **Trạng thái:** APPROVED AS DESIGN DIRECTION. Bảng mức tối thiểu PROPOSED.
- **Người duyệt:** User (review #2 spec #1). **Ngày:** 2026-10-24.

## ADR-022 — Validation lúc submit: `deferToSubmit` (OD-12)

- **Quyết định (user, review #2):** cho phép `deferToSubmit` với một số validation được khai báo rõ, APPROVED AS DESIGN DIRECTION. **Ràng buộc:**
  - Validator phải thuộc capability registry allowlist và có metadata cho phép chạy lúc submit.
  - Validation bắt buộc phải xong trước khi backend xác nhận submit thành công.
  - Timeout, bị từ chối hay backend không khả dụng đều phải có failure semantics tất định. Không fail-open với validation bắt buộc.
  - Không dùng `deferToSubmit` để lách một validation không hợp lệ.
  - Frontend hiển thị phản hồi hợp lý cho khách.
  - Backend xử lý retry và idempotency, bảo vệ dữ liệu khi validator chạy nhiều lần.
  - Tách business validation khỏi side effect không rollback được.
  - Test case cho: success, failure, timeout, stale response, duplicate submit và retry.
  - Làm rõ khác biệt giữa sync, async và submit-time validation.
- **Đề xuất của Claude (PROPOSED, spec #1 §11):**
  - Bảng ba loại validation.
  - Điều kiện: manifest có `allowsDeferToSubmit: true` và `authority: authoritative`.
  - Reject → 422. Timeout hoặc không khả dụng → 503 `E-VALIDATION-UNAVAILABLE`, bài nộp không được ghi.
  - Validator chỉ được có `sideEffects: none | idempotentRead`.
  - Bài nộp được ghi nguyên tử cùng bản ghi idempotency. Side effect chỉ chạy sau khi đã ghi.
  - AC-35.
- **Trạng thái:** APPROVED AS DESIGN DIRECTION.
- **Người duyệt:** User (review #2 spec #1). **Ngày:** 2026-10-24.

## ADR-023 — Governance, trust model và versioning của plugin

- **Bối cảnh:** spec #2 Q2-1. Ai viết, review và phát hành plugin khi nền tảng phục vụ hàng chục site.
- **Phương án:**
  - (a) Chỉ team platform viết plugin.
  - (b) Mỗi site team tự viết và tự phát hành.
  - (c) Centralized Governance + Distributed Contribution.
- **Quyết định (user): (c).**
  - Platform Maintainers quản lý SDK, typed contracts, registry, lifecycle, versioning, security, compatibility, conformance và release governance.
  - Site developer đóng góp qua PR. Platform Maintainer approve contract và release. Không bypass review.
  - **P0:**
    - plugin nằm trong monorepo
    - mỗi plugin có manifest + config schema
    - registry chỉ nhận trusted plugin đăng ký trong source/build
    - không có remote JavaScript, Editor không upload code
    - release qua review + CI
    - plugin dùng chung không import code riêng của site
  - **Tương lai:** code owner theo plugin, package có version độc lập, conformance là cổng vào registry, migration plan cho breaking change, chặn version deprecated hoặc vulnerable. Không có marketplace hay dynamic registry ở P0.
  - **Versioning:**
    - `pluginId` ổn định, version bất biến, semver để khai báo compatibility
    - pin chính xác trong form đã publish
    - manifest ghi version, source/build identity và hash
    - không `latest`, wildcard hay floating dependency, không tự nâng
    - nâng version phải có impact analysis và regression test
    - **semver không phải bằng chứng tương thích**
  - **Trust:**
    - Code của developer là trusted (review + CI, permission metadata, giới hạn side effect).
    - Config của Admin là untrusted data: không code, không network destination tùy ý, không ghi đè policy, không nạp code từ URL.
    - Plugin backend tuân thủ authZ, validation và classification phía server, chống SSRF.
  - **Ranh giới:** Shared Block ≠ Code Plugin. Không gộp thành cơ chế kế thừa.
  - **Quality gates:**
    - manifest/schema
    - typecheck
    - unit test
    - conformance
    - compatibility
    - security/dependency scan
    - ranh giới browser/server
    - bundle isolation
    - regression test cho form bị ảnh hưởng
    - idempotency cho side effect
- **Đánh đổi:**
  - Ưu: nhiều team đóng góp được mà vẫn giữ được một nguồn kiểm soát an toàn.
  - Nhược: Platform Maintainer có thể thành nút thắt khi review.
- **Trạng thái:** ACCEPTED ở mức nguyên tắc spec #2. Kiến trúc chi tiết (taxonomy, manifest, registry) PROPOSED. G1 NOT APPROVED.
- **Người duyệt:** User (spec #2 Answer #1). **Ngày:** 2026-10-24.

## ADR-024 — Capability family, đóng gói theo facet, registry tĩnh

- **Bối cảnh:** spec #2. Cần chia capability sao cho code server và secret không bao giờ lọt vào browser, và registry không trở thành service locator.
- **Phương án:**
  - Đóng gói:
    - A: mỗi capability một package
    - B: một package nhiều facet
    - C: một module, kiểm tra context lúc runtime
  - Registry:
    - R1: `registry.get()` toàn cục lúc runtime
    - R2: catalog tĩnh lúc build + import sinh tường minh
- **Quyết định (user, spec #2 Answer #2):**
  - **Bốn family:**
    - `browser-ui`
    - `cross-runtime-pure`: TS và Python là hai implementation của cùng một semantic contract. Có spec ngữ nghĩa chung, fixture có version, differential test, output tất định, không phụ thuộc timezone/locale/runtime default không kiểm soát.
    - `server-io`
    - `design-time`
  - Lookup phía browser chỉ gọi backend API đã duyệt qua connector/adapter. Không có endpoint tùy ý, không có server secret.
  - **Đóng gói B:**
    - entrypoint public tường minh
    - browser không import server
    - design-time không có trong artifact của khách
    - shared contract không import dependency có đặc quyền
    - **enforce bằng static check, dependency graph và bundle test**, không dựa vào kiểm tra runtime
    - không bắt buộc đủ mọi facet
  - **Registry R2:**
    - catalog cho Admin
    - compiler resolve plugin, facet, version
    - artifact chỉ chứa capability browser cần dùng, code-split khi nặng
    - không có capability server trong client
    - capability map có scope, truyền bằng DI
    - không service locator, không marketplace
    - **bằng chứng isolation thật ở spec #3/P07**
  - **Registry phải chứa:**
    - version chính xác
    - capability contract
    - execution boundary
    - permission metadata
    - config schema
    - compatibility
    - trạng thái deprecation/vulnerability
    - yêu cầu conformance
    - Side effect phải được **enforce ở backend**, không chỉ khai báo.
- **Đánh đổi:**
  - Ưu: isolation kiểm chứng được, không có code server trong bundle.
  - Nhược: phải duy trì static check cho ranh giới facet. Mỗi capability `cross-runtime-pure` cần hai implementation.
- **Trạng thái:** ACCEPTED ở mức nguyên tắc spec #2. Manifest và contract chi tiết PROPOSED. G1 NOT APPROVED.
- **Người duyệt:** User (spec #2 Answer #2). **Ngày:** 2026-10-24.

## ADR-025 — Phân loại action và yêu cầu sau submit (P0)

- **Bối cảnh:** spec #2 Q2-2. Claude đề xuất action chỉ chạy sau khi đã lưu bài nộp. User không đồng ý và yêu cầu phân loại.
- **Quyết định (user):**
  - **Năm loại:**
    1. UI interaction (local, browser)
    2. Query/lookup (chỉ đọc, qua integration đã duyệt)
    3. Authoritative validation (server)
    4. Business command (ghi có đặc quyền ở server, có permission tường minh, idempotency, error semantics)
    5. Post-commit effect (bất đồng bộ, có durability, retry, failure tracking; ưu tiên transactional outbox)
  - Không trộn UI/navigation với side effect có đặc quyền. Không bắt UI action hay lookup đi qua outbox.
  - **P0 phải chứng minh:**
    - Sports và PC dùng cùng một submission contract
    - Python validate theo authoritative published revision
    - lưu vào durable local DB
    - idempotency được kiểm chứng
    - có submission ID/receipt
    - có ít nhất một mock post-submit event hoặc mock integration handler
    - không có dữ liệu thật ra ngoài, không có side effect nghiệp vụ bên ngoài
  - Outbox (nếu dùng) ghi cùng transaction với bài nộp. Lỗi phía sau không làm mất bài nộp. UI phân biệt "đã nhận" với "xử lý phía sau đã xong".
  - Không có hạ tầng email hay worker phân tán phức tạp ở P0.
- **Trạng thái:** ACCEPTED ở mức nguyên tắc spec #2. Chi tiết thuộc spec #2 (contract của command/effect) và spec #5 (persistence, outbox, receipt). G1 NOT APPROVED.
- **Làm rõ (2026-10-24):** loại 4 "business command" được tách thành Provisional Command và Final Command ở ADR-027. ADR-025 vẫn hiệu lực.
- **Người duyệt:** User (spec #2 Answer #2). **Ngày:** 2026-10-24.

## ADR-026 — Plugin manifest, capability identity, resolution và compatibility

- **Bối cảnh:** spec #2. Claude đề xuất manifest bất biến, status ledger riêng và danh sách kind (S2-P05..P07). User review ở spec #2 Answer #3.
- **Quyết định (user): APPROVED AS DESIGN DIRECTION WITH ADJUSTMENTS.**
  - Giữ: release manifest bất biến, status ledger độc lập, taxonomy theo execution boundary, đóng gói nhiều facet, registry tĩnh lúc build, resolve dependency tường minh, permission enforce ở server.
  - **Capability identity:** định danh duy nhất, không nhập nhằng giữa `pluginId`, `pluginVersion`, `capabilityId`, `capabilityKind`, `executionFacet`. Compiler và backend resolve **cùng một** identity.
  - **Dependency:** stable identifier; release đã publish pin exact resolved version; phát hiện thiếu, không tương thích và cycle; không silent fallback; không tự nâng khi rebuild; có dependency graph và lock.
  - **Compatibility:** plugin manifest được khai `engineApi` range. Release Manifest ghi **chính xác** engine/runtime version. Có compatibility check với server. Form đã publish không được dùng server facet không tương thích chỉ vì backend mới được deploy.
  - **JSON Schema:** contract chuẩn phải dùng JSON Schema hợp lệ (ADR-019), output có schema và type rõ, có cơ chế validate. Placeholder kiểu `{"type":"enum"}` không được dùng.
  - **Data security:** `minClassification` chỉ là mức tối thiểu. Phải phân tích classification của input/output, propagation, trusted vs untrusted output, authorization theo tenant/site, xác minh phía server. Output từ browser **không tự động trusted**.
  - **Facet:** browser không chứa server code/secret; server không phụ thuộc browser runtime; design không có trong bundle của khách; JSON của Admin không chỉ định import path; registry kiểm tra entrypoint và package exports. Server facet Python được phân tích packaging/deploy versioning riêng, không giả định chung package runtime với Node/TS.
- **Đề xuất của Claude (PROPOSED, spec #2 §5–§13):** canonical key `pluginId@version#capabilityId`, kind suy ra family; manifest JSON Schema 2020-12; registry generator; resolve một version mỗi plugin trong một form; deploy gate cho server facet; chứng minh isolation sáu lớp (L1..L6).
- **Đánh đổi:**
  - Ưu: compiler và backend không thể lệch nhau về identity; không có đường nâng version ngầm.
  - Nhược: backend phải giữ nhiều version server facet song song (OD2-01), thêm việc cho CI.
- **Cập nhật (spec #2 review #1):** OD2-01 → ADR-029 (adapter theo version thay cho "nạp mọi version vào một process"), OD2-02 → ADR-030, OD2-03 → ADR-031. Trust không dựa trên `valueOrigin`; tách provenance / authority / verification (spec #2 rev 2 §13.2).
- **Trạng thái:** APPROVED AS DESIGN DIRECTION WITH ADJUSTMENTS. Schema và cơ chế PROPOSED. G1 NOT APPROVED.
- **Người duyệt:** User (spec #2 Answer #3). **Ngày:** 2026-10-24.

## ADR-027 — Phân loại command và final submission (P0)

- **Bối cảnh:** spec #2 Q2-3: có business write trước khi khách bấm Submit không.
- **Quyết định (user):**
  - **P0 (demo Sports/PC giả lập): không có business write trước Submit.** Trước submit chỉ có UI interaction, cập nhật field có điều kiện, lookup chỉ đọc, validation, preview, khôi phục draft phía client theo privacy policy đã duyệt. Chọn cửa hàng không giữ chỗ thật. Không đặt lịch, email, thanh toán hay reservation thật. Đây là giới hạn của PoC; flow cũ có pre-submit write phải được audit trước migration.
  - **Final submission P0:** (1) nhận request kèm idempotency key → (2) xác minh published revision và compatibility → (3) re-evaluate rule/validation authoritative → (4) loại bỏ hoặc từ chối dữ liệu không hợp lệ theo submission contract → (5) lưu vào durable local DB → (6) nếu có outbox thì cùng transaction → (7) trả receipt/submission ID → (8) mock handler xử lý post-submit event. Double-submit không tạo hai đơn; key dùng lại với payload khác phải bị phát hiện; lỗi sau commit không làm mất submission; không email thật, không gọi hệ thống công ty.
  - **Bốn loại thao tác:** Query (không đổi business state) · Provisional Command (tạo trạng thái tạm) · Final Command (business submission) · Post-commit Effect (sau commit).
  - Có extension point cho Provisional Command, **không implement** ở P0. Plugin contract không được giả định mọi server write chỉ xảy ra sau final submit.
  - Khi thiết kế Provisional Command (P1/P2): ownership, idempotency, TTL, authZ, cancel, retry, reconciliation, compensation (không giả định mọi thứ compensate được), dọn orphan, race, abuse/rate limit. TTL không bảo đảm thời điểm chính xác; invariant quan trọng enforce tại nguồn authoritative. Không xây generic saga engine cho PoC.
- **Quan hệ:** làm rõ loại 4 của ADR-025. Final Command trong P0 là submit pipeline do engine/backend sở hữu (ADR-016); plugin chỉ đóng góp validator và post-commit handler.
- **Trạng thái:** ACCEPTED ở mức nguyên tắc spec #2. Contract chi tiết PROPOSED (spec #2 §14–§15); transport/persistence ở spec #5. G1 NOT APPROVED.
- **Người duyệt:** User (spec #2 Answer #3). **Ngày:** 2026-10-24.

## ADR-028 — Governance theo version của plugin

- **Bối cảnh:** spec #2. Một version plugin có thể bị phát hiện lỗi hoặc lỗ hổng sau khi đã có form publish dùng nó.
- **Quyết định (user):**
  - Release manifest bất biến; status ledger tách riêng.
  - Trạng thái: `active`, `deprecated`, `vulnerable`, `revoked`.
  - Phân biệt bốn việc: chặn version cho lần publish sau; chính sách cho form đã publish đang dùng version đó; emergency disable/rollback; server compatibility và data migration.
  - Không silent-upgrade artifact đã publish.
- **Đề xuất của Claude (PROPOSED, spec #2 §16):** ma trận trạng thái × tác động; ledger append-only; báo cáo ảnh hưởng theo form; emergency disable là thao tác có chủ đích. Chính sách mặc định cho form đã publish khi `vulnerable`/`revoked` là **OD2-04 (OPEN)**.
- **Cập nhật (spec #2 review #1):** policy chi tiết được quyết ở ADR-032 (OD2-04, user sửa đề xuất) và ADR-035 (OD2-07).
- **Trạng thái:** ACCEPTED ở mức nguyên tắc spec #2. Policy chi tiết PROPOSED/OPEN. G1 NOT APPROVED.
- **Người duyệt:** User (spec #2 Answer #3). **Ngày:** 2026-10-24.

## ADR-029 — Server capability adapter theo version (OD2-01)

- **Bối cảnh:** form đã publish phải tiếp tục dùng đúng server code đã pin, kể cả khi backend được deploy lại. Claude đề xuất (a) nạp mọi version vào một backend.
- **Quyết định (user): APPROVED WITH ADJUSTMENTS.**
  - Hỗ trợ đồng thời các server capability version mà published revision hợp lệ còn dùng, qua **version-scoped server capability adapter**.
  - **Không bắt buộc** nạp mọi version của cùng Python package vào một process/environment.
  - Resolve chính xác từ Capability Lock tin cậy. Không fallback sang latest hay nearest-compatible.
  - Deploy compatibility gate kiểm mọi revision còn được hỗ trợ. Backend kiểm compatibility trước khi xử lý submission. Incompatibility → fail closed với mã lỗi phù hợp.
  - Backend update không được phá form đang mở trong browser.
  - Phân biệt: source package version, server adapter version, backend deployment version, published form revision, Capability Lock.
  - P0: một backend deployment chứa nhiều adapter nếu không xung đột dependency. Cô lập dependency bằng nhiều runtime: chỉ đề xuất cho production, không orchestration phức tạp trong PoC.
- **Đề xuất của Claude (PROPOSED, spec #2 rev 2 §5.4, §10):** adapter id, adapter runtime group, deployment inventory, tập revision được hỗ trợ (grace window, OD2-09), precheck cho rollback form và rollback backend, mã lỗi fail closed.
- **Trạng thái:** APPROVED WITH ADJUSTMENTS. Cơ chế PROPOSED. G1 NOT APPROVED.
- **Người duyệt:** User (spec #2 review #1). **Ngày:** 2026-10-24.

## ADR-030 — Immutable Plugin Release Store (OD2-02)

- **Quyết định (user): APPROVED.**
  - Artifact do trusted CI/build pipeline tạo. Identity/version bất biến, hash chính xác, source commit, dependency lock, provenance metadata, runtime compatibility metadata, facet inventory.
  - Không nhận artifact do Admin upload. Không nạp code thực thi từ URL trong form JSON.
  - Bốn lớp tách biệt: (1) plugin source/workspace cho development; (2) trusted release store; (3) runtime deployment gồm capability đã triển khai và xác minh; (4) published form release tham chiếu version cụ thể.
  - Admin production preview dùng trusted release capability. Local dev được dùng workspace build trong môi trường dev cô lập, đánh dấu development-only, không giả làm release.
  - Hash verification và provenance là yêu cầu P0. Artifact signing làm ở phase phù hợp.
- **Đề xuất của Claude (PROPOSED, spec #2 rev 2 §8, §9.4):** release do generator chạy ở chế độ trusted trên tree sạch đã commit; provenance record; dev identity `dev:` không publish được.
- **Trạng thái:** APPROVED. Cơ chế PROPOSED. G1 NOT APPROVED.
- **Người duyệt:** User (spec #2 review #1). **Ngày:** 2026-10-24.

## ADR-031 — Một version mỗi plugin trong một Form Release (OD2-03)

- **Quyết định (user): APPROVED FOR P0.** Trong một Form Release chỉ có một resolved version cho mỗi `pluginId`. Khi shared block hay capability yêu cầu version không tương thích: compiler phát hiện; diagnostic chỉ rõ dependency chain; không tự nâng/hạ; không bỏ qua dependency; không chọn theo load order. Giới hạn chỉ trong một Form Release; form khác nhau vẫn dùng version khác nhau.
- **Trạng thái:** APPROVED FOR P0.
- **Người duyệt:** User (spec #2 review #1). **Ngày:** 2026-10-24.

## ADR-032 — Ngữ nghĩa trạng thái version và security governance (OD2-04)

- **Bối cảnh:** Claude đề xuất `vulnerable` = chủ form quyết, `revoked` = tự động suspend form. User sửa.
- **Quyết định (user): MODIFIED.**
  - `deprecated`: cảnh báo; chặn dùng mới theo policy nếu cần; form đã publish tiếp tục trong thời gian hỗ trợ.
  - `vulnerable`: chặn phát hành bản mới chứa version đó theo security policy; impact analysis theo severity, exploitability, exposure; **Platform Security/Maintainer** quyết remediation deadline hoặc emergency mitigation; chủ form tham gia nhưng **không** tự miễn trừ.
  - `revoked`: có khả năng suspend runtime operation bị ảnh hưởng; backend enforce tại authoritative boundary; không fallback; có audit, incident metadata, user-facing failure và recovery path.
  - Tách **vulnerability status của code** khỏi **availability status của form**. Không mặc định coi suspend toàn bộ form là an toàn; cần impact analysis và cơ chế xử lý sự cố.
- **Đề xuất của Claude (PROPOSED, spec #2 rev 2 §16):** danh mục mitigation M1..M7, ma trận trạng thái → hành động bắt buộc/hành động do Platform Security quyết, incident record.
- **Trạng thái:** APPROVED (MODIFIED by user). Playbook PROPOSED. Thay đề xuất cũ ở ADR-028.
- **Người duyệt:** User (spec #2 review #1). **Ngày:** 2026-10-24.

## ADR-033 — Phạm vi capability kind ở P0 (OD2-05)

- **Quyết định (user): APPROVED WITH P0 SCOPE.**
  - Implement trong P0: `fieldType`, `validator`, `dataSource`, `serverValidator`, `postCommitEffect`. Có design facet/inspector để cấu hình field plugin trong Admin. Preview mock dùng versioned fixtures.
  - Platform core cung cấp ở P0: layout chuẩn, navigation/UI interaction chuẩn, canonicalization built-in, conditional rules built-in, final purchase submission command, Motion animation presets.
  - Kind còn lại: định nghĩa extension contract, không bắt buộc implement.
  - **Motion vẫn là P0** theo phạm vi dự án. Không có plugin `motionPreset` ở P0 không có nghĩa bỏ Motion Animation Editor.
  - Làm rõ `inspector` là design facet hay capability độc lập, tránh hai cơ chế đăng ký. Có ma trận P0/P1/P2.
- **Đề xuất của Claude (PROPOSED, spec #2 rev 2 §7):** `inspector` là **design binding** của chính capability (bỏ kind `inspector`); `previewMock` thay bằng `previewFixtures` (dữ liệu, bỏ kind).
- **Trạng thái:** APPROVED WITH P0 SCOPE.
- **Người duyệt:** User (spec #2 review #1). **Ngày:** 2026-10-24.

## ADR-034 — Gắn post-commit effect vào form (OD2-06)

- **Quyết định (user): APPROVED WITH RESTRICTIONS.**
  - Form Definition được khai binding tới post-commit effect đã được platform approve. Admin không tự định nghĩa business command tùy ý.
  - P0: chỉ mock effect; trigger sau khi submission commit; binding được kiểm theo trusted registry, permission và **site policy**; outbox (nếu dùng) cùng transaction; retry không tạo side effect trùng; lỗi downstream không làm mất submission; không email/API công ty.
  - Business Editor chọn effect được phép, không vượt policy.
- **Trạng thái:** APPROVED WITH RESTRICTIONS. Cú pháp PROPOSED (spec #2 rev 2 §15).
- **Người duyệt:** User (spec #2 review #1). **Ngày:** 2026-10-24.

## ADR-035 — Status ledger và emergency runtime override (OD2-07)

- **Quyết định (user): APPROVED WITH ADJUSTMENTS.**
  - Git-managed status ledger là nguồn quản trị và audit baseline ở P0.
  - Kiến trúc hỗ trợ **emergency runtime override** có kiểm soát: change được xác thực và phân quyền; audit log; backend enforce ngay khi override có hiệu lực; không sửa release manifest; reconciliation giữa ledger và runtime policy; người dùng form và Business Editor không đổi được trạng thái bảo mật; có failure policy khi runtime status store không khả dụng.
  - P0 mô phỏng override ở local. Không xây incident-management service.
- **Đề xuất của Claude (PROPOSED, spec #2 rev 2 §16.5):** effective status = mức chặt nhất của ledger và override; override bắt buộc gắn incident; reconciliation report. Failure policy: **OD2-08 (OPEN)**.
- **Trạng thái:** APPROVED WITH ADJUSTMENTS.
- **Người duyệt:** User (spec #2 review #1). **Ngày:** 2026-10-24.

## ADR-036 — Self-contained Form Release (spec #3 Q3-1)

- **Bối cảnh:** spec #3. Artifact của mỗi form nên tự chứa hoàn toàn, hay các form dùng chung một lớp runtime (engine/React) được cache chung.
- **Quyết định (user): APPROVED AS DESIGN DIRECTION — Self-contained Form Release cho P0.**
  - Mỗi form release độc lập về deployment, runtime dependency và rollback. Vẫn hỗ trợ code splitting, lazy loading và internal chunk.
  - **Không** có mutable shared runtime giữa các form ở P0.
  - Yêu cầu:
    - asset bất biến, riêng cho từng release
    - Capability Lock chính xác
    - import tường minh do compiler sinh
    - bundle isolation cho Sports, PC và biến thể Motion-none
    - không bundle server/design facet
    - browser cache và tương thích với revision cũ
    - rollback không cần rebuild
    - đo bundle size và runtime performance trên artifact thật
    - không tự kết luận isolation PASS khi chưa có bằng chứng
- **Đánh đổi:**
  - Ưu: rollback và isolation đơn giản, kiểm chứng được theo từng release; không có thay đổi runtime chung nào ảnh hưởng nhiều form cùng lúc.
  - Nhược: khách mở nhiều form không dùng chung cache engine/React; mỗi release chứa bản riêng.
- **Trạng thái:** APPROVED AS DESIGN DIRECTION. Cơ chế PROPOSED ở spec #3. G1 NOT APPROVED.
- **Người duyệt:** User (spec #3 Q3-1). **Ngày:** 2026-10-24.

## ADR-037 — Session-pinned revision, Stable Entry URL, Immutable Release URL (spec #3 Q3-2)

- **Bối cảnh:** khách đang mở form khi có revision mới được publish hoặc rollback; reload; draft của release cũ.
- **Quyết định (user): APPROVED AS DESIGN DIRECTION.**
  - **Bốn khái niệm:** Active Release (phân phối cho khách mới) · Supported Release (backend còn xử lý) · Retired/Unsupported · Suspended/Revoked. Inactive ≠ Unsupported. Rollback chỉ đổi Active Release, không revoke release publish sau đó.
  - **Session pinning:** session pin `formId`, `publishedRevision`, `releaseId`, identity của Capability Lock. Publish hay rollback không đổi workflow của tab đang mở. Backend validate theo definition và lock tin cậy của release đã pin. Runtime state và active pointer độc lập.
  - **Stable Entry URL** (khách mới nhận active; phát hiện draft hợp lệ để đề xuất Resume; không có dữ liệu khách trong URL) và **Immutable Release URL** (một artifact cụ thể, không đổi sau publish, phục vụ reload/deep link/tab cũ/dynamic import, tồn tại theo retention policy). Release identity phân biệt được nhiều artifact của cùng revision.
  - **Resolver/bootstrap** quyết định release trước khi khởi tạo runtime; không bao giờ để runtime của release A hydrate draft của release B; bootstrap không chứa mọi version engine.
  - **Publish/rollback:** đổi active pointer theo activation protocol; không xóa artifact cũ; không rebuild khi rollback; không migrate draft; không hứa CDN cập nhật tức thời, phải có consistency model.
  - **Draft recovery:** theo ADR-012; metadata draft pin release identity; không migrate ngầm; re-evaluate visibility/validation trước khi khôi phục step; không xóa draft ngầm; Start Over trên current active release; không đoán mapping; không hứa khôi phục PII; xử lý hai tab.
  - **Retention:** không xóa asset chỉ vì không còn active; tách "không còn nhận submit", "asset không còn phục vụ", "giữ để rollback", "security quarantine". Không tự chọn con số (OD2-09 OPEN).
  - **Backend enforcement:** frontend không quyết support; không tin `revision`/`releaseId` của client như bằng chứng; phân biệt incompatible / temporarily unavailable / permanently retired / security suspended, không gom thành 503.
  - Test matrix tối thiểu 14 case có expected behavior và nguồn sự thật.
- **Đề xuất của Claude (PROPOSED, notes S3-P01..P11):** `releaseId` theo hash của Release Manifest; bootstrap inline trong `entry.html` + status API; INV-R1 (runtime chỉ hydrate draft cùng `releaseId`), INV-R2 (immutable URL không mở session mới cho release không active); bốn chiều trạng thái release và ràng buộc mốc thời gian; consistency model eventual cho stable entry; activation protocol với CAS và reconciler; error contract 409/503/410/423; TM-R01..R14.
- **Trạng thái:** APPROVED AS DESIGN DIRECTION. Cơ chế PROPOSED. Activation, lưu trữ, cache thật: pending spec #5. G1 NOT APPROVED.
- **Người duyệt:** User (spec #3 Answer #2). **Ngày:** 2026-10-24.
