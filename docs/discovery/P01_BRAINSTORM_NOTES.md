# P01 — Ghi chú brainstorming (nhật ký liên tục)

> Nhật ký liên tục của buổi Q&A `superpowers:brainstorming`. Ghi lại **những gì user đã xác nhận**, tách riêng khỏi các phỏng đoán của Claude.
> Đây không phải spec. Spec nằm ở `docs/superpowers/specs/`, cần user review, sau đó qua G1.
> Nhãn: **CONFIRMED (user)** = user đã nói · **ASSUMPTION (Claude)** = chưa được xác nhận · **OPEN** = còn phải hỏi.
> Theo ADR-001, không đặt chi tiết nội bộ công ty ở đây.

## Thứ tự spec (từ CURRENT_STATUS, user đã chấp nhận ở session 2)

1. Schema + workflow DSL (hiện tại)
2. Plugin contract + capability registry
3. Compiler + chiến lược bundle
4. Kiến trúc Admin
5. API / persistence / publish-rollback (local)
6. Motion

## Session 2: Answer #1 (2026-10-23)

### CONFIRMED (user)

- **Quy trình:** user muốn Q&A brainstorming đầy đủ. Không được bỏ qua.
- **As-Is (tổng quát, không phải sự cố đã đo):**
  1. PO/PM hoặc business owner đưa ra yêu cầu.
  2. Developer sửa React component, validation và business logic.
  3. Developer test để chắc các form khác không bị ảnh hưởng.
  4. Static asset được build và deploy qua quy trình S3/CloudFront hiện có.
  5. Kiểm tra hành vi sau deploy.
- **Vấn đề cần giải quyết:**
  - Phải sửa source React ngay cả với thay đổi field hoặc flow đơn giản.
  - Source dùng chung giữa các site làm coupling ngày càng tăng.
  - Component chứa logic riêng của từng site.
  - Khó đảm bảo thay đổi một site không ảnh hưởng site khác.
  - Build có thể kéo theo dependency không cần thiết.
  - Developer tốn thời gian cho việc lẽ ra chỉ là cấu hình.
  - Thêm form hoặc đổi flow không có cơ chế chuẩn, tái sử dụng được.
- **To-Be:** user có quyền Admin có thể:
  1. tạo site hoặc form, hoặc clone một form hay template có sẵn
  2. cấu hình field, section, step, validation và conditional logic
  3. chọn component và plugin từ capability registry
  4. cấu hình UI theme và Motion
  5. preview và test các branch của workflow
  6. lưu draft, validate cấu hình và yêu cầu publish
  7. để hệ thống build một static artifact riêng cho form
  8. publish lên hosting và rollback theo version
- **Ranh giới:** Admin user không viết React/TypeScript cho các capability mà platform hỗ trợ. Developer chỉ tham gia khi:
  - có component hoặc plugin mới
  - có API integration hoặc business capability mới
  - có bug của engine hoặc compiler
  - thay đổi kiến trúc platform
- **Phạm vi thiết kế:** không thiết kế chỉ cho Sports/PC. Hai form đó dùng để kiểm chứng kiến trúc, không giới hạn nó. Schema và DSL nhắm tới hàng chục site với:
  - multi-step flow và conditional branching
  - field dependency và dynamic validation
  - component dùng chung và component riêng của site
  - plugin
  - state persistence và khôi phục
  - versioning
  - API integration
  - Motion
  - static compilation và bundle tách biệt
- **Anti-goal:** không có ngôn ngữ lập trình tùy ý trong JSON, và không có JavaScript tùy ý từ cấu hình Admin.
- **Chủ đề của spec #1:**
  - Form Definition Schema
  - Workflow DSL
  - Workflow State Model
  - Conditional Rules
  - Validation Contract
  - Schema Versioning
  - Extension Points
  - Error Handling
  - Compatibility and Migration
  - Với mỗi chủ đề: trade-off, invariant, ranh giới, edge case.
- **Gate không đổi:** G1 NOT APPROVED, G9 BLOCKED, G10 BLOCKED.

### ASSUMPTION (Claude) nêu ở Answer #1 → đã giải quyết ở Answer #2

