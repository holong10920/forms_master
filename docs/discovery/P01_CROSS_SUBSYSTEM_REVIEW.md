# P01 — Cross-Subsystem Review (sáu spec)

> Ngày: 2026-10-24. Theo ADR-018 và yêu cầu review spec #6 rev 1 (§13–§16).
> **Reviewer:** ba reviewer độc lập, chỉ đọc, đọc trực tiếp file spec và ADR (không đọc `docs/internal/`, không đọc repo công ty): (R1) hợp đồng end-to-end Sports/PC + ma trận interface; (R2) bảo mật và cô lập, gồm review thiết kế V5-01; (R3) vòng đời release, tương thích version, Motion, review/publish, rollback, parity TS/Python, governance plugin. Claude tổng hợp, gộp trùng, đối chiếu lại bằng chứng.
> **Phiên bản được review:** spec #1 rev 3.6, #2 rev 2.10, #3 rev 2.5, #4 rev 2.4, #5 rev 2, #6 rev 2; ADR-001..067; `docs/SECURITY_RISK_REGISTER.md`; `docs/REQUIREMENTS_TRACEABILITY.md`.
> **G1 NOT APPROVED. G9, G10 BLOCKED.** Report này không approve gì.

## 1. Verdict

**NOT READY FOR G1 — không có BLOCKER, có 17 MAJOR (sau khi gộp trùng) cần sửa trong spec trước G1.**

- Không phát hiện chỗ nào làm hệ thống **chấp nhận sai** (mọi thiếu sót đều fail closed hoặc là thiếu đặc tả). Vì vậy không có BLOCKER theo định nghĩa.
- Nhưng các MAJOR làm vertical slice **không chạy được** như đang viết (ví dụ chưa ai tạo `CAPSTATUS`/gate → approve đầu tiên thất bại; Build Request chưa có nguồn cho nhiều trường), hoặc làm guarantee đã duyệt **không đứng vững** (G-EXEC được mô tả không nhất quán; điều kiện của ADR-063 chưa có kiểm chứng; version engine/evaluator/preset không được ràng buộc giữa review, build, preview và backend).
- V5-01: review thiết kế độc lập đã làm — **đúng nguyên lý, nhưng có lỗ hổng phải sửa** (CSR-01, CSR-02); vẫn **VERIFICATION_PENDING** (CT-26 là gate sau G1).
- V5-02: G-EXEC là **ACCEPTED_RISK** (ADR-063) nhưng văn bản chưa nhất quán (CSR-04) và điều kiện chấp nhận chưa được kiểm chứng (CSR-05).

## 2. Ma trận tương thích interface (chuỗi end-to-end, R1)

