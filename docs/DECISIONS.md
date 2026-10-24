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
| ADR-038 | P0 render phía client (CSR) với Loading Shell nhẹ, trung tính với revision; measurement contract; prerender chỉ là tối ưu tương lai (spec #3 Q3-3) | **APPROVED AS DESIGN DIRECTION** (spec #3 Answer #3); release identity, bootstrap/CSP, scenario matrix PROPOSED (S3-P12..P16) | User (spec #3 Answer #3) | 2026-10-24 |
| ADR-039 | Byte-for-byte reproducible build cho trusted release; canonical build environment; verification hai build sạch; LRM contract; attestation `index.html`; provenance; failure semantics; bootstrap external (spec #3 Q3-4) | **APPROVED AS DESIGN DIRECTION** (spec #3 Answer #4); chi tiết PROPOSED (S3-P12 rev 2, S3-P13 rev 2, S3-P17..P21) | User (spec #3 Answer #4) | 2026-10-24 |
| ADR-040 | Hybrid code splitting với prefetch có điều kiện; chunk load failure không mất dữ liệu, không tải nhầm release; Motion-none bắt buộc (spec #3 Q3-5) | **APPROVED AS DESIGN DIRECTION** (spec #3 Answer #5); chunk plan, prefetch rule, retry PROPOSED (spec #3) | User (spec #3 Answer #5) | 2026-10-24 |
| ADR-041 | OD3-01: Vite 8.3.5 + Rolldown 1.2.15 là baseline đã kiểm chứng cho compiler design; chốt implementation sau verification gate | **CONDITIONALLY APPROVED** (spike review); trước đó: APPROVED AS EVALUATION DIRECTION | User (spec #3 review #1, spike review) | 2026-10-24 |
| ADR-042 | OD3-02: SPIKE-GATE-01 — Compiler Feasibility Spike trước G1, phạm vi giới hạn (EXP-01..05) | **APPROVED WITH LIMITED SCOPE** (spec #3 review #1); đã chạy và được user review; không phải duyệt implementation | User (spec #3 review #1, spike review) | 2026-10-24 |
| ADR-043 | OD3-03: chấp nhận ở P0 việc WebKit có thể tải lại chunk đã prefetch; xử lý evaluation failure không tự reload | **ACCEPTED FOR P0** (spike review) | User (spike review) | 2026-10-24 |
| ADR-044 | OD3-04: pnpm là package manager ưu tiên để đánh giá ở P02 (chưa khóa version) | **APPROVED AS EVALUATION DIRECTION** (spike review) | User (spike review) | 2026-10-24 |
| ADR-045 | Toolchain Node.js: Node 20 đã EOL; chỉ giữ để tái hiện spike; P02 đánh giá Node 24 LTS | **ACCEPTED** (spike review); version cụ thể chốt ở P02 | User (spike review) | 2026-10-24 |
| ADR-046 | Spec #4: Business-first Visual Form Builder, Developer-extensible Architecture; persona và hành trình ngày đầu; tiêu chí thành công A/B; nguyên tắc UX | **APPROVED AS PRODUCT DIRECTION** (spec #4 Answer #1); IA, mô hình UI, chỉ số PROPOSED | User (spec #4 Answer #1) | 2026-10-24 |
| ADR-047 | Spec #4: Hybrid Workspace (Outline · Canvas · Inspector; 作成/フロー/プレビュー/設定), P0 giới hạn; tách 5 loại state; single selection; typed command; bốn mức sẵn sàng (refinement 2026-10-24); Canvas chỉ dùng Presentation thuần; autosave + optimistic locking | **APPROVED AS PRODUCT/UX DESIGN DIRECTION** (spec #4 Answer #2); refinement **APPROVED** (spec #4 rev 2 review); cơ chế PROPOSED (spec #4) | User | 2026-10-24 |
| ADR-048 | OD4-01: Admin P0 dùng tiếng Nhật qua message catalog | **APPROVED** (spec #4 review #1) | User (spec #4 review #1) | 2026-10-24 |
| ADR-049 | OD4-02: điều kiện gắn với đích (transition first-match có thứ tự + `それ以外`) và named condition có ID ổn định; cho phép đóng OD-03 sau khi mapping nhất quán | **APPROVED WITH CONDITIONS** (spec #4 review #1) | User (spec #4 review #1) | 2026-10-24 |
| ADR-050 | OD4-03: được sửa draft khi review đang chờ; review luôn trên snapshot bất biến; stale-review detection | **APPROVED** (spec #4 review #1) | User (spec #4 review #1) | 2026-10-24 |
| ADR-051 | OD4-04: P0 shared block chỉ chèn/xem/pin/nâng version tường minh có preview impact; sửa block ở P1 | **APPROVED** (spec #4 review #1) | User (spec #4 review #1) | 2026-10-24 |
| ADR-052 | OD4-05: optimistic concurrency, không merge tự động; giữ thay đổi local, xem bản server và khác biệt, áp lại thủ công | **APPROVED** (spec #4 review #1) | User (spec #4 review #1) | 2026-10-24 |
| ADR-053 | OD4-06: Interactive Preview/Simulation P0 chạy trong iframe sandbox trên **origin riêng**, không bao giờ cùng document/execution context với Admin đã xác thực; postMessage protocol tối thiểu có kiểu | **APPROVED** (bác phương án (a) của Claude) | User (spec #4 rev 2 review) | 2026-10-24 |
| ADR-054 | Spec #5 Answer #1: publication state machine có gate, CAS, idempotent, reconcile; rollback thủ công không rebuild; phân biệt pointer / CDN / session; audit tối thiểu; P0 manual rollback, canary/auto-rollback P1. Kịch bản PC Rev 7→8 là **SYNTHETIC** | **APPROVED AS DESIGN REQUIREMENTS** | User (spec #4 rev 2 review & spec #5 Answer #1) | 2026-10-24 |
| ADR-055 | Spec #5: Phương án A — Operation Record + Reconciler + Transactional Store; SQLite (local) / DynamoDB (AWS), S3 cho artifact bất biến, CloudFront phân phối, Python API authoritative, build worker tách request, không Step Functions ở P0 | **APPROVED AS DESIGN DIRECTION** (chưa duyệt toàn bộ spec #5) | User (spec #5 architecture decision) | 2026-10-24 |
| ADR-056 | OD5-01: Admin xác thực bằng OIDC + BFF; local IdP giả lập với tài khoản tổng hợp, AWS Cognito; Authorization Code; token giữ phía server; cookie HttpOnly/Secure/SameSite; CSRF; RBAC server-side theo operation/site/form; người duyệt ≠ người gửi review | **APPROVED** | User (spec #5 rev 1 review) | 2026-10-24 |
| ADR-057 | OD5-02 / OD2-08: `T_stale = 60 s` chỉ cho query read-only/informational được chỉ định; không dùng cache stale cho submit, revocation, activation, đăng ký release, approval/preflight, effect đặc quyền; UI phân biệt authoritative / cached / unknown | **APPROVED WITH RESTRICTIONS** | User (spec #5 rev 1 review) | 2026-10-24 |
| ADR-058 | OD5-03 / OD2-09 / OD-08 / OD-09: TTL metadata draft của khách 72 giờ; `G` = 7 ngày tính từ lúc release rời active; retire thủ công sau eligibility check; không tự xóa asset khi hết `G` | **APPROVED AS P0 DEFAULTS** (chưa phải production policy) | User (spec #5 rev 1 review) | 2026-10-24 |
| ADR-059 | OD5-04: retention submission tổng hợp 30 ngày ở PoC; logical expiration khi đọc/xử lý; TTL vật lý có thể trễ; không PII thật | **APPROVED** | User (spec #5 rev 1 review) | 2026-10-24 |
| ADR-060 | OD-05 (spec #1): payload có field inactive → 422 với mã ổn định; backend tự tính field active; không lưu, không echo giá trị | **APPROVED** | User (spec #5 rev 1 review) | 2026-10-24 |
| ADR-061 | OD4-07: P0 chỉ inspector tự sinh từ schema + control typed đã duyệt; không chạy code custom Inspector trong origin Admin; sandbox custom Inspector P1 | **APPROVED** | User (spec #5 rev 1 review) | 2026-10-24 |
| ADR-062 | Spec #6: Motion phục vụ hiểu, phản hồi, liên tục — không trang trí; 4 tình huống (chuyển step, hiện nội dung theo điều kiện, phản hồi validation, phản hồi submit); preset đã duyệt + preview, không code; Motion không quyết định business state; reduced motion, a11y, hiệu năng, cô lập bundle | **APPROVED AS PRODUCT DIRECTION** | User (spec #6 Answer #1) | 2026-10-24 |
| ADR-063 | OD5-05: G-ADM bắt buộc; G-EXEC (zero adapter execution sau revocation) **không** được bảo đảm ở P0 — TOCTOU được chấp nhận **chỉ** cho PoC synthetic với điều kiện chặt; gate bảo mật riêng trước mọi tích hợp thật | **APPROVED WITH STRICT P0 RESTRICTIONS** | User (spec #5 security decision) | 2026-10-24 |
| ADR-064 | OD6-01: thư viện Motion sau Motion Adapter do platform sở hữu; pin version; MotionHost chỉ nhận TransitionNotice chỉ đọc; đo ở P04 | **APPROVED** | User (spec #6 rev 1 review) | 2026-10-24 |
| ADR-065 | OD6-02: preset P0 `none` / `subtle` / `guided`, recipe tween có ID + version, không spring; guided không auto-advance | **APPROVED** | User (spec #6 rev 1 review) | 2026-10-24 |
| ADR-066 | OD6-03: override Motion theo step → P1 | **APPROVED** | User (spec #6 rev 1 review) | 2026-10-24 |
| ADR-067 | OD6-04: duration/delay/easing trong recipe có version do platform kiểm soát; Editor chỉ chọn preset, nhóm, speed | **APPROVED AS P0 SCOPE REFINEMENT** | User (spec #6 rev 1 review) | 2026-10-24 |

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
- **Đề xuất của Claude (PROPOSED, notes S3-P01..P11):** `releaseId` theo hash của Release Manifest (**được thay bằng S3-P12** theo yêu cầu ở spec #3 Answer #3: identity tất định từ Logical Release Manifest, không vòng lặp, idempotent); bootstrap inline trong `entry.html` + status API; INV-R1 (runtime chỉ hydrate draft cùng `releaseId`), INV-R2 (immutable URL không mở session mới cho release không active); bốn chiều trạng thái release và ràng buộc mốc thời gian; consistency model eventual cho stable entry; activation protocol với CAS và reconciler; error contract 409/503/410/423; TM-R01..R14.
- **Trạng thái:** APPROVED AS DESIGN DIRECTION. Cơ chế PROPOSED. Activation, lưu trữ, cache thật: pending spec #5. G1 NOT APPROVED.
- **Người duyệt:** User (spec #3 Answer #2). **Ngày:** 2026-10-24.

## ADR-038 — CSR + Loading Shell trung tính với revision (spec #3 Q3-3)

- **Bối cảnh:** step đầu tiên nên hiện từ HTML prerender lúc build, hay khung chờ tới khi runtime khởi động.
- **Quyết định (user): APPROVED AS DESIGN DIRECTION — P0 dùng CSR với Loading Shell nhẹ, trung tính với revision.**
  - Không bắt buộc SSR/SSG/prerender/hydration ở P0.
  - Luồng: Stable Entry URL → bootstrap nhẹ → resolve release → tải đúng Immutable Release → khởi tạo React runtime → render form. Không tải engine, plugin catalog hay Motion trước khi resolver xác định release.
  - Loading Shell: HTML/CSS tối giản, không phụ thuộc React/plugin; responsive; trạng thái loading tiếng Nhật; reduced motion; không field giả; không layout shift lớn; không thông tin nhạy cảm; không nội dung đặc thù revision trước khi xác định revision; skeleton trung tính được phép nhưng không giả vờ tương tác được; chuyển sang form không mất focus/a11y semantics; có error/retry, không loading vô hạn.
  - Revision safety theo ADR-037; failure tất định khi network/status API lỗi; không coi release là supported chỉ vì có draft local; không bypass security policy.
  - Measurement contract (chưa có con số tuyệt đối): TTFB, FCP, LCP, CLS, INP, bootstrap JS bytes, initial CSS bytes, initial runtime JS bytes, Time to Form Visible, Time to Form Interactive/Ready, số request ban đầu, hành vi mạng chậm, cold vs warm cache. Tách ba thời điểm: shell xuất hiện · form có nội dung thật · khách nhập/tương tác ổn định. Không dùng FCP của shell để tuyên bố performance của form; không tuyên bố LCP/INP đạt khi chưa đo.
  - **Prerender** không bị loại về kiến trúc nhưng không implement ở P0; chỉ đánh giá khi benchmark chứng minh CSR gây vấn đề lớn; chỉ sau khi release identity đã resolve; Stable Entry không chứa prerender đặc thù của active revision.
  - **Release identity:** cùng canonical hash input và cùng artifact content → có thể cùng `releaseId`; khác content/input có ý nghĩa → identity khác; không vòng lặp; tách logical manifest, final metadata, signature, timestamp; định nghĩa trường thuộc hash input; xử lý collision/duplicate; publish idempotent; không dùng timestamp/randomness để tạo identity khác nhau.
  - **Bootstrap/CSP:** so sánh inline + CSP hash với external có version; không `unsafe-inline` mặc định; không nhúng mutable active pointer vào immutable bootstrap; stable entry có cache policy hợp activation protocol; resolver có nguồn sự thật rõ.
  - **Scenario matrix** 14 tình huống loading/bootstrap, phân loại automated / manual / future verification.
- **Đề xuất của Claude (PROPOSED, notes S3-P12..P16):** LRM / release HTML / FRM, `releaseId = rel_ + base32(sha256(JCS(LRM)))[:26]`, idempotent + `E-RELEASE-ID-COLLISION`; khuyến nghị bootstrap B (external bất biến, SRI) + CSS shell inline có CSP hash + active pointer dạng dữ liệu JSON trong `entry.html`; mốc T1/T2/T3; prerender chỉ ở Immutable Release URL; TM-L01..L14.
- **Cập nhật (spec #3 Answer #4, ADR-039):** bootstrap external có version được chọn cho P0; fallback thuần CSS là generic fallback notice, không phải CSP failure detector (S3-P13 rev 2); LRM contract chi tiết ở S3-P12 rev 2.
- **Trạng thái:** APPROVED AS DESIGN DIRECTION. Cơ chế PROPOSED ở spec #3. G1 NOT APPROVED.
- **Người duyệt:** User (spec #3 Answer #3). **Ngày:** 2026-10-24.

## ADR-039 — Byte-for-byte reproducible build (spec #3 Q3-4)

- **Bối cảnh:** build lại cùng release từ cùng input phải giống hệt từng byte, hay chỉ cần tương đương chức năng.
- **Quyết định (user): APPROVED AS DESIGN DIRECTION — Byte-for-byte Reproducible Build cho trusted release artifact.**
  - Cùng canonical input, toolchain, lock, artifact digest, build instruction, môi trường chuẩn → artifact giống hệt từng byte (SHA-256). Tương đương chức năng nhưng khác byte không phải là thành công. Phạm vi: release artifact đã định nghĩa; không gồm log, timestamp, báo cáo vận hành.
  - **Môi trường chuẩn:** container pin theo digest; Node, package manager (và Python nếu tham gia) version chính xác; lockfile; version compiler/bundler/minifier; hash plugin release; version engine/runtime; build config chuẩn; locale/timezone cố định; thứ tự file và serialization tất định; không đường dẫn tuyệt đối; không timestamp/random trong artifact thuộc identity. Không floating dependency resolution. Local build không thay bằng chứng trusted release.
  - **Verification:** hai build sạch độc lập từ cùng input, so toàn bộ inventory và hash; giống hệt → tiếp tục; khác → fail kèm diff. Không hợp thức hóa output khác nhau thành release mới. Cache không được che non-determinism.
  - **LRM:** canonical serialization; inventory có path tương đối + hash; sort và path normalization tất định; hash algorithm và schema version được định nghĩa; không tự tham chiếu; xử lý duplicate/collision; cùng LRM → cùng `releaseId`; khác input có ý nghĩa → identity khác hoặc bị kiểm incompatibility. **Cùng input mà byte khác là reproducibility failure.**
  - **`index.html`:** LRM → `releaseId` → `index.html` tất định → attestation ghi hash → integrity gate kiểm toàn bộ artifact set kể cả `index.html` → record cuối không sửa sau approval. Stable Entry HTML (mutable) không thuộc identity.
  - **Provenance** (tinh thần SLSA Build Provenance, mức PoC): source commit, builder identity, build instruction, dependency đã resolve, toolchain, artifact hash, build config identity. Reproducibility ≠ provenance; không cần SLSA certification ở P0.
  - **Failure semantics:** non-determinism, thiếu dependency, hash mismatch, manifest không nhất quán, file ngoài dự kiến, trùng path, lệch compiler, dependency không tin cậy, trùng `releaseId` → fail với diagnostic rõ; không fallback, không ghi đè artifact bất biến, không activate release lỗi; mọi check xong trước activation.
  - **Bootstrap:** external `bootstrap.js` có version cho P0; CSP theo topology production; SRI khi phù hợp; không `unsafe-inline` mặc định; CSS shell inline tuân CSP; active pointer trong Stable Entry không phải bằng chứng authoritative; fallback thuần CSS là generic notice, không phải CSP detector; `<noscript>` cho JS tắt.
  - **Scope:** không build farm, nhiều cloud builder, tất định giữa OS, registry phức tạp hay cache orchestration.
  - **Test matrix** 11 case có expected, pass/fail, vị trí evidence.
- **Đề xuất của Claude (PROPOSED, notes):** S3-P12 rev 2 (LRM contract: `lrmFormat`, JCS, SHA-256, path rules, scope), S3-P13 rev 2, S3-P17 (builder image, env), S3-P18 (protocol 10 bước), S3-P19 (Final Release Attestation write-once, integrity gate), S3-P20 (provenance), S3-P21 (TM-B01..B11).
- **Trạng thái:** APPROVED AS DESIGN DIRECTION. Chi tiết PROPOSED. G1 NOT APPROVED.
- **Người duyệt:** User (spec #3 Answer #4). **Ngày:** 2026-10-24.

## ADR-040 — Hybrid code splitting với prefetch có điều kiện (spec #3 Q3-5)

- **Bối cảnh:** capability chỉ dùng ở một nhánh (ví dụ `store-selector` ở 店頭買取) nên nằm trong bundle ban đầu hay lazy.
- **Quyết định (user): APPROVED AS DESIGN DIRECTION — Hybrid Code Splitting with Conditional Prefetch.**
  - Eager cho capability thiết yếu của step đầu; lazy cho capability của step/nhánh khác; shared internal chunk trong một release khi có lợi; không mutable shared runtime giữa release; bootstrap resolve release trước khi tải React/engine/plugin; có grouping, tránh over-splitting.
  - `store-selector`: lazy; nhánh 宅配 không chủ động tải; prefetch khi đã chọn 店頭 và có khả năng tới bước chọn cửa hàng; prefetch không chặn tương tác; backend validation luôn authoritative. Demo phân biệt "có trong artifact" với "browser thật sự tải".
  - Prefetch theo luật tất định (step reachable, branch đã chọn, ý định ổn định, dependency graph, network, data-saving); không prefetch mọi branch; prefetch không phải validation/transition/workflow state.
  - Motion: Sports Motion-none không có Motion trong bất kỳ chunk/dynamic import/registry import nào; reduced motion; animation không chặn business state hay submit. Chi tiết ở spec #6.
  - Chunk load failure: giữ step; không commit transition; không xóa giá trị; lỗi tiếng Nhật có recovery; phân biệt network / missing asset / incompatible / security suspended; không giả định `import()` lần hai sẽ request lại; reload chỉ khi cần, có cảnh báo PII, đúng pinned release, theo Draft Recovery; không tải active release mới thay thế.
  - Chunk graph từ Capability Lock tin cậy, specifier literal do compiler sinh, không registry toàn bộ, không design/server facet, không capability không dùng, React singleton, kiểm cycle/import trái phép, tên chunk ổn định, có chunk manifest. Không chỉ dựa vào tree-shaking.
  - 12 bundle verification test, mỗi test tách build graph / artifact inventory / network request / runtime behavior evidence.
  - Sửa: không deploy public sourcemap ở P0 (sourcemap debug là private artifact có hash/provenance riêng); không tuyên bố path independence nếu test không đổi path mà toolchain thấy.
- **Trạng thái:** APPROVED AS DESIGN DIRECTION. Cơ chế PROPOSED ở spec #3. G1 NOT APPROVED.
- **Người duyệt:** User (spec #3 Answer #5). **Ngày:** 2026-10-24.

## ADR-041 — Bundler: Vite + Rolldown là ứng viên đánh giá (OD3-01)

- **Bối cảnh:** spec #3 §9 liệt kê yêu cầu cứng với bundler; cần chọn công cụ bằng evidence.
- **Quyết định (user): APPROVED AS EVALUATION DIRECTION.**
  - Vite là ứng viên ưu tiên. Tài liệu Vite hiện tại dùng **Rolldown**, cấu hình qua `build.rolldownOptions` (thay `build.rollupOptions` đã deprecated). Đánh giá Vite + Rolldown trước.
  - Pin chính xác version Vite, Rolldown, Node, plugin, toolchain. Không trộn cấu hình Rollup cũ vào Rolldown nếu không được hỗ trợ.
  - Kiểm chứng API chunking thật, dependency graph, hành vi output.
  - Không coi Vite là đã chọn nếu spike thất bại. Không đáp ứng yêu cầu cứng → đề xuất phương án khác kèm evidence và trade-off. Không chọn vì phổ biến.
- **Kết quả spike (2026-10-24):** đáp ứng các yêu cầu §9 đã kiểm; cần `hashCharacters: 'hex'` và plugin L1b; chưa kiểm resolve từ release store và L1b. Khuyến nghị chọn có điều kiện (spec #3 rev 2 §22, OD3-01). Chưa phải quyết định.
- **Quyết định sau spike (user, 2026-10-24): CONDITIONALLY APPROVED.** Vite 8.3.5 + Rolldown 1.2.15 là baseline đã kiểm chứng cho compiler design. Trước khi chốt implementation phải: kiểm chứng resolve plugin từ release store; kiểm chứng L1b resolve allowlist; chạy positive và negative fixture; kiểm build graph và artifact isolation; không bỏ qua import tương đối; không dùng conditional exports làm security boundary duy nhất. **EXP-03 vẫn là FAIL**, không được đánh dấu PASS. (VG-01..VG-03, `docs/REQUIREMENTS_TRACEABILITY.md`.)
- **Trạng thái:** CONDITIONALLY APPROVED.
- **Người duyệt:** User (spec #3 review #1). **Ngày:** 2026-10-24.

## ADR-042 — SPIKE-GATE-01: Compiler Feasibility Spike (OD3-02)

- **Bối cảnh:** một số giả định của spec #3 (isolation, tái lập, export condition, retry `import()`, performance) chỉ xác nhận được bằng build thật. ADR-018 yêu cầu spike có gate riêng.
- **Quyết định (user): APPROVED WITH LIMITED SCOPE.** Ngoại lệ kỹ thuật trước G1, **không** phải duyệt implementation.
  - **Được phép:** branch local `spike/compiler-feasibility`; code thử nghiệm dùng xong bỏ; fixture Sports/PC giả lập; mock plugin và runtime tối thiểu để thử bundling; local build, Playwright, kiểm tra artifact, benchmark; file tạm; commit local trong branch spike để lưu bằng chứng tái hiện.
  - **Không được phép:** implement production compiler K0–K14, workflow engine, Admin Builder, backend submission/persistence/publishing; thay đổi AWS hay triển khai remote; push GitHub; dùng PII khách, secret, source độc quyền của công ty; merge code spike thành implementation khi chưa có G1; mở rộng spike ra ngoài các giả thuyết cần kiểm chứng.
  - **Tách biệt:** spike tách khỏi implementation chính thức; giữ source spike tái hiện được trên branch local hoặc khu vực experimental cô lập; mang kết quả, evidence và kết luận thiết kế về docs P01; không cherry-pick/merge code; không đánh dấu requirement production DONE vì spike PASS.
  - **Thí nghiệm:** EXP-01 Build isolation · EXP-02 Reproducible build · EXP-03 Conditional exports · EXP-04 Dynamic import failure (Chromium, Firefox, WebKit) · EXP-05 Performance (lab-only).
  - **Báo cáo** mỗi thí nghiệm: ID, giả thuyết, lệnh tái hiện, môi trường/toolchain, kết quả quan sát, PASS/FAIL/INCONCLUSIVE, đường dẫn evidence, giới hạn, ảnh hưởng tới spec #3, thay đổi thiết kế đề xuất. **Không sửa tiêu chí sau khi xem kết quả**; FAIL phải báo rõ.
  - Sau spike: independent consistency review spec #3 (đối chiếu spec #1 rev 3.3, spec #2 rev 2.3); spec #3 rev 2 nếu cần; rà K0–K14 (thứ tự thực thi, stage nào chạy lại ở hai lần build, LRM trước/sau verification, artifact có bị đổi sau khi hash, attestation cover gì, file ngoài inventory, tách side effect staging với spec #5) kèm diagram và stage dependency matrix.
- **Thực hiện (2026-10-24):** tiêu chí chốt trước ở `22ecfaf`. EXP-01 PASS, EXP-02 PASS, EXP-03 FAIL (hai điều kiện), EXP-04 PASS (một giả định FAIL), EXP-05 PASS (lab-only). Báo cáo `docs/discovery/P01_SPIKE_GATE_01_REPORT.md`; evidence `docs/evidence/P01/spike-gate-01/`; source `spikes/compiler-feasibility/` (chưa commit; hook yêu cầu user duyệt).
- **Review của user (2026-10-24):** giữ nguyên kết quả: EXP-01 PASS; EXP-02 PASS trong phạm vi môi trường đã thử; EXP-03 FAIL; EXP-04 PASS theo acceptance criteria, có limitation với WebKit và evaluation failure; EXP-05 PASS, lab-only. Không nâng tuyên bố ngoài phạm vi evidence; spike PASS không đồng nghĩa requirement production DONE. Đã duyệt hai commit local: `b3070d2` (branch `spike/compiler-feasibility`) và commit docs trên `p00-discovery`. Không merge spike branch.
- **Trạng thái:** APPROVED WITH LIMITED SCOPE; spike đã chạy và được review. G1 NOT APPROVED, G9/G10 BLOCKED.
- **Người duyệt:** User (spec #3 review #1). **Ngày:** 2026-10-24.

## ADR-043 — Prefetch trên WebKit và evaluation failure ở P0 (OD3-03)

- **Bối cảnh:** SPIKE-GATE-01 EXP-01: WebKit 27.2 (Playwright) không dùng lại response prefetch bằng `fetch()` cho lần tải module (4 request so với 2). EXP-04: trên WebKit, reload không phục hồi được lỗi evaluate.
- **Quyết định (user): ACCEPTED FOR P0.**
  - Chấp nhận WebKit có thể tải lại chunk đã prefetch trong phạm vi PoC, dựa trên số đo hiện tại. Ghi limitation và overhead byte/request; không hứa prefetch được dùng lại hoàn hảo; không ảnh hưởng correctness; không kết luận Safari thật giống Playwright WebKit; đánh giá lại nếu plugin thật lớn hơn nhiều.
  - Evaluation failure: không khẳng định nguyên nhân khi evidence chưa đủ; không tự động reload làm mất dữ liệu trong memory; phải có recovery cho người dùng thấy và giữ pinned release.
- **Trạng thái:** ACCEPTED FOR P0. Verification: VG-07, VG-08.
- **Người duyệt:** User (spike review). **Ngày:** 2026-10-24.

## ADR-044 — Package manager: đánh giá pnpm (OD3-04)

- **Bối cảnh:** spike gặp lỗi arborist của npm 10.8.2 (`edgesOut`) với workspace + optional peer; phải dùng `legacy-peer-deps`.
- **Quyết định (user): APPROVED AS EVALUATION DIRECTION.** pnpm là package manager ưu tiên cho P02, **chưa khóa version**. Yêu cầu: tạo fixture tái hiện lỗi optional-peer của npm 10.8.2; kiểm pnpm cài fixture thành công; kiểm resolve dependency của workspace; kiểm frozen lockfile; kiểm React peer singleton; pin `packageManager` version chính xác sau khi chọn; không floating dependency trong release CI. Không suy ra mọi phiên bản npm đều lỗi từ một lần gặp lỗi.
- **Trạng thái:** APPROVED AS EVALUATION DIRECTION. Verification: VG-04.
- **Người duyệt:** User (spike review). **Ngày:** 2026-10-24.

## ADR-045 — Toolchain Node.js sau khi Node 20 EOL

- **Bối cảnh:** spike dùng Node 20.20.2 (khớp máy local); Node.js 20 đã EOL.
- **Quyết định (user): ACCEPTED.** Giữ image Node 20 để tái hiện spike, **không** mặc định dùng cho canonical production build. Ở P02: ưu tiên đánh giá Node.js 24 LTS; pin image theo digest bất biến; kiểm tương thích Vite/Rolldown và plugin; chạy lại verification reproducibility và isolation; ghi rõ nếu kết quả khác spike. Không sửa evidence gốc của spike.
- **Trạng thái:** ACCEPTED; version cụ thể chốt ở P02. Verification: VG-05.
- **Người duyệt:** User (spike review). **Ngày:** 2026-10-24.

## ADR-046 — Business-first Visual Form Builder (spec #4 Answer #1)

- **Bối cảnh:** spec #4 (Admin Form Builder) phải được thiết kế từ góc nhìn người nghiệp vụ.
- **Quyết định (user): Business-first Visual Form Builder, Developer-extensible Architecture.** Định hướng sản phẩm, chưa duyệt spec #4 hay G1.
  - **Persona (giả định thiết kế):** Business Editor — PC Site (PO/PM/Business Operator); hiểu nghiệp vụ; không cần biết React/TS/Python/JSON Schema/DSL; không sửa source, không đăng ký plugin; chỉ dùng capability đã approve; không nhất thiết có quyền publish.
  - **Hành trình ngày đầu 9 bước:** login & chọn site → tạo form (starter/clone/trống; không live inheritance) → step → field → điều kiện (`WHEN … THEN …`, không code/JSON/regex/DSL/path) → theme & Motion (preset; spec #6) → **preview & test** (desktop/mobile, nhánh, validation, 確認, hoàn tất; cùng semantic contract; phân biệt Visual/Interactive Preview, Submission Simulation, Published Form; không side effect) → lưu & sửa lỗi (lỗi dễ hiểu, dẫn tới chỗ sửa; draft có lỗi / hợp lệ để preview / hợp lệ để request publish) → gửi review (Editor không bypass reviewer; phối hợp spec #5).
  - Identity ổn định do platform quản lý; đổi label không phá reference; classification không hạ dưới mức tối thiểu.
  - **Thành công A (spec #4)** và **B (vertical slice)** như notes; A toàn bộ bằng UI, không source/JSON.
  - **Nguyên tắc UX:** business-first terminology; progressive disclosure; direct manipulation; safe editing; accessible (không bắt buộc drag-and-drop); deterministic feedback (không giả vờ publish thành công).
  - **Scope:** P0 ưu tiên first-day journey end-to-end; danh sách P1/P2 như notes; P0 vẫn có branching, cấu hình trực quan, validation, preview, persistence, review/publish journey.
  - **Chỉ số UX:** đề xuất kèm phương pháp đo; không đặt KPI cố định như đã xác nhận.
  - **Anti-goal:** không thiết kế JSON editor bọc drag-and-drop rồi gọi là no-code.
- **Đề xuất của Claude (PROPOSED, notes S4-P01..P04):** IA; ba mô hình UI (A outline, B flow canvas, C hybrid workspace — khuyến nghị C); interaction model; bảng chỉ số kèm target đề xuất.
- **Trạng thái:** APPROVED AS PRODUCT DIRECTION. G1 NOT APPROVED.
- **Người duyệt:** User (spec #4 Answer #1). **Ngày:** 2026-10-24.

## ADR-047 — Builder: Hybrid Workspace và editor state (spec #4 Answer #2)

- **Bối cảnh:** chọn mô hình UI cho Builder trong ba phương án A (outline), B (flow canvas), C (hybrid workspace).
- **Quyết định (user): C — Hybrid Workspace, P0 giới hạn. APPROVED AS PRODUCT/UX DESIGN DIRECTION.**
  - Outline · Visual Form Canvas · Properties Inspector; chế độ 作成 / フロー / プレビュー / 設定. A là fallback, chỉ chuyển khi có approval đổi scope; B không dùng ở P0.
  - P0: Outline (drag **và** bàn phím/menu), Canvas dùng renderer của khách qua **design-time interaction adapter** (không kích hoạt transition, privileged command hay submission), Inspector 基本/条件/検証/詳細, Rule Editor dạng câu serialize thành typed DSL, Flow Overview chỉ đọc có bản danh sách tương đương, Interactive Preview tách khỏi Edit Canvas, theme + Motion preset, draft persistence, diagnostics, review request UX.
  - **Editor state:** Document / Selection / Diagnostics / Preview Runtime / Persistence tách bạch, đồng bộ qua contract; single selection authority; typed command có stable ID, validation, impact analysis; không panel nào tự mutate JSON.
  - **Ba mức draft:** Editable / Previewable / Review-ready; diagnostic có mã ổn định, thông báo nghiệp vụ tiếng Nhật, severity, target, hành động sửa.
  - **Autosave:** optimistic locking theo draft version; response trễ không ghi đè; 409 không ghi đè ngầm và giữ thay đổi local; không CRDT; `pending` chỉ hạn chế thao tác không an toàn.
  - **A11y/responsive:** desktop-first; collapse Outline, Inspector drawer ở màn nhỏ; keyboard, focus, reorder không cần drag, nhãn screen reader, không chỉ dùng màu.
  - P1/P2: free-form layout, edge editing, undo/redo đầy đủ, collaboration, rule debugger nâng cao, bulk cross-site, marketplace, AI sinh form.
  - **UX acceptance:** task-based test 9 task với persona không biết code; KPI đề xuất chưa phải acceptance; không tuyên bố usability PASS chỉ từ developer tự test.
- **Trạng thái:** APPROVED AS PRODUCT/UX DESIGN DIRECTION. Cơ chế PROPOSED ở spec #4. G1 NOT APPROVED.
- **Người duyệt:** User (spec #4 Answer #2). **Ngày:** 2026-10-24.
- **Refinement (user, review spec #4 rev 2, 2026-10-24): APPROVED.**
  1. Builder Canvas chỉ dùng **Presentation thuần** + design-time adapter; không mount component hành vi của plugin (thay cho "renderer của khách" ở trên).
  2. **Bốn mức sẵn sàng** thay ba mức draft, với điều kiện mỗi mức có entry criteria, blocking diagnostics và allowed actions tường minh. Mức sẵn sàng **không** được nhầm với trạng thái lưu, vòng đời review hay trạng thái của revision đã publish.

## ADR-048 — Ngôn ngữ Admin P0 (OD4-01)

- **Quyết định (user): APPROVED.** P0 Admin dùng tiếng Nhật. Mọi nhãn, lỗi, trạng thái, help text hướng tới người nghiệp vụ đi qua **message catalog tiếng Nhật**; không hardcode chuỗi trong business logic; mở đường thêm ngôn ngữ sau. Identifier kỹ thuật và diagnostic nội bộ không nhất thiết dịch.
- Đóng spec #1 OD-11 cho P0.
- **Người duyệt:** User (spec #4 review #1). **Ngày:** 2026-10-24.

## ADR-049 — Biểu diễn điều kiện (OD4-02; spec #1 OD-03)

- **Quyết định (user): APPROVED WITH CONDITIONS.** Điều kiện gắn với đích (transition destination; field visible/required), có named condition.
- **Bắt buộc làm rõ:** ưu tiên khi nhiều điều kiện cùng đúng; first-match hay loại trừ lẫn nhau; `それ以外`; ngữ nghĩa missing/null/empty/type theo spec #1; named condition dùng ID ổn định, phát hiện tham chiếu vòng; diagnostic khi xung đột, nhánh không tới được, transition chưa đủ; mapping chuẩn từ Visual Rule Editor sang typed DSL.
- Được phép đóng spec #1 OD-03 **sau khi** hoàn tất mapping nhất quán và xác minh không có mâu thuẫn ngữ nghĩa (thực hiện ở spec #4 rev 2 §11, spec #1 rev 3.4).
- **Người duyệt:** User (spec #4 review #1). **Ngày:** 2026-10-24.

## ADR-050 — Review trên snapshot bất biến (OD4-03)

- **Quyết định (user): APPROVED.** Editor được tiếp tục sửa draft khi review đang chờ, nhưng: review request luôn tham chiếu **snapshot bất biến** đã gửi; Reviewer không review draft đang đổi; sửa sau khi gửi không đổi nội dung đang review; publish dùng **snapshot đã approve** và chạy lại preflight/compatibility gate cần thiết; nếu active revision hoặc dependency đổi trong lúc review thì phải **phát hiện review cũ (stale)**; không ngầm approve draft mới hơn snapshot đã xem; P0 không cần multi-review nâng cao.
- **Người duyệt:** User (spec #4 review #1). **Ngày:** 2026-10-24.

## ADR-051 — Shared block trong Builder P0 (OD4-04)

- **Quyết định (user): APPROVED.** P0: chèn shared block đã approve; xem cấu hình/dependency; pin revision bất biến; nâng sang revision khác một cách tường minh; xem trước impact trước khi nâng; **không** sửa nội dung gốc của shared block trong Builder P0; không tự nâng các form khác. Soạn/sửa shared block chuyển sang P1.
- **Người duyệt:** User (spec #4 review #1). **Ngày:** 2026-10-24.

## ADR-052 — Xung đột khi lưu (OD4-05)

- **Quyết định (user): APPROVED.** P0 dùng optimistic concurrency, không merge tự động. Khi xung đột: giữ thay đổi chưa lưu; hiện bản server mới hơn; cho xem khác biệt theo step/field/rule; hướng dẫn áp lại thủ công; không ghi đè ngầm; không báo 保存済み khi server chưa xác nhận; không CRDT hay collaboration real-time.
- **Người duyệt:** User (spec #4 review #1). **Ngày:** 2026-10-24.

## ADR-053 — Cô lập Interactive Preview (OD4-06)

- **Bối cảnh:** spec #4 rev 2 đề xuất (a) P0 chạy component hành vi của plugin trong cùng document với Admin và ghi nhận rủi ro; iframe ở P1.
- **Quyết định (user): bác (a). P0 Interactive Preview / Simulation phải được cô lập về execution.**
  - Edit Canvas: chỉ presentation, không hành vi của khách.
  - Interactive Preview / Simulation: runtime khách cô lập, **một** iframe sandbox trên **origin tách biệt với Admin** (không cần iframe riêng cho từng plugin).
  - Không chia sẻ token xác thực, cookie hay service đặc quyền của Admin; không side effect production; chỉ dữ liệu tổng hợp, mock integration, browser facet đã approve; CSP/network policy giới hạn đích; không lấy code plugin từ URL do Admin JSON chỉ định.
  - Admin ↔ Preview qua **postMessage protocol tối thiểu có kiểu**: kiểm origin/source chặt, validate schema message, preview session identity, không truyền credential hay PII, không evaluate code từ message.
  - Không dùng sandbox cùng origin kết hợp `allow-scripts` + `allow-same-origin` (vô hiệu hóa isolation). Nếu dùng opaque origin phải tính tới origin `null` trong kiểm message và CORS; ưu tiên origin preview riêng có policy rõ.
  - Không cần microfrontend framework hay marketplace. PoC đơn giản hơn: được phép standalone preview trên origin riêng; **không** tự fallback sang chạy cùng document. Nếu isolation thành blocker lớn: báo trade-off và phương án để user duyệt; không mặc định dời sang P1.
  - Verification bắt buộc: plugin đọc storage/cookie của Admin; gọi API đặc quyền của Admin; fetch ngoài allowlist; điều hướng top-level; postMessage sai dạng; runtime preview crash; preview session bị thay khi draft đổi; Preview và Published Runtime dùng cùng semantic engine. Không tuyên bố an toàn hoàn toàn chỉ nhờ iframe/CSP; server authorization vẫn bắt buộc.
- **Ngoài ra (cùng review):** đồng bộ 10 mã diagnostic mới vào catalog spec #3; server preflight giữ authoritative; so digest **không thay thế** conformance/differential test; khôi phục trùng key phải bảo toàn tham chiếu trong rule/validator/effect và không đổi ngầm mã option; giữ bảo toàn tính năng chỉ đọc và snapshot review bất biến. Sau các sửa này spec #4 có thể ở trạng thái READY_FOR_CROSS_SPEC_REVIEW nếu không có blocker mới.
- **Người duyệt:** User (review spec #4 rev 2). **Ngày:** 2026-10-24.

## ADR-054 — Publication và rollback: yêu cầu thiết kế (spec #5 Answer #1)

- **Bối cảnh:** câu hỏi mở đầu spec #5 về một sự cố publish/rollback. User không cung cấp sự cố thật; đưa **SYNTHETIC INCIDENT SCENARIO** (PC Rev 7 active → Rev 8 publish → nhánh 店頭買取 lỗi chọn cửa hàng → rollback Rev 7). Không được trình bày như evidence lịch sử.
- **Quyết định (user): APPROVED AS DESIGN REQUIREMENTS.**
  - **Publisher thấy:** form/site; snapshot đã duyệt; revision và release identity; release đang active; release đề xuất; trạng thái compile/validation/integrity; dependency và cảnh báo tương thích; publish readiness; lịch sử thao tác. Không release nào chưa qua gate security/integrity được thành active. Không dùng snapshot hay `releaseId` do client gửi làm bằng chứng authorization.
  - **Publication state machine** (stage khái niệm): chọn snapshot đã duyệt → tạo Build Request tin cậy → compile + reproducibility → đăng ký release bất biến → stage + verify artifact → verify tương thích backend/runtime → activation bằng cập nhật pointer authoritative → verify serving/activation → audit + kết quả. Yêu cầu: idempotent; CAS; không activation trước khi gate pass; lỗi không để pointer trỏ vào artifact chưa sẵn sàng; retry/reconcile khi gián đoạn; không ghi đè artifact bất biến; phân biệt activation và lan truyền CDN; không hứa atomicity phân tán giữa DB, object storage, CDN nếu không có protocol chứng minh.
  - **Rollback:** Publisher có quyền xem lịch sử, chọn release trước đủ điều kiện, xem impact/tương thích, xác nhận, thấy kết quả và audit. Không rebuild; không sửa artifact; kiểm eligibility/integrity/security; chuyển pointer an toàn đồng thời; không ghi đè một publish mới hơn mà operator chưa thấy; không tự rollback backend; không tự migrate session. Phân biệt: pointer đã đổi / CDN-browser đã nhận / session cũ vẫn chạy release cũ. Lỗi → không báo thành công giả.
  - **Session (ADR-037):** session đang mở giữ release đã pin; khách mới theo resolver; cache gây nhất quán cuối cùng; asset cũ giữ theo retention; backend support matrix quyết định release cũ còn submit được không; security suspension có thể override grace; không tự chuyển form đang nhập sang revision khác. Release cũ không còn được hỗ trợ → rollback không tiến hành nếu không có quyết định vận hành phù hợp.
  - **Audit P0:** ai gửi review, ai approve, ai publish; release nào active; publish/rollback bắt đầu/kết thúc; verification nào PASS/FAIL; số lỗi theo release; rollback nào và lý do. Không log PII/payload. Metrics theo `releaseId` được phép; không xây observability enterprise ở P0.
  - **Phạm vi:** P0 = manual rollback, phân quyền theo vai trò, kiểm tương thích/security, activation an toàn đồng thời, audit, UI rõ cho operator. P1 có thể đánh giá: auto rollback theo ngưỡng, canary, progressive rollout, phân loại sự cố tự động.
  - **Spec #5 phải thiết kế vertical slice:** Editor → lưu draft → server preflight → snapshot review → approval → Build Request → compile/verify → đăng ký release → staging → activation → form khách → submit authoritative → mock effect → rollback; gồm API contract, persistence model, authn/authz, sở hữu site/form, optimistic concurrency, idempotency, plugin support/security policy, OD2-08, OD2-09, retention, state machine, server-side validation, transaction/outbox, failure recovery, audit. **Không tự chọn `T_stale` hay `G`** trước khi trình risk/trade-off.
  - Ưu tiên vertical slice nhỏ chạy được sau G1; không thành deployment platform tổng quát.
- **Người duyệt:** User (spec #5 Answer #1). **Ngày:** 2026-10-24.

## ADR-055 — Kiến trúc publication và persistence (spec #5, phương án A)

- **Bối cảnh:** S5-P01 đưa ba phương án: A Operation Record + Reconciler trên store authoritative; B Step Functions + DB; C pointer trên S3.
- **Quyết định (user): A. APPROVED AS DESIGN DIRECTION**, chưa phải duyệt toàn bộ spec #5 hay G1.
  - **Storage baseline:** local SQLite; AWS DynamoDB; artifact bất biến trên S3; phân phối form khách qua CloudFront; Python API là backend authoritative; build worker tách khỏi request; reconciler xử lý operation bị gián đoạn. Không bắt buộc RDS/PostgreSQL; nếu có ràng buộc DynamoDB không đáp ứng được thì trình evidence + trade-off trước khi đổi. Không xây generic database framework.
  - **Transaction boundary:** một miền giao dịch logic, không phải một record khổng lồ. Tách draft, snapshot review bất biến, review/approval, release record tin cậy, active pointer, operation publish/rollback, audit, submission, outbox. Dữ liệu lớn có chiến lược lưu riêng; tôn trọng giới hạn DynamoDB (item 400 KB, transaction 100 action, tổng 4 MB). Không mặc định S3 và DynamoDB có distributed transaction; payload ngoài DB phải có content hash và verification.
  - **Activation:** active pointer trong DB là authoritative; activation chỉ khi release đã approve, artifact đã stage + verify, tương thích backend/runtime, security policy cho phép, CAS khớp release active trước đó, audit + operation state nhất quán, không lost update giữa publish và rollback. Không tuyên bố CAS làm CloudFront cập nhật nguyên tử; phân biệt DB committed / resolver (entry) cập nhật / CDN lan truyền / khách mới thực sự nhận; có status contract + wording UI.
  - **Reconciler:** state machine tối thiểu, không Step Functions ở P0 nếu chưa bắt buộc; operation id, idempotency key, expected pointer version, claim có điều kiện, lease, fencing/generation, retryable vs terminal, khôi phục sau crash, reconcile khi timeout/unknown outcome, audit không PII, không activate operation cũ sau publish/rollback mới hơn; idempotency phủ cả bước bên ngoài khi khả thi, không chỉ dựa vào retry HTTP.
  - **Parity local/AWS:** không cần cùng semantics SQL/API, nhưng cùng **domain transaction contract** (optimistic concurrency, tạo snapshot bất biến, CAS activation, unique operation/idempotency, submission + outbox, crash recovery, conflict/failure mong đợi); contract test suite chạy trên cả hai adapter; không dùng hành vi local làm bằng chứng cho AWS.
  - **Failure matrix:** tối thiểu 15 tình huống (build fail … snapshot vượt giới hạn), mỗi tình huống nêu DB state, artifact state, retry/reconcile, ảnh hưởng khách, kết quả hiển thị cho Admin.
  - **Policy:** chưa chốt OD2-08 (`T_stale`) và OD2-09 (`G`); phải phân tích revocation latency, availability của policy store, session đang mở, draft TTL, tương thích backend, retention asset, failure, chi phí vận hành. Release đã bị suspend không được tiếp tục chỉ vì cache còn hạn khi revoke authoritative đã xác nhận; nêu rõ giới hạn khi mất kết nối policy store. Tách activation, support, security, asset retention.
  - **Submission:** tra release tin cậy, validate authoritative phía server, idempotency, phân loại/mã hóa/retention PII, submission + outbox nguyên tử, worker mock effect, retry/dedup/dead-letter phù hợp P0; không hứa exactly-once với hệ thống ngoài.
  - **Spec #4 rev 2.1:** chấp nhận READY_FOR_CROSS_SPEC_REVIEW có điều kiện: targeted independent review cho Preview isolation; xác minh ranh giới import design/presentation/browser facet; xác minh origin iframe, sandbox, postMessage, preview session. Không mở lại toàn bộ spec #4 nếu không có blocker mới.
  - **Thứ tự spec #5:** persistence aggregates → state machine publication/rollback → API boundaries → security/compatibility/support policy → submission/outbox → failure/recovery matrix; trình các lựa chọn thật sự cần quyết (đặc biệt OD2-08, OD2-09); đủ dữ kiện thì chuẩn bị Architecture Proposal thay vì hỏi nhiều câu nhỏ.
- **Người duyệt:** User (spec #5 architecture decision). **Ngày:** 2026-10-24.

## ADR-056 — Xác thực Admin (OD5-01)

- **Quyết định (user): APPROVED.** OIDC + Backend-for-Frontend. Local: IdP giả lập với tài khoản tổng hợp. AWS baseline: Amazon Cognito. Authorization Code flow theo hướng dẫn bảo mật hiện hành; token quản lý phía server, không lưu `localStorage`; cookie phiên HttpOnly, Secure, SameSite phù hợp; chống CSRF; RBAC kiểm phía server trên từng operation/site/form; người duyệt và người gửi review phải là hai identity khác nhau (P0).
- Mock IdP local **không** phải bằng chứng tích hợp Cognito PASS. Không cần enterprise SSO ở P0.
- **Người duyệt:** User (review spec #5 rev 1). **Ngày:** 2026-10-24.

## ADR-057 — `T_stale` và giới hạn dùng cache policy (OD5-02, OD2-08)

- **Quyết định (user): APPROVED WITH RESTRICTIONS.** `T_stale = 60 s` ở P0, **chỉ** cho các query read-only/informational được chỉ định.
- Cache stale **không** được quyết định: authorization của submission khách; security revocation; activation publish/rollback; security eligibility khi đăng ký release; approval/preflight authoritative; effect đặc quyền. Các thao tác này phải kiểm trạng thái authoritative hoặc fail closed khi không xác minh được.
- Admin UI phân biệt: trạng thái authoritative mới; trạng thái cached chỉ để thông tin; trạng thái unknown/không khả dụng. Không trình bày trạng thái cached như kết quả bảo mật thời gian thực.
- **Người duyệt:** User (review spec #5 rev 1). **Ngày:** 2026-10-24.

## ADR-058 — Draft TTL, grace window, retire (OD5-03, OD2-09, OD-08, OD-09)

- **Quyết định (user): APPROVED AS P0 DEFAULTS** (chưa phải production business policy): TTL metadata draft khách 72 giờ; `G` = 7 ngày; retire thủ công sau eligibility check.
- **Draft:** không persist PII khách trong browser; không có draft khách phía server; metadata phục hồi chỉ chứa release identity đã pin và dữ liệu không nhạy cảm trong allowlist; browser có thể xóa storage bất kỳ lúc nào; không cam kết khôi phục PII sau reload.
- **Grace:** `G` tính từ lúc release không còn active (trừ khi policy quy định khác). Phân biệt active / supported / security-suspended / retired / asset-retained. Không tự xóa asset khi hết `G`. Phải xác định: thời điểm nhận submission muộn nhất; bắt đầu/kết thúc grace; retention sau grace; giả định cache browser/CDN có giới hạn; resume khi release không còn supported; khác biệt retire thường và revocation khẩn cấp. Không bảo đảm vô hạn tab cũ vẫn submit được. `T_edge_max` chưa xác định thì ghi là mục kiểm chứng khi deploy, không tự suy ra cận trên.
- Đóng spec #1 OD-08 (giá trị P0), OD-09 (retire thủ công); spec #2 OD2-09.
- **Người duyệt:** User (review spec #5 rev 1). **Ngày:** 2026-10-24.

## ADR-059 — Retention submission ở PoC (OD5-04)

- **Quyết định (user): APPROVED.** 30 ngày cho submission tổng hợp. Chỉ dữ liệu giả; không PII thật khi chưa có approval bổ sung. Logical expiration enforce khi đọc/xử lý; TTL DynamoDB xóa vật lý có thể trễ. Audit metadata và payload submission tổng hợp có thể có retention khác nhau nếu thiết kế rõ. Không log raw payload.
- **Người duyệt:** User (review spec #5 rev 1). **Ngày:** 2026-10-24.

## ADR-060 — Field inactive trong payload (spec #1 OD-05)

- **Quyết định (user): APPROVED.** Từ chối bằng validation error HTTP 422. Backend tự tính field active theo revision/workflow tin cậy; không tin cờ visibility do client gửi; không lưu giá trị field inactive; không echo PII trong error hay log; runtime nên xóa/vô hiệu giá trị phụ thuộc khi đổi nhánh; có test đổi nhánh, field ẩn, payload cũ, gửi lại. Error có mã máy đọc ổn định và UX mapping.
- **Người duyệt:** User (review spec #5 rev 1). **Ngày:** 2026-10-24.

## ADR-061 — Inspector P0 (OD4-07)

- **Quyết định (user): APPROVED.** P0 chỉ dùng Inspector sinh từ schema và control typed đã duyệt. Không chạy code custom Inspector trong origin Admin. Sandbox cho custom Inspector chuyển P1.
- Trước khi coi P0 đủ: xác minh các plugin cần cho Sports và PC đều cấu hình được qua Inspector tự sinh; nếu thiếu khả năng thiết yếu thì đề xuất một control typed built-in nhỏ, không mở thực thi code tùy ý.
- **Người duyệt:** User (review spec #5 rev 1). **Ngày:** 2026-10-24.

## ADR-062 — Motion Product Direction (spec #6 Answer #1)

- **Quyết định (user): APPROVED AS PRODUCT DIRECTION.** Motion cải thiện **sự hiểu, phản hồi và tính liên tục**, không trang trí form. Business Editor mở tab モーション để chọn phong cách chuyển động hợp với website và xem trước ngay; không lập trình animation.
- **Bốn tình huống ưu tiên:**
  1. Chuyển step (次へ/戻る): nhẹ, biết mình ở bước nào, không đổi trang đột ngột, không mất giá trị, không hỏng history/focus.
  2. Hiện nội dung theo điều kiện (ví dụ 店頭買取 → khu chọn cửa hàng; 宅配買取 → nhánh 宅配): Motion chỉ phản ánh state Workflow Engine đã quyết; không quyết field active; không trì hoãn invalidation hay server validation để chờ animation.
  3. Phản hồi validation: lỗi rõ; nhấn nhẹ; không rung mạnh, không nhấp nháy, không tự cuộn gây mất phương hướng; screen reader đọc được; animation không thay message; không hiện thành công khi validation authoritative còn pending.
  4. Phản hồi submit: pending đúng; success chỉ sau khi backend xác nhận; thất bại có lỗi + cách khắc phục; Motion không gây submit lần hai; không success vì animation kết thúc; không chạy effect/command từ animation callback.
- **Preset P0:** hệ preset đã duyệt; đề xuất ban đầu `なし` / `控えめ` / `ガイド付き` (đề xuất sản phẩm, chưa phải registry cuối). Editor: chọn preset, xem trước, so On/Off, bật/tắt theo nhóm tương tác được hỗ trợ, xem reduced motion. Không chỉnh keyframe; không JS/CSS/script; không timeline editor, choreography graph, 3D. Override theo step chỉ vào P0 nếu thật sự cần cho demo Sports/PC.
- **Ranh giới:** Workflow Engine giữ business state; Motion chỉ render transition đã xác nhận; tách domain/workflow state, validation/submission status, UI presentation state, animation lifecycle. Lifecycle của animation không được: commit navigation, authorize submission, sửa PII, dispatch server effect, override validation, mở khóa action bị disable. Motion lỗi không làm form không submit được; có fallback không animation.
- **Contract khai báo có kiểu** (trigger, target là region đã đăng ký, preset ID + version, tham số có kiểu, biến thể reduced motion, tương thích runtime/build); không event handler/code/selector/DOM mutation tùy ý; validate, pin version, compile tất định, không phụ thuộc thời gian/ngẫu nhiên, parity Preview/Published.
- **A11y:** `prefers-reduced-motion`; tắt chuyển động không thiết yếu; bàn phím; screen reader; focus sau chuyển step; không flash/strobe; không cần animation để hiểu/hoàn thành; Editor không override được tùy chọn của người dùng.
- **Hiệu năng:** ưu tiên transform/opacity; không layout thrashing; không chặn input; không kéo dài; không layout shift bất ngờ; fallback thiết bị chậm. 120–250 ms chỉ là gợi ý cần kiểm chứng, không phải KPI. Đo bytes JS/CSS, initial vs lazy, request, T2/T3, INP, CLS, long task, overhead reduced motion, thiết bị chậm; không kết luận CWV PASS từ lab.
- **Bundle:** theo spec #3 — Sports Motion-none không có Motion runtime trong toàn bộ artifact graph, không dynamic import, không preset thừa; PC chỉ bundle preset thực dùng, không registry toàn cục; lazy khi hợp lý mà không làm animation đến quá trễ; không ảnh hưởng tính tất định của Release Manifest.
- **Builder UX:** tab モーション cho Business Editor: Preset Library trái, Visual Preview giữa, thuộc tính phải/Inspector, Preview On/Off, Preview Reduced Motion; tương thích Hybrid Workspace; preview chạy trong runtime cô lập (ADR-053). Editor thấy hiệu ứng áp ở đâu, khi nào, ảnh hưởng a11y/hiệu năng, Motion-none trông thế nào; không thấy DSL/code.
- **Non-goals P0:** GSAP timeline, keyframe editor, CSS animation editor, scroll-linked, parallax, 3D, choreography toàn form, AI sinh script, script tùy ý theo plugin.
- **Thành công:** Editor mở PC Builder → chọn preset → preview chuyển step → preview 店頭/宅配 → kiểm reduced motion → lưu draft → gửi review; không code, không DSL, không developer. Form khách đúng khi animation tắt hoặc không tải được.
- **Người duyệt:** User (spec #6 Answer #1). **Ngày:** 2026-10-24.

## ADR-063 — Thực thi adapter sau revocation (OD5-05)

- **Quyết định (user): APPROVED WITH STRICT P0 RESTRICTIONS** — phương án (a), chỉ cho PoC synthetic P0.
- **G-ADM (bắt buộc):** revocation commit trước transaction submit → submit thất bại; submit commit trước → có thể hợp lệ; ConditionCheck nằm trong cùng transaction ghi submission/outbox; retry idempotent của submission đã commit không tạo admission mới; gate thiếu → fail closed.
- **G-EXEC (không bảo đảm):** không có guarantee "không adapter mới nào chạy sau commit của revocation". Đọc nhất quán mạnh không khóa gate; adapter có thể **bắt đầu** sau commit nếu lần đọc gate xảy ra trước đó. Đây là giới hạn **TOCTOU**, không chỉ là "lời gọi đang dở chạy tiếp". Adapter **read-only** cũng nằm trong phạm vi rủi ro, không riêng effect.
- **Điều kiện để chấp nhận:** dữ liệu synthetic; không PII thật; không connector ngoài thật; không effect đặc quyền thật; mock adapter không truy cập hệ thống nghiệp vụ thật; mock effect không gửi email/SMS hay sửa dữ liệu thật; adapter không có secret thật; network access giới hạn theo allowlist và được kiểm chứng; runtime policy store không khả dụng → fail closed cho mọi quyết định nhạy cảm về bảo mật; giới hạn G-EXEC có trong security risk register và đánh giá G1 cuối. **Điều kiện thay đổi → approval hết hiệu lực.**
- **Trước tích hợp thật:** trước bất kỳ connector thật, PII thật hay effect đặc quyền nào phải có một security verification/approval gate riêng. Phương án (b) lease/permit chỉ là **ứng viên nghiên cứu**, chưa phải giải pháp mặc định; cần xét lease acquisition/expiry, clock skew và giả định lỗi, fencing token, revoke đồng thời, hủy lời gọi đang chạy, lời gọi đã admit chưa thực thi, dịch vụ ngoài có hỗ trợ fencing/idempotency không, guarantee chính xác trước/sau commit. Không hứa zero execution khi chưa có cơ chế chứng minh; không tự chọn thời lượng lease hay dung sai lệch giờ.
- **V5-01 giữ UNVERIFIED:** cần independent design review cho thay đổi `CAPSTATUS.version`; CT-26 có interleaving commit có kiểm soát; cùng domain contract trên SQLite và DynamoDB Local ở pha kiểm chứng; emulator PASS không phải bằng chứng đủ cho AWS production; CT-26 chỉ chạy được sau G1 → đánh dấu **post-G1 implementation verification gate**, không tuyên bố PASS trong P01. Cross-Subsystem Review phải phân loại rõ: design contradiction / accepted risk / verification pending / blocker thật.
- **Người duyệt:** User (spec #5 security decision). **Ngày:** 2026-10-24.

## ADR-064 — Kiến trúc Motion (OD6-01)

- **Quyết định (user): APPROVED** — phương án B: thư viện Motion sau **Motion Adapter do platform sở hữu**. Runtime không phụ thuộc trực tiếp API thư viện ngoài adapter; pin exact version thư viện và tương thích build; MotionHost nhận `TransitionNotice` chỉ đọc; không engine dispatch hay callback nghiệp vụ đặc quyền; Motion không điều khiển validation, navigation, submission, effect; có fallback không chuyển động; P04 đo bundle/hiệu năng thật. Không tuyên bố thư viện nhẹ hơn CSS/WAAPI khi chưa benchmark.
- **Người duyệt:** User. **Ngày:** 2026-10-24.

## ADR-065 — Preset Motion P0 (OD6-02)

- **Quyết định (user): APPROVED** — `none` (なし), `subtle` (控えめ), `guided` (ガイド付き); recipe dạng tween, không spring. Recipe có ID + version ổn định, mapping target/trigger đã duyệt, cấu hình tất định, biến thể reduced motion, không chạy code từ cấu hình Admin, không ảnh hưởng domain state. `guided` không có nghĩa auto-advance hay chọn thay khách.
- **Người duyệt:** User. **Ngày:** 2026-10-24.

## ADR-066 — Override Motion theo step (OD6-03)

- **Quyết định (user): APPROVED** — chuyển P1. P0: preset cấp form; bật/tắt theo nhóm tương tác được hỗ trợ; speed ba mức đã duyệt; preview Motion On/Off; preview reduced motion. Không per-step choreography hay timeline editor.
- **Người duyệt:** User. **Ngày:** 2026-10-24.

## ADR-067 — Tham số thấp cấp của Motion (OD6-04)

- **Quyết định (user): APPROVED AS P0 SCOPE REFINEMENT** — duration/delay/easing nằm trong recipe có version do platform kiểm soát; Business Editor không chỉnh ms, easing curve hay thuộc tính animation tùy ý; chỉ chọn preset, nhóm, speed. Traceability MOTION-01: engine/recipe vẫn hỗ trợ duration/delay/easing; UI P0 không mở tham số thấp cấp; chỉnh nâng cao chuyển P1 nếu có nhu cầu. **Không** đánh dấu requirement DONE chỉ vì đã sửa scope.
- **Người duyệt:** User. **Ngày:** 2026-10-24.