- A-01: tỷ lệ change request không cần developer là thước đo thành công. → **Xác nhận một phần:** đây là một metric quan trọng, không phải duy nhất (xem Answer #2 §5).
- A-02: đường ranh thiết kế cốt lõi của spec #1 là ranh giới giữa "cấu hình được trong Admin" và "cần developer plugin". → **Đã xác nhận** (xem Answer #2 §2).

## Session 2: Answer #2 (2026-10-23), user mục tiêu và ranh giới DSL

### CONFIRMED (user)

- Phần tóm tắt lại mục đích của platform là đúng.
- **User: business-first, developer mở rộng được.**
  - Mục tiêu dài hạn: business user, PO/PM và operator không biết code có thể tạo, cấu hình và quản lý form trong phạm vi capability được hỗ trợ.
  - Trong MVP, developer hoặc technical admin có thể làm phần cấu hình và test.
  - Admin vẫn **không** được đòi hỏi kiến thức lập trình (React, JavaScript hay JSON) chỉ vì user của MVP là developer.
- **Business tự cấu hình được (no-code):**
  - tạo hoặc clone form
  - thêm, xóa, sắp xếp lại field và section
  - multi-step workflow và conditional branching
  - field dependency
  - validation qua UI
  - dùng component và plugin có sẵn
  - theme, responsive layout và Motion preset
  - preview và test branch
  - lưu draft, xem version, yêu cầu publish
  - Use case thông thường không được cần JavaScript, JSON expression hay **raw regex**.
- **Developer mở rộng (code):**
  - field, component và plugin mới
  - integration mới
  - business capability tùy biến
  - bảo trì engine, compiler và runtime
  - mọi thứ DSL không hỗ trợ
  - Developer đăng ký capability qua **typed contract** để Admin tái sử dụng.
  - Admin không bao giờ được upload hoặc chạy JavaScript tùy ý.
- **Nguyên tắc DSL:**
  - declarative
  - condition operator hữu hạn, có kiểu
  - rule kết hợp được
  - data dependency tường minh
  - evaluation tất định (deterministic)
  - transition được định nghĩa rõ
  - schema validation
  - phân tích tĩnh trước publish
  - config có version
  - tương thích ngược
- **Quy tắc escalation:** khi DSL không diễn đạt được một yêu cầu, quyết định giữa thêm một declarative capability và build một developer plugin. Không bao giờ thêm operator hay expression không giới hạn chỉ để xử lý một edge case.
- **Admin UX:**
  - Một Visual Form Builder thực sự, không phải JSON editor có drag-and-drop phủ bên trên. Gồm:
    - palette, canvas và inspector
    - visual rule editor và workflow graph/step editor
    - bộ chọn Motion preset
    - live preview
    - thông báo lỗi dễ hiểu với con người
  - UI phân tầng theo độ phức tạp. Business Editor không thấy khái niệm kỹ thuật. Tùy chọn nâng cao vẫn có nhưng được phân quyền và để riêng.
- **Success metric:**
  - tỷ lệ thay đổi không cần developer
  - thời gian tạo một form
  - thời gian đổi một field hoặc flow
  - regression sau thay đổi
  - mức tái sử dụng component và plugin
  - bundle size và runtime performance
  - khả năng test các branch
  - độ chính xác của rollback
  - khả năng debug và bảo trì
  - người không biết code có hoàn thành được tác vụ hay không
  - **Chỉ đặt target dạng số khi đã có baseline và dữ liệu business.**
- **Vai trò governance:** Business Editor, Reviewer/Publisher, Developer, Platform Admin. Spec #1 không cần RBAC đầy đủ, nhưng kiến trúc **không** được giả định rằng người sửa form cũng là người publish được.
- **Phân tích của spec #1 phải bao gồm:**
  - form data model
  - field state và derived state
  - conditional evaluation
  - ngữ nghĩa transition
  - validation rule
  - tham chiếu plugin
  - tiến hóa schema
  - error handling
  - tương thích form

### ASSUMPTION (Claude): quyết định kỹ thuật, chưa được xác nhận

- T-01: Admin không bao giờ gõ regex. Kiểm tra định dạng là các named validator do developer đăng ký (ví dụ `jp-phone`, `katakana`, `postal-code-jp`), với tham số có kiểu.
- T-02: mỗi static artifact nhúng snapshot definition bất biến của nó. Một submission mang `formId` + `revision` + `schemaVersion`, và backend validate theo đúng revision đó.
- T-03: hidden field giữ giá trị trong memory (để quay lại không mất dữ liệu đã nhập), nhưng bị loại khỏi validation và khỏi payload được submit.
- T-04: text hiển thị cho người dùng localize được ngay từ đầu (mặc định `ja`), dù multi-locale là P1.
- T-05: data model biểu diễn được repeatable group (nhiều sản phẩm) ngay từ đầu, dù UI là P1, vì thêm sau sẽ phá vỡ value-path contract.

### OPEN (Answer #2)

- Q3: các form chia sẻ và tái sử dụng thành phần giữa hàng chục site như thế nào: chỉ copy bằng clone, kế thừa template trực tiếp (live), hay shared block có version được pin theo từng form. → đã trả lời ở Answer #3.

## Session 2: Answer #3 (2026-10-23), versioning cho shared block

> Phạm vi do user nêu: các quyết định này chỉ phê duyệt **nguyên tắc của spec #1**. Chúng không phê duyệt kiến trúc tổng thể hay bất kỳ phần implementation nào. G1 NOT APPROVED, G9/G10 BLOCKED. → ADR-008, ADR-009, ADR-010 (`docs/DECISIONS.md`).

### CONFIRMED (user)

- **Mô hình tái sử dụng = C: shared block có version, cộng với clone cho form mới.**
- **Không tự động lan truyền.**
  - Mỗi form tham chiếu một shared-block revision cố định, bất biến. Ví dụ: Sports → CustomerInfo v1, PC → CustomerInfo v2, Gakki → CustomerInfo v1.
  - Khi v3 ra mắt, các form đang chạy không thay đổi. Admin được thông báo và có thể xem diff và impact analysis.
  - Admin hoặc Reviewer chọn nâng cấp. Việc này tạo ra một **form draft revision mới**, chỉ publish sau khi validate, test và được duyệt.
  - Không kế thừa template trực tiếp và không nâng cấp dependency ngầm.
- **Clone:**
  - Tạo form mới từ một template hoặc form có sẵn. Form mới có lifecycle và versioning độc lập.
  - Tham chiếu shared block vẫn được pin. Sửa local không bao giờ thay đổi shared block gốc.
- **Shared block contract:**
  - block ID ổn định
  - revision ID bất biến
  - input/output contract tường minh khi cần
  - field identifier có namespace
  - validation rule có version
  - tham chiếu dependency
  - metadata về tương thích
  - theo dõi usage/dependency
- **Compiler resolve** toàn bộ dependency graph thành một **release manifest bất biến**. Artifact dùng đúng các revision đã resolve. Không có `latest` và không có wildcard dependency.
- **Bulk adoption (tính năng P1; dependency model của P0 không được cản trở nó):**
  - usage theo site
  - version lỗi thời
  - diff giữa các revision
  - các form bị ảnh hưởng
  - đề xuất bulk update
  - chạy validation và regression
  - publish theo từng form hoặc theo release group đã được duyệt
- **Cập nhật bảo mật:**
  - Không bao giờ âm thầm, kể cả với bản sửa lỗi bảo mật.
  - Một block revision có thể được đánh dấu vulnerable hoặc deprecated, và việc publish revision không an toàn bị chặn.
  - Nâng cấp khẩn cấp và rollback đi qua quy trình có kiểm soát. Một bản patch không bao giờ được thay đổi 30 form production mà không qua validation và release governance.
- **T-01 APPROVED:** named validator nằm trong developer registry. Admin chọn validator và đặt các tham số được phép.
- **T-02 APPROVED WITH SECURITY REQUIREMENT:**
  - Published revision là bất biến.
  - Một submission được gắn với `formId` + `revision` + `schemaVersion`.
  - Backend kiểm tra revision với một **authoritative registry** và không tin metadata do client khai báo.
  - Không có server secret trong runtime.
- **T-03 APPROVED WITH ADJUSTMENTS:**
  - Hidden field chỉ giữ giá trị trong interaction session hiện tại, để có thể khôi phục nếu nó xuất hiện lại. Khi đang hidden thì không validate và không submit.
  - Cần policy cho dữ liệu nhạy cảm, draft được persist và revalidation ở backend.
  - Hidden field phía client không bao giờ là nguồn dữ liệu đáng tin.
- **T-04 APPROVED:** locale mặc định là `ja`. Schema hỗ trợ localization với quy tắc fallback và thiếu bản dịch tường minh.
- **T-05 APPROVED:**
  - Data model hỗ trợ repeatable group ngay từ đầu, với identity ổn định cho từng item và cách định địa chỉ field lồng nhau.
  - UI của repeatable group là P1. P0 không cần runtime UI đầy đủ.
- **Sáu entity riêng biệt**, mỗi entity có ownership, version lifecycle và quy tắc tương thích riêng:
  1. Form Template
  2. Shared Form Block
  3. Form Definition
  4. Published Form Revision
  5. Code Plugin / Capability
  6. Release Manifest
  - Shared block không được biến thành một cơ chế kế thừa mới, phức tạp.
- **Còn phải làm rõ trong spec #1:**
  - field addressing và namespace
  - ngữ nghĩa transition
  - conditional evaluation
  - hành vi của hidden field
  - thời điểm validation
  - data model của repeatable group
  - resolve shared block
  - tương thích revision

### ASSUMPTION (Claude): mới, chưa được xác nhận

- T-06: Form Template là một published form revision được gắn cờ "template". Nó chỉ là nguồn để clone và không giữ liên kết trực tiếp. Bản clone ghi `clonedFrom` chỉ để audit.
- T-07: namespace của field lấy từ **block instance alias** trong form, không lấy từ block ID, để cùng một block có thể xuất hiện hai lần (ví dụ hai địa chỉ).
- T-08: ở P0, shared block không được chứa shared block khác (độ sâu 1). Điều này tránh một cây kế thừa mới. Lồng nhau sẽ cần ADR mới.

### OPEN (Answer #3)

- Q4: khôi phục state của end-user. → đã trả lời ở Answer #4.

## Session 2: Answer #4 (2026-10-23), lifecycle của entity và khôi phục draft

> Phạm vi phê duyệt: chỉ nguyên tắc của spec #1 (ADR-011, ADR-012). G1 NOT APPROVED.

### CONFIRMED (user)

- Đồng ý với mô hình 6 entity.
- **T-06 APPROVED WITH ADJUSTMENTS:**
  - Form Template có thể được tạo từ một published revision bất biến.
  - Template có identity và metadata riêng: `templateId`, `templateVersion`, `sourceRevision`, ownership.
  - Clone tạo ra một Form Definition độc lập. Không có kế thừa trực tiếp.
  - P0 không cần Template Management đầy đủ.
- **T-07 APPROVED WITH ADJUSTMENTS:**
  - Addressing dùng **block instance identifier ổn định**, không bao giờ dùng display name. Cùng một block có thể xuất hiện nhiều lần trong một form.
  - Yêu cầu:
    - identity là duy nhất trong form
    - tham chiếu ổn định cho condition và validation
    - đổi label không bao giờ làm đổi identity
    - path có cấu trúc cho dữ liệu lồng nhau và repeatable
    - identity ổn định cho item trong repeatable group
    - phát hiện xung đột và tham chiếu không hợp lệ ở compile time
  - Claude phải đề xuất cách xử lý cụ thể cho việc đổi tên technical alias và migrate field path.
- **T-08 APPROVED FOR P0:**
  - Composition shared block một cấp. Một block không được chứa block khác.
  - Composition block tách biệt với dữ liệu lồng nhau và repeatable group. Data model vẫn phải hỗ trợ giá trị lồng nhau.
- **Q4: Progressive Draft Recovery, ưu tiên quyền riêng tư.** Mục tiêu: khách hàng không phải gõ lại cả form sau khi lỡ reload hoặc đóng tab.
  - **Reload:**
    - Khôi phục `formId` và revision đã dùng.
    - Khôi phục step hiện tại nếu nó vẫn hợp lệ.
    - Khôi phục các field được phép persist.
    - Đánh giá lại condition và validation.
    - Không bao giờ tin browser state đã serialize.
  - **Đóng rồi mở lại** (cùng browser):
    - Nếu có draft chưa hết hạn, đưa ra lựa chọn Tiếp tục hoặc Làm lại từ đầu.
    - Không bao giờ âm thầm thay form đang nhập bằng một draft khác.
    - Khôi phục cơ bản không cần login.
    - Không đảm bảo khôi phục nếu storage bị xóa hoặc bị chặn.
  - **Dữ liệu nhạy cảm:**
    - Ở P0, không lưu PII lâu dài trong localStorage, sessionStorage hay IndexedDB.
    - Tên, số điện thoại, địa chỉ chi tiết và file upload mặc định chỉ nằm trong runtime memory.
    - Nếu reload làm mất PII, UI giải thích điều này và cho khách hàng nhập lại.
    - Field definition mang metadata **data classification + persistence policy**. Platform kiểm soát các metadata này, và Business Editor không thể nới lỏng hạn chế về PII.
  - **Tương thích revision:**
    - Draft được gắn với đúng `formId`, published revision, `schemaVersion` và identity/version của config liên quan.
    - Không bao giờ âm thầm migrate draft sang revision mới.
    - Nếu revision cũ vẫn được hỗ trợ, tiếp tục dùng nó.
    - Nếu không, hiển thị hướng dẫn bắt đầu lại hoặc dùng một migration đã được kiểm chứng. Không bao giờ map field bằng cách đoán.
  - **Lifecycle:**
    - TTL tường minh
    - lưu theo debounce hoặc checkpoint
    - vẫn nhập được khi storage không khả dụng
    - chỉ xóa sau khi backend xác nhận submit thành công
    - giữ draft khi submit thất bại
    - hidden field tuân theo T-03
    - backend luôn revalidate theo authoritative revision
  - **Tương lai (P1):** draft phía server và resume trên nhiều thiết bị, nếu business cần. Chúng đòi hỏi authN/xác minh, bảo vệ dữ liệu, retention và phân quyền khôi phục.
  - **Kiến trúc:**
    - Draft persistence không gắn chặt với Workflow Engine. Nó nằm sau abstraction riêng (`DraftPersistenceAdapter` hoặc tương đương).
    - Engine chạy hoàn toàn trong memory khi persistence tắt hoặc không khả dụng.
    - localStorage không bao giờ là form state authoritative.
    - Spec cần nêu rõ trade-off và invariant. Chưa cần chi tiết implementation đầy đủ.

### PROPOSAL v1 (Claude): addressing và rename, trình bày ở session 2 → được thay thế bởi v2 (Answer #5)

- P-01: ba lớp identity cho mỗi node:
  - `id`: opaque, bất biến, không bao giờ hiển thị cho Business Editor. Mọi tham chiếu nội bộ đều dùng nó.
  - `key`: alias kỹ thuật, dùng trong submission payload và data contract. Chỉ hiển thị trong Advanced.
  - `label`: text hiển thị đã được bản địa hóa.
- P-02: một tham chiếu nội bộ có dạng `instanceId/fieldId`. Đường dẫn dữ liệu bên ngoài = `alias.key`, với item lặp lại có dạng `group[itemId]`.
- P-03: chính sách rename key:
  - Tự do khi form chưa từng được publish.
  - Sau khi publish, một lần rename được ghi thành `renamedFrom` trong revision kế tiếp, cần quyền nâng cao và hiển thị mức ảnh hưởng.
  - Submission của revision cũ giữ key cũ vì mỗi submission được validate theo đúng revision của nó.
- P-04: `id` của field giữ ổn định qua các block revision. Một block revision khai báo các thay đổi của nó (thêm, xóa, rename, đổi type). Khi nâng cấp một form, mọi tham chiếu được kiểm tra lại và publish bị chặn nếu có tham chiếu treo (dangling ref) hoặc operator không tương thích.
- P-05: migration `schemaVersion` là code developer có tính tất định, kèm fixture. Nó áp dụng cho draft và definition trong storage của Admin. Published revision không bao giờ bị ghi lại; chúng vẫn đọc được qua các reader có version.
- P-06: bên trong một repeatable group, rule dùng scope `$item` cho các field anh em trong cùng item. Điều kiện giữa các item chỉ dùng một tập aggregate hữu hạn (`any`, `all`, `count`).

### OPEN (Answer #4)

- Q5: derived value. → đã trả lời ở Answer #5.

## Session 2: Answer #5 (2026-10-23), review addressing và derived state

### CONFIRMED (user)

- Hướng tổng thể của P-01..P-06 được đồng ý nhưng **chưa được phê duyệt chính thức**. Proposal v2 bên dưới phải bao quát các điểm A1..A8 của user.
- **Derived state: quyết định sơ bộ.**
  - Builder **cần** giá trị được tính toán hoặc tự điền từ field khác, chia thành ba loại riêng biệt:
    1. `calculated`: tính toán nội bộ với các phép toán có giới hạn (đếm, cộng tổng, nối chuỗi, so sánh).
    2. `prefill/default`: điền giá trị theo một policy tường minh về việc khách hàng có được sửa hay không và giá trị có thể bị ghi đè hay không.
    3. `external lookup`: một API hoặc plugin lấy dữ liệu, ví dụ địa chỉ từ mã bưu điện.
  - Business logic phức tạp như ước tính giá thu mua thuộc về plugin hoặc backend. Không bao giờ đặt công thức tùy ý trong DSL.
- **Yêu cầu bắt buộc:**
  - Business Editor cấu hình toàn bộ logic qua UI trực quan, không code và không biểu thức DSL.
  - Derived value có dependency tracking, phát hiện vòng lặp (cycle), đánh giá tất định và xử lý lỗi rõ ràng.
  - Không bao giờ tin kết quả phía client đối với dữ liệu nghiệp vụ quan trọng. Backend validate hoặc tính lại.
  - Áp dụng ADR-012: không lưu PII lâu dài trong trình duyệt cho prefill hay derived state.
  - Phải tường minh giá trị tính toán nào được submit và giá trị nào chỉ để hiển thị.
  - P0 không được phình thành một ngôn ngữ lập trình đa dụng.

### PROPOSAL v2 (Claude): identity, path, rename, migration. Chờ review, NOT approved

**R-01 Các lớp identity (A1)**
- `fieldDefId`: identity của một field definition. Nó nằm trong một block (ổn định qua các revision của block đó) hoặc trong section cục bộ của form.
- `blockInstanceId`: identity của một lần đặt một block vào một form.
- **Identity của field trong form** = tuple (`blockInstanceId`, `fieldDefId`), viết dạng chuẩn là `inst_9q1m:fld_zip`.
  - Field cục bộ của form dùng instance dành riêng `$local`.
  - Hai instance của cùng một block cho ra các tuple khác nhau, nên không bao giờ xung đột.
- Option có mã `value` ổn định riêng, tách biệt khỏi label đã bản địa hóa. Đổi tên label của option không bao giờ làm thay đổi dữ liệu.

**R-02 Tính bất biến và thay đổi ngữ nghĩa (A2)**
- Một `id` không bao giờ thay đổi trong suốt vòng đời của entity. Mọi chỉnh sửa được phân loại tại thời điểm compile:
  - **compatible**: label, help text, layout, thêm option, điều chỉnh tham số validation. Giữ nguyên id.
  - **contract-change**: xóa option value, rename key, đổi required/optional, đổi classification. Giữ nguyên id, thay đổi được liệt kê trong diff của data contract, và cần reviewer xác nhận (acknowledgement) trước khi publish.
  - **breaking**: đổi value type (text→number, single→multi), đổi ý nghĩa hoặc đơn vị của option. **Cấm sửa tại chỗ.** Admin cung cấp "replace field", tạo một `fieldDefId` mới, cho field cũ nghỉ hưu (retire), và để compiler hiển thị điểm phá vỡ contract. P0 không có chuyển đổi giá trị tự động giữa field cũ và field mới.

**R-03 Tham chiếu nội bộ vs payload đã serialize (A3)**
- Tham chiếu trong **definition** không chứa item id:
  - `inst_9q1m:fld_zip`
  - bên trong một repeatable group, `$item:fld_maker` tương đối với item hiện tại
  - với group xem như một collection, `inst_items:grp_products`
- **Địa chỉ runtime:** `inst_items:grp_products[itm_x3]/fld_maker`. Runtime state lưu các item của group dạng `{ order: [itemId…], items: { itemId → values } }`. Thứ tự được tách riêng khỏi identity.
- **Submit payload** được key theo `alias.key`. Một group là một **mảng object có thứ tự**, và mỗi object mang `_itemId`. Thứ tự mảng = thứ tự hiển thị. Ví dụ:
  ```json
  {
    "formId": "pc-demo",
    "revision": 7,
    "schemaVersion": "1.0",
    "values": {
      "customer": { "phone": "…" },
      "products": [
        { "_itemId": "itm_x3", "maker": "…" },
        { "_itemId": "itm_b7", "maker": "…" }
      ]
    }
  }
  ```
- `itemId`:
  - được sinh ngẫu nhiên phía client
  - duy nhất trong group của nó trong suốt session
  - backend chỉ kiểm tra định dạng và tính duy nhất, và coi nó là opaque
- **Customer draft** (ADR-012) được key theo identity nội bộ, vì nó gắn với đúng revision. Các field PII bị loại trừ.

**R-04 Key/alias ledger (A4)**
- Mỗi form có một **key ledger** chỉ ghi thêm (append-only) trải dài qua các revision. Với mỗi field identity và block instance, nó ghi lại key nào được dùng trong khoảng revision nào. Ví dụ: `tel` r1–r3 → `phone` r4–r6 → `mobile` r7–.
- Quy tắc:
  1. Có thể rename nối tiếp bao nhiêu lần cũng được. Ledger phân giải mọi key lịch sử về identity của nó.
  2. Một key đã xuất hiện trong bất kỳ published revision nào được **dành riêng vĩnh viễn cho identity đó**. Không thể gán nó cho identity khác, điều này ngăn analytics và integration trộn lẫn hai ý nghĩa. Identity đó được phép quay lại key cũ của chính nó.
  3. Mỗi release xuất ra một **data contract** (key → identity, type, classification, `renamedFrom`). Integration và analytics nên map theo identity hoặc qua ledger, không bao giờ chỉ theo key.
- Alias của block instance tuân theo cùng các quy tắc ledger.

**R-05 Pinning (A5)**
- Một Published Form Revision pin:
  - revision của chính nó
  - chính xác từng block revision (`customer-info@r2`)
  - mọi version của plugin và validator
- Release manifest bổ sung content hash.
- Nâng cấp block chỉ tạo một **draft mới**. Published revision không bao giờ bị động đến.

**R-06 Kiểm tra của compiler (A6).** Tất cả là lỗi chặn (blocking error) trừ khi được đánh dấu warning.
- **Xung đột (collision):**
  - trùng `id`
  - trùng alias của instance
  - trùng key giữa các phần tử anh em trong namespace của payload
  - một identity khác dùng lại key đã được ledger dành riêng
- **Tham chiếu treo (dangling reference):** field, instance, option value, plugin, validator hoặc block revision đã bị xóa.
- **Type không tương thích:**
  - operator vs type của field
  - aggregate trên thứ không phải collection
  - type đầu ra của derived vs nơi tiêu thụ
  - tham chiếu `$item` nằm ngoài group
- **Thay đổi data contract:** diff so với data contract của published revision trước, phân loại theo R-02. Các mục contract-change cần reviewer xác nhận. Các mục breaking bị cấm sửa tại chỗ.
- **Graph:** vòng lặp giữa các dependency về visibility, requirement, derived và prefill. Lỗi hiển thị đường đi của vòng lặp bằng label.
- **Supply:** ref dạng wildcard hoặc không pin; block revision có lỗ hổng hoặc deprecated (block có lỗ hổng chặn publish, deprecated thì warning).

**R-07 Migration (A7)**
- Phạm vi: **chỉ Admin draft**. Không bao giờ áp dụng cho published revision, customer draft hay dữ liệu đã submit.
- Luồng:
  1. Một lần chạy thử (dry run) tạo ra bản sao đã migrate cùng một diff dễ đọc (preview).
  2. Một user xác nhận.
  3. Kết quả được lưu thành một draft version mới qua optimistic concurrency. Draft version trước đó vẫn lấy lại được.
  4. Bất kỳ lỗi nào cũng để nguyên draft (atomic).
- Idempotent: một migration được key theo (từ → đến `schemaVersion`). Fixture khẳng định `migrate(migrate(x)) == migrate(x)`, và chạy nó trên một document đã migrate là no-op.

**R-08 Aggregate trên collection (A8)**
- Collection rỗng: `any([]) = false`, `all([]) = true` (vacuous truth), `count([]) = 0`, `sum([]) = 0`.
- Vì `all` trên một group rỗng gây bất ngờ cho người không viết code:
  - Rule editor hiển thị "(cũng đúng khi không có item nào)".
  - Compiler **warning** khi `all` được dùng trên một group có `minItems` bằng 0.
- Aggregate chỉ xét các item **đang hiển thị** và field đang hiển thị. Giá trị bị ẩn hoặc rỗng được tính là "không có giá trị".
- Phép so sánh với "không có giá trị" là `false`. Chỉ `isEmpty` / `isNotEmpty` kiểm tra tính rỗng.
- Việc kết hợp block trong P0 giữ ở độ sâu một cấp (ADR-011, T-08).

### PROPOSAL v2 (Claude): derived state. Chờ review, NOT approved

**D-01 `calculated`**
- Một derived field chỉ đọc.
- Được dựng trong một formula builder trực quan từ một **catalog operator hữu hạn**:
  - `count`, `sum`, `min`, `max`
  - `add`, `subtract`, `multiply` (không có phép chia trong P0)
  - `concat` kèm separator
  - phép so sánh → boolean
  - `choose` (một danh sách hữu hạn các cặp điều kiện → giá trị, cộng một giá trị mặc định)
- Đầu ra có type. Không có hàm do user định nghĩa, không vòng lặp, không biểu thức dạng text tự do.

**D-02 `prefill/default`**
- Nguồn:
  - một giá trị tĩnh
  - một field khác (sao chép)
  - một URL query parameter nằm trong allowlist (không bao giờ là PII, ví dụ mã campaign)
- Policy:
  - `editable` (true/false)
  - `overwrite`, nhận một trong ba giá trị:
    - `ifEmpty`: chỉ điền khi rỗng
    - `untilEdited`: tiếp tục đồng bộ cho đến khi khách hàng sửa
    - `always`: bản sao chỉ đọc (mirror)
- Ví dụ: "連絡先住所 = 集荷先住所と同じ" (địa chỉ liên hệ giống địa chỉ lấy hàng).

**D-03 `external lookup`**
- Chỉ thông qua một plugin hoặc connector capability đã đăng ký. Không có URL trong definition (ARCH-10).
- Request chỉ mang các input đã khai báo.
- Trạng thái async: `idle`, `pending`, `success`, `error`, `timeout`.
- Kết quả điền vào các field đích theo policy của D-02.
- Lỗi không bao giờ chặn việc nhập tay.
- P0 chỉ dùng mock data. Bản thân plugin mã bưu điện là P0 hay P1 sẽ được quyết định ở spec #2 (capability matrix hiện ghi P1).

**D-04 Dependency graph**
- Một graph duy nhất bao gồm visibility, requirement, lọc option, giá trị calculated và prefill.
- Vòng lặp = lỗi compile.
- Đánh giá theo thứ tự topo, với tie-break dựa trên id ổn định.
- Đánh giá lại theo kiểu incremental: chỉ các node phía hạ nguồn của input bị thay đổi mới được tính lại (ARCH-06).

**D-05 Lỗi**
- Input bị thiếu lan truyền "không có giá trị" và không phải là lỗi.
- Tràn số (overflow), hoặc lệch type tại runtime (lẽ ra không thể xảy ra sau các kiểm tra compile), đưa derived field vào trạng thái lỗi với thông báo dễ đọc. Nó không làm crash form.
- Lỗi lookup hiển thị phương án dự phòng là nhập tay.

**D-06 Submit**
- Mọi derived field khai báo `submit: include | displayOnly`.
- Với `include`:
  - Backend **tính lại** các giá trị `calculated` từ input đã submit với cùng definition. Giá trị của backend là chuẩn (authoritative). Sai lệch được ghi log mà không có PII.
  - Giá trị được điền bởi lookup được validate như input của khách hàng.
- Giá trị `displayOnly` không bao giờ được gửi đi.
- Evaluator FE và BE dùng chung một bộ conformance fixture.

**D-07 Classification taint**
- Một giá trị derived hoặc prefill kế thừa **classification cao nhất trong các input của nó**. Giá trị dẫn xuất từ PII là PII, nên không bao giờ được lưu lâu dài trong trình duyệt (ADR-012).
- Compiler tính toán taint.

### Edge case (spec #1, tính đến hiện tại)

- EC-01: cùng một block được dùng hai lần, và một rule trong instance A tham chiếu một field trong instance B → tham chiếu chéo instance tường minh; được phép, có kiểm tra.
- EC-02: một key được rename `tel`→`phone`→`tel` → được phép (cùng identity); ledger hiển thị cả hai khoảng.
- EC-03: một field mới cố lấy key đã nghỉ hưu `tel` → bị chặn (đã dành riêng).
- EC-04: type của field đổi text→number → chặn sửa tại chỗ; đề xuất "replace field".
- EC-05: một option value bị xóa trong khi một published rule hoặc submission cũ đang dùng nó → contract-change; cần reviewer xác nhận; revision cũ không bị ảnh hưởng.
- EC-06: một block được nâng cấp r1→r2 và r2 xóa một field mà rule của form tham chiếu → dangling reference; chặn publish.
- EC-07: `all` trên group rỗng → true, kèm warning khi compile nếu `minItems` = 0.
- EC-08: một repeatable item bị xóa giữa chừng khi điền form → id của nó không bao giờ được dùng lại trong session, và aggregate được tính lại.
- EC-09: các item được sắp xếp lại → identity không đổi và chỉ thứ tự mảng trong payload thay đổi.
- EC-10: một giá trị calculated phụ thuộc vào một field bị ẩn → input bị ẩn được tính là "không có giá trị".
- EC-11: prefill `untilEdited` → sau khi khách hàng sửa, việc nguồn thay đổi không ghi đè nữa.
- EC-12: lookup mã bưu điện bị timeout → vẫn nhập tay được, không có lỗi chặn.
- EC-13: vòng lặp giữa visibility của A, B dạng calculated và requirement của A → lỗi compile hiển thị đường đi.
- EC-14: client gửi một giá trị calculated đã bị sửa đổi → backend tính lại và ghi log sai lệch.
- EC-15: một giá trị dẫn xuất từ PII sắp được lưu vào draft → bị loại trừ nhờ taint.
- EC-16: một migration chạy hai lần hoặc lỗi giữa chừng → no-op / draft không đổi.

### Acceptance criteria (spec #1, tính đến hiện tại). Sẽ trở thành test sau G1.

- AC-01: hai instance của một block compile không có xung đột identity, và rule có thể tham chiếu từng instance một cách rõ ràng.
- AC-02: rename label hoặc key không bao giờ làm thay đổi kết quả đánh giá rule.
- AC-03: key ledger từ chối việc dùng lại key đã dành riêng và phân giải mọi key lịch sử về identity của nó.
- AC-04: compiler chặn publish khi có collision, dangling reference, type không tương thích, breaking change và vòng lặp, và mỗi lỗi nêu tên các phần tử bằng label.
- AC-05: diff data contract giữa hai revision liệt kê mọi contract change. Publish cần reviewer xác nhận.
- AC-06: một published revision giống hệt từng byte trước và sau khi tạo draft nâng cấp block.
- AC-07: fixture migration schema đạt tính idempotent (`migrate∘migrate = migrate`), và một migration lỗi để nguyên draft.
- AC-08: ngữ nghĩa aggregate trên group rỗng, bị ẩn và được điền một phần khớp với R-08 ở **cả** evaluator FE và BE (fixture dùng chung).
- AC-09: một giá trị `calculated` có `submit: include` được backend tính lại, và giá trị client đã bị sửa đổi không được lưu như giá trị chuẩn.
- AC-10: không có PII hay giá trị dẫn xuất từ PII xuất hiện trong browser storage sau bất kỳ tương tác nào (một test kiểm tra storage).
- AC-11: lỗi hoặc timeout của lookup không bao giờ ngăn việc hoàn thành form bằng nhập tay.

### OPEN (Answer #5)

- Q6: thay đổi branch. → đã trả lời ở Answer #6.

## Session 2: Answer #6 (2026-10-23), đổi branch và ngữ nghĩa activity

### CONFIRMED (user): sơ bộ, chưa được duyệt → ADR-014 PROPOSED

1. Khi một branch trở thành inactive, dữ liệu đã nhập của nó mặc định được giữ **trong bộ nhớ cho form session hiện tại**.
2. Field và step inactive không tham gia validation, tính toán effective, hay submit payload.
3. Quay lại branch cũ thì khôi phục dữ liệu, nhưng các dependency phải được **revalidate và tính lại**.
4. Mặc định, reload hoặc đóng tab không lưu dữ liệu của inactive branch (ADR-012).
5. Một `clearOnDeactivate` cấu hình được dùng cho dữ liệu không bao giờ được khôi phục: OTP, security token, dữ liệu xác thực nhạy cảm, hoặc dữ liệu bị business rule làm mất hiệu lực.
6. Khi một dependency thay đổi, phải quyết định giá trị cũ còn hợp lệ hay phải reset hoặc fetch lại. **Không bao giờ dùng kết quả async đã cũ (stale).**
7. Backend validate **active branch** theo đúng published revision. Backend không bao giờ chấp nhận dữ liệu của inactive branch chỉ vì client đã gửi lên.
8. Một policy nhất quán áp dụng cho field visibility, conditional step và điều hướng branch.
- **Ví dụ chấp nhận của user:**
  - UA-1: 宅配 → 店頭 → 宅配 khôi phục 梱包キット và ngày nhận hàng nếu chúng vẫn còn hợp lệ.
  - UA-2: 宅配 → 店頭 → Submit không gửi dữ liệu chỉ thuộc 宅配.
  - UA-3: đổi branch sau khi nhập dữ liệu không bao giờ vô tình làm mất dữ liệu hợp lệ.
  - UA-4: khi một dependency thay đổi, giá trị derived và giá trị lookup được kiểm tra lại.
  - UA-5: field có `clearOnDeactivate` không được khôi phục khi quay lại.
  - UA-6: reload không bao giờ khôi phục dữ liệu nhạy cảm hoặc dữ liệu inactive branch từ browser storage.
- **Yêu cầu:** một đề xuất chi tiết về ngữ nghĩa điều hướng, phân biệt `hidden`, `inactive`, `unreachable`, `disabled` và `cleared`. Không mở rộng phạm vi P0.

### PROPOSAL v1 (Claude): ngữ nghĩa điều hướng và activity. Chờ review, NOT approved

**N-01 Từ vựng: năm thuật ngữ ở ba cấp độ khác nhau**

| Thuật ngữ | Cấp độ | Định nghĩa | Giữ giá trị trong bộ nhớ | Render | Validate | Dùng trong tính toán | Submit | Lưu vào draft |
|---|---|---|---|---|---|---|---|---|
| `hidden` | **nguyên nhân** runtime | visibility rule của chính node (hoặc của section chứa nó) là false, trong khi step của nó nằm trên active path | có (trừ khi `clearOnDeactivate`) | không | không | coi là "không có giá trị" | không | không |
| `inactive` | **trạng thái** runtime (bao trùm) | node không tham gia, vì nó bị hidden, vì một ancestor inactive, hoặc vì step của nó nằm ngoài active path | có (trừ khi `clearOnDeactivate`) | không | không | coi là "không có giá trị" | không | không |
| `disabled` | **trạng thái** runtime | node **active** nhưng khách hàng không sửa được (calculated, `always` mirror, bị khóa khi lookup đang chạy) | có | có, với ngữ nghĩa read-only (`aria-readonly`, focus được, screen reader đọc được) | có | có | nếu `submit: include` | theo phân loại (ADR-012) |
| `unreachable` | thuộc tính **compile-time** | không có path nào từ điểm bắt đầu tới step, hoặc một điều kiện visibility luôn là false | n/a | n/a | n/a | n/a | n/a | n/a |
| `cleared` | **sự kiện** | giá trị bị xóa khỏi bộ nhớ và không thể khôi phục | → không | — | — | — | — | bị xóa |

- Một step `unreachable` chặn publish. Một field không bao giờ có thể visible là compile warning.
- `cleared` được kích hoạt bởi:
  - `clearOnDeactivate` + trở thành inactive
  - dependency bị vô hiệu theo policy "reset" (N-06)
  - Start Over
  - submit đã được backend xác nhận
  - kết thúc session

**N-02 Một hàm activity duy nhất (điểm 8 của user)**
- `active(node) = onActivePath(step(node)) ∧ visible(node) ∧ active(parent(node))`
- Được dùng giống hệt nhau ở runtime, Admin preview và backend validator (qua các conformance fixture dùng chung).
- "Conditional step" trong Admin UI ("bỏ qua step này khi…") chỉ là **sugar**. Compiler hạ nó thành các cạnh của graph, nên graph là nguồn duy nhất quyết định step activity.

**N-03 Step graph và path**
- Step là node. Mỗi step không phải terminal có một danh sách transition **có thứ tự** `condition → target`. **Match đầu tiên thắng**, và bắt buộc có target `default`, nên routing luôn toàn phần và tất định.
- Terminal step được khai báo tường minh. PC có một completion cho mỗi branch.
- **P0: step graph phải là DAG.** "Thêm sản phẩm khác" thuộc về repeatable group, không phải vòng lặp trong graph. Nhờ vậy các kiểm tra sau trở nên đơn giản và đảm bảo kết thúc (ARCH-05):
  - reachability
  - khả năng tới terminal
  - dead end
  - độ phủ branch
- Cho phép vòng lặp về sau sẽ cần một ADR.
- Trạng thái của step:
  - `visited`: nằm trên path, trước step hiện tại
  - `current`
  - `pending`: chưa xác định
  - `offPath`: từng nằm trên path, nhưng path đã đổi
- Field trên step `pending` chưa được validate và chưa được submit. Tại thời điểm submit, path đã hoàn chỉnh.

**N-04 Next / Back / nhảy step**
- **Next:**
  1. Validate mọi field active của step hiện tại.
  2. Nếu có lỗi, ở lại và focus vào lỗi đầu tiên.
  3. Nếu không, đánh giá các transition và push target vào history.
- **Back:**
  - Pop history, đi theo path khách hàng thực sự đã đi, không đi ngược cạnh của graph.
  - **Không validate khi Back.** Input không hợp lệ vẫn được giữ.
- **Sau khi một câu trả lời trước đó thay đổi:** forward path được tính lại ở lần Next kế tiếp. History phía sau step hiện tại bị cắt bỏ, và các step không còn trên path trở thành `offPath` (inactive, giá trị được giữ theo N-01).
- **Sửa từ màn xác nhận (確認):**
  - "修正する" nhảy tới step đó. Sau khi sửa, Next đánh giá lại routing.
  - Nếu path không đổi và mọi step ở giữa vẫn hợp lệ, khách hàng có thể quay thẳng về màn xác nhận.
  - Nếu path đã đổi, khách hàng phải đi qua các step mới.
- **Back/forward của browser và URL:**
  - Mỗi lần đổi step đều ghi history state, nên Back của browser = Back.
  - Một step trong URL (deep link hoặc bị sửa tay) chỉ được chấp nhận nếu nằm trên một path hợp lệ có thể dựng lại từ các giá trị hiện tại. Nếu không, khách hàng được đưa tới step hợp lệ xa nhất (khớp với reload của ADR-012).

**N-05 Submit**
1. Validate mọi field active trên toàn bộ active path.
2. Gửi payload, chỉ gồm các giá trị active (key theo R-03).
3. Backend **dựng lại active path** từ các giá trị được submit với cùng published revision (N-02). Backend từ chối request với `422 INACTIVE_DATA_PRESENT` nếu có field inactive (strict, không âm thầm loại bỏ), và validate mọi thứ còn lại.
4. Nếu thất bại, ở lại màn xác nhận, giữ state trong bộ nhớ và draft, và cho phép retry. Chi tiết idempotency nằm ở spec #5.

**N-06 Vô hiệu hóa theo dependency (điểm 6 của user)**
- Mỗi giá trị mang một **provenance**: `user`, `prefill`, `lookup` hoặc `calculated`.
- **Calculated:** luôn được tính lại đồng bộ, không bao giờ stale.
- **Giá trị phụ thuộc option** (option đã chọn không còn trong tập option đã lọc):
  - Giá trị được giữ lại, nhưng **effective value = "không có giá trị"**.
  - Nếu option xuất hiện lại (ví dụ 釣具 → ゴルフ → 釣具), giá trị lại có hiệu lực và được revalidate.
- **Lookup:**
  - Mỗi request được gắn một **input fingerprint** và một số thứ tự. Response chỉ được áp dụng nếu fingerprint của nó bằng với input hiện tại và nó là response mới nhất. Response stale bị bỏ.
  - Khi input thay đổi:
    - các giá trị do lookup điền mà khách hàng chưa sửa được fetch lại theo policy D-02
    - các giá trị khách hàng đã sửa được giữ và hiển thị kèm gợi ý "có thể đã cũ"
  - Lookup đang pending không bao giờ chặn Next. Kết quả về sau khi khách hàng đã đi tiếp vẫn chỉ được áp dụng nếu fingerprint khớp và field chưa bị sửa.
- **Policy theo từng field** (developer hoặc Platform Admin có thể đặt; Business Editor chỉ chọn từ các preset an toàn):
  - `onDependencyChange: keep | revalidate | reset`
  - Mặc định là `revalidate`.
  - `reset` = `cleared`.

**N-07 Khôi phục khi quay lại (UA-1, UA-3, UA-5)**
- Node chuyển từ inactive sang active sẽ khôi phục giá trị trong bộ nhớ của nó. Sau đó các dependency của nó được đánh giá lại (N-06) và giá trị được revalidate. Lỗi được giữ im lặng cho tới lần Next kế tiếp (xem Q7).
- Node có `clearOnDeactivate` quay lại ở trạng thái trống.
- Mặc định phân loại cho `clearOnDeactivate`:
  - bắt buộc **bật** cho `secret` (OTP, token)
  - tùy chọn cho dữ liệu bị business làm mất hiệu lực
  - Business Editor không thể tắt nó cho `secret`

**N-08 Reload (UA-6)**
- Chỉ các giá trị được phép `persist` của node **active** mới được lưu vào draft. Giá trị inactive và PII không bao giờ được ghi.
- Khi khôi phục:
  1. Chạy lại hàm activity.
  2. Dựng lại path.
  3. Tiếp tục tại step hợp lệ xa nhất.

### Edge case (bổ sung)

- EC-17: 宅配 → 店頭 → 宅配 → giá trị được khôi phục, revalidate, lookup được kiểm tra lại (UA-1).
- EC-18: 宅配 → 店頭 → submit → payload không có key chỉ thuộc 宅配. Payload bị sửa để thêm các key đó nhận 422 (UA-2, điểm 7).
- EC-19: đổi category làm sub-option đã chọn bị lọc mất → effective "không có giá trị". Đổi lại thì được khôi phục.
- EC-20: response lookup mã bưu điện về sau khi mã bưu điện đã đổi → bị bỏ (fingerprint không khớp).
- EC-21: một field OTP (`secret`) trên một branch bị rời đi rồi vào lại → trống (UA-5).
- EC-22: tham số step trong URL trỏ tới step chưa tới hoặc offPath → redirect tới step hợp lệ xa nhất.
- EC-23: ở màn xác nhận, sửa một câu trả lời trước đó làm đổi branch → khách hàng phải đi qua các step của branch mới trước khi tới màn xác nhận.
- EC-24: Back từ một step có input không hợp lệ → được phép, và input được giữ.
- EC-25: sugar "bỏ qua step khi…" của Admin và một branch tường minh cho ra cùng kết quả activity (tương đương khi hạ cấp).

### Tiêu chí chấp nhận (bổ sung)

- AC-12: các ví dụ của user UA-1..UA-6 pass dưới dạng test tự động trên cả runtime lẫn static artifact được sinh ra.
- AC-13: hàm activity cho kết quả giống hệt nhau ở FE runtime, preview và BE validator trên các fixture dùng chung.
- AC-14: compiler từ chối chu trình trong step graph, step unreachable, thiếu transition `default` và dead end không phải terminal.
- AC-15: không bao giờ áp dụng kết quả lookup stale (test với mock response trả về sai thứ tự).
- AC-16: Back và Forward của browser nhất quán với Back trong app và history của path.

### OPEN (Answer #6)

- Q7: thời điểm validation. → đã trả lời ở Answer #7.

## Session 2: Answer #7 (2026-10-23), bổ sung điều hướng và UX validation

### CONFIRMED (user)

- N-01..N-08 được đồng ý về nguyên tắc. **ADR-014 vẫn PROPOSED.**
- **Các bổ sung điều hướng được yêu cầu (A1..A5):**
  - A1: tách riêng `readOnly`, `pending/loading` và `inactive`. Không gộp chúng vào `disabled`.
  - A2: deep link tới một step hợp lệ không được bỏ qua các step bắt buộc chưa hoàn thành.
  - A3: `unreachable` chỉ chặn publish khi điều đó **chắc chắn tại compile time**. Một step bị bỏ qua hợp lệ bởi điều kiện runtime không phải là unreachable.
  - A4: rời 確認 để sửa sẽ revalidate và tính lại mọi dependency bị ảnh hưởng.
  - A5: lookup async đang pending cần policy tường minh cho chuyển step, timeout, retry và kết quả về muộn.
- **Answer #7: UX validation (đã xác nhận):**
  - **Field text:**
    - Validate khi blur, sau khi field đã được tương tác.
    - Không báo lỗi ở lần gõ phím đầu tiên.
    - Khi field đã hiện lỗi, cập nhật hoặc xóa lỗi **ngay lập tức** khi khách hàng sửa, không chờ lần blur tiếp theo.
  - **Radio, select, checkbox:** cập nhật rule liên quan và validation ngay khi thay đổi.
  - **次へ:** validate mọi field active trong step. Nếu có field không hợp lệ, ở lại, hiện lỗi và focus đúng chỗ.
  - **戻る:** không validate, không chặn, và giữ input kể cả khi không hợp lệ.
  - **確認 / Submit:** kiểm tra lại toàn bộ dữ liệu active. Backend là thẩm quyền cuối cùng.
  - **Field inactive:** không bao giờ hiện lỗi và không bao giờ chặn điều hướng.
  - **Field được kích hoạt lại:** revalidate theo state hiện tại.
  - **IME tiếng Nhật:** không báo lỗi trong lúc composition.
  - **Validation async:** pending, timeout và retry, cộng với bảo vệ chống response stale.
  - **Message:** dễ hiểu, đúng ngôn ngữ. Không bao giờ chỉ dựa vào màu sắc.
- **Trách nhiệm của từng tầng (đã xác nhận):**
  - **DSL** quyết định validation rule, dependency và tính hợp lệ.
  - **Runtime** quyết định khi nào hiện lỗi, cùng với focus, scroll-to-error và accessibility.
  - **Backend** revalidate dữ liệu được submit theo published revision.
  - **Business Editor** cấu hình rule qua UI, không cần code.

### PROPOSAL (Claude): phụ lục điều hướng N-09..N-13. Chờ review, NOT approved

**N-09 Từ vựng trạng thái runtime (thay thế dòng `disabled` của N-01)**

| Trạng thái | Active? | Khách hàng sửa được | Validate | Submit | Ghi chú |
|---|---|---|---|---|---|
| `readOnly` | có | không, nhưng focus được và đọc được (`aria-readonly`) | có | nếu `submit: include` | `calculated`, `always` mirror. Thuộc tính DSL được đặt qua UI. |
| `pending` | có | **có** (là lớp phủ trạng thái, không phải khóa) | có; kiểm tra async đang chạy được tính là "chưa biết" | có | `aria-busy`. Áp dụng khi lookup hoặc validation async đang chạy. Chỉnh sửa của khách hàng thắng kết quả lookup về muộn (N-06). |
| `disabled` | có | không | không revalidate trong lúc khóa | có | **Khóa tương tác chỉ ở runtime**, ví dụ khi đang submit. **Không phải thuộc tính DSL trong P0.** |
| `inactive` | không | — | không | không | như ở N-01 |

**N-10 Deep link và reload (A2).** Sửa đổi N-04 và N-08.
- Một step trong URL chỉ được chấp nhận nếu mọi step **trước** nó trên active path được dựng lại đều **hoàn thành**, nghĩa là mọi field bắt buộc đang active đều có mặt và hợp lệ.
- Nếu không, khách hàng được redirect tới **step chưa hoàn thành đầu tiên** trên path, không phải "step hợp lệ xa nhất".
- Quy tắc tương tự áp dụng khi tiếp tục draft sau reload.

**N-11 `unreachable` chỉ khi chắc chắn (A3).** Các lỗi chặn:
- step không có path theo cạnh nào từ điểm bắt đầu (cấu trúc)
- transition có điều kiện **luôn false về mặt tĩnh** (một literal, hoặc điều kiện mà compiler chứng minh được là rỗng, như hai `eq` trên cùng field với literal khác nhau nối bằng `and`)
- transition bị **che khuất** bởi một điều kiện không điều kiện hoặc giống hệt đứng trước trong cùng danh sách có thứ tự

Mọi thứ phụ thuộc vào câu trả lời lúc runtime **không** phải là lỗi. Admin preview có thể cung cấp view "độ phủ branch" không chặn thay thế.

**N-12 Rời 確認 để sửa (A4)**
- Sửa một field sẽ tính lại và revalidate toàn bộ closure dependency phía sau của nó (D-04) **trên mọi step của active path**, không chỉ step đang sửa.
- Lối tắt "quay lại 確認" chỉ xuất hiện khi path không đổi **và** toàn bộ active path validate thành công sau khi tính lại.
- 確認 luôn render từ state mới nhất, không bao giờ từ bản tóm tắt đã cache.

**N-13 Policy async khi chuyển step (A5)**
- **Lookup (chỉ điền giá trị):**
  - Không bao giờ chặn 次へ.
  - Timeout: một mặc định do developer đặt trong capability contract, giới hạn bởi mức tối đa của platform. **Không bịa con số ở đây.** Chúng được đặt dựa trên đo đạc ở spec #2.
  - Retry: **0 lần retry tự động trong P0**, cộng với thao tác 再試行 thủ công. Luôn có thể nhập tay.
  - Kết quả về muộn: chỉ áp dụng nếu fingerprint khớp với input hiện tại, target vẫn **active**, và khách hàng chưa sửa nó. Nếu không, kết quả bị bỏ và không bao giờ được lưu.
  - Nếu kết quả về sau khi khách hàng đã rời step, field được revalidate, và 確認/Submit sẽ bắt mọi thay đổi về tính hợp lệ.
- **Validation async (quyết định tính hợp lệ):**
  - 次へ chờ trong lúc nó `pending`, tối đa tới timeout.
  - Khi timeout, áp dụng policy theo từng validator do developer chọn trong capability contract:
    - `failOpen` (mặc định): đi tiếp, và backend quyết định khi submit
    - `failClosed`: chặn, kèm message và 再試行
  - Response stale bị bỏ.
  - Không form demo P0 nào cần async validator. Chỉ đặc tả contract.

### PROPOSAL (Claude): validation contract V-01..V-09. Chờ review, NOT approved

- **V-01 Ba tầng (đã xác nhận ở trên)**
  - DSL = tính hợp lệ thuần túy: `validate(definition, state) → errors`
  - runtime = trình bày
  - backend = thẩm quyền
  - Cùng một rule catalog và cùng fixture chạy ở cả FE và BE.
- **V-02 Trạng thái tương tác của từng field**
  - Các trạng thái: `pristine`, `touched` (đã blur một lần, hoặc đã đổi lựa chọn) và `dirty`. Step còn theo dõi `submitAttempted`.
  - Lỗi được hiện khi field `active` ∧ `invalid` ∧ (`touched` ∨ `submitAttempted`).
  - Khi lỗi đã hiện, field revalidate ở mỗi lần thay đổi, nên lỗi được xóa ngay lập tức.
- **V-03 IME**
  - Trong khoảng `compositionstart`…`compositionend`, engine không nhận giá trị đã commit, nên không có validation và không đánh giá dependency.
  - Enter trong lúc composition không bao giờ kích hoạt 次へ.
  - Giá trị được commit tại `compositionend`.
- **V-04 次へ thất bại**
  1. Hiện mọi lỗi trong step.
  2. Focus vào **field không hợp lệ đầu tiên theo thứ tự hiển thị** và scroll tới nó.
  3. Thông báo tóm tắt lỗi (số lượng và link) qua `aria-live`.
  - Mỗi field dùng `aria-invalid` và `aria-describedby` trỏ tới message của nó.
- **V-05 Message**
  - Mỗi validator trong registry đi kèm message mặc định đã bản địa hóa (`ja` trước tiên), có nội suy tham số, ví dụ 「{max}文字以内で入力してください」.
  - Business Editor có thể ghi đè nội dung theo từng field trong UI.
  - Lỗi luôn là text kèm icon, không bao giờ chỉ dựa vào màu sắc.
  - Bản dịch bị thiếu đi theo fallback T-04.
- **V-06 Validation async:** pending, timeout và retry, với cơ chế chống stale bằng fingerprint dùng chung với N-13.
- **V-07 Kích hoạt lại**
  - Field revalidate theo state hiện tại.
  - Lỗi chỉ hiển thị nếu field đã `touched` trước đó hoặc step có `submitAttempted`.
- **V-08 Lỗi từ backend**
  - Trả về theo key là external path (R-03), với error code ổn định và không phản hồi lại PII.
  - Runtime map từng lỗi vào field tương ứng.
  - Nếu field nằm ở step khác, submit từ 確認 sẽ điều hướng tới **step đầu tiên trên path** có lỗi và focus vào đó.
  - Path không xác định fallback về message cấp form.
- **V-09 Inactive** field không bao giờ hiện lỗi và không bao giờ chặn (đã xác nhận).

### Edge case (bổ sung)

- EC-26: khách hàng nhấn Enter trong lúc IME composition ở field text → không 次へ, không validation.
- EC-27: lỗi đang hiện, và khách hàng gõ giá trị đúng → lỗi được xóa mà không cần blur.
- EC-28: field chưa touched được kích hoạt lại → không có lỗi cho tới 次へ (V-07).
- EC-29: deep link tới step 4 khi step 2 chưa hoàn thành → redirect tới step 2 (N-10).
- EC-30: step bị bỏ qua bởi điều kiện runtime → không bị báo là unreachable (N-11).
- EC-31: điều kiện transition không bao giờ đúng được (`x eq A and x eq B`) → compile error (N-11).
- EC-32: backend từ chối một field ở step 2 trong khi khách hàng đang ở 確認 → điều hướng tới step 2 và focus vào field đó (V-08).
- EC-33: validation async bị timeout → `failOpen` đi tiếp, `failClosed` chặn kèm 再試行 (N-13).
- EC-34: kết quả lookup về sau khi target đã trở thành inactive → bị bỏ, không lưu (N-13).
- EC-35: từ 確認, sửa category làm mất hiệu lực một giá trị calculated ở step 3 → được tính lại, và lối tắt bị ẩn nếu step 3 giờ không hợp lệ (N-12).

### Tiêu chí chấp nhận (bổ sung)

- AC-17: các quy tắc thời điểm validation (V-02, V-07, V-09) pass trong test tự động của runtime và của artifact được sinh ra.
- AC-18: test IME composition cho thấy không có validation và không điều hướng trong lúc composition. Phương pháp test (composition event thật trên browser hay chuỗi mô phỏng) được quyết định trong test plan, và giới hạn sẽ được nêu rõ.
- AC-19: khi 次へ thất bại, focus rơi vào field không hợp lệ đầu tiên, và một lượt scan accessibility (axe hoặc tương đương) không tìm thấy vấn đề critical nào ở trạng thái lỗi.
- AC-20: deep link không thể bỏ qua step chưa hoàn thành (N-10).
- AC-21: các lỗi `unreachable` của compiler **không có false positive** trên một bộ fixture gồm các step có thể bị bỏ qua lúc runtime.
- AC-22: lỗi backend theo key external path được map đúng field và step (V-08).

### OPEN (Answer #7)

- Q8: ranh giới mở rộng của plugin. → đã trả lời ở Answer #8.

## Session 2: Answer #8 (2026-10-23), điều chỉnh và ranh giới plugin

### CONFIRMED (user)

- **Điều chỉnh các đề xuất trước:**
  - A1: `pending` không bao giờ khóa input. **Approved in principle.** Response lookup không bao giờ ghi đè dữ liệu khách hàng đã sửa.
  - A2: deep link và reload xác định việc hoàn thành dựa trên **dữ liệu thực sự còn tồn tại cộng với validation hiện tại**, không dựa trên cờ hoàn thành đã lưu (áp dụng ADR-012).
  - A3: `unreachable` chỉ chặn publish khi compiler chứng minh được. Không có false positive.
  - A4: lookup đang pending tự nó không chặn 次へ, nhưng **field bắt buộc vẫn còn không hợp lệ thì có chặn**. Cho phép nhập tay khi lookup timeout hoặc thất bại.
  - A5: validation async **không** mặc định `failOpen` cho mọi validator.
    - Validation được chia thành **advisory** và **authoritative**.
    - Nếu backend không kiểm tra được một điều kiện business bắt buộc, dữ liệu không được coi là hợp lệ.
  - A6: IME composition không kích hoạt validation, nhưng UI vẫn hiển thị input bình thường.
- **Answer #8: ranh giới plugin (nguyên tắc đã xác nhận; kiến trúc đầy đủ của spec #1 chưa được duyệt):**
  - Plugin mở rộng capability. **Form Engine sở hữu** lifecycle, điều hướng, điều phối validation và submit pipeline.
  - **Được phép trong P0:**
    - custom field type qua một typed contract
    - validator qua registered validator contract
    - lookup/connector qua một capability được cấp
    - Motion preset qua animation lifecycle
    - derived function có giới hạn, khi thực sự cần và có contract đánh giá FE/BE
    - template field/block/step dạng khai báo mà Business Editor chủ động áp dụng; template không bao giờ sửa graph đang chạy
  - **Không được phép trong P0:**
    - plugin tạo, xóa hoặc sắp xếp lại step lúc runtime
    - plugin ghi đè điều hướng hoặc submit pipeline
    - plugin thay đổi ngữ nghĩa activity
    - JavaScript tùy ý từ Business Editor
    - plugin đọc hoặc gửi PII tới dịch vụ bên ngoài vượt quá quyền đã khai báo
    - plugin ghi vào internal state của engine ngoài các API được phép
  - **Plugin contract tối thiểu mà spec phải định nghĩa:**
    1. registry và id/version duy nhất
    2. input/output schema và kiểm tra kiểu
    3. khai báo permission/capability
    4. các lifecycle hook được phép
    5. lỗi, timeout, fallback và hủy (cancellation)
    6. theo dõi dependency cho giá trị derived
    7. backend validation hoặc tính lại cho dữ liệu authoritative
    8. pin version theo từng published revision
    9. phát hiện plugin thiếu/không tương thích và chặn publish
    10. quy tắc về privacy, PII taint và side effect
  - P0 không cần hệ thống plugin đầy đủ, chỉ cần các extension point đủ rõ để tránh kiến trúc hard-code.
- **Bước tiếp theo đã thống nhất:** viết **spec #1 Architecture Proposal**.
  - Tóm tắt các ADR và quyết định với ACCEPTED / PROPOSED / OPEN.
  - Không bao giờ nâng PROPOSED thành APPROVED.
  - Bao gồm diagram, ví dụ DSL, compiler pipeline, trách nhiệm của runtime, ranh giới plugin, versioning, data flow, P0 vs P1/P2, rủi ro, trade-off và các quyết định còn chờ.
  - Không có câu hỏi discovery mới. Các mục chưa giải quyết đưa vào Open Decisions.
- G1 NOT APPROVED.

### Trạng thái

- Discovery Q&A cho spec #1 đã **đóng** theo chỉ thị của user. Đề xuất nằm ở `docs/superpowers/specs/2026-10-23-form-schema-workflow-design.md`.
- Builder check đã chạy (2026-10-23). Claude đã quyết định các điểm nhỏ của nó, và spec giờ dùng `derivedPath(values)` thay vì history được lưu, thay thế cách diễn đạt dựa trên history của N-04 trong nhật ký này. Hai điểm thuộc về user và được ghi lại là OD-01 (diễn đạt lại) và OD-14 (mới) trong spec §21.

## Session 2: Review #1 spec #1 (2026-10-23)

> Verdict của user: **CHANGES / VERIFICATION REQUIRED**. Review dựa trên báo cáo tóm tắt, chưa phải phê duyệt toàn bộ spec #1. G1 NOT APPROVED.

### CONFIRMED (user)

- **OD-01: APPROVED AS DESIGN DIRECTION, chọn (a)** → ADR-017.
  - Evaluator TypeScript ở FE, evaluator Python ở BE.
  - Lý do:
    - BE không phải gọi Node service cho mỗi submission
    - runtime dependency và failure domain đơn giản hơn
    - phù hợp kiến trúc hiện tại
  - Điều kiện bắt buộc:
    - Có một DSL semantic contract duy nhất.
    - Dùng chung conformance fixtures có version.
    - Kiểm tra: null/missing, type coercion, comparison, Unicode, normalization, validation, errors. Hành vi số phải tương đương.
    - Có golden, boundary và differential tests.
    - Backend kiểm tra theo authoritative published revision.
    - Hai evaluator cùng PASS test đơn giản **không** là bằng chứng đủ về parity.
  - Nếu chi phí bảo trì không chấp nhận được thì mở lại ADR kèm evidence. Không tự chuyển sang Node service.
- **OD-14: APPROVED AS DESIGN DIRECTION, chọn (a)** → ADR-018.
  - G1 chỉ được trình sau khi đủ 6 subsystem spec **và** Cross-Subsystem Integration Review.
  - Không mở quyền scaffold hoặc implement sau spec #1–#3.
  - Trong P01 được phép: design review, kiểm chứng lý thuyết, test matrix.
  - Spike thực thi cần một gate riêng (scope, mục đích, output, cleanup policy) và chỉ chạy sau khi được duyệt.
- **Yêu cầu review navigation:**
  - Phân tích `derivedPath(values)` cho các trường hợp:
    - current step không còn reachable
    - upstream đổi branch
    - Back sau khi đổi điều kiện
    - nhiều condition cùng TRUE
    - không condition nào match
    - step bị skip
    - cycle
    - rule phụ thuộc dữ liệu chưa nhập
    - async validation chưa xong
    - draft recovery về step không hợp lệ
  - Cần có truth table và deterministic rules.
  - Không dùng array history gây hành vi không tái hiện được, nhưng cũng không giả định path tính lại giải quyết được mọi vấn đề.
- **Yêu cầu review dữ liệu:**
  - integer range và JS safe integer
  - chiến lược decimal
  - null vs missing vs chuỗi rỗng
  - code point vs grapheme cluster
  - chuẩn hóa 全角/半角
  - canonicalization theo validator
  - địa chỉ ổn định cho repeatable item
  - giá trị ẩn và backend projection
  - rename, xóa và migration field
  - Normalization không được âm thầm phá dữ liệu gốc hay làm FE/BE lệch nhau.
- **Ranh giới compiler và plugin:**
  - Spec #1 chỉ mô tả integration contract ở mức cao. Chi tiết thuộc spec #2/#3.
  - Đánh dấu những gì đang PROPOSED.
  - Không được có hai nguồn sự thật.
- **OD-02..OD-13 chưa được duyệt.** Cần Decision Matrix gồm: ID, vấn đề, phương án, khuyến nghị, lý do, trade-off, impact P0, phụ thuộc spec #2–#6, hạn quyết (trước spec #2 hay để đến G1). Không mặc định là ACCEPTED.
- **Cross-subsystem review sau khi đủ 6 spec**, kiểm các cặp:
  - Schema ↔ Plugin Registry
  - Schema ↔ Admin Editor
  - Workflow Engine ↔ Python Evaluator
  - Plugin Registry ↔ Compiler
  - Form Revision ↔ Backend Submission
  - Compiler ↔ Release Manifest
  - Publishing ↔ Rollback
  - Motion ↔ Runtime Lifecycle
  - Draft Recovery ↔ Published Revision
  - Đánh dấu mọi conflict, circular dependency và quyết định còn mở.
- **Docs và Git:**
  - Chuẩn hóa docs sang tiếng Việt, giữ nguyên identifier.
  - Cho phép **commit local** các docs P01 đã qua kiểm tra bảo mật, trên branch hiện tại. Trước khi commit phải: kiểm tra staged diff, kiểm tra `docs/internal/` và dữ liệu không được track, không bypass hook, không push, không đụng AWS.
  - Có thể tạo commit WIP rõ ràng. Commit **không** có nghĩa spec là APPROVED/DONE.

### Đã thực hiện (Claude)

- Spec #1 revision 2 thêm các mục:
  - §7.6: ngữ nghĩa dữ liệu
  - §8.7: NR-01..NR-11, T1–T3, E1–E10
  - §12: bảng ranh giới với spec #2/#3/#5/#6
  - §21: Decision Matrix
  - §25: kế hoạch cross-subsystem review
  - §26: mức độ sẵn sàng
  - AC-29..AC-33: parity
- DECISIONS.md: thêm ADR-017, ADR-018. Gate log ghi rõ điều kiện trình G1.
- Docs chuyển sang tiếng Việt. Riêng file evidence giữ nguyên vì là output gốc của lệnh.

### OPEN

- OD-02..OD-13 (spec #1 §21). Phải quyết trước khi brainstorm spec #2: **OD-02, OD-04, OD-07, OD-12**.

## Session 3: Review #2 spec #1 (2026-10-24)

> Verdict của user: **CONDITIONALLY ACCEPTED FOR DESIGN CONTINUATION.**
> - User cho phép brainstorm spec #2. Spec #1 **chưa được duyệt hoàn toàn**, và chưa có quyền implement.
> - G1 NOT APPROVED. G9/G10 BLOCKED.

### CONFIRMED (user)

- **OD-02 (APPROVED WITH CONDITIONS)** → ADR-019. JSON Schema 2020-12 dùng để mô tả và validate cấu trúc Form Definition.
  - schema canonical có version
  - không duy trì nhiều schema độc lập dễ drift giữa TS và Python
  - tách structural / semantic / runtime
  - JSON Schema không thay thế Workflow DSL
  - business rule chỉ nằm trong typed DSL hoặc registered capability
  - không expression, không JavaScript
  - kiểm tra tương thích validator FE/BE, làm rõ `format` là annotation hay assertion
  - fixture và conformance dùng chung
  - definition đã publish không bị mutate khi schema lên version
  - Claude đề xuất cơ chế sinh hoặc kiểm chứng contract TS/Python (không implement trước G1).
- **OD-04 (APPROVED)** → ADR-020. Block có `exports` tường minh.
  - export có định danh ổn định, chỉ tham chiếu được public export
  - resolve theo instance và revision bất biến
  - kiểm tra trùng, tham chiếu sai và thay đổi không tương thích
  - thay đổi export được phản ánh trong version và impact analysis
  - không dùng `latest`
  - phân biệt field export, plugin output và integration output
- **OD-07 (APPROVED)** → ADR-021. Developer/Platform đặt mức tối thiểu, Editor chỉ được tăng.
  - field mới có mặc định an toàn, component nhạy cảm lấy chính sách từ registry
  - platform và BE thực thi policy, JSON của Admin không vô hiệu hóa được
  - P0 không lưu PII trong browser
  - không có PII trong compiler metadata, manifest, log, analytics
  - BE kiểm tra theo definition tin cậy và registry
  - không xây policy language phức tạp
- **OD-12 (APPROVED WITH RESTRICTIONS)** → ADR-022. `deferToSubmit`:
  - chỉ cho validator trong allowlist có metadata tường minh
  - phải xong trước khi BE xác nhận thành công
  - failure semantics tất định, không fail-open
  - không dùng để lách validation sai
  - FE có phản hồi
  - BE lo retry và idempotency
  - tách khỏi side effect không rollback được
  - có test cho success, failure, timeout, stale, duplicate, retry
  - làm rõ khác biệt sync / async / submit-time
- **Trước khi đánh dấu spec #1 READY_FOR_CROSS_REVIEW**, phải rà thêm:
  - §7.6: canonicalization không làm mất dữ liệu quan trọng; type coercion; missing, null, empty, false, zero; overflow; độ dài Unicode; itemId; lọc field ẩn ở BE; kịch bản parity.
  - §8.7: transition atomicity và race condition:
    - 次へ khi đang pending
    - sửa input khi async đang chạy
    - response cũ về sau
    - đổi branch khi đang điều hướng
    - Back/Forward và reload
    - step trở thành unreachable
    - draft của revision cũ
    - double-click
    - validation thành công nhưng transition không còn hợp lệ
  - Cần invariant và expected behavior, không chỉ happy path.
- **Spec #2:** brainstorm Plugin Contracts & Capability Registry. Các chủ đề:
  - identity và semver
  - manifest
  - các loại capability: field, validator, action, data source, layout, integration
  - registry API và typed contract
  - `configSchema` cho Inspector
  - renderer interface và interface validation phía server
  - output và dependency
  - permission cho side effect
  - lifecycle
  - cancel và xử lý kết quả cũ
  - compatibility và deprecation
  - isolation trong compiler, tree-shaking
  - conformance test
  - bảo mật và ràng buộc dependency
  - Không được biến registry thành global service locator, không load code tùy ý từ Admin.
  - Phải xác định phần nào là P0, phần nào là P1/P2.

### Đã thực hiện (Claude): spec #1 revision 3

- §7.6.4/§7.6.5: **bỏ NFC cho văn bản tự do.**
  - NFC đổi U+FA30 thành U+4FAE, tức mất 異体字 trong tên riêng. Đã kiểm chứng bằng Python và Node.
  - Canonicalization chỉ áp cho field type có cấu trúc, idempotent, và phần bị bỏ được liệt kê tường minh.
  - Phát hiện thêm: máy local đang có Node ở Unicode 17.0 và Python 3.9 ở Unicode 14.0.0.
  - Chính file spec cũng bị công cụ tự chuẩn hóa U+FA30, nên fixture phải ghi ký tự bằng escape.
- §7.6.9 type coercion, §7.6.10 ma trận parity.
- §7.7 quản lý schema, §7.8 block exports.
- §8.7.6: invariant INV-N1..N8 và các kịch bản C1–C10. Đã cập nhật NR-11 và T3.
- §11 ba loại validation và `deferToSubmit`, §16 classification, §12 danh sách contract chuyển sang spec #2.
- AC-34..AC-38. §21 cập nhật trạng thái OD. §26 mức độ sẵn sàng.
- ADR-019..022 trong DECISIONS.md.

### OPEN

- Spec #1: user review rev 3, sau đó (nếu đồng ý) mới chuyển sang READY_FOR_CROSS_REVIEW.
- OD-03, OD-05, OD-06, OD-08..OD-11, OD-13: vẫn OPEN.

## Session 3: Spec #2, Plugin Contracts & Capability Registry (bắt đầu 2026-10-24)

> Bối cảnh ràng buộc:
> - ADR-016 (ranh giới plugin), ADR-019 (schema), ADR-020 (exports), ADR-021 (classification), ADR-022 (`deferToSubmit`)
> - spec #1 §12 (contract chuyển sang spec #2)
> - Chưa có quyết định nào của spec #2.

### OPEN

- Q2-1: ai viết plugin. → đã trả lời ở Spec #2 Answer #1.

## Session 3: Spec #2 Answer #1 (2026-10-24), ownership và governance của plugin → ADR-023

### CONFIRMED (user)

- **Mô hình: Centralized Governance + Distributed Contribution.**
  - Platform Maintainers quản lý:
    - Plugin SDK và typed contracts
    - Capability Registry
    - lifecycle và versioning
    - security policies
    - compatibility requirements
    - conformance tests
    - release governance
  - Developer của từng site được viết plugin mới, cải tiến plugin có sẵn, hoặc đề xuất capability qua Pull Request.
  - Không được bypass review. Không phát hành plugin chưa kiểm chứng.
  - Platform Maintainer approve contract và release.
- **P0:**
  - Plugin nằm trong monorepo, viết bằng TypeScript hoặc ngôn ngữ phù hợp với execution target đã duyệt.
  - Có public interface và dependency boundary.
  - Mỗi plugin có manifest và configuration schema.
  - Registry chỉ nhận trusted plugin đã đăng ký trong source/build.
  - Không tải hay thực thi remote JavaScript. Business Editor không upload code.
  - Release qua code review và CI.
  - Plugin dùng chung không import code ứng dụng riêng của site.
- **Tương lai (không implement ở P0):**
  - code owner theo plugin
  - site team tự phát triển capability
  - tách thành package có version độc lập nếu cần
  - SDK có compatibility contract ổn định
  - CI chạy conformance trước khi registry chấp nhận
  - breaking change cần migration plan
  - chặn publish với version deprecated hoặc vulnerable
  - Không có dynamic package registry hay marketplace ở P0.
- **Versioning:**
  - `pluginId` ổn định, release version bất biến, dùng semver để khai báo compatibility.
  - Form đã publish pin chính xác version.
  - Release manifest ghi version, source/build identity và artifact hash.
  - Không `latest`, không wildcard, không floating dependency. Không tự nâng plugin của form đang chạy.
  - Nâng plugin phải có impact analysis và regression test.
  - Compiler chỉ đưa vào những gì form cần.
  - **Semver không phải bằng chứng tương thích.** Tương thích phải được kiểm chứng.
- **Trust model:**
  - **Trusted Developer Code** qua review và CI, được làm đúng các tác vụ của execution target đã duyệt, có permission metadata và giới hạn side effect.
  - **Untrusted Admin Configuration** chỉ là dữ liệu:
    - không chứa JavaScript thực thi
    - không tạo network destination tùy ý
    - không ghi đè security policy
    - không nạp code từ URL
  - Plugin backend tuân thủ authorization, input validation và classification phía server. Config không được chọn endpoint nội bộ tùy ý (SSRF).
- **Capability cần hỗ trợ:**
  - field renderer
  - validator
  - data source / lookup
  - workflow action
  - layout
  - backend integration
  - derived function
  - Motion preset (nếu thật sự cần ở registry chung)
  - Không nhất thiết tất cả cùng một loại plugin. Cần phân tích chia thành **capability family** theo execution context.
  - Frontend không cần backend secret. Backend integration không bị bundle vào browser. Compiler chỉ import code chạy được trên browser.
  - Output có typed contract. Async có cancellation và stale policy.
  - Registry không phải global service locator.
- **Quality gates cho mỗi plugin:**
  - manifest/schema validity
  - typecheck
  - unit test
  - contract/conformance test
  - compatibility test
  - security/dependency scan
  - kiểm tra ranh giới browser/server
  - bundle isolation test
  - regression test cho các form bị ảnh hưởng
  - Plugin có side effect cần idempotency và failure semantics.
- **Ranh giới:** Shared Block (Editor cấu hình, là Form Definition có version, không có code) ≠ Code Plugin (developer viết, release qua CI, có typed API và security contract). Không gộp thành cơ chế kế thừa.
- **Thứ tự ưu tiên của spec #2:**
  1. taxonomy
  2. manifest
  3. registry architecture
  4. config schema
  5. ranh giới browser/server
  6. lifecycle và versioning
  7. isolation trong compiler
  8. conformance
  - Trình bày phương án và trade-off trước khi chốt.

### PROPOSAL (Claude): taxonomy và registry, phiên 3. Chờ review, NOT approved

- **S2-P01 Capability family theo execution context:**
  - `browser-ui`: field renderer, layout, motion preset
  - `isomorphic-pure`: validator đồng bộ, derived function, canonicalizer; có bản TS và Python với fixture chung
  - `server-io`: data source/lookup, validator authoritative async và submit-time, backend integration, workflow action
  - `design-time`: inspector/config editor, template (dữ liệu), mock cho preview
- **S2-P02 Đóng gói:** một plugin package có nhiều **facet** theo context, mỗi facet là một entrypoint riêng (`browser`, `server`, `design`). Compiler chỉ import facet `browser` của capability được dùng.
- **S2-P03 Registry:**
  - Là catalog tĩnh, sinh lúc build từ manifest trong monorepo. Admin và compiler đọc catalog này.
  - Ở runtime, compiler sinh import tường minh, và engine nhận một capability map (dependency injection) chỉ gồm những gì form dùng.
  - Không có `registry.get()` toàn cục.
- **S2-P04 Workflow action:**
  - Chỉ chạy phía server, ở các lifecycle point do engine khai báo (P0: chỉ sau khi bài nộp đã ghi).
  - Idempotent, có outbox/retry.
  - Không đụng navigation hay submit (ADR-016).

### OPEN

- Q2-2: việc sau khi submit. → đã trả lời ở Spec #2 Answer #2.

## Session 3: Spec #2 Answer #2 (2026-10-24), taxonomy, đóng gói, registry, action → ADR-024, ADR-025

### CONFIRMED (user)

- **Taxonomy: APPROVED WITH ADJUSTMENTS.** Bốn family:
  - `browser-ui`
  - **`cross-runtime-pure`** (đổi tên từ `isomorphic-pure`, vì TS và Python có thể là hai implementation của cùng một semantic contract)
  - `server-io`
  - `design-time`
  - Với `cross-runtime-pure`: shared semantic specification, conformance fixtures có version, differential tests, output tất định, không phụ thuộc timezone/locale/runtime default không kiểm soát.
  - Lookup phía browser được gọi backend API đã duyệt qua connector/adapter có contract rõ. Browser không truy cập endpoint tùy ý, không có server secret.
- **Đóng gói: chọn B**, một package có nhiều facet/entrypoint theo context (cấu trúc thư mục chỉ minh họa).
  - entrypoint public tường minh
  - facet browser không import facet server
  - code design-time không có trong artifact của khách
  - shared contract không import dependency có đặc quyền
  - **Thực thi bằng static check, dependency graph và bundle test**, không dựa vào kiểm tra môi trường lúc runtime.
  - Plugin không cần có đủ mọi facet.
- **Registry: chọn R2**, catalog tĩnh sinh lúc build + import tường minh do compiler sinh.
  - Admin dùng catalog để hiển thị capability được phép chọn. Compiler resolve đúng plugin, facet, version.
  - Artifact chỉ chứa capability browser thật sự cần. Capability nặng được code-split. Capability server không có trong client bundle.
  - Runtime nhận scoped capability map qua dependency injection.
  - Không có global service locator hay marketplace remote JS ở P0.
  - **Bằng chứng isolation thật phải có ở spec #3/P07.**
- **Workflow action: ADJUSTED.** Không giới hạn mọi action chỉ chạy sau khi đã lưu bài nộp. Phân thành năm loại:
  1. UI interaction: hành vi local trên browser
  2. Query/lookup: chỉ đọc, qua integration đã duyệt
  3. Authoritative validation: kiểm tra phía server
  4. Business command: ghi có đặc quyền phía server
  5. Post-commit effect: email, notification, đồng bộ ra ngoài
  - Không trộn UI interaction và navigation với side effect nghiệp vụ có đặc quyền.
  - Command có đặc quyền phải có permission tường minh, idempotency và error semantics.
  - Post-commit effect bất đồng bộ cần durability, retry, failure tracking. Ưu tiên transactional outbox khi phù hợp.
  - Không bắt UI action hay lookup đi qua outbox.
- **Sau submit trong P0:** không tích hợp hệ thống công ty, không email thật, không dịch vụ bên thứ ba. PoC phải chứng minh:
  - Sports và PC submit qua **cùng một submission contract**
  - Python validate theo authoritative published revision
  - bài nộp được lưu vào **durable local DB**
  - idempotency được kiểm chứng
  - có **submission ID/receipt** để hiển thị xác nhận
  - có **ít nhất một mock post-submit event hoặc mock integration handler** để chứng minh extension point
  - không gửi dữ liệu thật ra ngoài, không có side effect nghiệp vụ bên ngoài
  - Nếu dùng outbox thì lưu bài nộp và outbox event **trong cùng một transaction**.
  - Lỗi sau submit không làm mất bài nộp đã commit.
  - UI phân biệt "bài nộp đã được nhận" với "xử lý phía sau đã xong".
  - Không xây hạ tầng email hay hệ thống worker phân tán phức tạp.
- **Bảo mật và versioning:**
  - Plugin là code đã review, **không mặc nhiên an toàn**.
  - Registry cần có: version chính xác, capability contract, execution boundary, permission metadata, config schema, thông tin compatibility, trạng thái deprecation/vulnerability, yêu cầu conformance.
  - **Side effect phải được thực thi (enforce) ở backend**, không chỉ khai báo trong manifest.

### PROPOSAL (Claude): manifest, phiên 3. Chờ review, NOT approved

- S2-P05: release manifest **bất biến**. Trạng thái (`active` / `deprecated` / `vulnerable`) nằm trong một **registry status ledger** riêng, có thể thay đổi, do Platform Maintainer quản lý. Đổi trạng thái không làm thay đổi bản release.
- S2-P06: một manifest liệt kê nhiều capability. Mỗi capability có `kind`, `family`, `facets`, schema theo kind, `permissions`, `minClassification`, `authority`, `dependsOn`. Kind thuộc family nào thì chỉ được có các facet hợp lệ cho family đó.
- S2-P07: kind dự kiến:
  - `browser-ui`: `fieldType`, `layout`, `motionPreset`, `uiInteraction`
  - `cross-runtime-pure`: `validator`, `derivedFn`, `canonicalizer`
  - `server-io`: `dataSource`, `serverValidator`, `command`, `postCommitEffect`
  - `design-time`: `inspector`, `template`, `previewMock`

### OPEN

- Q2-3: Có trường hợp nào khách đang điền dở mà hệ thống đã phải ghi thật trước khi bấm gửi (ví dụ giữ chỗ một khung giờ đến cửa hàng) không? (hỏi ở phiên 3)
  - → đã trả lời ở Spec #2 Answer #3.

## Session 3: Spec #2 Answer #3 (2026-10-24), plugin manifest và thao tác trước submit → ADR-026, ADR-027, ADR-028

### CONFIRMED (user)

- **Plugin Manifest: APPROVED AS DESIGN DIRECTION WITH ADJUSTMENTS.** Chưa duyệt toàn bộ spec #2, chưa duyệt G1.
  - Đồng ý: release manifest bất biến; status ledger độc lập; capability taxonomy theo execution boundary; đóng gói nhiều facet; registry tĩnh lúc build; resolve dependency tường minh; permission được enforce ở server.
  - **Capability identity:** phải định danh duy nhất, không nhập nhằng giữa `pluginId`, `pluginVersion`, `capabilityId`, `capabilityKind`, `executionFacet`. Compiler và backend resolve **cùng một** capability identity.
  - **Dependency resolution:**
    - mọi dependency có stable identifier
    - published release pin exact resolved versions
    - phát hiện dependency thiếu hoặc không tương thích, phát hiện cycle
    - không silent version fallback, không tự nâng dependency khi rebuild
    - có dependency graph và lock/manifest phù hợp
  - **Engine compatibility:**
    - plugin manifest được phép khai `engineApi` range.
    - Release Manifest phải ghi **chính xác** engine/runtime version đã dùng.
    - Có compatibility check với implementation phía server.
    - Form đã publish **không được** dùng server facet không tương thích chỉ vì backend mới được deploy.
  - **JSON Schema:** sửa placeholder trong ví dụ manifest khi đưa vào contract chuẩn (ví dụ `{"type":"enum"}` không hợp lệ). Output phải có schema hợp lệ, type rõ ràng, có cơ chế validate.
  - **Plugin data security:** `minClassification` chỉ là policy tối thiểu, không đại diện cho toàn bộ data flow. Phải phân tích:
    - classification của input và output
    - data propagation
    - output trusted vs untrusted
    - authorization theo tenant/site
    - xác minh dữ liệu phía server (server-authoritative)
    - **Output của plugin phía browser không tự động trở thành trusted data.**
  - **Facet boundary:**
    - browser facet không chứa server code/secret
    - server facet không phụ thuộc browser runtime
    - design facet không xuất hiện trong bundle của khách
    - JSON của Admin không được chỉ định import path
    - registry kiểm tra facet entrypoint và package exports
    - Với server facet Python: phân tích packaging và deployment versioning, **không giả định** Node/TS và Python dùng chung package runtime.
- **Business write trước submit (P0):** **không** yêu cầu business write trước khi khách bấm Submit trong demo Sports/PC.
  - Trước submit chỉ có: UI interaction, cập nhật field có điều kiện, lookup chỉ đọc, validation, preview, khôi phục draft phía client theo privacy policy đã duyệt.
  - Chọn cửa hàng chỉ là chọn, không giữ chỗ thật. Không tích hợp đặt lịch, email, thanh toán hay reservation thật.
  - Đây là **giới hạn của PoC**, không phải khẳng định cho mọi form production. Flow cũ có pre-submit write phải được audit trước khi migration.
- **Final submission (P0), sau khi khách bấm Submit:**
  1. Backend nhận request kèm idempotency key.
  2. Xác minh published form revision và compatibility.
  3. Re-evaluate rule/validation authoritative.
  4. Loại bỏ hoặc từ chối dữ liệu không hợp lệ theo submission contract.
  5. Lưu submission vào durable local DB.
  6. Nếu dùng outbox: submission và outbox event trong cùng transaction.
  7. Trả receipt / submission ID.
  8. Mock processing handler xử lý post-submit event.
  - Yêu cầu: double-submit không tạo hai đơn; dùng lại idempotency key với payload khác phải bị phát hiện và xử lý theo contract rõ ràng; lỗi sau commit không làm mất submission; không email thật, không gọi hệ thống công ty, không dữ liệu khách thật.
- **Tương lai: Provisional Command.** Architecture phải có extension point cho thao tác ghi trước final submit (upload file tạm, giữ slot hẹn, draft phía server, verification challenge, báo giá/giữ chỗ tạm). Những thao tác này **không** đồng nghĩa với final purchase submission.
  - Phân biệt: **Query** (không đổi business state) · **Provisional Command** (tạo trạng thái tạm) · **Final Command** (business submission) · **Post-commit Effect** (sau khi transaction commit).
  - Không implement Provisional Command Framework ở P0, nhưng **plugin contract không được giả định mọi server write chỉ xảy ra sau final submit**.
- **Provisional Command contract (chỉ thiết kế, P1/P2):** resource ownership, idempotency, expiration/TTL, authorization, cancellation, retry, reconciliation, compensation khi đảo ngược được, dọn orphan resource, race condition, abuse/rate limiting.
  - Không giả định mọi action đều compensate được (email/OTP đã gửi thì không thu hồi được; giữ chỗ tạm thì có thể hết hạn hoặc release).
  - TTL cleanup không bảo đảm thời điểm hết hiệu lực chính xác. Business invariant quan trọng phải enforce tại nguồn authoritative.
  - Không xây generic saga/compensation engine chỉ cho PoC.
- **Plugin version governance:** manifest bất biến và status ledger tách riêng. Trạng thái: `active`, `deprecated`, `vulnerable`, `revoked`. Phân biệt:
  - chặn version cho các lần publish sau
  - chính sách cho các form đã publish đang dùng version đó
  - emergency disable / rollback
  - server compatibility và data migration
  - Không silent-upgrade artifact đã publish.
- **Yêu cầu tiếp theo:** ghi nguyên tắc vào ADR và notes; chi tiết chưa quyết giữ PROPOSED. Phân tích manifest schema, capability contract interface, registry generation, version/dependency resolution, server compatibility, async lifecycle và cancellation, security policy, conformance suite. **Chứng minh bằng thiết kế** rằng plugin có browser, server và design facet không khiến compiler bundle nhầm code giữa các môi trường. Không code, không tự duyệt G1, G9/G10 vẫn BLOCKED. Sau đó đưa **Spec #2 Design Proposal** để user review.

### Đã thực hiện (Claude)

- ADR-026 (manifest, identity, resolution, compatibility, data security, facet boundary), ADR-027 (Query / Provisional / Final / Post-commit; P0 không có business write trước submit), ADR-028 (status ledger và governance theo version). Cả ba ở mức nguyên tắc; chi tiết PROPOSED.
- ADR-025 được làm rõ bởi ADR-027 (loại "business command" tách thành Provisional Command và Final Command). Không supersede.
- Viết Spec #2 Design Proposal: `docs/superpowers/specs/2026-10-24-plugin-contracts-capability-registry-design.md`. Quyết định còn chờ user: OD2-01..OD2-07 (spec #2 §22).

### OPEN

- User review Spec #2 Design Proposal (rev 1) và các OD2-xx. → đã review ở Spec #2 Review #1.

## Session 3: Spec #2 Review #1 (2026-10-24) → ADR-029..035

### CONFIRMED (user)

- **Verdict: CHANGES REQUIRED — DESIGN DIRECTION ACCEPTED.** Cho phép sửa spec #2 và chuẩn bị sang spec #3 sau khi đồng bộ contract quan trọng. Chưa duyệt toàn bộ spec #2. G1 NOT APPROVED.
- **OD2-01 APPROVED WITH ADJUSTMENTS:** hỗ trợ đồng thời các server capability version mà published revision hợp lệ còn dùng, nhưng **không bắt buộc** nạp mọi version vào một Python process/environment.
  - version-scoped server capability adapter; resolve chính xác từ Capability Lock tin cậy; không fallback sang latest/nearest-compatible
  - deploy gate kiểm mọi revision còn được hỗ trợ; backend kiểm compatibility trước khi xử lý submission; fail closed với mã lỗi phù hợp
  - backend update không được phá form đang mở trong browser
  - phân biệt: source package version, server adapter version, backend deployment version, published form revision, Capability Lock
  - P0: một backend deployment nhiều adapter nếu không xung đột dependency. Nếu cần nhiều runtime để cô lập dependency: đề xuất riêng cho production, không orchestration phức tạp trong PoC.
- **OD2-02 APPROVED:** Immutable Plugin Release Store.
  - artifact do trusted CI/build pipeline tạo; identity/version bất biến; hash chính xác; source commit; dependency lock + provenance; runtime compatibility metadata; facet inventory
  - không nhận artifact do Admin upload; không nạp code từ URL trong form JSON
  - phân biệt 4 lớp: workspace (dev) · trusted release store · runtime deployment · published form release
  - Admin production preview dùng trusted release capability. Local dev dùng workspace build trong môi trường dev cô lập, đánh dấu development-only, không giả làm release.
  - Hash verification và provenance là yêu cầu P0; artifact signing làm ở phase phù hợp.
- **OD2-03 APPROVED FOR P0:** một resolved version mỗi `pluginId` trong một Form Release. Conflict: compiler phát hiện, diagnostic chỉ rõ dependency chain, không tự nâng/hạ, không bỏ qua dependency, không chọn theo load order. Form khác nhau vẫn dùng version khác nhau được.
- **OD2-04 MODIFIED:** không chấp nhận "`vulnerable`: form owner quyết" khi không có security governance.
  - `deprecated`: cảnh báo; chặn dùng mới theo policy nếu cần; form đã publish tiếp tục trong thời gian hỗ trợ.
  - `vulnerable`: chặn phát hành bản mới chứa version đó theo security policy; impact analysis theo severity, exploitability, exposure; **Platform Security/Maintainer** quyết remediation deadline hoặc emergency mitigation; chủ form tham gia nhưng không tự miễn trừ.
  - `revoked`: có khả năng suspend runtime operation bị ảnh hưởng; backend enforce tại authoritative boundary; không fallback; có audit, incident metadata, user-facing failure, recovery path.
  - Tách vulnerability status của code khỏi availability status của form. Không mặc định suspend toàn bộ form là an toàn; cần impact analysis và cơ chế xử lý sự cố.
- **OD2-05 APPROVED WITH P0 SCOPE:** chỉ implement kind thật sự cần: `fieldType`, `validator`, `dataSource`, `serverValidator`, `postCommitEffect`. Design facet/inspector để cấu hình field plugin trong Admin. Preview mock dùng versioned fixtures. Platform core cung cấp ở P0: layout chuẩn, navigation/UI interaction chuẩn, canonicalization built-in, conditional rules built-in, final submission command, Motion presets. Định nghĩa extension contract cho kind còn lại, không bắt buộc implement. **Motion vẫn P0** (không có plugin `motionPreset` ≠ bỏ Motion Animation Editor). Làm rõ `inspector` là design facet hay capability độc lập, tránh hai cơ chế đăng ký. Tạo ma trận P0/P1/P2.
- **OD2-06 APPROVED WITH RESTRICTIONS:** definition được bind tới post-commit effect đã được platform approve; Admin không tự định nghĩa business command. P0: chỉ mock effect; trigger sau commit; kiểm theo registry, permission và **site policy**; outbox cùng transaction; retry không nhân đôi side effect; lỗi downstream không mất submission; không email/API công ty. Editor chọn effect được phép, không vượt policy.
- **OD2-07 APPROVED WITH ADJUSTMENTS:** Git-managed ledger là nguồn quản trị và audit baseline P0, nhưng kiến trúc phải có **emergency runtime override** có kiểm soát: change được xác thực và phân quyền; audit log; backend enforce ngay; không sửa release manifest; reconciliation giữa ledger và runtime policy; người dùng form/Business Editor không đổi được; có failure policy khi runtime status store không khả dụng. P0 mô phỏng ở local. Không xây incident-management service.
- **Xem lại bốn lựa chọn kỹ thuật:**
  - 8.1 Đồng ý server verification lúc submit cho demo. Kiểm tra `storeExists` (manifest ví dụ trước, `allowsDeferToSubmit: false`) vs `storeIdValid` (rev 1, qua `deferToSubmit`): cùng hay khác capability? Khi fail ở submit: không tạo submission, chỉ rõ field/store sai, cho chọn lại, không mất giá trị hợp lệ khác.
  - 8.2 Đồng ý production/published preview chỉ dùng release artifact; local dev được thử plugin chưa phát hành trong isolated dev preview; không giả mạo release identity.
  - 8.3 **Không** dùng `valueOrigin` làm cơ chế quyết định trust. Tách value provenance, authority policy, verification policy. `storeId` chọn từ option server vẫn untrusted khi client gửi lại. Derived output từ client không tự nhận là server-trusted.
  - 8.4 Postal-code: mô tả cách map lookup result vào field, quyền sửa giá trị autofill, loại bỏ response cũ, xử lý địa chỉ cũ khi đổi mã bưu điện, plugin không mutate state ngoài typed command. Postal-code là P1, chỉ thiết kế.
- **Kiểm tra thêm trước spec #3:** dependency isolation (dynamic import specifier tĩnh do compiler sinh; custom export condition phải kiểm trong bundler thật; conditional exports không là security boundary duy nhất); React singleton, platform SDK compatibility, duplicate React; trùng thư viện tạm chấp nhận nếu đo được; bundle budget ở spec #3; artifact integrity (commit, lock, hash, reproducible input, compatibility, không secret trong bundle/sourcemap/metadata); server release compatibility (retention/grace period cho form đang mở; frontend rollback ≠ backend rollback); conformance (mỗi guard có negative fixture, chứng minh fail đúng lý do; chưa kết luận isolation PASS khi chưa có artifact thật).
- **Việc cần làm:** áp OD2-01..07 vào ADR; sửa mâu thuẫn; spec #2 rev 2; đồng bộ spec #1; Cross-Spec Interface Matrix #1 ↔ #2; danh sách OPEN và blocker; nếu xong phần ảnh hưởng spec #3 thì brainstorm spec #3. Cho phép **local documentation commit** sau staged-diff/security check. Không code, không push, không AWS write, không tự duyệt G1.

### Đã thực hiện (Claude)

- ADR-029..035 (OD2-01..07). ADR-028 ghi chú: policy chi tiết theo ADR-032 và ADR-035.
- Spec #2 rev 2 (§26 tóm tắt thay đổi). Spec #1 rev 3.1: đồng bộ contract plugin theo spec #2 §19.
- `storeExists` chỉ xuất hiện trong đề xuất ở chat phiên trước, không có trong file nào của repo; spec #2 rev 2 ghi `storeIdValid` thay thế nó (§18.1).

### OPEN

- User review spec #2 rev 2 và OD2-08..OD2-10 (spec #2 §22).
- Spec #3 brainstorming: câu hỏi đầu tiên ghi ở Session 3: Spec #3.

## Session 3: Spec #3, Compiler & Bundle Architecture (bắt đầu 2026-10-24)

> Bối cảnh ràng buộc:
> - ADR-002 (Hybrid), ADR-004 (vertical slice), ADR-005 (performance chỉ dựa trên đo), ADR-018 (spike cần gate riêng)
> - Spec #1 §12, §14 (compiler front-end, Normalized IR, Release Manifest, Dependency Lock thuộc spec #3)
> - Spec #2 rev 2: §9.2 Capability Lock, §9.4 tiêu thụ release + shared externals, §10.2 nội dung Release Manifest, §11 INV-F1..F7 và L1–L6, §11.5 (custom export condition phải kiểm trong bundler thật)
> - Master BUILD-01..10, PERF-01..07
> - Chưa có quyết định nào của spec #3.

### OPEN

- **Q3-1:** Khi một form được publish, artifact phục vụ khách nên **tự chứa hoàn toàn** (mỗi form có engine, React và plugin riêng trong thư mục của nó; rollback chỉ là đổi con trỏ) hay các form **dùng chung một lớp runtime** (engine/React) được cache chung giữa nhiều form/site?
  - Ảnh hưởng: cache của trình duyệt giữa các form, cách chứng minh isolation (INV-F1, INV-F6), rollback có kéo theo runtime chung không, React singleton, PERF-02.
  - Phỏng đoán của Claude (chưa phải đề xuất chính thức): P0 tự chứa hoàn toàn để bằng chứng BUILD-04/06 và rollback đơn giản; runtime dùng chung chỉ xem xét sau khi có số đo.
  - → đã trả lời ở Spec #3 Answer #1.

## Session 3: Spec #3 Answer #1 (2026-10-24), self-contained form release → ADR-036

### CONFIRMED (user)

- **Q3-1: APPROVED AS DESIGN DIRECTION — Self-contained Form Release cho P0.**
  - Mỗi form release độc lập về deployment, runtime dependency và rollback; vẫn có code splitting, lazy loading, internal chunk.
  - Không có mutable shared runtime giữa các form ở P0.
  - Yêu cầu: asset bất biến riêng cho release; Capability Lock chính xác; import tường minh do compiler sinh; bundle isolation cho Sports, PC và Motion-none; không bundle server/design facet; browser cache và tương thích revision cũ; rollback không cần rebuild; đo bundle size và runtime performance từ artifact thật; không tự kết luận isolation PASS khi chưa có bằng chứng.
- Nhắc lại: OD2-08/09 vẫn OPEN, giải quyết trước spec #5. G1 NOT APPROVED, G9/G10 BLOCKED. Không code, không push, không AWS write.

### OPEN

- **Q3-2:** Khách đang điền dở form PC ở rev 7 thì Editor publish rev 8 (hoặc rollback về rev 6). Khi khách bấm 次へ tiếp trong tab đang mở, và khi khách reload trang, khách nên ở revision nào?
  - Ảnh hưởng: entry URL ổn định và con trỏ revision hiện hành, URL bất biến theo revision, thời gian giữ asset cũ (lazy chunk của tab đang mở), cache header, draft gắn revision (ADR-012, spec #1 §13), supported set và grace window (spec #2 §10.3, OD2-09).
  - Phỏng đoán của Claude: tab đang mở tiếp tục rev 7 tới khi submit; reload có draft rev 7 còn được hỗ trợ thì tiếp tục rev 7 qua URL bất biến của revision, nếu không thì báo nhẹ nhàng và bắt đầu lại trên rev 8; khách mới luôn nhận revision hiện hành.
  - → đã trả lời ở Spec #3 Answer #2.

## Session 3: Spec #3 Answer #2 (2026-10-24), revision pinning, URL và recovery → ADR-037

### CONFIRMED (user)

- **Decision: Session-pinned Revision + Stable Entry URL + Immutable Release URL.** APPROVED AS DESIGN DIRECTION cho spec #3 (chưa duyệt toàn spec, chưa G1).
- **Active vs Supported:**
  - Active Release: release phân phối cho khách mới.
  - Supported Release: release backend vẫn chấp nhận xử lý.
  - Retired/Unsupported Release: backend không còn hỗ trợ.
  - Suspended/Revoked Release: bị hạn chế vì security hoặc operational policy.
  - Inactive ≠ Unsupported. Rollback chỉ đổi Active Release, không mặc nhiên revoke các release publish sau đó.
- **Session pinning:** mở PC rev 7 → pin `formId`, `publishedRevision`, `releaseId`, identity của Capability Lock. Transition theo rev 7. Publish rev 8 hay rollback rev 6 không làm tab đang mở đổi workflow. Backend validate submit theo definition và lock tin cậy của rev 7. Rev 7 còn supported → khách hoàn thành được; bị suspend hoặc không còn supported → backend từ chối theo policy rõ ràng. Không chuyển revision chỉ vì active pointer đổi. Runtime state và active pointer độc lập.
- **Hai loại URL:**
  - Stable Entry URL: cho landing page; khách mới nhận Active Release; phát hiện draft cũ hợp lệ để đề xuất Resume; không nhúng dữ liệu khách vào URL.
  - Immutable Release URL: trỏ tới một release artifact cụ thể; không đổi nội dung sau publish; phục vụ reload, deep link, tab cũ, dynamic import; chỉ tồn tại khi release còn được phân phối theo retention policy.
  - URL chứa revision **không** đủ để định danh artifact; release identity phải phân biệt được nhiều artifact release nếu cần.
  - Phải có resolver/bootstrap cụ thể để **không bao giờ** xảy ra: có draft rev 7 → mở stable URL → tải runtime rev 8 → runtime rev 8 hydrate draft rev 7. Được dùng bootstrap nhẹ quyết định release trước khi khởi tạo runtime; **không** đưa mọi version engine vào bootstrap.
- **Publish/rollback:** publish rev 8 → active pointer chuyển theo activation protocol; session rev 7 không bị chuyển; artifact rev 7 không bị xóa; backend giữ compatibility theo support policy. Rollback rev 6 → pointer về rev 6; khách mới nhận rev 6 sau khi activation/caching có hiệu lực; session rev 7/8 tiếp tục nếu còn supported; không rebuild rev 6; không migrate draft rev 7/8 sang rev 6. Không hứa mọi CloudFront edge cập nhật tức thời; phải mô tả cache propagation và consistency model.
- **Draft recovery:** tuân thủ chính sách đã duyệt (chỉ dữ liệu được phép; không PII bền vững trong browser ở P0). Metadata draft có release identity đã pin. Reload có draft hợp lệ → resume đúng release; không có draft → active release. Không silently migrate. PII mất thì nhập lại. Re-evaluate visibility/validation trước khi khôi phục step; không khôi phục mù `currentStep`. Draft không tương thích hoặc release không còn supported: thông báo rõ; **không âm thầm xóa draft**; đề xuất Start Over trên **current active release**; không đoán mapping; không hứa khôi phục PII. Xét trường hợp hai tab cùng form, tránh draft collision.
- **Old assets retention:** không xóa asset chỉ vì release không còn active. Xét: draft TTL, open-session grace window, backend compatibility window, dynamic import/lazy chunk, browser/CDN cache, security incident, rollback eligibility, storage/cleanup. Phân biệt: không còn cho submit · asset không còn được phục vụ · giữ để rollback · security quarantine (các thời điểm có thể khác nhau). OD2-09 vẫn OPEN; không tự chọn con số trong spec #3.
- **Backend enforcement:** frontend không quyết định support. Backend kiểm: form identity, trusted published revision, Capability Lock, runtime compatibility, release support status, security policy, idempotency. Không tin `revision`/`releaseId` client gửi như bằng chứng authorization. Không còn supported: không xử lý theo bản mới, không làm mất dữ liệu đã nhập, lỗi có contract rõ, UI hướng dẫn. Phân biệt incompatible / temporarily unavailable / permanently retired / security suspended; **không gom mọi lỗi thành 503**.
- **Test matrix** tối thiểu 14 case (ở dưới), mỗi case có expected behavior và nguồn sự thật.
- **Governance:** ghi notes + ADR; đồng bộ assumption ở spec #1 (draft recovery), spec #2 (lock, backend compatibility), spec #3, spec #5 (publishing/activation: pending detailed design). Không tự duyệt OD2-08/09. Cho phép local documentation commit sau khi kiểm staged diff, secret, file nội bộ. Không push, không AWS write. G1 NOT APPROVED, G9/G10 BLOCKED. Sau đó hỏi câu tiếp theo của spec #3.

### PROPOSAL (Claude): release resolution, phiên 3. Chờ review, NOT approved. Sẽ chuyển vào spec #3.

**S3-P01 Release identity.**
- `releaseId` định danh **một artifact đã build**, khác `revision`. Dạng: `rel_<formId>_r<revision>_<contentHash12>`; `contentHash` là hash của Release Manifest (gồm file inventory), nên hai lần build khác nhau của cùng revision có hai `releaseId` khác nhau.
- Backend giữ **release record** tin cậy: `{ releaseId, formId, revision, siteId, releaseManifestHash, capabilityLockHash, supportStatus, securityStatus, retention, createdAt }`. Client gửi `releaseId` chỉ để backend **tra cứu**; mọi thông tin khác lấy từ record, và record phải khớp `formId` + `revision` của request.

**S3-P02 URL (minh họa; hosting thật thuộc spec #5, sau G10).**

| URL | Nội dung | Cache |
|---|---|---|
| Stable Entry `/f/{site}/{form}/` | `entry.html` nhỏ: bootstrap inline + `activeReleaseId` của lần activation | mutable: browser `no-cache`; CDN TTL ngắn `T_edge` và/hoặc invalidation khi activation |
| Immutable Release `/r/{releaseId}/` | `index.html` của release (nhúng `releaseId`, IR) | bất biến: `max-age` dài, `immutable` |
| Assets `/r/{releaseId}/assets/{name}.{hash}.{ext}` | JS/CSS/chunk lazy của release | bất biến |
| Status API (backend) | `GET /api/forms/{formId}/releases/{releaseId}/status` | không cache (hoặc rất ngắn) |

**S3-P03 Bootstrap/resolver.** Inline trong `entry.html`, **không có engine, không có React**, chỉ biết `formId` và `activeReleaseId`. Kích thước đo trên artifact thật (ADR-005).
1. Đọc metadata draft của form trong browser storage (chỉ metadata, không PII): `{ releaseId, revision, sessionId, savedAt, draftFormat }`.
2. Không có draft, hoặc draft của đúng `activeReleaseId` → điều hướng/tải runtime của active release.
3. Draft của release khác `R_d` → gọi status API của `R_d` (timeout ngắn):
   - `supported` → hiện lựa chọn (HTML tĩnh, tiếng Nhật): 「前回の入力を再開する」 / 「最初からやり直す」. Resume = **điều hướng toàn trang** sang `/r/{R_d}/`; runtime active không bao giờ được khởi tạo trong lần tải này.
   - `retired` / `suspended` / `incompatible` → thông báo rõ lý do; nút 「最初からやり直す」 tải active release; draft cũ **không bị xóa ngầm** (giữ tới TTL, có nút xóa tường minh).
   - lỗi mạng / timeout → 「確認できませんでした」 + 再試行 + Start Over; **không** tải active runtime kèm draft.
4. Start Over tạo draft mới cho active release; draft cũ giữ nguyên tới TTL hoặc tới khi khách xóa.
- **INV-R1 (phòng thủ thứ hai):** runtime chỉ hydrate draft có `releaseId` **bằng** `releaseId` nhúng trong chính nó. Lệch → không hydrate, chuyển về stable entry. Nhờ vậy dù bootstrap lỗi, runtime rev 8 cũng không thể hydrate draft rev 7.
- **INV-R2:** Immutable Release URL **không** khởi tạo session mới cho release không active. Mở `/r/{R}/` mà không có draft/session của `R` → chuyển về stable entry (khách mới luôn nhận active). Ngoại lệ: preview/QA có token ký (P1).

**S3-P04 Session pinning trong tab.** Runtime giữ `releaseId` trong bộ nhớ; mọi lazy chunk tải từ `/r/{releaseId}/assets/…` (đường dẫn tương đối của release). `sessionStorage` giữ `{ releaseId, sessionId }`, nên reload trong cùng tab đi qua bootstrap và resume đúng release (nếu còn supported). Submit gửi `{ formId, revision, releaseId, values, idempotencyKey }`.

**S3-P05 Hai tab cùng form.**
- Mỗi tab có `sessionId` riêng; draft lưu theo `formId + sessionId` (không ghi đè lẫn nhau). Không merge giữa các tab.
- `BroadcastChannel` báo tab khác đang mở form (thông tin, không khóa).
- Stable entry có nhiều draft → đề xuất draft mới nhất; các draft khác giữ tới TTL.
- Một tab submit thành công → báo qua `BroadcastChannel`; tab kia hiện 「別のタブで送信が完了しました」 và hỏi trước khi cho submit tiếp. **Giới hạn:** đây là best-effort phía client; hai `idempotencyKey` khác nhau vẫn tạo hai submission nếu khách cố ý xác nhận gửi lại. P0 không dedupe theo nội dung (không dùng PII).

**S3-P06 Trạng thái release và các mốc thời gian.** Bốn chiều độc lập:

| Chiều | Giá trị | Ai quyết | Ghi chú |
|---|---|---|---|
| Activation | `active` / `inactive` | publish/rollback | đúng một active mỗi form |
| Support | `supported` / `retired` | support policy (OD-09, OD2-09) | inactive ≠ retired |
| Security | `normal` / `suspended` | Platform Security (ADR-032, ADR-035) | suspended chặn submit ngay |
| Asset retention | `served` / `withdrawn` / `archived` / `quarantined` | retention policy, security | archived = không phục vụ nhưng giữ để rollback/audit |

Ràng buộc (không có con số cố định, chờ OD2-09/OD-08):
- `supportEndsAt ≥ deactivatedAt + max(G, T_edge_max)`: mọi release từng có thể được cache phục vụ như active phải còn supported đủ lâu.
- `assetsWithdrawnAt ≥ supportEndsAt`: còn nhận submit thì asset (kể cả lazy chunk) còn phục vụ.
- Draft của release đã `withdrawn` vẫn được bootstrap xử lý (status API trả `retired`), không cần asset.
- Rollback tới `R` yêu cầu: `R` không `suspended`/`quarantined`; asset `served` hoặc khôi phục được từ `archived`; precheck adapter (spec #2 §10.4); `R` được đặt lại `supported` nếu đã `retired` (thao tác tường minh, có audit).
- `quarantined` (security): asset có thể bị gỡ ngay; mọi tab đang mở bị chặn ở backend (submit/query); bootstrap báo suspended.

**S3-P07 Consistency model của active pointer.**
- **Nguồn sự thật** là active pointer record ở backend (`formId → { releaseId, pointerVersion }`, đổi bằng compare-and-swap). `entry.html` là **bản chiếu** của record đó.
- Asset và release HTML bất biến → nhất quán mạnh theo URL.
- Stable entry nhất quán **cuối cùng (eventual)**: sau activation, một khách có thể còn nhận release active trước đó trong tối đa `T_edge_max` (TTL hoặc thời gian invalidation lan tới mọi edge, cộng cache trình duyệt nếu có). Hai request tới hai edge khác nhau có thể thấy hai release khác nhau. **Không** đảm bảo monotonic.
- An toàn vì: mọi session pin release của nó; release vừa rời active vẫn supported (ràng buộc ở S3-P06). Security suspend không dựa vào CDN: backend chặn ngay, bootstrap/runtime hiển thị khi gọi status hoặc submit.

**S3-P08 Activation protocol (khung; chi tiết spec #5).**
1. Ghi mọi file immutable của release, kiểm hash từng file.
2. Tạo release record (`inactive`, `supported`).
3. Deploy gate / adapter precheck (spec #2 §10.4).
4. **Đổi active pointer bằng CAS** (`pointerVersion` + 1). Đây là bước duy nhất làm release thành active.
5. Sinh lại `entry.html` từ pointer record và ghi ra.
6. Invalidate CDN cho đường dẫn entry (sau G10).
7. Xác minh: tải stable URL tới khi thấy `releaseId` mới (giới hạn số lần).
- Gián đoạn ở 1–3: release mới chưa active, không ảnh hưởng khách; dọn dẹp hoặc chạy lại. Gián đoạn sau 4: backend đã trỏ release mới nhưng `entry.html` có thể còn cũ → **reconciler** so pointer record với `entry.html` đang phục vụ và ghi lại cho khớp. Rollback dùng cùng protocol, bỏ bước 1 (không rebuild).

**S3-P09 Error contract** (mã lỗi ổn định; HTTP status đề xuất, chốt ở spec #5).

| Loại | Mã | HTTP | `retryable` | UI |
|---|---|---|---|---|
| Incompatible: trạng thái client không xử lý được bằng release tin cậy (release không thuộc form/revision, `draftFormat` lạ, lock lệch) | `E-RELEASE-INCOMPATIBLE` | 409 | không | giải thích; Start Over trên active; draft giữ |
| Temporarily unavailable: adapter/backend tạm không dùng được | `E-CAPABILITY-UNAVAILABLE` | 503 + `Retry-After` | có | 再試行; giữ state |
| Permanently retired | `E-RELEASE-RETIRED` | 410 | không | giải thích; Start Over trên active; draft giữ |
| Security suspended (release hoặc capability) | `E-RELEASE-SUSPENDED`, `E-CAPABILITY-BLOCKED` | 423 | không (tới khi incident xử lý xong) | giải thích, không hứa thời điểm; giữ state |
| Validation | (spec #1 V-08) | 422 | không | về step lỗi |
| Idempotency key dùng lại với payload khác | `E-IDEMPOTENCY-KEY-REUSED` | 409 | không | nội bộ (engine tạo key mới) |

Mọi lỗi kèm `{ code, retryable, releaseId, userAction }`; không chứa PII.

**S3-P10 Test matrix (TM-R01..R14).**

| # | Tình huống | Kết quả mong đợi | Nguồn sự thật |
|---|---|---|---|
| R01 | Publish rev 8 khi tab đang mở rev 7 | tab tiếp tục rev 7, transition theo rev 7, submit được nếu rev 7 supported | session pin (runtime) + release record rev 7 |
| R02 | Rollback rev 6 khi tab đang mở rev 7 | như R01; rev 7 không bị revoke | session pin + release record rev 7 |
| R03 | Reload với draft rev 7 hợp lệ (rev 7 vẫn active) | bootstrap tải rev 7, khôi phục theo NR-08/NR-09 | draft metadata + `activeReleaseId` |
| R04 | Reload không có draft | tải active release | `entry.html` (bản chiếu pointer) |
| R05 | Resume draft rev 7 khi rev 8 active | đề xuất Resume; Resume → điều hướng `/r/rel_…r7…/`; runtime rev 8 không khởi tạo | status API (`supported`) + INV-R1 |
| R06 | Resume khi rev 7 retired | thông báo, Start Over trên active, draft giữ | status API (`retired`) |
| R07 | Resume khi rev 7 security-suspended | thông báo suspended, không tải rev 7; Start Over chỉ nếu active không bị suspend | status API (`suspended`) |
| R08 | Tab rev 7 lazy-load chunk sau khi rev 8 active | chunk tải từ `/r/{rev7}/assets/…` thành công | asset retention (`served`) |
| R09 | CDN/browser còn cache `entry.html` cũ | khách nhận release active trước đó, session pin release đó, submit được | ràng buộc `supportEndsAt` (S3-P06) |
| R10 | Submit đúng lúc trạng thái rev 7 đổi | backend quyết theo trạng thái tại thời điểm xử lý (đọc trong cùng transaction); trước thay đổi → nhận; sau → 410/423; không ghi nửa chừng | release record trong transaction submit |
| R11 | Hai tab cùng form | hai draft riêng theo `sessionId`; báo tab khác; submit ở tab A → tab B được cảnh báo | browser storage + `BroadcastChannel` (best-effort) |
| R12 | Reload ở step không còn hợp lệ, PII mất | về `firstIncomplete` kèm giải thích (NR-08/NR-09, E9) | engine `derivedPath(values)` |
| R13 | Mở trực tiếp immutable URL cũ | có draft/session của release đó và còn supported → resume; không có → chuyển về stable entry | INV-R2 + status API |
| R14 | Publish/rollback gián đoạn giữa các bước | trước bước 4: không đổi gì với khách; sau bước 4: reconciler đưa `entry.html` khớp pointer | active pointer record (CAS) |

**S3-P11 Pending cho spec #5 (Publishing/Activation, chưa thiết kế chi tiết):** lưu trữ release record và pointer; status API; activation protocol và reconciler; CDN invalidation và cache header thật (sau G10); retention job; HTTP status cuối cùng của S3-P09; lưu draft metadata và TTL (OD-08); grace window (OD2-09); số `T_edge_max` theo hạ tầng.

### Đã thực hiện (Claude)

- ADR-037 (session-pinned revision + stable entry URL + immutable release URL).
- Đồng bộ: spec #1 rev 3.2 (§9 `session`, §13 draft và submit của revision cũ), spec #2 rev 2.1 (§10.3 active ≠ supported, §10.6 phân loại lỗi, §19 I-19/I-22). Spec #3 chưa có tài liệu; S3-P01..P11 sẽ chuyển vào spec #3.

### OPEN

- **Q3-3:** Khi khách mở form trên điện thoại với mạng chậm, bạn muốn step đầu tiên hiện ra ngay từ HTML tĩnh trước khi JavaScript tải xong (prerender lúc build), hay chấp nhận một khung chờ nhẹ cho tới khi runtime khởi động (render hoàn toàn phía client)?
  - Ảnh hưởng: LCP/INP (PERF-03), độ phức tạp của compiler (render React lúc build, hydration), tương tác với bootstrap/resolver (HTML prerender của active release không được hiện cho khách có draft của release khác), A11y/IME khi trang hiện trước lúc tương tác được, kích thước `entry.html`.
  - Phỏng đoán của Claude: P0 render phía client với bootstrap nhỏ và khung chờ; chỉ thêm prerender nếu số đo trên artifact thật cho thấy cần (ADR-005).
  - → đã trả lời ở Spec #3 Answer #3.

## Session 3: Spec #3 Answer #3 (2026-10-24), chiến lược render ban đầu → ADR-038

> Câu trả lời đến trong hai tin nhắn (tin đầu bị cắt giữa mục 4). Đã nhận đủ mục 1–9.

### CONFIRMED (user)

- **Decision: APPROVED AS DESIGN DIRECTION — P0 dùng CSR với Loading Shell nhẹ, trung tính với revision.** Chưa duyệt toàn spec #3 hay G1.
- **Rendering P0:** Client-Side Rendering cho customer form. Không bắt buộc React SSR/SSG/prerender/hydration ở P0.
  - Luồng: Stable Entry URL → Lightweight Bootstrap → resolve release active/đã pin → tải đúng Immutable Release → khởi tạo React runtime → render form.
  - Loading Shell không phụ thuộc React hay plugin runtime.
  - Không tải engine, plugin catalog hay Motion trước khi resolver xác định release.
- **Loading Shell UX:** hiện nhanh bằng HTML/CSS tối giản; responsive mobile; trạng thái loading rõ bằng tiếng Nhật; không animation phức tạp; hỗ trợ reduced motion; không có field tương tác giả; không gây layout shift lớn khi form render; không hiện thông tin nhạy cảm; không hiện nội dung đặc thù của revision trước khi xác định revision. Được dùng skeleton trung tính về bố cục nhưng không giả vờ form đã tương tác được. Chuyển Shell → Form mượt, không mất keyboard focus hay accessibility semantics. Có error/retry UI khi runtime hoặc resolver không tải được; không loading vô hạn.
- **Revision safety (theo ADR-037):** bootstrap xác định release trước khi tải React runtime; draft hợp lệ của release cũ → Resume đúng release; không render rev 8 rồi mới đổi sang rev 7; runtime chỉ hydrate draft cùng `releaseId`; không tự migrate draft; backend xác thực support status; không tin metadata client làm bằng chứng authorization. Network/status API lỗi → failure tất định. Không giả định release còn supported chỉ vì có draft local. Không bypass security policy để tránh màn hình lỗi.
- **Performance:** chưa yêu cầu con số tuyệt đối khi chưa có baseline, nhưng spec #3 phải có **measurement contract** cho: TTFB, FCP, LCP, CLS, INP, bootstrap JS bytes, initial CSS bytes, initial runtime JS bytes, Time to Form Visible, Time to Form Interactive/Ready, số request ban đầu, hành vi mạng chậm, cold vs warm cache.
  - Phân biệt ba thời điểm: (1) Loading Shell xuất hiện; (2) customer form có nội dung thật; (3) khách nhập liệu và tương tác ổn định. Không dùng FCP đẹp của shell để tuyên bố cả form có performance tốt. Không tuyên bố LCP/INP đạt mục tiêu khi chưa đo.
- **Prerender là tối ưu tương lai:** không loại bỏ về kiến trúc. Khi benchmark chứng minh CSR gây vấn đề lớn, có thể đánh giá: prerender lúc build theo từng immutable release, HTML tĩnh chứa step đầu, hydration React, khớp HTML/client tất định, plugin contract tương thích SSR, progressive loading. Prerender chỉ sau khi release identity đã được resolve đúng. **Stable Entry URL không được chứa prerender đặc thù form của active revision** để rồi hiện nhầm cho người đang resume revision khác. Không implement prerender ở P0 chỉ vì công nghệ hỗ trợ.
- **Sửa release identity hashing:** câu "hai lần build cùng revision sẽ có hai releaseId" chưa luôn đúng. Contract chính xác: cùng canonical hash input và cùng artifact content có thể cho cùng `releaseId`; khác content hoặc hash input có ý nghĩa phải tạo identity khác; không đưa `releaseId` vào chính nội dung được hash (circular); phân biệt logical manifest, final release metadata, signature, timestamp; định nghĩa trường nào thuộc canonical hash input; có xử lý collision/duplicate và publish release idempotent. Mục tiêu: identity tất định và artifact integrity. Không dùng timestamp hay randomness chỉ để tạo `releaseId` khác nhau nếu không có lý do kiến trúc.
- **Bootstrap và CSP:** so sánh A (inline + CSP hash) với B (`bootstrap.js` external có version) theo CSP, cache, số request, độc lập update/rollback, bảo mật, maintainability, active release resolution. Không dùng `unsafe-inline` mặc định. Không nhúng mutable active pointer vào immutable bootstrap script. Stable entry có cache policy hợp với activation protocol; resolver có nguồn sự thật rõ ràng.
- **Scenario matrix bổ sung:** cold mobile/slow network; warm cache/repeat visit; resume rev 7 khi active rev 8; rollback trong lúc bootstrap resolve; status API chậm/không khả dụng; bootstrap OK nhưng runtime chunk lỗi; offline; CSP chặn script; JavaScript tắt; Back/Forward; thông báo loading cho bàn phím/screen reader; reduced motion; entry cũ bị cache; reload khi runtime chưa khởi tạo xong. Phân loại automated / manual / future verification theo risk.
- **Governance:** ghi Q3-3 vào ADR và notes; đồng bộ spec #1 (draft recovery), spec #2 (release compatibility) nếu cần; cho phép local documentation commit sau staged-diff/security check; không code, không push, không AWS write; G1 NOT APPROVED, G9/G10 BLOCKED. Câu hỏi tiếp theo nên về compiler pipeline, chunk splitting hoặc reproducible build.

### PROPOSAL (Claude): bổ sung sau Answer #3. Chờ review, NOT approved. Sẽ chuyển vào spec #3.

**S3-P12 Release identity tất định (thay đoạn `releaseId` ở S3-P01).**

Ba lớp, chỉ lớp đầu quyết định identity:

| Lớp | Nội dung | Thuộc canonical hash input? |
|---|---|---|
| **Logical Release Manifest (LRM)** | `lrmFormat`; `formId`, `siteId`, `revision`; hash Normalized IR; hash Capability Lock (FBK + hash facet); version chính xác của engine, compiler, bundler, shared externals; hash build config (base path policy, target browsers, chế độ build); **file inventory**: mọi file phục vụ của release trừ `index.html`, sắp xếp theo path, mỗi file `{ path, size, sha256, contentType }` | ✔ toàn bộ, canonical JSON (RFC 8785) |
| **Release HTML** | `index.html` sinh **sau** khi có `releaseId`, bằng template tất định từ LRM + `releaseId` | ✘ (để tránh vòng lặp); hash của nó ghi ở lớp dưới |
| **Final Release Metadata (FRM)** | `releaseId`, digest đầy đủ của LRM, `indexHtmlSha256`, thời điểm tạo, pipeline id, con trỏ tới provenance, signature (phase sau) | ✘ |

- `releaseId = "rel_" + base32(sha256(JCS(LRM)))` cắt còn 26 ký tự (130 bit) cho URL; digest đầy đủ lưu trong FRM.
- **Không file nào trong inventory chứa `releaseId`.** Runtime biết identity của mình qua `index.html` (khối dữ liệu `<script type="application/json" id="release">`, không thực thi). Asset JS/CSS chỉ chứa hash nội dung, nên không có vòng lặp.
- **Ngoài hash input:** timestamp, hostname/đường dẫn tuyệt đối của máy build, thời gian build, số ngẫu nhiên, signature, provenance pointer, backend deployment version lúc publish. Những thứ này nằm ở FRM hoặc provenance.
- **Hệ quả:**
  - Cùng LRM (cùng input có ý nghĩa và cùng byte artifact) → cùng `releaseId`. Đăng ký lại là **idempotent** (trả về release đã có; activation là bước riêng).
  - Build không tái lập (cùng input nhưng byte khác) → inventory khác → `releaseId` khác. Đây là tín hiệu để điều tra tính tái lập (Q3-4), không phải cách cố ý tạo identity mới.
  - Hai form có nội dung giống nhau vẫn có `releaseId` khác vì `formId` nằm trong LRM.
- **Collision/duplicate:** khi đăng ký, nếu `releaseId` đã có: digest đầy đủ và LRM giống → no-op; khác → `E-RELEASE-ID-COLLISION`, dừng, không ghi đè (thực tế gần như không xảy ra, nhưng phải tất định).
- **Integrity:** khi phục vụ hoặc rollback, kiểm từng file theo inventory và `index.html` theo `indexHtmlSha256`.

**S3-P13 Bootstrap: A (inline + CSP hash) vs B (external có version).**

| Tiêu chí | A. Inline + CSP hash | B. `bootstrap.<hash>.js` external, bất biến |
|---|---|---|
| CSP | `script-src 'sha256-…'`; hash đổi mỗi khi code bootstrap đổi → header CSP và `entry.html` phải đổi đồng thời; dùng `<meta>` CSP thì mất một số directive (`frame-ancestors`, report) | `script-src 'self'`, không có hash phải đồng bộ |
| Cache trình duyệt | code tải lại cùng `entry.html` mỗi lần (vì entry `no-cache`) | cache dài hạn, dùng chung giữa các form cùng origin; lần sau 0 byte |
| Số request ban đầu | 0 thêm | +1 khi cold (cùng origin, HTTP/2) |
| Độc lập update/rollback | version bootstrap gắn với lần sinh `entry.html`; mỗi activation có thể vô tình đổi bootstrap | bootstrap có version riêng của platform; rollback form không đổi bootstrap; entry cũ trong cache vẫn trỏ file bootstrap cũ còn tồn tại |
| Bảo mật | không `unsafe-inline`, nhưng dễ trượt sang nới CSP khi hash lệch | SRI được; code platform đã review |
| Maintainability | khó test, khó đo riêng | module thường, test/lint/budget riêng |
| Active pointer | trong HTML mutable (hợp lệ) | trong HTML mutable dưới dạng dữ liệu JSON, **không** trong script bất biến |

**Khuyến nghị: B**, kèm:
- `entry.html` (mutable): HTML shell + CSS shell tối thiểu inline với `style-src 'sha256-…'` (CSS shell do platform version hóa, ít đổi; inline để shell hiện ngay khi cold) + khối dữ liệu `<script type="application/json" id="active">{ formId, activeReleaseId, pointerVersion }</script>` + `<script src="/_platform/bootstrap.<hash>.js" defer integrity="…">` + `<noscript>`.
- Nguồn sự thật: active pointer record ở backend; `entry.html` là bản chiếu; bootstrap chỉ đọc dữ liệu, không giữ pointer.
- Cache: `entry.html` `no-cache` + ETag (trình duyệt luôn revalidate), CDN TTL ngắn/invalidation khi activation (spec #5); `bootstrap.<hash>.js`, asset release: `immutable`.
- Trade-off chấp nhận: thêm 1 request khi cold; đo ở benchmark. Nếu số đo cho thấy đáng kể, cân nhắc A cho riêng phần resolver nhưng vẫn không dùng `unsafe-inline`.

**S3-P14 Measurement contract.**

| Mốc | Định nghĩa | Cách đo |
|---|---|---|
| T1 Shell visible | FCP của `entry.html` | Performance API / Lighthouse lab |
| T2 Form visible | step đầu tiên có nội dung thật được render | `performance.mark("form:visible")` do runtime đặt + element timing |
| T3 Form ready | handler đã gắn, field đầu tiên focus/nhập được, không còn chunk bắt buộc đang chờ | `performance.mark("form:ready")` |
| Khác | TTFB, LCP, CLS, INP, bootstrap JS bytes, initial CSS bytes, initial runtime JS bytes, số request ban đầu | web-vitals + bundle stats |

- Mọi số đo ghi rõ **lab-only** (thiết bị, throttling, cold/warm) cho tới khi có dữ liệu thật (PERF-03). Báo cáo luôn tách T1, T2, T3; không dùng T1 để kết luận về form.
- Budget chưa có con số; đặt sau baseline và duyệt ở G1 (ADR-005).

**S3-P15 Prerender (tương lai).** Nếu có, chỉ ở **Immutable Release URL** (sau khi release đã được resolve), không bao giờ ở Stable Entry. Điều kiện trước khi đánh giá: benchmark CSR chứng minh vấn đề; plugin contract tương thích SSR (spec #2 sẽ cần mở rộng); HTML/client khớp tất định.

**S3-P16 Scenario matrix loading/bootstrap (TM-L01..L14).** Loại: **A** = automated (unit/integration/Playwright), **M** = manual, **F** = future verification (sau G10 hoặc khi có hạ tầng thật).

| # | Tình huống | Kết quả mong đợi | Nguồn sự thật | Loại |
|---|---|---|---|---|
| L01 | Cold mobile, mạng chậm | shell hiện từ HTML + CSS inline; resolver chạy sau khi bootstrap tải; báo cáo T1/T2/T3 riêng | số đo lab | A (Playwright throttle, lab) + M (thiết bị thật) |
| L02 | Warm cache, quay lại | bootstrap và asset từ cache; `entry.html` revalidate (304) | cache header | A |
| L03 | Resume draft rev 7 khi active rev 8 | như TM-R05: đề xuất Resume, rev 8 không khởi tạo | status API + INV-R1 | A |
| L04 | Rollback xảy ra trong lúc bootstrap resolve | bootstrap dùng `activeReleaseId` đã đọc; session pin release đó; release này vẫn supported | ràng buộc S3-P06 | A (integration, đổi pointer giữa chừng) |
| L05 | Status API chậm hoặc không khả dụng | sau timeout: 「確認できませんでした」 + 再試行 + Start Over; không tải runtime kèm draft | bootstrap (tất định) | A (mock) |
| L06 | Bootstrap OK, runtime chunk lỗi | shell chuyển sang lỗi + 再試行 (tải lại đúng release); không loading vô hạn | bootstrap bắt lỗi tải script + timeout | A (chặn route) |
| L07 | Offline | trước khi tải: trang lỗi mặc định của trình duyệt (P0 không có service worker); giữa chừng: engine xử lý lỗi mạng ở query/submit (spec #1 §11) | trình duyệt / engine | A (giữa chừng) + M |
| L08 | CSP chặn script | shell không treo: thông báo dự phòng thuần CSS hiện sau N giây (không cần JS, không phải chuyển động) mời tải lại; CSP report cho vận hành | CSS shell | A (phục vụ sai hash) |
| L09 | JavaScript tắt | `<noscript>`: 「このフォームをご利用いただくには、JavaScriptを有効にしてください。」 | HTML | A (`javaScriptEnabled: false`) |
| L10 | Back/Forward | về stable entry: bootstrap resolve lại (có thể đề xuất Resume); trong form: spec #1 C5; trang khôi phục từ bfcache không khởi tạo runtime lần hai | bootstrap + engine | A |
| L11 | Bàn phím/screen reader | shell có `role="status"` `aria-live="polite"` 「読み込み中…」; khi form sẵn sàng: thông báo 「フォームを読み込みました」, đưa focus tới tiêu đề step (tabindex=-1) chỉ khi người dùng chưa tự di chuyển focus | runtime a11y | A (axe, kiểm focus) + M (VoiceOver/NVDA) |
| L12 | Reduced motion | shell không có chuyển động, chỉ chữ/trạng thái tĩnh | CSS `prefers-reduced-motion` | A (emulate) |
| L13 | `entry.html` cũ bị cache | nhận release active trước đó (vẫn supported) và chạy bình thường; nếu đã retired → thông báo, Start Over tải `entry.html` mới với revalidate bắt buộc | S3-P06, status API | A (integration) + F (CDN thật) |
| L14 | Reload khi runtime chưa khởi tạo xong | bootstrap chạy lại; marker trong `sessionStorage` (nếu có) → cùng release; không tạo draft trùng | bootstrap + session marker | A |

### Đã thực hiện (Claude)

- ADR-038 hoàn chỉnh (đủ mục 1–9). ADR-037 ghi chú: định nghĩa `releaseId` thay bằng S3-P12.
- Đồng bộ: spec #2 rev 2.2 (§10.2: tách LRM và FRM). Spec #1 không cần sửa (draft recovery đã dùng `releaseId`, INV-R1).

### OPEN

- **Q3-4 (reproducible build):** Khi build lại cùng một release từ cùng input, bạn cần byte-for-byte giống hệt (để `releaseId` trùng và rebuild là bằng chứng integrity), hay chấp nhận "tương đương chức năng" với hash khác?
  - Ảnh hưởng: môi trường build (pin toolchain, container cố định hay máy local), ý nghĩa của rebuild-verification (spec #2 AC2-06), S3-P12, cách xử lý khi bundler không tất định.
  - Phỏng đoán của Claude: byte-for-byte cho mọi file trong inventory, build trong môi trường đã pin; nếu spike cho thấy bundler không tất định thì ghi thành defect cần xử lý, không nới contract.
  - → đã trả lời ở Spec #3 Answer #4.

## Session 3: Spec #3 Answer #4 (2026-10-24), reproducible build → ADR-039

### CONFIRMED (user)

- **DECISION: APPROVED AS DESIGN DIRECTION — Byte-for-byte Reproducible Build cho trusted release artifact.** Chưa duyệt toàn spec #3 hay G1.
- **Yêu cầu:** cùng canonical build input, cùng toolchain, cùng dependency lock và artifact digest, cùng build instruction, cùng môi trường chuẩn → artifact giống hệt từng byte, so bằng SHA-256 (hoặc hash mật mã phù hợp). Tương đương chức năng mà khác byte **không** phải reproducible build thành công. Phạm vi: các release artifact đã định nghĩa; không yêu cầu CI log, timestamp, báo cáo vận hành giống hệt.
- **Build environment chuẩn cho CI release:** container image pin theo digest; Node chính xác; Python chính xác nếu tham gia compilation; package manager chính xác; lockfile; version compiler/bundler/minifier; hash plugin release artifact; version engine/runtime; build config chuẩn; locale, timezone và input môi trường có ảnh hưởng được cố định; thứ tự file và serialization tất định; không phụ thuộc đường dẫn tuyệt đối; không timestamp/random trong artifact thuộc phạm vi identity. Không floating dependency resolution. Local build linh hoạt hơn nhưng không thay bằng chứng trusted release.
- **Verification protocol:** (1) resolve input bất biến → (2) build A trong môi trường sạch → (3) build B độc lập từ cùng input → (4) so toàn bộ artifact inventory → (5) so hash → (6) giống hệt: tiếp tục integrity/release check → (7) khác: fail kèm báo cáo diff. Không hợp thức hóa output khác nhau thành release mới khi tuyên bố cùng input. Build cache không được che non-determinism; cần clean-build verification.
- **S3-P12 bổ sung:** LRM có canonical serialization contract; inventory có relative path + content hash từng file trong phạm vi; sort và path normalization tất định; định nghĩa hash algorithm và schema version của manifest; `releaseId` không tự tham chiếu; xử lý duplicate/collision; cùng LRM → cùng `releaseId`; khác input có ý nghĩa → identity khác hoặc bị kiểm incompatibility. **Cùng input khai báo mà byte khác là reproducibility failure, không phải cơ chế tạo release mới.**
- **index.html integrity:** LRM → `releaseId` → `index.html` tất định → Final Release Metadata/Attestation ghi hash `index.html` → integrity gate kiểm toàn bộ artifact set kể cả `index.html` → record integrity cuối không được sửa sau approval. Phân biệt: immutable release `index.html` · mutable Stable Entry HTML · build artifact · build provenance · operational status record. Stable Entry HTML không thuộc identity của release.
- **Provenance (theo tinh thần SLSA Build Provenance, mức PoC):** source commit, builder identity, build instruction, dependency đã resolve, toolchain, artifact hash, build config identity. Reproducibility và provenance là hai thuộc tính khác nhau; artifact tái lập được không tự chứng minh nguồn hay pipeline đáng tin. Không cần SLSA certification ở P0.
- **Failure semantics:** non-deterministic output, thiếu dependency, hash mismatch, manifest không nhất quán, file output ngoài dự kiến, trùng path artifact, lệch version compiler, dependency không tin cậy, trùng `releaseId` → pipeline fail với diagnostic rõ. Không fallback, không ghi đè artifact bất biến, không activate release lỗi. Mọi check security/integrity xong trước activation.
- **S3-P13:** đồng ý `bootstrap.js` external có version cho P0. CSP hợp topology production; SRI/hash khi cấu hình phù hợp; không `unsafe-inline` mặc định; CSS shell inline tuân CSP; active-pointer metadata của Stable Entry **không** phải bằng chứng authoritative; backend vẫn enforce release status và security policy; bootstrap không tải runtime của revision sai. **Fallback thuần CSS không biết chắc CSP chặn JS hay runtime đang chậm** → mô tả là generic fallback notice, không phải CSP failure detector. JS tắt → `<noscript>`. Không tạo UX hứa phát hiện mọi lỗi bootstrap khi chưa có JS chạy.
- **Scope:** không overengineer. Ưu tiên một môi trường tham chiếu, output tất định, lock chính xác, diff verification, release bất biến, evidence. Không cần build farm, nhiều cloud builder, tất định giữa các OS, artifact registry phức tạp, build-cache orchestration.
- **Test matrix** (11 case, có expected, pass/fail, vị trí evidence) — ở S3-P21.
- **Governance:** ghi Answer #4 và điều chỉnh S3-P12/P13 vào ADR + notes; chi tiết chưa review giữ PROPOSED; cho phép local documentation commit sau staged-diff/security check; không code, không push, không AWS write; G1 NOT APPROVED, G9/G10 BLOCKED. Câu hỏi tiếp theo ưu tiên: compiler pipeline stages, static vs dynamic plugin import, chunk splitting, release artifact verification. Khi đủ thông tin thì tạo Spec #3 Architecture Proposal.

### PROPOSAL (Claude): sau Answer #4. Chờ review, NOT approved. Sẽ chuyển vào spec #3.

**S3-P12 rev 2 — LRM contract.**
- `lrmFormat: 1` (schema version của LRM, có JSON Schema 2020-12 riêng). Đổi cấu trúc LRM = tăng `lrmFormat`.
- **Serialization:** RFC 8785 (JCS) trên UTF-8; mọi số trong LRM là integer; không trường tùy chọn mang giá trị `null` (bỏ hẳn trường).
- **Hash:** SHA-256 cho từng file và cho LRM. `releaseId = "rel_" + base32-lowercase-không-padding(sha256(JCS(LRM)))[:26]`; digest đầy đủ (hex 64) lưu ở Final Release Attestation.
- **Phạm vi inventory:** mọi file phục vụ dưới `/r/{releaseId}/` **trừ** `index.html`. Sourcemap không phục vụ công khai ở P0 (SEC-04); nếu sinh ra để debug thì là private artifact, liệt kê kèm hash trong provenance, không thuộc LRM.
- **Path:** tương đối với gốc release, phân tách `/`, ký tự cho phép `[a-z0-9._/-]` (compiler sinh tên, không lấy từ dữ liệu Editor), cấm `..`, `./`, `/` đầu, `//`, path rỗng. Hai path chỉ khác hoa/thường → `E-ARTIFACT-PATH-COLLISION`. Sắp xếp theo thứ tự byte UTF-8.
- **Mỗi entry:** `{ path, size, sha256, contentType }`; `contentType` lấy từ bảng cố định theo đuôi file (không đoán theo nội dung).
- **Verification:** tính lại `sha256(JCS(LRM))` → phải ra đúng `releaseId` và digest trong attestation.
- **Cùng `releaseId` đã có:** digest đầy đủ + LRM giống → no-op (idempotent); khác → `E-RELEASE-ID-COLLISION`.
- **Input khai báo giống nhau mà byte khác** (phát hiện ở verification hai build, S3-P18) → `E-BUILD-NON-REPRODUCIBLE` (NON_REPRODUCIBLE_BUILD); không đăng ký release nào.

**S3-P17 Canonical build environment (P0).**
- **Builder image:** một image Docker (Docker 29.1.3 có sẵn trên máy) pin theo **digest**, chứa Node (version chính xác), package manager (version chính xác, qua corepack hoặc cài cố định), không có gì khác cần cho build. Python **không** tham gia compilation theo thiết kế hiện tại (analyzer chạy trong Node build worker); nếu sau này tham gia thì pin version tương tự.
- **Môi trường cố định:** `TZ=UTC`, `LANG=C.UTF-8`, `LC_ALL=C.UTF-8`, umask cố định, đường dẫn build cố định trong container (ví dụ `/build`), `NODE_ENV=production`, `SOURCE_DATE_EPOCH` = thời điểm commit (chỉ để công cụ nào cần timestamp có giá trị cố định; mục tiêu là không có timestamp trong artifact).
- **Dependency:** cài từ lockfile ở chế độ frozen (không resolve lại); không mạng trong bước build sau khi cài (giảm phụ thuộc ngoài); plugin release lấy từ release store theo hash (spec #2 §9.4).
- **Build config chuẩn:** một file config có hash (target browser, base path policy, minifier option, chunk naming theo content hash), nằm trong LRM.
- **Toolchain manifest:** version chính xác của Node, package manager, bundler, minifier, compiler, engine → ghi vào LRM (phần ảnh hưởng output) và provenance.
- **Local build:** được dùng để phát triển và Dev Preview (spec #2 §9.5), không bao giờ là bằng chứng trusted release.

**S3-P18 Verification protocol.**

| Bước | Việc | Thất bại |
|---|---|---|
| 1 | Resolve input bất biến: commit sạch, lockfile, hash plugin release, digest builder image, build config | `E-BUILD-UNPINNED-DEP`, `E-BUILD-DEP-MISSING`, `E-BUILD-UNTRUSTED-DEP` |
| 2 | Build A: container mới, không cache | build error |
| 3 | Build B: container mới khác, không cache, **khác thư mục mount trên host** (để lộ phụ thuộc đường dẫn) | build error |
| 4 | So inventory A/B (tập path, size) | `E-BUILD-NON-REPRODUCIBLE` + diff |
| 5 | So SHA-256 từng file và digest LRM | `E-BUILD-NON-REPRODUCIBLE` + diff |
| 6 | Kiểm toolchain thực tế khớp toolchain manifest | `E-TOOLCHAIN-MISMATCH` |
| 7 | Tính `releaseId`, kiểm trùng (S3-P12) | `E-RELEASE-ID-COLLISION` |
| 8 | Sinh `index.html`, ghi Final Release Attestation | — |
| 9 | Integrity gate (S3-P19) | `E-ARTIFACT-HASH-MISMATCH`, `E-ARTIFACT-UNEXPECTED-FILE`, `E-LRM-INCONSISTENT` |
| 10 | Chỉ khi tất cả pass: đăng ký release (inactive) → activation theo S3-P08 | — |

- P0 dùng **cả hai build sạch** (quy mô PoC chịu được chi phí). Cache chỉ dùng cho build dev.
- Báo cáo diff: danh sách path khác, hash A/B, diff nội dung dạng text cho file text; công cụ diff do builder chọn.

**S3-P19 Final Release Attestation và integrity gate.**
- **Final Release Attestation (FRA):** `{ attestationFormat, releaseId, lrmDigest, indexHtmlSha256, artifactSetDigest (sha256 của JCS danh sách mọi file đã phục vụ, kể cả index.html), provenanceDigest, createdAt }`. Ghi **một lần** vào release store; sau approval không sửa (write-once). Cần sửa → đó là release khác, không phải sửa record.
- **Integrity gate** (trước activation và khi rollback): mọi file trong inventory tồn tại và đúng hash; `index.html` đúng `indexHtmlSha256`; **không có file nào ngoài** inventory + `index.html`; `releaseId` tính lại khớp; FRA khớp LRM.
- **Năm loại dữ liệu tách biệt:** immutable release `index.html` (thuộc artifact set, có hash trong FRA) · mutable Stable Entry HTML (bản chiếu active pointer, không thuộc identity) · build artifact (thuộc LRM) · build provenance (S3-P20) · operational status record (activation, support, security, retention; spec #5).

**S3-P20 Provenance (mức PoC, theo tinh thần SLSA Build Provenance).** `{ subject: [{ releaseId, artifactSetDigest }], source: { commit, treeClean: true }, builder: { imageDigest, pipelineId, operator (P0: local) }, buildInstructions: { command, buildConfigDigest }, resolvedDependencies: [{ name, version, integrity }], pluginReleases: [{ PRK, facetHashes }], toolchain: {...}, reproducibility: { buildA, buildB, identical: true } }`. Lưu cạnh FRA, digest ghi trong FRA. Không ký ở P0 (ADR-030). Ghi rõ: provenance nói release **được build thế nào và từ đâu**; reproducibility nói **build có tất định không**; cả hai không chứng minh pipeline đáng tin.

**S3-P13 rev 2 — Bootstrap.**
- Thông báo dự phòng thuần CSS là **generic fallback notice**: hiện sau N giây nếu form chưa thay shell, nội dung không đoán nguyên nhân, ví dụ 「読み込みに時間がかかっています。通信環境をご確認のうえ、ページを再読み込みしてください。」. Không tuyên bố đó là lỗi CSP.
- TM-L08 sửa thành: "CSP chặn script → shell hiện generic fallback notice sau N giây; CSP report (nếu cấu hình) cho vận hành biết nguyên nhân".
- Active pointer trong `entry.html` chỉ dùng để chọn release cho khách mới; backend vẫn kiểm support/security ở mọi query/submit.

**S3-P21 Test matrix reproducible build (TM-B01..B11).** Evidence (sau G1): `docs/evidence/<phase>/release-verification/<case>/` gồm command, output, hash list, diff report.

| # | Case | Expected | Pass | Fail |
|---|---|---|---|---|
| B01 | Hai build sạch cùng input | inventory và hash giống hệt | mọi SHA-256 trùng, `releaseId` trùng | bất kỳ file nào khác |
| B02 | Đảo thứ tự liệt kê file (filesystem trả thứ tự khác) | output không đổi | hash giống B01 | khác hash |
| B03 | Đổi source hoặc plugin dependency có ý nghĩa | `releaseId` khác; inventory phản ánh thay đổi | `releaseId` ≠ bản gốc | `releaseId` trùng |
| B04 | Đổi timestamp/log/metadata vận hành | `releaseId` không đổi | trùng | khác |
| B05 | Dependency không pin (range, thiếu trong lock) | build bị từ chối trước khi chạy | `E-BUILD-UNPINNED-DEP` | build chạy tiếp |
| B06 | Artifact của dependency/plugin bị thay đổi (hash khác lock) | integrity fail | `E-ARTIFACT-HASH-MISMATCH` / `E-LOCK-UNRESOLVABLE` | build dùng artifact lạ |
| B07 | Sửa `index.html` sau khi sinh | integrity gate fail | lỗi với `indexHtmlSha256` | qua gate |
| B08 | Sửa LRM | verification `releaseId` fail | `E-LRM-INCONSISTENT` | qua gate |
| B09 | Cùng input khai báo, output khác (ví dụ chèn non-determinism cố ý) | `E-BUILD-NON-REPRODUCIBLE`, không đăng ký release | lỗi + diff report | release được tạo |
| B10 | Build revision khác của cùng form | `releaseId` khác; resolver/status không trả nhầm release | khác identity, tra đúng record | resolve nhầm |
| B11 | Publish fail ở integrity gate | active release không đổi | pointer giữ nguyên, `pointerVersion` không tăng | pointer bị đổi |

### Đã thực hiện (Claude)

- ADR-039 (reproducible build, LRM contract, attestation, provenance, failure semantics). ADR-038 ghi chú: S3-P13 rev 2.
- Không cần sửa spec #1/#2 (spec #2 §9.3 rebuild và AC2-06 đã dựa trên tính tái lập của spec #3).

### OPEN

- **Q3-5 (static vs dynamic import, chunk splitting):** Plugin như `store-selector` chỉ dùng ở một nhánh (店頭買取). Bạn muốn code của nó nằm trong bundle ban đầu, hay tách thành chunk chỉ tải khi khách có khả năng đi vào nhánh đó?
  - Ảnh hưởng: initial runtime JS bytes và T2/T3 (S3-P14); độ trễ khi chuyển step; xử lý chunk lỗi giữa form (không mất dữ liệu); prefetch; Motion lazy (biến thể Motion-none); cách chứng minh INV-F1/F6 khi có nhiều chunk. Mọi `import()` vẫn là literal do compiler sinh (INV-F3).
  - Phỏng đoán của Claude: chunk ban đầu = engine + capability của step đầu tiên; capability của step khác tách chunk theo step/nhánh, prefetch khi form đã ready và trình duyệt rảnh; chunk lỗi → step đó hiện 再試行, giữ nguyên dữ liệu.
  - → đã trả lời ở Spec #3 Answer #5.

## Session 3: Spec #3 Answer #5 (2026-10-24), code splitting và lazy loading → ADR-040; yêu cầu viết Spec #3 proposal

### CONFIRMED (user)

- **DECISION: APPROVED AS DESIGN DIRECTION — Hybrid Code Splitting with Conditional Prefetch.** Chưa duyệt toàn spec #3 hay G1.
- **Chiến lược P0:** eager-load capability thiết yếu cho step đầu; lazy-load capability chỉ dùng ở step/nhánh khác; prefetch có điều kiện (xét network/performance); shared internal chunk trong phạm vi một release khi có lợi; không mutable shared runtime giữa các release. Bootstrap resolve release trước khi tải React, engine và plugin. Không bắt buộc một chunk cho mỗi field/step/plugin; compiler có chiến lược grouping, tránh over-splitting.
- **`store-selector`:** browser facet trong chunk/chunk group lazy; nhánh 宅配 không chủ động tải; chọn 店頭 và có khả năng tới bước chọn cửa hàng thì được prefetch; prefetch không chặn tương tác; không prefetch thì vẫn lazy-load được; backend validation luôn authoritative. Demo phải chứng minh: PC artifact có Store Selector; nhánh 店頭 tải nó; nhánh 宅配 không request nó (baseline không prefetch nhầm); Sports hoàn toàn không chứa nó. **Phân biệt code có trong artifact với code browser thật sự tải.**
- **Prefetch:** không prefetch mọi branch sau khi ready. Dựa trên: step reachable hiện tại, branch đã chọn, ý định đã validate hoặc đủ ổn định, capability dependency graph, network, data-saving, giới hạn thiết bị nếu quan sát tin cậy được. Không ML, không scheduler phức tạp; ưu tiên luật tất định: branch chưa chọn → không prefetch plugin nặng của branch; branch đã chọn → có thể prefetch capability của next reachable step; mạng chậm/data-saving → chỉ tải khi cần; branch đổi → không khởi tạo capability của branch cũ, prefetch đã bắt đầu không được coi là workflow state. Prefetch không phải validation hay transition.
- **Motion:** Sports Motion-none là test bắt buộc: không có Motion runtime trong bất kỳ chunk nào, không dynamic import tới Motion, không registry import ngầm kéo Motion; tắt animation không làm hỏng workflow. Form có Motion: chỉ tải animation capability cần; reduced motion; animation không chặn business state; backend validation/submit không chờ Motion. Chi tiết Motion ở spec #6.
- **Chunk load failure:** giữ step hiện tại; không commit transition dựa trên capability chưa load; không xóa giá trị hợp lệ trong memory; lỗi tiếng Nhật kèm recovery; phân biệt network failure, missing asset, incompatible release, security suspension; không báo submit thành công khi capability bắt buộc chưa sẵn sàng. **`import()` lần hai không chắc phát sinh request mới** khi cùng URL đã thất bại; thiết kế retry theo khả năng runtime thật. Nếu phải reload: cảnh báo PII chỉ có trong memory; không tự reload; reload đúng immutable pinned release; theo Draft Recovery; pinned release retired/suspended thì hướng dẫn phù hợp. Không âm thầm tải active release mới.
- **Chunk graph và compiler boundary:** import graph từ Capability Lock tin cậy; static và dynamic import specifier đều do compiler sinh (literal); không lấy path từ Admin JSON; không import toàn registry; không bundle design/server facet hay browser capability không dùng; React singleton mỗi release; kiểm cycle và import trái phép; tên chunk/content hash ổn định; có manifest mô tả quan hệ module/chunk/dependency. Không chỉ dựa vào tree-shaking.
- **Bundle verification:** 12 test (Sports không có Store Selector; Sports Motion-none không có Motion; PC 店頭 tải Store Selector; PC 宅配 không request nó; plugin dùng ở nhiều bước không gây duplicate React/runtime; design facet không có; Python server facet không có; mạng chậm không mất data; missing chunk có lỗi và recovery; reload sau import lỗi giữ pinned release; prefetch bị bỏ khi tiết kiệm dữ liệu; không có chunk ngoài dự kiến). Mỗi test phân biệt build graph evidence, artifact inventory evidence, network request evidence, runtime behavior evidence. Network PASS không chứng minh code không có trong artifact.
- **Sửa S3-P12/P17/P18:** (a) **Sourcemap:** file phục vụ công khai phải thuộc integrity verification; không thể vừa phục vụ sourcemap công khai vừa loại khỏi mọi inventory. P0: không deploy public sourcemap; debug thì giữ trong private build artifact có access control, hash/provenance riêng; không đưa sourcemap có thể lộ source nội bộ vào public release. (b) **Path independence:** đổi thư mục host không chứng minh gì nếu trong container luôn cùng path. Giải thích phạm vi reproducibility trong môi trường chuẩn; kiểm hoặc loại trừ absolute path ảnh hưởng artifact; muốn chứng minh path independence thì test phải đổi path mà toolchain thật sự thấy; không tuyên bố thuộc tính mà test không quan sát được. Giữ mục tiêu byte-for-byte.
- **Compiler pipeline end-to-end:** thiết kế các stage (gợi ý 14 stage), đánh giá thứ tự, input/output, failure; tránh cycle trong hash/manifest; xác định stage pure/deterministic, có side effect, cache được, bắt buộc fail closed, nằm ngoài compiler (Publishing, spec #5). Không trộn compilation với AWS deployment.
- **Việc tiếp theo:** cập nhật ADR + notes; hoàn thành **Spec #3 Architecture Proposal rev 1** (pipeline diagram, chunk graph Sports và PC, hai ví dụ build artifact, ví dụ Release Manifest, failure matrix, performance measurement contract, cross-spec mapping với spec #1/#2, independent design/builder consistency review và sửa mâu thuẫn trước khi trình, Open Decisions, scope P0/P1/P2). Không hỏi thêm chi tiết nhỏ nếu không có blocker kiến trúc mới. Trình spec #3 trước khi brainstorm spec #4. Cho phép local documentation commit sau staged-diff/security check. Không code, không push, không AWS write. G1 NOT APPROVED, G9/G10 BLOCKED.

### Đã thực hiện (Claude)

- ADR-040. Spec #3 Architecture Proposal rev 1: `docs/superpowers/specs/2026-10-24-compiler-bundle-release-design.md` (chuyển S3-P01..P21, TM-R/L/B vào tài liệu; sửa sourcemap và path independence; thêm pipeline, chunk plan, TM-C).

### OPEN

- User review Spec #3 Architecture Proposal rev 1 và các OD3-xx. → đã review ở Spec #3 Review #1.

## Session 3: Spec #3 Review #1 (2026-10-24) → ADR-041, ADR-042 (SPIKE-GATE-01)

### CONFIRMED (user)

- **Verdict: CONDITIONALLY ACCEPTED FOR TECHNICAL VERIFICATION.** Spec #3 chưa duyệt toàn bộ; vẫn cần final design review và Cross-Subsystem Review.
- **OD3-01 → ADR-041:** Vite + Rolldown là ứng viên ưu tiên để kiểm chứng (Vite hiện dùng Rolldown, `build.rolldownOptions`). Pin version chính xác; không trộn cấu hình Rollup cũ; kiểm API chunking, dependency graph, output; không coi là đã chọn nếu spike thất bại; không chọn vì phổ biến.
- **OD3-02 → ADR-042 SPIKE-GATE-01 (APPROVED WITH LIMITED SCOPE):** phạm vi được/không được như ADR-042. EXP-01..05 với evidence yêu cầu cụ thể:
  - EXP-01: Sports Motion-none và PC có Store Selector; Sports không có Store Selector, không Motion; PC chỉ tải chunk ở nhánh 店頭; 宅配 không request; không design/server facet; không React trùng, không circular import trái phép. Evidence: module graph, chunk inventory, artifact hash, network trace.
  - EXP-02: môi trường pin chuẩn; hai build sạch độc lập; byte-identical, SHA-256 khớp trên toàn bộ artifact set; inventory giống; không absolute path; không tên file/chunk id không tất định. Khác → FAIL, hash diff, nguyên nhân; không đổi sang tiêu chí "tương đương chức năng".
  - EXP-03: plugin có browser, design, server facet (Python hoặc marker server-only): build browser chỉ resolve entrypoint được phép; build design resolve được design facet; build khách từ chối import design trái phép; browser không truy cập server facet; canary/negative fixture thật sự làm guard fail. Conditional exports không là sandbox duy nhất.
  - EXP-04: Playwright Chromium, Firefox, WebKit; phân biệt network timeout, HTTP 404/503, module evaluation throw, retry cùng URL, recovery bằng reload, chunk của release cũ còn tồn tại và tải đúng. Ghi browser + version, số request, error object, kết quả retry, giữ dữ liệu. Không giả định retry luôn được; không tự reload khi memory có PII.
  - EXP-05: T1, T2, T3, byte JS/CSS ban đầu, tổng JS sau toàn flow, số request, cold/warm, CPU/network throttling. LAB-ONLY; không tuyên bố Core Web Vitals PASS.
- **Pipeline consistency review** trước khi hoàn tất spec #3: orchestrator chạy lại stage nào cho hai build; LRM tính trước hay sau verification; artifact có bị đổi sau khi hash; attestation cover gì; file ngoài inventory; stage sau đổi output stage trước mà không invalidate hash; tách side effect staging với spec #5. Cần diagram và stage dependency matrix có thứ tự thực thi.
- **Báo cáo kết quả** theo mẫu (ID, giả thuyết, lệnh, môi trường, kết quả, PASS/FAIL/INCONCLUSIVE, evidence, giới hạn, ảnh hưởng, đề xuất). Không sửa acceptance criteria sau khi xem kết quả. Failure là kết quả có giá trị.
- **Sau spike:** independent consistency review spec #3; spec #3 rev 2 nếu cần; không cần đạt mọi benchmark lý tưởng mới được brainstorm spec #4; risk còn mở ghi rõ và chuyển tới implementation plan/verification gate phù hợp.
- **Governance:** cập nhật DECISIONS, notes, CURRENT_STATUS, CONTEXT_HANDOFF, PROJECT_CHECKLIST. Không đổi G1/G9/G10. Sau báo cáo spike: trình kết quả → cập nhật spec #3 theo evidence → brainstorm spec #4. Không tự bắt đầu production implementation.

### Tiêu chí thí nghiệm (chốt TRƯỚC khi chạy; không sửa sau khi xem kết quả)

Ghi tại commit này để có mốc thời gian trước khi spike chạy. Chi tiết lệnh và fixture ở branch `spike/compiler-feasibility`.

| EXP | PASS khi | FAIL khi | INCONCLUSIVE khi |
|---|---|---|---|
| 01 | (a) không module/chuỗi đặc trưng Store Selector trong mọi file emit của Sports; (b) không module Motion và không `import()` tới Motion trong Sports Motion-none; (c) PC có chunk Store Selector riêng, chỉ được request khi đi 店頭; (d) luồng 宅配 không request chunk đó; (e) không module/marker design hay server trong bất kỳ build khách nào; (f) đúng một React/ReactDOM trong module graph; (g) đồ thị import tĩnh giữa chunk không vòng | bất kỳ (a)–(g) sai | không thu được module graph hoặc network trace đáng tin |
| 02 | hai build sạch độc lập (container mới, không cache) từ cùng input cho SHA-256 giống hệt trên mọi file của artifact set, cùng inventory, không path tuyệt đối trong output | bất kỳ file nào khác byte, inventory khác, hoặc có path tuyệt đối | không có môi trường pin chuẩn (ví dụ không chạy được container) → chỉ báo kết quả native, ghi INCONCLUSIVE cho phần canonical |
| 03 | build khách không resolve được `./design` (build fail đúng lý do); build design resolve được; server marker không vào build khách; mỗi negative fixture làm guard tương ứng fail đúng lý do và bản control pass | guard không fail với negative fixture, hoặc fail vì lý do khác, hoặc build khách resolve được design | — |
| 04 | với mỗi engine: ghi được hành vi của 6 kịch bản; retry bậc 1 (URL có query) được phân loại đúng là hoạt động/không hoạt động; reload về đúng release giữ được dữ liệu không-PII đã lưu; chunk release cũ tải đúng | spike không phân biệt được các kịch bản, hoặc thiết kế §15.3 sai ở điểm cốt lõi (ví dụ query-retry không tạo request mới trên cả 3 engine) — ghi FAIL cho giả định đó | engine không chạy được trong môi trường |
| 05 | thu được T1/T2/T3, byte, request, cold/warm với throttling ghi rõ cho cả hai form | — (không có ngưỡng; chỉ đo) | không đo được một mốc nào đó → ghi rõ mốc thiếu |

## Session 3: SPIKE-GATE-01 đã chạy (2026-10-24)

### Kết quả (Claude; chờ user review)

- Báo cáo: `docs/discovery/P01_SPIKE_GATE_01_REPORT.md`. Evidence: `docs/evidence/P01/spike-gate-01/`. Source spike: `spikes/compiler-feasibility/` (branch local `spike/compiler-feasibility`; **chưa commit** — hook yêu cầu user duyệt từng lần commit).
- Đánh giá theo tiêu chí đã chốt ở commit `22ecfaf`:
  - EXP-01 **PASS**.
  - EXP-02 **PASS** (thêm: đổi thư mục trong container và macOS/Linux arm64 giống hệt).
  - EXP-03 **FAIL** (hai điều kiện đã chốt): import tương đối vượt qua `exports` (design và `.py`); L3 và quét canary bắt đúng.
  - EXP-04 **PASS**; giả định "reload luôn phục hồi" FAIL trên WebKit (Playwright 27.2, nguyên nhân chưa rõ). "Bộ đếm retry không đủ" chỉ là suy luận, chưa đo.
- Consistency review độc lập sau spike phát hiện các chỗ tuyên bố quá mức và mâu thuẫn; đã sửa trong báo cáo, spec #3 rev 2 (§25.3), spec #2 rev 2.4, spec #1 rev 3.3 (C11 `groups`, EC-36).
  - EXP-05 **PASS** (lab-only).
- Minh bạch: EXP-04 lần 1 có lỗi harness (reset một lần bị trình duyệt tự gửi lại; rule lỗi khớp cả CSS); evidence lần 1 giữ nguyên. EXP-05 lần 1 đo CLS 0.28 do runtime spike gỡ shell muộn; evidence giữ nguyên.
- Thay đổi thiết kế: spec #3 rev 2 (§5.4/§5.5 ma trận stage, L1b, `hashCharacters: 'hex'`, retry token duy nhất, gỡ shell cùng commit, giới hạn đo) và spec #2 rev 2.4 (L1b).
- OPEN mới: OD3-03 (prefetch trên WebKit), OD3-04 (package manager). OD3-01: khuyến nghị chọn Vite 8.3.5 + Rolldown 1.2.15.

### OPEN

- User review kết quả spike và spec #3 rev 2; quyết OD3-01, OD3-03, OD3-04; duyệt commit (spike branch và docs). → đã review ở "SPIKE-GATE-01 review".

## Session 3: SPIKE-GATE-01 review (2026-10-24) → ADR-041 (cập nhật), ADR-043..045

### CONFIRMED (user)

- **Duyệt hai commit local cụ thể:** commit 1 trên `spike/compiler-feasibility` (source spike, fixture giả lập, test, script, evidence đã che path) → `b3070d2`; commit 2 trên `p00-discovery` (báo cáo, evidence cần thiết, spec #1/#2/#3, ADR, notes, checklist, traceability, handoff). Kiểm branch, status, staged diff, secret, file nội bộ, dữ liệu thật, đường dẫn local trước mỗi commit; không stage source spike vào branch docs; không tắt hook; hook từ chối thì ghi blocker. Không merge spike branch. Không push, không AWS write. Duyệt này chỉ cho hai commit, không phải quyền bypass hook về sau.
- **Giữ kết quả spike:** EXP-01 PASS; EXP-02 PASS trong phạm vi môi trường đã thử; EXP-03 FAIL; EXP-04 PASS theo acceptance criteria nhưng có limitation với WebKit và evaluation failure; EXP-05 PASS, lab-only. Không nâng tuyên bố ngoài evidence; spike PASS ≠ production DONE.
- **OD3-01 → ADR-041 CONDITIONALLY APPROVED:** Vite 8.3.5 + Rolldown 1.2.15 là baseline đã kiểm chứng cho compiler design; trước khi chốt implementation: release-store resolution, L1b, positive/negative fixture, build graph/artifact isolation, không bỏ qua import tương đối, conditional exports không là boundary duy nhất. Không đánh dấu EXP-03 PASS.
- **OD3-03 → ADR-043 ACCEPTED FOR P0:** WebKit có thể tải lại chunk đã prefetch; ghi limitation và overhead; không hứa reuse hoàn hảo; không ảnh hưởng correctness; không suy ra Safari thật giống Playwright WebKit; đánh giá lại nếu plugin lớn hơn nhiều. Evaluation failure: không khẳng định nguyên nhân; không tự reload làm mất dữ liệu; recovery người dùng thấy được, giữ pinned release.
- **OD3-04 → ADR-044:** pnpm ưu tiên cho P02, chưa khóa version; danh sách kiểm (fixture lỗi npm, workspace, frozen lockfile, React singleton, pin `packageManager`, không floating dependency). Không suy ra mọi npm đều lỗi.
- **Node.js → ADR-045:** Node 20 đã EOL; giữ image Node 20 chỉ để tái hiện spike; P02 ưu tiên Node 24 LTS, pin digest, chạy lại tái lập và isolation; không sửa evidence gốc.
- **Risk giữ OPEN:** L1b, release-store resolution, tái lập khác kiến trúc, Safari thật, phục hồi lỗi evaluate trên WebKit, isolation của preset Motion, cache CDN/browser thật, OD2-08/09 và các decision còn mở.
- **Tiếp theo:** cập nhật CURRENT_STATUS/CONTEXT_HANDOFF với SHA thật; giữ spec #3 rev 2 ở trạng thái cần final/cross-spec review; đưa verification gate vào traceability; brainstorm **spec #4 — Admin Form Builder UX & Architecture** từ góc nhìn Business Editor (tạo form không cần code, kéo thả field/step, conditional logic trực quan, cấu hình validation, Plugin Inspector, preview, quản lý draft/published revision, cảnh báo khi thay đổi ảnh hưởng dependency). Không implementation chính thức. G1 NOT APPROVED, G9/G10 BLOCKED.

### Đã thực hiện (Claude)

- ADR-041 cập nhật; ADR-043, ADR-044, ADR-045. Spec #3 rev 2: §0.1, §12.1 (Node), §22, §26 (cần final/cross-spec review). Traceability: VG-01..VG-10.
- Commit 1: `b3070d2` (spike branch). Commit 2: xem `git log` của `p00-discovery`.

## Session 3: Spec #4, Admin Form Builder UX & Architecture (bắt đầu 2026-10-24)

> Bối cảnh ràng buộc (không hỏi lại):
> - ADR-008 (người dùng; no-code; người sửa ≠ người publish), ADR-004 (vertical slice; undo/redo P1 nhưng builder state là immutable document + typed commands), ADR-009/011 (shared block, template, identity), ADR-015 (validation UX), ADR-019..021 (schema, exports, classification), ADR-033 (design binding/inspector), ADR-037/038 (preview vs release, CSR).
> - Spec #1 rev 3.3 (DSL, rule AST, navigation, derived state), spec #2 rev 2.4 (catalog, design binding, Dev Preview, status ledger), spec #3 rev 2 (release, preview không phải release).
> - Ưu tiên của user: góc nhìn Business Editor — tạo form không cần code; kéo thả field và step; conditional logic qua visual editor; cấu hình validation; Plugin Inspector; preview; quản lý draft/published revision; cảnh báo khi thay đổi ảnh hưởng dependency.
> - OPEN liên quan từ spec #1: OD-03 (cách biểu diễn rule trong UI), OD-11 (ngôn ngữ của Admin), OD-13 (block trải nhiều step).

### OPEN

- **Q4-1:** Hãy kể (hoặc hình dung) buổi làm việc đầu tiên của một Business Editor khi được giao tạo form thu mua PC mới trên Admin: họ là ai, họ mở Admin ra và làm những gì theo thứ tự, và tới lúc nào thì bạn coi là họ đã thành công?
  - → đã trả lời ở Spec #4 Answer #1.

## Session 3: Spec #4 Answer #1 (2026-10-24), Business Editor journey → ADR-046

### CONFIRMED (user)

- **Decision: Business-first Visual Form Builder, Developer-extensible Architecture.** Định hướng sản phẩm; chưa duyệt spec #4 hay G1.
- **Persona (giả định thiết kế, chưa xác minh nhân sự thật): Business Editor — PC Site.** PO, PM hoặc Business Operator; hiểu nghiệp vụ và dữ liệu cần thu; quyết field, điều kiện, thứ tự step; không cần biết React/TS/Python/JSON Schema/DSL; không sửa source, không đăng ký plugin; chỉ dùng capability đã approve; không nhất thiết có quyền publish.
- **Hành trình ngày đầu (9 bước):**
  1. Login & chọn site: thấy site/form được phép; UI phân biệt Site, Form, Form Draft, Published Form Revision, Active Release; không đưa khái niệm kỹ thuật vào luồng chính.
  2. Tạo form: từ template/starter được phép, clone form/revision (nếu có quyền), hoặc form trống (nếu scope cho phép). Không live inheritance; không cần Template Marketplace ở P0. Đặt tên và thông tin cơ bản.
  3. Step: Visual Step Editor (ví dụ: 商品情報 → 買取方法 → 連絡先・住所 → 確認; nhánh có thể đổi danh sách step thực tế). Thêm/xóa/sắp xếp, đổi tên, cấu hình nội dung, thấy quan hệ giữa các step. Không sửa JSON.
  4. Field: chọn từ Capability Library (メーカー, 型番, CPU, バッテリー状態, SIM関連情報, お名前, 電話番号, メールアドレス…). Thêm/xóa/sắp xếp, label tiếng Nhật, required/optional, option list, registered validator, helper/error text, layout được phép. Identity ổn định do platform quản lý; đổi label không phá reference; classification không hạ dưới mức tối thiểu.
  5. Điều kiện: Visual Rule Editor, dạng `WHEN [買取方法] [is] [店頭買取] THEN [Go to] [店舗選択]`. Không JavaScript, JSON expression, regex tùy ý, DSL text, technical field path. Admin chuyển thao tác thành typed Workflow DSL; backend/compiler dùng contract của spec #1.
  6. Theme & Motion: theme/token được duyệt, màu, typography/spacing trong phạm vi, Motion preset được duyệt; không CSS/Motion code; animation không điều khiển business state; chi tiết ở spec #6.
  7. **Preview & Test (một trong những bước quan trọng nhất):** desktop, mobile, các step, các nhánh, validation error, Back/Next, 確認, màn hoàn tất. Cùng semantic contract với runtime khách. P0 dữ liệu giả và mock. Phân biệt Visual Preview / Interactive Preview / Submission Simulation / Published Customer Form. Không side effect ra business system.
  8. Save & sửa lỗi: lỗi dễ hiểu, dẫn thẳng tới chỗ cần sửa (step không tới completion, field bị rule tham chiếu đã xóa, thiếu cấu hình bắt buộc, plugin không tương thích, validation sai, rẽ nhánh không đủ). Không chỉ raw JSON Schema error. Phân biệt: draft có lỗi (vẫn lưu được) · draft hợp lệ để preview · draft hợp lệ để request publish. Không publish khi chưa qua validation gate.
  9. Gửi review: Reviewer/Publisher kiểm thay đổi form, thay đổi dependency, shared block bị ảnh hưởng, compatibility, kết quả preview/simulation, publish readiness; approve/reject/publish theo quyền; Editor không bypass. Workflow approval đầy đủ phối hợp spec #5; spec #4 có UX contract tương ứng.
- **Thành công:**
  - A (spec #4): tạo/clone PC form; thêm/sửa/sắp xếp field và step; điều kiện 店頭/宅配; registered validation; theme/Motion preset; preview các nhánh chính; thấy và sửa lỗi cấu hình; lưu, mở lại, tiếp tục; gửi publish — toàn bộ bằng UI, không source/JSON, không cần capability code mới cho nghiệp vụ registry đã hỗ trợ.
  - B (vertical slice end-to-end, không chỉ spec #4): publish sau approve; compiler build artifact cô lập; Sports và PC khác flow; backend nhận submit theo authoritative revision; mock post-submit effect; rollback; bundle isolation có bằng chứng.
- **Nguyên tắc UX:** business-first terminology (Form, Step, Field, Condition, Preview, Publish; không capability lock/IR/dependency graph/release manifest); progressive disclosure (không Inspector khổng lồ); direct manipulation (click/select/reorder trên canvas + properties inspector; flow và preview phản ánh thay đổi); safe editing (cảnh báo impact, không phá shared block, không silent migration, identifier ổn định, dependency tự phân tích); accessible (bàn phím, screen reader, **không bắt buộc drag-and-drop**, Admin responsive trong phạm vi P0); deterministic feedback (trạng thái lưu, validation, loading/lỗi rõ; không giả vờ publish thành công khi backend chưa xác nhận).
- **Scope:** P0 ưu tiên first-day journey chạy được end-to-end; không enterprise designer đầy đủ. P1/P2 có thể: bulk update nhiều site, multiplayer real-time, rule debugger nâng cao, plugin marketplace, template/version inheritance nâng cao, undo/redo đầy đủ, AI sinh form, mass migration. P0 vẫn phải có branching, cấu hình trực quan, validation, preview, persistence và review/publish journey ở mức đã duyệt.
- **UX đo được:** đề xuất chỉ số (time to first valid form, time to first interactive preview, số thao tác thêm field, số thao tác tạo nhánh, tỷ lệ hoàn thành không cần developer, số lỗi cấu hình phát hiện trước publish, khả năng tự sửa lỗi từ thông báo, nhất quán preview/runtime) kèm phương pháp đo; **không** đặt KPI cố định như đã được business xác nhận.
- **Tiếp theo:** đi từ journey sang Information Architecture và interaction model (dashboard, tạo form, builder canvas, step/flow editor, property inspector, preview/simulation, version/publish state); đề xuất 2–3 mô hình UI kèm ưu/nhược và khuyến nghị. **Không** thiết kế JSON editor bọc drag-and-drop rồi gọi là no-code. Không kéo dài bằng câu hỏi nhỏ nếu đủ căn cứ cho UX Architecture Proposal. Cho phép local documentation commit sau staged-diff/security check và theo chính sách hook.

### PROPOSAL (Claude): IA, mô hình UI, interaction model, chỉ số UX. Chờ review, NOT approved

**S4-P01 Information Architecture.**

```
Admin
├─ Site switcher (chỉ site được phép)
│  └─ Site dashboard: danh sách form + trạng thái
│     (下書きあり · レビュー中 · 公開中 rN · 要確認の問題 N件)
├─ Form overview (một form)
│  ├─ 公開中のバージョン (active) · lịch sử bản đã publish
│  ├─ 下書き (draft hiện tại) → mở Builder
│  ├─ Yêu cầu review (trạng thái)
│  └─ Thành phần dùng chung (shared block, plugin) + cảnh báo
├─ Builder (một draft)  — chế độ: 作成 | フロー | プレビュー | 設定
├─ Review (Reviewer/Publisher): thay đổi theo ngôn ngữ nghiệp vụ, impact, preview của snapshot, kết quả simulation, approve/reject/publish
└─ Thư viện: shared block, starter (P0: chọn và pin; không marketplace)
```

Từ ngữ hiển thị (ngôn ngữ Admin: OD-11): Form, 下書き (Draft), 公開バージョン rN (Published Revision), 公開中 (Active). "Release" và mọi khái niệm kỹ thuật (lock, IR, manifest) chỉ xuất hiện ở màn Advanced/Reviewer.

**S4-P02 Ba mô hình UI cho Builder.**

*Mô hình A — Outline-first (danh sách dọc kiểu biểu mẫu):*
```
┌ Steps & Fields (dọc) ─────────────┬ Inspector ┐
│ ▸ 1 商品情報                       │ (field    │
│     メーカー / 型番 / CPU          │  đang     │
│ ▸ 2 買取方法  ⑂ 2 nhánh            │  chọn)    │
│ ▸ 3a 店舗選択 (khi 店頭)           │           │
│ ▸ 3b 宅配情報 (khi 宅配)           │           │
│ ▸ 4 連絡先 · 5 確認                │           │
└────────────────────────────────────┴───────────┘
```
- Ưu: quen thuộc, gần thứ tự khách thấy; dễ làm accessible (danh sách, bàn phím); phạm vi P0 nhỏ nhất.
- Nhược: nhánh chỉ thấy dạng nhãn; flow phức tạp khó hình dung; không thấy form "trông thế nào" khi đang sửa.

*Mô hình B — Flow-canvas-first (đồ thị node/edge):*
```
[商品情報] → [買取方法] ─店頭→ [店舗選択] ─┐
                       └─宅配→ [宅配情報] ─┴→ [連絡先] → [確認]
(click node → drawer chỉnh field)
```
- Ưu: nhánh rõ nhất; khớp mô hình step graph của DSL.
- Nhược: đồ thị node gây áp lực với người nghiệp vụ, dễ thành "lập trình trực quan"; zoom/kéo khó accessible; chỉnh field bị đẩy vào drawer; dễ vẽ edge sai (vòng, nhánh thiếu).

*Mô hình C — Hybrid workspace (khuyến nghị):*
```
┌ 構成 (outline) ──┬ キャンバス (step đang chọn, renderer thật) ┬ インスペクター ─────┐
│ 1 商品情報       │  商品情報                                  │ [基本][条件][検証]  │
│ 2 買取方法 ⑂     │  メーカー [_____]   ← click để chọn        │ [詳細 ▸]            │
│ 3a 店舗選択      │  ＋ ここに追加                             │ ラベル  必須 ☑      │
│ 3b 宅配情報      │  型番     [_____]                          │ 選択肢 …            │
│ 4 連絡先  5 確認 │                                            │                     │
├──────────────────┴────────────────────────────────────────────┴─────────────────────┤
│ 保存済み ✓ · 問題 2件 ▸ · 下書き (レビュー依頼可能: いいえ)      [作成|フロー|プレビュー|設定] │
└─────────────────────────────────────────────────────────────────────────────────────┘
```
- **Outline** (trái): cây step → field; chọn, thêm, sắp xếp bằng drag **và** bàn phím/menu "移動先…".
- **Canvas** (giữa): step đang chọn được vẽ bằng **chính renderer của runtime** ở chế độ chỉnh sửa (direct manipulation: click chọn, điểm chèn ＋). Không phải JSON được vẽ lại.
- **Inspector** (phải): theo đối tượng đang chọn, chia tab 基本 / 条件 / 検証 / 詳細 (progressive disclosure).
- **フロー**: bản đồ step và nhánh **sinh tự động** từ rule; click node để tới step/rule; P0 không cho vẽ edge — nhánh được sửa bằng câu điều kiện.
- **プレビュー**: engine thật, khung desktop/mobile, chọn kịch bản (店頭/宅配), simulation có nhãn.
- **Thanh trạng thái**: trạng thái lưu, số vấn đề (click để mở danh sách và nhảy tới chỗ sửa), mức sẵn sàng của draft.
- Ưu: vừa thao tác trực tiếp vừa thấy tổng thể; nhánh nhìn được mà vẫn sửa bằng ngôn ngữ nghiệp vụ; canvas và preview cùng renderer với runtime (BUILD-08, spec #3); outline đảm bảo đường không cần drag.
- Nhược: nhiều phần phải đồng bộ (outline, canvas, flow, inspector); phạm vi P0 lớn hơn A. Giảm bằng cách: フロー chỉ đọc + điều hướng ở P0; một vùng chọn duy nhất cho toàn workspace.

**Khuyến nghị: C**, với P0 cắt gọn (フロー chỉ đọc, chưa có canvas tự do kéo thả layout). A là phương án dự phòng nếu phạm vi P0 cần nhỏ hơn. B không khuyến nghị cho Business Editor.

**S4-P03 Interaction model (áp cho C).**
- **Một vùng chọn duy nhất** (step / field / block instance / rule); outline, canvas, flow và inspector đều theo vùng chọn này; breadcrumb ở inspector.
- **Mọi chỉnh sửa là typed command** (ADR-004) → autosave theo debounce, optimistic concurrency theo `draftVersion`, chừa đường undo/redo (P1).
- **Thêm field:** điểm ＋ giữa các field → Capability Library (tìm kiếm + nhóm: 基本 / 選択 / 連絡先(個人情報) / 店舗・プラグイン / 共通ブロック) → chèn với giá trị mặc định an toàn. Mục tiêu ≤ 3 thao tác.
- **Sắp xếp:** drag handle; Alt+↑/↓; menu "移動先…" để chuyển sang step khác. Không bắt buộc drag.
- **Điều kiện (rule):** tab 条件 có câu `[field] [toán tử theo kiểu field] [giá trị từ option list] → [hiển thị / ẩn / bắt buộc]`; với step: mục "次のステップ" gồm danh sách `この場合 → [step]` theo thứ tự và "それ以外 → [step]" bắt buộc. Điều kiện đặt tên được ("店頭買取の場合") để dùng lại. Admin chuyển thành Rule AST và transition của spec #1; không bao giờ hiện AST.
- **Validation:** tab 検証: 必須; validator đã đăng ký dạng chip lấy từ catalog; tham số qua inspector sinh từ `paramsSchema`; ghi đè message.
- **Plugin Inspector:** field plugin dùng design binding của capability (spec #2 §7.2) hoặc inspector tự sinh từ `configSchema`; badge trạng thái (`deprecated`…) ; version chỉ hiện ở 詳細.
- **Vấn đề (Issues):** diagnostic của analyzer (spec #1 §14) được dịch sang ngôn ngữ nghiệp vụ, mỗi vấn đề có nút "修正する" nhảy tới đúng đối tượng. Ba mức của draft: 編集中 (có lỗi, vẫn lưu) · プレビュー可能 · レビュー依頼可能.
- **Cảnh báo impact trước thay đổi nguy hiểm:** xóa field đang được rule tham chiếu; đổi/xóa option đang dùng trong rule; đổi key ảnh hưởng Data Contract; nâng version block/plugin. Dialog liệt kê chỗ bị ảnh hưởng và lựa chọn (hủy / sửa luôn tham chiếu / tiếp tục và để lại lỗi). Key ledger (spec #1 R-04) ngăn dùng lại key.
- **Preview:** engine thật + browser facet từ release store (spec #2 §9.5, spec #3); chọn step bắt đầu, kịch bản nhánh, desktop/mobile; Submission Simulation gọi mock backend, có nhãn 「シミュレーション」, không side effect.
- **Trạng thái lưu:** 保存済み / 保存中 / 未保存の変更 / 保存できませんでした (再試行); xung đột phiên bản (người khác vừa sửa) → thông báo và lựa chọn, không ghi đè ngầm.

**S4-P04 Chỉ số UX (đề xuất, chưa phải KPI đã xác nhận).**

| Chỉ số | Cách đo | Target đề xuất |
|---|---|---|
| Time to first valid PC form (người dùng lần đầu, từ starter) | usability test có kịch bản với dữ liệu giả; bấm giờ từ "Create" tới khi draft đạt mức レビュー依頼可能 | ≤ 30 phút |
| Time to first interactive preview | cùng buổi test; tới lúc lần đầu mở プレビュー và đi được 1 step | ≤ 5 phút |
| Số thao tác thêm một field | đếm thao tác (click/phím) từ ＋ tới field xuất hiện với mặc định | ≤ 3 |
| Số thao tác tạo nhánh 店頭/宅配 | đếm thao tác cho rule "次のステップ" 2 nhánh + "それ以外" | ≤ 8 |
| Tỷ lệ hoàn thành task không cần developer | số người hoàn thành / số người test (≥ 5 người nội bộ, không phải developer) | ≥ 4/5 |
| Lỗi cấu hình phát hiện trước publish | bộ lỗi gieo sẵn (fixture); tỷ lệ bị analyzer bắt trước khi request publish | 100% với lỗi trong catalog đã định nghĩa |
| Tự sửa lỗi từ thông báo UI | trong test, tỷ lệ lỗi gieo sẵn người dùng tự sửa không hỏi ai | ≥ 80% |
| Nhất quán preview/runtime | conformance scenario chạy cả preview và artifact; so kết quả | 100% scenario giống nhau (tự động) |

- Instrument trong Admin chỉ ghi sự kiện thao tác và thời điểm, không PII, không nội dung field.
- Số target là để user review; không dùng làm cam kết.

### OPEN

- **Q4-2:** chọn mô hình UI cho Builder (A / B / C) và phạm vi P0 của mô hình đó.