| # | Producer → Consumer | Artifact / trường | Nguồn sự thật | Version | Validation / lỗi | Contract test | Kết luận |
|---|---|---|---|---|---|---|---|
| 1 | Editor → Builder | typed `Command` (#4 §8; `SetMotion*` #6 §10) | Document Admin | command log | precondition; impact | TM-6A02, 4K01 | COMPATIBLE |
| 2 | Builder → Draft | `PUT /forms/{id}/draft {draftVersion, document, saveSeq}` (#4 §15, #5 §7.2) | `DRAFT#` | CAS `draftVersion` | 409, `KEY_COLLISION`, 413 | CT-01, CT-11, 4K01 | COMPATIBLE |
| 3 | Draft → Preflight | `inputIds`, `diagnosticsDigest` (#3 §5.1, #4 §14.3) | build worker `preflight` | `analyzerVersion` | `DIAGNOSTIC_DRIFT` | TM-4D02/03 | **GAP** (CSR-08, CSR-09) |
| 4 | Preflight → Snapshot | blob + `ReviewRequest` (#5 §5.4, #4 §17) | `SNAP#`, `REVIEW#` | `snapshotVersion` | ConditionCheck `draftVersion` | CT-02, CT-16 | COMPATIBLE (tên trường lệch, CSR-16) |
| 5 | Review → Approval | approve + ConditionCheck pointer, `CAPSTATUS` (#5 §5.4, §8) | `REVIEW#`, `POINTER`, `CAPSTATUS` | `version` | 409 các loại | CT-14, CT-25 | **GAP** (CSR-01, CSR-16, MINOR-07) |
| 6 | Approval → Capability Lock | identity + resolution context (#2 §9.2) | K3 | PRK/FBK + hash | `E-CAP-*` | TM-B16 | COMPATIBLE |
| 7 | Operation → Compiler | Build Request (#3 §5.1, #5 §6.2) | spec #5 | digest | `E-BUILD-INPUT-DIGEST` | TM-B01..B17 | **GAP** (CSR-09, CSR-10, CSR-12) |
| 8 | Compiler → Key ledger | Data Contract → `KEY#{key}#{releaseId}` (#3 §6, #5 §6.4 R4) | ledger spec #5 | `activatedAt` | `E-KEY-COLLISION` | CT-13 | **CONTRADICTION** (CSR-08) |
| 9 | K14 → Register/Verify | staging, LRM, FRA (#3 §11–§12; #5 §5.4) | `REL#` | `lrmDigest` | collision, integrity gate | CT-19, TM-5G10 | COMPATIBLE (CSR-15) |
| 10 | Verify → Activation | transaction 8 + p + f action (#5 §6.5) | `POINTER` | CAS | SUPERSEDED/FAILED | CT-03/04/20/23 | **GAP** (CSR-01, MINOR-07) |
| 11 | Activation → Entry | `entry.html` (#3 §14.1, #5 §6.6) | `POINTER.entryVersion` | `If-Match` | reconciler | TM-5D01, TM-5G09 | COMPATIBLE (tên lệch, MINOR-09; CSR-14) |
| 12 | Entry → Bootstrap / pinning | draft metadata, status API (#3 §14.2, #5 §7.4) | release + gate | `draftFormat` | resume/Start Over | TM-L*, TM-R*, TM-5G11/12 | **GAP** (CSR-14, MINOR-10) |
| 13 | Runtime → Chunks / Motion | Chunk Plan, group `motion`, IR `motion` (#3 §7, §15; #6 §7) | LRM | `motion-presets` | K10 `E-ARTIFACT-MOTION-*` | TM-C*, TM-6B01..04 | **GAP** (CSR-12) |
| 14 | Workflow → Submit body | `{formId, releaseId, revision, schemaVersion, values, idempotencyKey}` (#5 §10.2) | release theo `releaseId` | hash JCS | 409/410/413/422/423/503 | TM-5S01..03, TM-5G14 | CONTRADICTION nhẹ (MINOR-06) |
| 15 | Submit → Admission gates | ConditionCheck FORM/REL/FBK (#5 §9.3, §10.3) | gate `blockers` | CAS `CAPSTATUS` | 423/410/409/503 | CT-08/09/22/26, TM-5G01..18 | **CONTRADICTION** (CSR-03, MINOR-05) |
| 16 | Submit → Outbox → Mock effect | `EVT#` (#5 §10.4–§10.5, #2 §15.3) | `fb_submission` | `generation` | `blocked`/`dead` | CT-07, CT-10, TM-5E01, TM-5G08 | COMPATIBLE (MINOR-14) |
| 17 | Rollback | `{targetReleaseId, expectedPointerVersion}` (#5 §6.2; #3 §16.1; #2 §10.4) | `POINTER` | CAS | 422/409 | TM-5P03..06, CT-20 | COMPATIBLE (CSR-14) |

## 3. Findings

Phân loại: **BLOCKER / MAJOR / MINOR / ACCEPTED_RISK / VERIFICATION_PENDING**. Không mục nào được hạ từ blocker/MAJOR xuống accepted risk khi chưa có ADR.

### 3.1. MAJOR (cần sửa trong spec trước G1)

| ID | Nguồn | Vấn đề (bằng chứng) | Sửa đề xuất | Spec |
|---|---|---|---|---|
| **CSR-01** | E2E-01, SEC-02 | Không spec nào nói **ai tạo** `CAPSTATUS#{PRK}` và `GATE#FBK`, khi nào (#5 §9.3 "thao tác platform"; không endpoint ở #5 §7.2; #2 §8.1 bước 10 chỉ ghi catalog). Approve/activation đòi chúng tồn tại (#5 §5.4, §6.5 5a/5b) → approve đầu tiên của Sports/PC thất bại; `storeList` 503. `CAPSTATUS` bị xóa/tạo lại với `serverFbks` rỗng → override "thành công" trên 0 gate, gate mở sai | thao tác **catalog runtime ingestion** (idempotent, audit, platform-admin hoặc bước của deploy gate): một transaction tạo `CAPSTATUS` **cùng mọi** gate server FBK của PRK (tập FBK bất biến theo manifest), trước preflight đầu tiên; cấm Delete `CAPSTATUS#`/`GATE#` (cả IAM); thao tác repair dưới CAS; CT mới | #5 §7.2, §9.3; #2 §8.1 |
| **CSR-02** | SEC-01, SEC-03, E2E-15 | Tạo gate FBK khởi tạo `blockers` thiếu `mitigation#M3#…` (V5-01 ca 7 sai); danh sách override đọc bằng `Query` (read-committed, không serializable như `GetItem`) nên không chắc thấy override cùng transaction mà `CAPSTATUS` đã phản ánh (ca 2) | lưu tập `gateBlockers` (ledger `revoked`, override runtime, M3) **ngay trong `CAPSTATUS`**; tạo gate sao đúng tập đó — chỉ đọc **một** item ở version `v` rồi CAS `v`; mở rộng CT-26 cho M3 và đường repair | #5 §9.3, §23.4 |
| **CSR-03** | E2E-02 | Tập FBK được gate chỉ gồm `serverValidator`, verification check, `postCommitEffect` (#5 §9.3) — bỏ sót **server facet của `validator` cross-runtime-pure** (#2 §7.1) mà `revoked` đòi M3 cho mọi server FBK (#2 §16.3) → jpPhone server facet bị revoke vẫn chạy và submit vẫn được nhận | tập FBK = **mọi server FBK trong lock** được gọi trên đường submit hoặc query; tính lại trần ≤ 10 | #5 §9.3, §10.3 |
| **CSR-04** | SEC-04, SEC-10, LIFE-14 | Văn bản còn hứa adapter bị revoke ngừng ngay, trái ADR-063: #5 §13 #12 ("adapter không còn được gọi"), TM-5G04, TM-5G17, §9.3/§10.5 ("linearization point của effect"); #2 §16.5 ("Enforce ngay", "có hiệu lực tại commit"); TM-5G18 còn nhánh (b) | sửa thành "lời gọi có lần đọc gate **sau** commit không chạy; G-EXEC không bảo đảm (ADR-063, SR-01)"; ghi chú ở ADR-035; bỏ/đánh dấu research nhánh (b) | #5, #2, ADR-035 |
| **CSR-05** | SEC-09 | Điều kiện chấp nhận của ADR-063 ("network allowlist **đã kiểm chứng**", không connector/secret thật) chưa có kiểm chứng: chỉ có 4Z14 (Preview API) và L3 tĩnh; không test egress cho Form API, outbox worker, adapter runtime; không kiểm cấu hình connector/secret của host. SR-01 đang ghi như đã kiểm chứng | thêm test bắt buộc: chặn egress khi chạy (mọi process), cấu hình chỉ mock connector, scan secret cấu hình host; ghi SR-01 là "điều kiện chờ kiểm chứng"; chạy được sau G1 nhưng phải PASS trước bất kỳ demo/đánh giá G1 exit nào dựa vào ADR-063 | #5 §14, register |
| **CSR-06** | SEC-11 | #4 §14.4 còn ghi "Admin build … chỉ chứa design facet + entry `presentation`", trái ADR-061, INV-A1 (design là P1), #4 §9 D5 | Admin build chỉ chứa `presentation`; L1b + L5 với canary design | #4 §14.4 |
| **CSR-07** | SEC-12, LIFE-15 | `presentation` của version đã `revoked` vẫn chạy trong origin Admin; browser facet đã `revoked` vẫn có trong Preview build (#4 §14.4 gộp mọi release đang pin, không lọc status) — tới khi deploy lại Admin; ADR-053 đòi "browser facet đã approve" | Canvas và iframe đọc trạng thái hiệu lực authoritative; `revoked` → thẻ giữ chỗ, không mount; Preview build loại version `revoked`; ghi vào register | #4 §9, §14.4; #2 INV-A2 |
| **CSR-08** | E2E-03 | Data Contract không có `identity`/`renamedFrom` (#3 §6) dù #1 R-04(3) đòi; #5 R4 cần identity để ghi `KEY#…`; Build Request chỉ có `previousDataContract` → K5 không kiểm được key đã giữ ở release cũ hơn, collision chỉ lộ ở VERIFYING; `inputIds` của preflight không có key ledger trong khi Admin dùng nó (#4 §14.2) → drift giả | thêm `identity`, `renamedFrom` vào Data Contract; digest `keyLedgerSnapshot` vào Build Request và `inputIds`; `previousDataContract` = Data Contract của release tại `basePointerVersion` | #3 §5.1, §6; #4 §14.2–§14.3; #5 §6.4 |
| **CSR-09** | E2E-04, LIFE-16 | #5 chưa định nghĩa **cách lắp Build Request**: `catalogSnapshotId`/`ledgerSnapshotId`/`runtimeOverrideSnapshotId` không có aggregate sinh ra; `registryCatalog`, `buildConfig`, `bootstrap`, `releaseHtmlTemplate`, `builderImage` không có nguồn; site policy `allowedEffects` không có trong #5 §5.1 lẫn Build Request (K5 `E-EFFECT-NOT-ALLOWED` mất tính thuần); "retry cho Build Request giống hệt" không đúng khi platform nâng giữa hai lần | bảng "trường Build Request → nguồn" trong #5; aggregate snapshot (catalog, ledger, override, site policy) có id/digest; lưu digest Build Request vào review khi gán revision (retry dùng lại → cùng `releaseId`) hoặc ghi rõ một revision có thể có nhiều `releaseId` | #5 §5, §6.2; #3 §5.1 |
| **CSR-10** | LIFE-01 | Version engine của Preview, analyzer Admin và builder không bị ràng buộc với nhau: Reviewer xem vN bằng engine X (preview `review`), publish build bằng engine Y; "Published Runtime" mơ hồ khi `S` có nhiều engine (#4 §14.2, §14.7; #3 §11.1; #5 §6.2) | ghi `engineVersion`/`analyzerVersion` vào preflight và ReviewRequest; BUILDING/VERIFYING đòi `toolchain.engine` khớp, lệch → STALE + preflight lại; deploy builder image cùng Admin/Preview build; 4Z08 định nghĩa theo engine của release | #4, #5, #3 |
| **CSR-11** | LIFE-02 | Evaluator Python không có kiểm tương thích **giữa các version** với IR/engine của release trong `S` (#3 §6 `irFormat`/`engineIrRange`; #2 §10.4 deploy gate chỉ kiểm adapter; #1 AC-31, #2 C3 chỉ differential cùng version) → nâng backend có thể lệch ngữ nghĩa với release cũ, trái ADR-017 | evaluator khai dải `irFormat`/semantic version hỗ trợ; deploy gate kiểm mọi release trong `S`; differential/golden test theo ma trận {engine của release trong `S`} × {evaluator hiện tại} | #1, #2 §10.4, #5 §9.2 |
| **CSR-12** | LIFE-03, E2E-08 | `@platform/motion-presets` không được pin trong Build Request (#3 §5.1 "mọi tham chiếu là digest" nhưng không có mục preset), không có trường LRM có schema, không có "catalog"/ledger trạng thái cho preset (#6 §7.3 `W-MOTION-PRESET-DEPRECATED` không có nguồn); IR envelope (#3 §6) không có `motion`/`regionId` mà #6 §6.2, §7.3 cần; #5 I5-08 ghi "không ảnh hưởng" | coi preset như platform asset trong release store, pin digest trong Build Request (như `bootstrap`); trường LRM; ledger trạng thái preset; IR có `motion` + `regionId`; sửa I5-08 | #3 §5.1, §6, §11; #6 §7; #5 |
| **CSR-13** | LIFE-04 | TM-6R10 ("không hiện giá trị đã bị `clearOnDeactivate`") yếu hơn invariant "shell không có giá trị khách" (#6 §6.3); #1 §8.3 giữ giá trị inactive trong bộ nhớ trừ `clearOnDeactivate`; mặc định `AnimatePresence` giữ element con thật; câu "engine invalidate giá trị ngay" trái #1 | slot tự render `ExitShell` từ IR theo `regionId`, **không bao giờ** giữ element con; không giá trị nào (kể cả lựa chọn); đổi "invalidate" thành "loại khỏi active/validate/payload"; TM-6R10/R12 VERIFICATION_PENDING (sau G1) | #6 §6.3, §12 |
| **CSR-14** | LIFE-06 | Sau rollback R8 → R7, entry dùng bootstrap **của R7** (#3 §14.1); draft R8 với `draftFormat` mới bị bootstrap cũ coi là `incompatible` → chỉ Start Over, trong khi R8 còn supported trong grace (trái ADR-037/054) | entry dùng bootstrap mới nhất trong các release thuộc `S` (pin riêng trong `POINTER`), hoặc luật tương thích ngược theo major `draftFormat`; test | #3 §14; #5 §6.6 |
| **CSR-15** | LIFE-07 | Chuyển release sang `verified` có điều kiện `state = registered` (#5 §5.4) → retry cùng review (cùng `releaseId`, đã `verified`) hoặc VERIFYING của rollback thất bại giả | `state IN (registered, verified)` + fencing; rollback chỉ ConditionCheck; test retry sau activation fail và rollback | #5 §5.4, §6.2 |
| **CSR-16** | LIFE-08, E2E-11 | State machine review lệch: #4 §17 (InReview/Stale/Approved/Published, InReview→Draft) vs #5 §8 (OPEN/APPROVED/PUBLISHING/PUBLISHED/REJECTED/STALE, PUBLISHING→APPROVED); Admin thiếu trạng thái đang publish / publish thất bại; STALE do dependency **không được lưu** nên STALE→OPEN có thể không xảy ra; không API "preflight lại trên vN"; `dataContractAck` vs `dataContractDiff.acknowledged` | #4 dùng đúng state của #5 + bảng nhãn `ja`; nói rõ `REVIEW_RECHECK_REQUIRED` có ghi STALE không; thêm `POST /reviews/{id}/preflight`; thống nhất tên trường | #4 §17; #5 §7.2, §8 |
| **CSR-17** | LIFE-10 | Plugin `deprecated` "tiếp tục hoạt động **tới** `supportEndsAt`" (#2 §16.3) nhưng #5 §9.3 không có gate nào cho `deprecated` → hành vi sau mốc không định nghĩa | ghi rõ "chỉ thông tin; muốn ngừng phải áp M2–M5 tường minh", hoặc đồng bộ ledger sang gate | #2 §16.3; #5 §9.3 |

### 3.2. MINOR

| ID | Nguồn | Tóm tắt | Spec |
|---|---|---|---|
| MINOR-01 | SEC-05 | đồng bộ ledger `vulnerable→revoked` dùng `ADD`+`DELETE` cùng thuộc tính → `ValidationException`; dùng `SET publishBlockers = :computed` dưới CAS | #5 §9.3 |
| MINOR-02 | SEC-06 | miễn trừ deploy gate: `DEPLOYMENT#CURRENT` chỉ có hash; deploy gate ghi không kiểm lại gate; bảng §9.3 thiếu ConditionCheck | #5 §9.2–§9.3 |
| MINOR-03 | SEC-07 | `GATEINTENT` bị bỏ lại khi crash chặn request mới mãi; thêm `expiresAt` + dọn | #5 §9.3 |
| MINOR-04 | SEC-08 | phạm vi override PRK vs FBK; override quá `expiresAt` có còn "mở" | #2 §16.5; #5 §9.3 |
| MINOR-05 | E2E-05, LIFE-11 | `E-CAPABILITY-UNAVAILABLE` `retryable` true (#2, #3) vs false (#5 gate thiếu); 423 "tạm thời retryable" của `GATEINTENT` vs #3 (423 không retry) → tách mã | #2, #3, #5 |
| MINOR-06 | E2E-06 | body submit lệch: #2 §15 thiếu `schemaVersion`; #1 §17 thiếu `releaseId`; #1 §8.6(4) "tải IR theo revision"; trường lưu #1 §7.6.7 vs `SUB#` | #1, #2 |
| MINOR-07 | E2E-07 | lần publish đầu: `POINTER` tạo khi tạo form nhưng action 1 dùng `attribute_not_exists(pointerVersion)`; `basePointerVersion` của form chưa publish → đặt `pointerVersion = 0` | #5 §5.4, §6.5 |
| MINOR-08 | SEC-13 | thu hồi session/preview session theo user không có index; Preview API nên kiểm lại Membership | #5 §5.2, §7.6 |
| MINOR-09 | E2E-09, LIFE-09 | đặt tên: `revN`/`rev7`/`r8` vs block `rN`; `reviewCounter` thiếu ở aggregate; `activeReleaseId`/`active.releaseId`; `retired`, `supportEndsAt` dùng cho cả plugin và release | nhiều |
| MINOR-10 | E2E-10, LIFE-13 | status API thiếu retention/quarantine/incompatible; bootstrap #3 thiếu nhánh availability, freshness, `rel#pending` | #5 §7.4; #3 §14.2 |
| MINOR-11 | SEC-14 | site của Preview API cho phiên `partial`; outbox không kiểm lại `allowedEffects` | #5 §7.3, §10.5 |
| MINOR-12 | SEC-15 | origin form khách ở local chưa chỉ định (nếu `localhost` → cùng site Admin); `__Host-` cần `Secure` trên HTTP local; cookie `state`/PKCE với `SameSite=Strict` không đi kèm callback Cognito (mock IdP cùng site che lỗi) | #4 §14.7; #5 §7.6 |
| MINOR-13 | SEC-16 | chỗ đồng bộ cũ: #6 I6-06/M1 "INV-A2 chưa có Motion"; #4 §14.7 "đăng ký session server-to-server" vs item `PREVIEW#`; chưa nói process nào phục vụ Preview build và đặt header origin preview | #6, #4, #5 |
| MINOR-14 | E2E-12 | INV-A2 cấm mock trong Preview build nhưng `simulatePending` dùng adapter submit mock | #2 INV-A2; #6 §10 |
| MINOR-15 | E2E-13 | catalog mã: thiếu `E-ADMIN-MOTION-NOT-BUNDLED`, `UNKNOWN_FIELD`, `E-TYPE` ở #3 | #3 §16.4, §18.1a |
| MINOR-16 | E2E-14 | ADR-003 còn `fade-slide`/`scale-spring` (spring); #1 §14 (S0 freeze), §17 (compiler cập nhật ledger) lỗi thời so với ADR-050, #5 R4 | ADR-003, #1 |
| MINOR-17 | LIFE-05 | thứ tự ưu tiên focus khi lỗi backend làm đổi step; "điều khiển gây thay đổi" khi node inactive do lookup/`restoreDraft` | #1 §8.4; #6 §6.3 |
| MINOR-18 | LIFE-12 | pseudo-code deploy gate #2 §10.4 thiếu miễn trừ, lặp theo "revision" thay vì release | #2 §10.4 |
| MINOR-19 | LIFE-17 | `REQUIREMENTS_TRACEABILITY` lỗi thời (rev cũ, OD2-08/09 còn OPEN, cột Design F-P0 trống, VG-09 "sau spec #6", VG-12 còn "shard"); thiếu các VG sau G1/G10 (§6) | traceability |

### 3.3. ACCEPTED_RISK (đã có ADR)

| ID | Rủi ro | ADR | Ghi chú |
|---|---|---|---|
| AR-01 | G-EXEC TOCTOU — adapter (kể cả read-only: jpPhone, katakana, `storeList`) có thể bắt đầu sau commit của revocation | ADR-063, SR-01 | chỉ PoC synthetic; điều kiện **chưa được kiểm chứng** (CSR-05); văn bản chưa nhất quán (CSR-04) |
| AR-02 | Cache thông tin ≤ 60 s khi store không khả dụng | ADR-057, SR-06 | không dùng cho quyết định bảo mật |

### 3.4. VERIFICATION_PENDING

| ID | Mục | Trạng thái |
|---|---|---|
| VP-01 | V5-01 / SR-02 — tạo gate FBK (CAS `CAPSTATUS`) | review thiết kế độc lập **đã làm** (R2): đúng nguyên lý, cần sửa CSR-01, CSR-02 trước G1; CT-26 là **post-G1 implementation verification gate**; emulator PASS không đủ cho AWS |
| VP-02 | G-ADM (admission) | cơ chế có; TM-5G01..03, TM-5G07, CT-08/09 sau G1 |
| VP-03 | `T_edge_max ≤ G` | VG-10, sau G10 |
| VP-04 | Contention gate, độ trễ commit revocation | VG-12, sau G10 |
| VP-05 | Shell exit không PII | TM-6R10/R12 sau G1 (sau CSR-13) |

### 3.5. Cần user phân loại (đang OPEN trong register)

| ID | Rủi ro | Đề xuất |
|---|---|---|
| SR-03 | revocation do rủi ro browser facet chỉ chặn bằng M4/M5 **từng form**, không nguyên tử giữa form, chịu độ trễ entry/CDN | ACCEPTED_RISK cho P0 synthetic (hai form demo), cùng điều kiện ADR-063 |
| SR-04 | `presentation` là code plugin trong origin Admin; spy chỉ phát hiện | ACCEPTED_RISK cho P0 (chỉ plugin của platform), kèm CSR-07 |
| SR-05 | `previewSessionId` là bearer capability hẹp | ACCEPTED_RISK cho P0 (chỉ dữ liệu tổng hợp) |
| SR-08..SR-12 (mới) | xem `docs/SECURITY_RISK_REGISTER.md` (bổ sung theo R2) | phân loại sau khi sửa CSR |

## 4. Xung đột phạm vi P0/P1/P2

| Hạng mục | Spec A | Spec B | Đề xuất |
|---|---|---|---|
| "Motion Animation Editor" | P0: #2 §7.1 (`motionPreset`), #3 §20.3 | chỉ preset/nhóm/speed: #6 §2, §13; ADR-066/067 | sửa #2, #3 theo ADR-066/067 |
| "Visual Preview" | P1 "Visual Preview riêng": #4 §22 | P0 cột giữa tab モーション: #6 §10 | #4 §22 làm rõ: preview Motion trong iframe là P0; "Visual Preview riêng" (khác) là P1 |
| Token editor | "P1, spec #6": #4 §16, §22 | #6 không nhắc | #6 ghi rõ ngoài phạm vi, P1 |
| M4 ngừng nhận submit | #2 §21: P0 "M3, M5 tối thiểu" | #5 §15: M4/M5 P0 | **user xác nhận** M4 ở P0 |
| Runtime override | #2 §21: "mô phỏng local" | #5 §7.2, §9.3: API + gate thật ở P0 | **user xác nhận** |
| M3 `block-operation` | #2 §16.2: chặn từng thao tác | #5 §9.3: P0 chặn cả FBK (*[Claude]*, chưa ADR) | **user xác nhận** |
| Xác minh stable URL sau activation | #3 §16.3 bước 6 (khung P0) | #5 §6.6, §15: probe chỉ sau G10, local `cdn = n/a` | #3 làm rõ: local kiểm entry trực tiếp; probe CDN sau G10 |
| VG-12 "shard" | traceability | #5 §9.3: P0 một item, shard P1 | sửa traceability |

## 5. Mâu thuẫn chéo spec (tóm tắt)

1. Ai tạo `CAPSTATUS`/gate, khi nào (CSR-01).
2. Tập FBK được gate bỏ sót validator server facet (CSR-03).
3. Data Contract không mang identity mà key ledger và #1 R-04 cần (CSR-08).
4. Build Request thiếu nguồn cho nhiều trường, kể cả site policy và Motion preset (CSR-09, CSR-12).
5. Engine/analyzer/evaluator/preset không bị ràng buộc version giữa review → build → preview → backend (CSR-10, CSR-11, CSR-12).
6. Bootstrap sau rollback làm draft của release vẫn supported thành `incompatible` (CSR-14).
7. State machine review khác nhau giữa Admin và backend (CSR-16).
8. G-EXEC: văn bản ở #2, #5 còn hứa "ngừng ngay" (CSR-04).
9. Admin build còn design facet trong văn bản #4 dù ADR-061 (CSR-06).

## 6. Verification gates còn mở

| Pha | Gate |
|---|---|
| **Trước G1 (sửa thiết kế / quyết định)** | CSR-01..17; phân loại SR-03..05 và SR mới; xác nhận scope (§4); VG-07 cần chốt hạn ("trước G1 hoặc khi có thiết bị") |
| **Sau G1 (cần implementation)** | CT-26 (V5-01); TM-5G01..18; test điều kiện ADR-063 (CSR-05) — phải PASS trước mọi đánh giá dựa vào ADR-063; TM-6R10/R12; 4Z08 theo engine; differential TS/Python cùng version (AC-29..33, C3) **và** ma trận cross-version (CSR-11); TM-4D03; VG-01..05, VG-08, VG-09; cổng đo Motion P04 (ADR-064); TM-B, TM-6B02 (tái lập build); checklist isolation ADR-053 (4Z01..15); VG-06 khi có runner |
| **Sau G10** | VG-10 (`T_edge_max ≤ G`), VG-11, VG-12; Cognito PASS; contract test trên DynamoDB thật; CDN probe |

Các gate "thiếu VG" trong traceability (CT-26, ma trận cross-version, cổng đo Motion, checklist ADR-053, Cognito, DynamoDB thật) cần được thêm (MINOR-19).

## 7. Vertical-slice implementation readiness

**Chưa sẵn sàng.** Về hướng kiến trúc: sáu spec ăn khớp (ma trận §2: 9/17 ranh giới COMPATIBLE, phần còn lại là GAP/CONTRADICTION có cách sửa cụ thể, không cần thiết kế lại). Về contract: vertical slice Sports/PC chưa chạy được vì CSR-01 (gate/`CAPSTATUS`), CSR-08/09 (Data Contract, Build Request) và CSR-10/12 (version engine/preset). Ước lượng: một **vòng sửa có trọng tâm** (spec #1 nhỏ, #2 vừa, #3 vừa, #4 vừa, #5 lớn nhất, #6 nhỏ), rồi targeted re-review độc lập chỉ trên phần đã sửa.

## 8. Khuyến nghị G1

**Không khuyến nghị approve G1 lúc này.** Đề xuất lộ trình:

1. User quyết các điểm ở §9.
2. **Vòng sửa C1** (chỉ sửa có trọng tâm, không viết lại spec): CSR-01..17 + MINOR liên quan trực tiếp (MINOR-01, 05, 06, 07, 10, 13, 14, 15, 19); cập nhật register và traceability.
3. Targeted re-review độc lập trên phần đã sửa (ưu tiên CSR-01/02/03, CSR-08/09, CSR-10..12).
4. Không còn BLOCKER/MAJOR → trình **G1 Approval Package** (verdict, phạm vi P0 cuối, rủi ro đã chấp nhận, gate sau G1/G10, kế hoạch vertical slice). User quyết G1; Claude không tự approve.

## 9. Điểm cần user quyết

1. Cho phép tiến hành **vòng sửa C1** như §8.
2. Phân loại **SR-03, SR-04, SR-05** (đề xuất: ACCEPTED_RISK chỉ cho P0 synthetic, cùng điều kiện ADR-063).
3. Xác nhận phạm vi P0: **M4** (ngừng nhận submit) và **runtime override qua API thật** ở P0 (spec #5) thay cho "tối thiểu / mô phỏng" của spec #2 §21; **M3 `block-operation` chặn cả FBK** ở P0.
4. Chốt hạn **VG-07**.
5. Cho phép **ghi chú amend ADR-003** (preset `subtle`/`guided`, tween) theo ADR-065.
