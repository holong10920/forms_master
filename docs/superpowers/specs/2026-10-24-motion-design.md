# Spec #6: Motion (Architecture Proposal)

> **Trạng thái: PROPOSAL, revision 2.2** (2026-10-25).
> - Rev 2.2 (ADR-074): §11 ghi rõ Motion chỉ được xem ở **Interactive Preview** (iframe cô lập); Edit Canvas (host khai báo) không có Motion và không tuyên bố parity Motion. Không đổi contract Motion.
> - Rev 2.1 (vòng sửa C1): `ExitShell` do slot tự vẽ từ IR theo `regionId`, không giữ element con (CSR-13, §6.2–§6.3, TM-6R10); `motion-presets` là platform asset pin bằng digest trong Build Request (CSR-12, §7.3); adapter submit mock của preview là module platform được INV-A2 cho phép (MINOR-14); I6-06 cập nhật (MINOR-13); token editor ngoài phạm vi (P1).
> - Review rev 1 (user): direction approved with targeted corrections; OD6-01..04 → ADR-064..067. Rev 2: §7.4 reduced motion & lazy import, §6.3 bóng exit không PII, §6.4 chuyển nhanh & hủy, §12 test bổ sung, §14 truy vết MOTION-01. Thay đổi: §20.
> - Rev 1 đã qua builder check + consistency review độc lập (§19).
> - Hướng đi đã duyệt: ADR-062 (Motion Product Direction), ADR-064..067 (kiến trúc B, preset, per-step P1, tham số trong recipe). Ràng buộc có sẵn: ADR-016 (Motion preset qua animation lifecycle), ADR-033 (Motion là core P0, không có plugin kind `motionPreset` ở P0), ADR-038/ADR-040 (CSR, group `motion` lazy, Motion-none bắt buộc), ADR-047/ADR-053 (Hybrid Workspace, Preview cô lập). Cơ chế trong tài liệu này **PROPOSED**.
> - **G1 NOT APPROVED.** G9, G10 BLOCKED. Không có code. Không có số đo nào trong tài liệu này; mọi con số về thời lượng là giá trị đề xuất cần kiểm chứng (ADR-005).
> - Nguồn: [notes](../../discovery/P01_BRAINSTORM_NOTES.md) (Spec #6 Answer #1); [DECISIONS.md](../../DECISIONS.md); [spec #1 rev 3.5](2026-10-23-form-schema-workflow-design.md) §7.1 (`motion`), §8.4, §9; [spec #2 rev 2.9](2026-10-24-plugin-contracts-capability-registry-design.md) §7.1, §11; [spec #3 rev 2.4](2026-10-24-compiler-bundle-release-design.md) §7, §8, §10, §15.2; [spec #4 rev 2.3](2026-10-24-admin-form-builder-design.md) §14.7, §16; master F-P0-09, F-P1-09, MOTION-01..07, PERF-07, TEST-07, DOD-03.
>
> Phạm vi: subsystem spec số 6 trên 6 — chuyển động của form khách và cách Business Editor cấu hình nó.

## 0. Cách đọc trạng thái

| Nhãn | Ý nghĩa |
|---|---|
| **APPROVED …** | User duyệt hướng đi |
| **PROPOSED** | Claude đề xuất, chờ review |
| **OPEN** | Chờ user quyết (§16) |
| *[Claude]* | Lựa chọn nhỏ để tài liệu đủ cụ thể |

---

## 1. Mục đích

Motion giúp khách **hiểu** điều gì vừa thay đổi, **thấy phản hồi** cho hành động của mình và **giữ mạch** khi chuyển bước — không trang trí (ADR-062). Spec này định nghĩa: Motion được phép làm gì và không được làm gì so với Workflow Engine; contract khai báo mà Business Editor cấu hình qua preset; cách compiler đưa đúng phần code cần thiết vào artifact; và trải nghiệm tab モーション.

## 2. Goals, non-goals, anti-goals

**Goals**
- G6-1: Bốn tình huống có chuyển động phục vụ hiểu biết: chuyển step, hiện/ẩn nội dung theo điều kiện, phản hồi validation, phản hồi submit.
- G6-2: Business Editor chọn preset đã duyệt, xem trước, so sánh có/không chuyển động và chế độ reduced motion — không code, không DSL.
- G6-3: Motion không bao giờ quyết định hay trì hoãn business state.
- G6-4: Form đúng hoàn toàn khi Motion tắt, bị reduced motion, hoặc không tải được.
- G6-5: Form không dùng Motion không chứa byte nào của Motion; form dùng Motion chỉ chứa recipe thực dùng.
- G6-6: Preview và Published dùng cùng contract, cùng version, cùng tham số.

**Non-goals (P0, ADR-062):** token editor của theme (P1, spec #4 §16); timeline kiểu GSAP, keyframe editor, CSS animation editor, scroll-linked, parallax, 3D, choreography toàn form, AI sinh script, script theo plugin, spring/stagger/micro-interaction (F-P1-09). Override theo từng step: chưa quyết (OD6-03, khuyến nghị P1).

**Anti-goals**
- Animation callback dispatch navigation, submit, effect, sửa giá trị, mở khóa nút.
- Chờ animation xong mới đổi state, mới chuyển focus, mới cho gửi.
- Hiện "thành công" vì animation kết thúc.
- Business Editor ép chuyển động lên khách đã bật reduced motion.
- Một registry preset toàn cục trong mọi artifact.
- Animate thuộc tính gây layout (height, width, top, left, margin) mỗi lần gõ phím.

## 3. Ràng buộc

- Master §6.5 chỉ định thư viện `motion` cho React (MOTION-01..07: typed config có khoảng giới hạn, preset registry, `MotionConfig reducedMotion`, `LazyMotion` + `m`, transform/opacity, giữ focus/ARIA/giá trị, không import Motion khi không dùng). Chọn khác phải qua ADR + user approval (§5).
- Spec #3: group `motion` lazy, tải sau T3 khi form có Motion và không reduced motion; không bao giờ chờ Motion; engine không import Motion (L3); K10 kiểm Motion-none (`E-ARTIFACT-MOTION-PRESENT`).
- Spec #2 / ADR-033: preset là **code của platform (core)**, không phải plugin ở P0.
- Spec #4 / ADR-053: preview chạy trong iframe cô lập; Admin origin không chạy code hành vi.

---

## 4. Bốn tình huống và ngữ nghĩa

| Nhóm (`category`) | Kích hoạt bởi (engine đã commit) | Chuyển động | Không được |
|---|---|---|---|
| `stepTransition` | `nav.current` đổi (次へ, 戻る, jump) | step mới vào (enter) theo hướng `forward`/`back`; step cũ biến mất ngay *[Claude]* | giữ hai step cùng lúc trong DOM; chờ animation mới chuyển focus |
| `conditionalReveal` | node (section/field/block instance) đổi active ↔ inactive do rule | node mới active: enter; node vừa inactive: exit ngắn dạng "bóng" (§6.3) | quyết định active; trì hoãn xóa giá trị hay invalidation; animate chiều cao |
| `validationFeedback` | lỗi xuất hiện/biến mất trên field hoặc tóm tắt lỗi | message vào nhẹ (opacity); nhấn mạnh viền field một lần | rung, nhấp nháy, tự cuộn ngoài việc đưa phần tử được focus vào tầm nhìn; hiện "OK" khi kết quả authoritative còn pending |
| `submitFeedback` | `submit.status` = `pending` / `succeeded` / `failed` (bổ sung vào engine, I6-02) | chỉ báo pending (do **core** render, có cả khi Motion-none) vào nhẹ; kết quả: chuyển sang step hoàn tất (dùng `stepTransition`) hoặc hiện lỗi (dùng `validationFeedback`) | gửi lần hai; success trước khi backend xác nhận; chạy effect/command |

Lần render đầu của form không có animation (không có "intro").

---

## 5. Kiến trúc: ba phương án

| | **A. CSS/WAAPI do platform tự viết** | **B. Thư viện `motion` (LazyMotion + `m`) sau một adapter** | **C. Preset là plugin (`motionPreset`)** |
|---|---|---|---|
| Cách làm | recipe = class CSS (transition transform/opacity) + một helper nhỏ dùng Web Animations API cho exit; presence (giữ node khi exit) tự viết | recipe = cấu hình `motion` (variants, tween); presence bằng `AnimatePresence` ở slot container (§6.3); `LazyMotion` + feature bundle tối thiểu; reduced motion theo §7.4 (tương đương MOTION-03) | mỗi preset là một plugin có browser facet, qua registry/conformance của spec #2 |
| Bundle | nhỏ nhất (không thư viện); chưa đo | có thư viện; mức tăng **chưa đo** — phải đo trên artifact thật (ADR-005) | như B hoặc A tùy plugin + chi phí registry |
| Tương thích | transition CSS và WAAPI phổ biến; presence/interrupt tự xử lý từng trường hợp | thư viện lo presence, interrupt, reduced motion; phụ thuộc vào version thư viện | phụ thuộc chất lượng từng plugin |
| UX | đủ cho fade/slide/scale ngắn; spring và sequence khó (P1 F-P1-09 phải viết lại) | đủ cho P0; mở đường spring/stagger ở P1 không đổi kiến trúc | linh hoạt nhất, khó bảo đảm nhất quán |
| Bảo trì | team sở hữu code presence + edge case (focus, unmount giữa chừng) | team sở hữu adapter + recipe; theo dõi version thư viện | governance plugin (review, ledger, conformance) cho thứ vốn là core |
| Khớp master | **lệch** master §6.5 → cần ADR + duyệt | **khớp** | **lệch** ADR-033 ở P0 |
| Rủi ro chính | bug presence/a11y tự viết | byte tăng; thư viện có thể kéo thêm feature nếu cấu hình sai (K10 phải bắt) | mở cửa cho code animation không kiểm soát |

**Đã quyết: B (ADR-064)** — thư viện Motion sau **Motion Adapter do platform sở hữu**, pin exact version; kèm hai điều kiện:
1. **Adapter cách ly thư viện** (§6.2): engine và renderer không biết đến `motion`; chỉ module của group `motion` import thư viện. Đổi sang A sau này chỉ thay implementation của adapter.
2. **Cổng đo**: khi P04 (Shared UI + Motion) có artifact thật, đo bytes của group `motion` cho PC, INP/long task trên CPU chậm (lab), so sánh với A dựng thử tối thiểu nếu số đo vượt ngân sách user chốt. Không có số đo thì không tuyên bố B "nhẹ" hay "đủ nhẹ".

C bị loại cho P0 (ADR-033; spec #2 §7.1 xếp `motionPreset` ở mức contract, implement P1). Không tuyên bố thư viện nhẹ hơn CSS/WAAPI khi chưa benchmark.

---

## 6. Ranh giới: engine events, Motion config, renderer

### 6.1. Bốn lớp state

```mermaid
flowchart LR
  E["Workflow Engine<br/>(domain/workflow state,<br/>validation, submission status)"] -->|"selector thuần:<br/>TransitionNotice (chỉ đọc)"| R["Renderer (core)<br/>render đúng state ngay"]
  R --> MR["MotionRegion (core, no-op mặc định)"]
  MH["MotionHost<br/>(group motion, lazy)"] -. "đăng ký vào slot của core" .-> MR
  MC["Motion config (IR)"] --> MH
  MH -.x.->|"không có API dispatch"| E
```

| Lớp | Sở hữu | Motion được |
|---|---|---|
| Domain/workflow state (giá trị, activity, `nav`) | engine | đọc thông báo, **không** ghi |
| Validation/submission status | engine | đọc, **không** ghi |
| UI presentation state (focus, aria, disabled) | renderer core | không đổi; renderer đặt focus/aria **ngay khi** state đổi |
| Animation lifecycle (bắt đầu, xong, hủy) | MotionHost | chỉ dùng nội bộ để dọn "bóng" (§6.3); không phát sự kiện ra ngoài |

### 6.2. Contract giữa các phần

- **`TransitionNotice`** (engine → renderer, dữ liệu thuần, không PII): `stepChanged { from, to, direction: forward | back }` (hướng = so vị trí trên `derivedPath`; jump/deep link coi như `forward` hoặc `back` theo vị trí) · `nodeActivity { nodeId, kind: section | field | block, active: boolean }` · `validationShown { nodeId | "summary", visible: boolean }` · `submitStatus { status: idle | pending | succeeded | failed }`. Sinh từ diff của state đã commit; không chứa giá trị field.
- **Bổ sung cần có ở spec #1 (I6-02):** selector `transitionNotices(prev, next)`; trạng thái `submit` (`idle`/`pending`/`succeeded`/`failed`) suy ra từ effect `submit` đang chạy và `submitResult` — khớp khóa runtime `disabled` và INV-N5 (C9) đã có.
- **`MotionRegion`** (core): component bao quanh vùng đã đăng ký (`step`, `section`, `field`, `block`, `errorMessage`, `errorSummary`, `submitStatus`) với `regionId` ổn định từ IR. Mặc định render children trực tiếp, không import Motion.
- **`MotionPresenceSlot`** (core): đặt ở **container cha** của các node có thể đổi active (thân step, section). Mặc định render danh sách con hiện tại. Khi `MotionHost` có mặt và một con vừa thành inactive, slot **tự vẽ `ExitShell`** cho `regionId` đó **từ IR** (kích thước đo trước khi gỡ, nhãn từ definition) — **không bao giờ** giữ lại element con thật (không dùng hành vi mặc định của `AnimatePresence` là giữ child cuối). Không có Motion → không có shell.
- **`MotionHost`** (group `motion`): khi group tải xong, đăng ký implementation vào slot của core. Nhận `TransitionNotice` + Motion config đã compile; quyết định recipe cho region. API của nó **chỉ** có `renderRegion(region, children)` và `renderPresence(slot, children)`; không có tham chiếu tới dispatcher hay store/selector của engine, không mạng, không storage (luật L3 mới cho package Motion, §14).
- **Lỗi:** `MotionHost` nằm trong error boundary riêng; lỗi → gỡ slot, render không animation; core (không phải package Motion) ghi một counter kỹ thuật không PII. Group không tải được → không thử lại liên tục; form vẫn đủ chức năng.

### 6.3. Hành vi chi tiết bảo vệ business state

- **Chuyển step:** engine commit `nav` → renderer render step mới; adapter React chuyển focus tới tiêu đề step mới **ngay**, trước khi animation bắt đầu (quy tắc focus này **chưa có** trong spec #1 — bổ sung qua I6-02); step cũ bị gỡ ngay *[Claude]*; enter animation chạy trên container bằng transform/opacity. History do engine quản lý; Motion chỉ dùng `direction`.
- **Node vừa inactive (exit) — chỉ khi Motion có mặt; không bao giờ giữ PII:**
  - Engine **loại node khỏi active / validate / payload ngay** khi state đổi (giá trị inactive có thể vẫn được giữ trong bộ nhớ để khôi phục khi quay lại nhánh — spec #1 §8.4; `clearOnDeactivate` thì xóa) và bỏ qua mọi input từ node inactive; không có gì chờ animation.
  - `AnimatePresence` trong `MotionPresenceSlot` chỉ giữ một **presentation shell đã làm sạch**: khung có cùng kích thước, nhãn và chú thích lấy từ **definition** (không phải dữ liệu khách), ô nhập được thay bằng khối trống trung tính. **Không** có giá trị khách (tên, điện thoại, email, địa chỉ, văn bản tự do, lựa chọn, giá trị vừa bị invalidation xóa), **không** input/control tương tác, **không** component của plugin, **không** subscribe engine.
  - Shell `aria-hidden="true"`, `inert`, không focus được, không nằm trong accessibility tree, không nằm trong payload, không chạy effect. `inert` ở đây là biện pháp a11y, không phải ranh giới an toàn.
  - Shell nằm **ngoài flow** (định vị tuyệt đối tại chỗ cũ); exit tối đa thời lượng recipe, timeout an toàn *[Claude: 400 ms]*; sau đó gỡ khỏi DOM.
  - Nếu focus đang ở trong node vừa inactive: adapter React chuyển focus tới điều khiển đã gây thay đổi (thường là lựa chọn vừa bấm) — bất kể có Motion hay không.
  - Negative test TM-6R12: đổi nhánh khi field cũ có PII giả có marker → marker không xuất hiện trong DOM của shell, accessibility tree hay bất kỳ snapshot nào.
- **Node vừa active (enter):** có mặt trong layout ngay; chỉ opacity/transform của chính nó được animate. Không animate chiều cao.
- **Validation:** message và `aria-describedby`/`aria-live` có mặt ngay; animation chỉ là opacity của message và một lần nhấn mạnh viền. Theo spec #1 §11: khi submit/next thất bại, focus tới **field lỗi đầu tiên** và scroll tới đó; tóm tắt lỗi thông báo qua `aria-live`. Scroll kiểu `nearest`, tức thời khi reduced motion.
- **Submit:** engine khóa runtime (`disabled`, spec #1 C9/INV-N5) trong lúc `pending`, dùng cùng idempotency key (spec #5); animation không đụng tới trạng thái nút. Success chỉ khi engine nhận phản hồi backend.

### 6.4. Chuyển nhanh và hủy animation

- Mỗi region có tối đa **một** animation đang chạy; `TransitionNotice` mới cho cùng region **hủy/thay** animation cũ ngay (không xếp hàng).
- Callback hoàn tất của animation chỉ dọn shell/style của chính nó; **không** có quyền khôi phục hay ghi lại workflow state cũ, không đổi focus/aria.
- Focus và aria do engine/lớp a11y của adapter React quyết định theo state hiện tại, không chờ animation.
- Component unmount giữa transition → animation bị hủy cùng component; không callback nào chạy sau unmount gây tác dụng phụ.
- Preview reset giữa animation → iframe hủy mọi animation đang chạy rồi áp state mới.

---

## 7. Contract khai báo

### 7.1. Trong definition (spec #1 §7.1, slot `motion`)

```json
{
  "motion": {
    "preset": { "id": "guided", "package": "@platform/motion-presets", "version": "1.0.0" },
    "categories": {
      "stepTransition": "on",
      "conditionalReveal": "on",
      "validationFeedback": "on",
      "submitFeedback": "off"
    },
    "speed": "standard"
  }
}
```

- Không có `motion`, hoặc `preset.id = "none"` → form **Motion-none**.
- `categories`: chỉ các nhóm preset hỗ trợ; giá trị `on`/`off`.
- `speed`: enum `slow` / `standard` / `fast` *[Claude]*.
- `preset.id = "none"` → không được có `categories`/`speed` (schema dùng `oneOf`).
- Không có trường nào nhận chuỗi selector, code, URL, tên event, CSS. JSON Schema dùng `additionalProperties: false`.

### 7.2. Preset (code của platform)

Package `@platform/motion-presets` (core, phát hành qua trusted pipeline, có version, conformance riêng). Mỗi preset là **dữ liệu** tham chiếu tới **recipe** có sẵn trong package:

| Preset | `id` | Nhãn (catalog `ja`) | Nhóm hỗ trợ | Recipe (ví dụ) |
|---|---|---|---|---|
| Không chuyển động | `none` | なし | — | — |
| Nhẹ | `subtle` | 控えめ | cả bốn | step: `fade-slide`; reveal: `fade`; validation: `fade` + `outline-pulse-once`; submit: `fade` |
| Có dẫn hướng | `guided` | ガイド付き | cả bốn | step: `slide-directional`; reveal: `scale-in`; validation: `fade` + `outline-pulse-once`; submit: `fade` |

- Ví dụ của spec #3 dùng tên `fade-slide` / `scale-spring` cho preset; spec #3 cần đổi sang `subtle` (`sports-demo`) và `guided` (`pc-demo`); `sports-demo-nomotion` là biến thể Motion-none (I6-04). P0 **không** dùng spring: `scale-in` là tween có thời lượng (spring là F-P1-09).
- **Recipe** = mô tả có kiểu: thuộc tính animate (chỉ `opacity`, `transform`, và `box-shadow` cho `outline-pulse-once`), bảng `speed → durationMs` (thuộc dữ liệu preset có version; khoảng đề xuất 120–250 ms, chưa phải KPI), `delayMs` cố định trong recipe (P0: 0), easing (enum), hướng, và **biến thể reduced motion = không chuyển động**.
- **Tương thích:** mỗi bản `motion-presets` khai `compat.engine` (range version engine/renderer core) và version thư viện `motion` được pin. Compiler kiểm khi resolve (`E-MOTION-PRESET-INCOMPATIBLE`). Nâng version preset là thao tác chủ động (`UpgradeMotionPreset`, §10), không tự động.
- **Độ lệch có chủ ý so với MOTION-01** (trigger, duration, delay, easing/spring ở mức config): P0 để trigger/duration/delay/easing ở mức **recipe do platform duyệt**; Editor chỉ chọn preset, nhóm và `speed`. Đã duyệt (ADR-067): giữ khả năng duration/delay/easing ở mức recipe/engine; UI P0 không mở tham số thấp cấp; chỉnh nâng cao P1 nếu có nhu cầu.
- Bộ preset đã duyệt (ADR-065): `none` / `subtle` / `guided`, recipe tween có ID + version ổn định, không spring. `guided` **không** auto-advance hay chọn thay khách.

### 7.3. Compile (spec #3)

- *(C1, CSR-12)* Nguồn của preset: `@platform/motion-presets` là **platform asset** trong release store; version được hỗ trợ ghi trong `PLATFORMREL` (spec #5 §6.8); trạng thái (active/deprecated) theo ledger của platform asset; Build Request pin digest (`motionPresets`, spec #3 §5.1); LRM có trường `motion` (spec #3 §11.1).
- K1/K5: validate `motion` theo schema; preset/version phải có trong catalog (`E-MOTION-PRESET-UNKNOWN`), nhóm phải được preset hỗ trợ (`E-MOTION-CATEGORY-UNSUPPORTED`), tương thích engine (`E-MOTION-PRESET-INCOMPATIBLE`); preset deprecated → `W-MOTION-PRESET-DEPRECATED`. Các mã mới bổ sung vào catalog diagnostic của spec #3 (I6-04).
- K6: IR mang `motion` đã chuẩn hóa: `{ presetRef, recipesByCategory, durationsMs, reduced: "none" }` — không còn tên preset tự do.
- K7/K8: form Motion-none → không group `motion`, không tham chiếu. Form có Motion → group `motion` chỉ import **đúng các recipe** trong IR, `LazyMotion` với feature bundle tối thiểu đủ cho các recipe đó; specifier là literal từ catalog (INV-F3).
- K10: kiểm Motion-none (đã có, `E-ARTIFACT-MOTION-PRESENT`); thêm canary cho **từng recipe** → recipe không dùng mà có mặt là lỗi (`E-ARTIFACT-MOTION-UNUSED-RECIPE`); không có feature thư viện ngoài danh sách cho phép (ví dụ layout animation).
- LRM: version package `motion-presets` và thư viện `motion` là input của `releaseId`; recipe tất định (không thời gian/ngẫu nhiên ảnh hưởng tới cấu hình hay workflow).

### 7.4. Runtime: tải và reduced motion

| Trường hợp | Hành vi |
|---|---|
| Form **không** dùng Motion | không emit runtime, chunk hay `import()` nào của Motion (K10, TM-6B03) |
| Form dùng Motion, `reduced` bật **từ đầu** | kiểm `reduced` **trước** `import()` và **trước** mọi prefetch → không tải group `motion`; không prefetch; form chạy không chuyển động (TM-6B04) |
| Form dùng Motion, `reduced` tắt | tải group theo spec #3 §15.2 (sau T3, không chờ); chưa tải xong → không animation |
| `reduced` **bật giữa phiên** | hủy ngay mọi animation đang chạy; mọi animation sau đó dùng biến thể không chuyển động. Module đã tải **không** được unload khỏi bộ nhớ — chỉ không được dùng để chuyển động |
| `reduced` **tắt giữa phiên** | group được tải theo quy tắc thường |
| Group lỗi khi tải / khi chạy | không thử lại liên tục; render không chuyển động; workflow, navigation, a11y nguyên vẹn (TM-6R08) |

- **Tín hiệu `reduced` nội bộ** = `matchMedia('(prefers-reduced-motion: reduce)')` (theo dõi thay đổi), hoặc cờ giả lập **chỉ có trong preview**. Khi `reduced`: `MotionConfig reducedMotion="always"` **và** recipe trả biến thể không chuyển động. `reducedMotion="user"` của thư viện **không** được dùng làm bằng chứng rằng Motion JS không được tải — việc không tải được bảo đảm bằng kiểm tra trước `import()`/prefetch.
- Không có cấu hình nào cho Editor vượt qua tùy chọn này của khách.

---

## 8. Accessibility

| Yêu cầu | Cách đáp ứng |
|---|---|
| `prefers-reduced-motion` | §7.4; không tải Motion; mọi recipe có biến thể không chuyển động |
| Tắt chuyển động không thiết yếu | mọi chuyển động trong P0 đều không thiết yếu: thông tin luôn có mặt ngay không cần animation |
| Bàn phím | không thay đổi thứ tự focus; bóng exit `inert`; không bẫy focus |
| Screen reader | `aria-live`/`aria-describedby`/tiêu đề step cập nhật ngay; bóng exit `aria-hidden` |
| Focus sau chuyển step | tới tiêu đề step mới ngay khi commit (§6.3) |
| Không flash/strobe | không recipe nào lặp; `outline-pulse-once` một lần; không đổi độ sáng toàn màn hình |
| Không cần animation để hiểu/hoàn thành | Motion-none là đường chuẩn được test đầy đủ (TM-6R01) |

## 9. Hiệu năng và bundle

- Chỉ `opacity`/`transform` (và `box-shadow` một lần); không animate layout; không animation trong lúc gõ phím; không chặn input (animation không giữ main thread chờ).
- Nội dung reveal xuất hiện trong layout ngay khi khách chọn (dịch chuyển layout do input của người dùng); exit gỡ node sau ≤ 400 ms. Cần đo CLS thực tế trên artifact (không giả định).
- **Đo (P04/P07, trên artifact thật, ghi môi trường):** bytes JS/CSS của group `motion` (PC), bytes Sports Motion-none (phải bằng không phần Motion), initial vs lazy, số request, T2/T3 có/không Motion, INP và long task khi chuyển step/reveal (CPU throttle), CLS, overhead của reduced motion, hành vi trên thiết bị chậm. Lab ≠ field; không kết luận CWV PASS.
- `sports-demo-nomotion` (biến thể Motion-none): không module, không `import()`, không file `motion.*` (spec #3 TM-C02). `sports-demo` dùng `subtle`; `pc-demo` dùng `guided`: chỉ recipe thực dùng.

---

## 10. Builder UX: chế độ 設定 › モーション (spec #4)

```
┌ 設定 ▸ モーション ───────────────────────────────────────────────────────────────────────┐
│ プリセット            │ プレビュー（分離環境）                         │ 設定                       │
│ ○ なし                │ ┌──────────────────────────────┐               │ 適用する場面                │
│   動きを使いません      │ │  商品情報 → 買取方法          │               │ ☑ ステップの切り替え（5か所）│
│ ○ 控えめ              │ │  （プレビュー）               │               │ ☑ 条件による表示（3か所）    │
│   短いフェード          │ └──────────────────────────────┘               │ ☑ 入力エラーの表示           │
│ ● ガイド付き           │ [次へを試す] [店頭買取を選ぶ] [宅配買取を選ぶ]   │ ☐ 送信中の表示               │
│   移動の方向を示す      │ [エラーを表示] [送信中を表示]                    │ 速さ: [標準 ▾]              │
│   追加の読み込みあり    │ 表示: (●動きあり ○動きなし) ☐動きを減らす設定で確認 │ ⓘ 動きを減らす設定のお客様には │
│   （標準サンプルでの測定値: —）│                                              │   動きは表示されません        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

- **Trái — Preset Library:** thẻ `なし` / `控えめ` / `ガイド付き` với mô tả ngắn, nhóm hỗ trợ, và "追加の読み込み" lấy từ **số đo của bản phát hành preset trên fixture chuẩn** — gắn nhãn 「標準サンプルでの測定値」, không phải bytes của form này; chưa có số đo thì 「—」, không ước lượng.
- **Giữa — Visual Preview:** iframe preview cô lập (spec #4 §14.7), phiên mode `partial` (draft có thể chưa hoàn chỉnh) với dữ liệu tổng hợp. Nút kịch bản được **sinh từ IR** của phiên (ví dụ với PC: 「次へを試す」, 「買取方法: 店頭買取」, 「買取方法: 宅配買取」); mỗi nút gửi một lệnh chung có kiểu:
  - `preview.demo { action: "next" | "back" | "setOption" | "showValidation" | "simulatePending", fieldId?, optionValue? }` — `fieldId`/`optionValue` phải có trong IR của phiên (iframe kiểm, sai → bỏ); `setOption` đi qua **engine** như một input thật (không ép UI); `showValidation` = engine chạy `next` trên step hiện tại để sinh lỗi thật; `simulatePending` = engine của iframe dùng **adapter submit mock** giữ trạng thái `pending` trong preview (không gọi Preview API, không ép UI — giữ ADR-062 "Motion chỉ phản ánh state engine") *[Claude]*.
  - `preview.motionMode { motion: "on" | "off", reducedMotion: "emulate" | "system" }`.
  - Cả hai tuân quy tắc của spec #4 §14.7: JSON Schema theo `type`, ≤ 16 KB, đúng `previewSessionId`, `seq` tăng theo chiều, `targetOrigin` chính xác. Nếu OS của Editor đang bật reduce, preview tôn trọng và hiện ghi chú 「お使いの端末で動きを減らす設定が有効です」.
- **Phải — thuộc tính:** bật/tắt từng nhóm, kèm **nơi áp dụng** đếm từ IR (số step có thể chuyển tới; số node có `visibleWhen`) — ví dụ 「ステップの切り替え（5か所）」, 「条件による表示（3か所）」; `速さ`; ghi chú a11y/hiệu năng cố định từ catalog.
- **Command** (spec #4 §8): `SetMotionPreset{id, version}` (đã có; chọn version tương thích cao nhất có trong Preview build, pin), `SetMotionCategory{category, on}`, `SetMotionSpeed{speed}`, `UpgradeMotionPreset{toVersion}` (chủ động, có diff). Không command nào nhận chuỗi tự do.
- **Diagnostics** (spec #4 §13.2): `E-MOTION-PRESET-UNKNOWN`, `E-MOTION-CATEGORY-UNSUPPORTED`, `E-MOTION-PRESET-INCOMPATIBLE` (gate preview), `W-MOTION-PRESET-DEPRECATED` (none), `E-ADMIN-MOTION-NOT-BUNDLED` khi version preset đã pin không có trong Preview build (gate preview; 「このモーションの版はプレビューで利用できません」).
- **Review diff** (spec #4 §17): thay đổi Motion hiện bằng ngôn ngữ nghiệp vụ, ví dụ 「モーション: 控えめ → ガイド付き」, 「送信中の表示: オン → オフ」.
- Editor không thấy JSON, recipe id hay thời lượng ms.

**Hành trình (định nghĩa thành công của ADR-062):**

| # | Bước | Màn hình |
|---|---|---|
| 1 | Mở PC Form Builder | フォーム一覧 → ビルダー |
| 2 | Chọn preset | 設定 › モーション, thẻ ガイド付き |
| 3 | Xem chuyển step | 次へを試す |
| 4 | Xem 店頭/宅配 | 店頭買取を選ぶ / 宅配買取を選ぶ |
| 5 | Kiểm reduced motion | 動きを減らす設定で確認 |
| 6 | Lưu draft | tự động (spec #4 §15), trạng thái 保存済み |
| 7 | Gửi review | レビューを依頼 (spec #4 §17); diff nghiệp vụ hiện 「モーション: 控えめ → ガイド付き」 |

## 11. Preview / Published parity

- *(Rev 2.2, ADR-074)* Ba tầng của spec #4 §9.1: **Edit Canvas** không chạy Motion (không có Motion runtime trong Admin build, INV-A1) và không tuyên bố gì về chuyển động; **Interactive Preview** (tab モーション, Preview, Review) là nơi duy nhất trong Admin xem Motion, parity theo contract có version (`platformReleaseId` gồm engine, `motion-presets`, thư viện Motion); **Published Form** là chuẩn. Motion Preview vốn đã chạy trong iframe cô lập (§10), nên ADR-074 không đổi contract Motion.
- Preview iframe dùng cùng package engine, `motion-presets`, thư viện `motion` và cùng IR `motion` như artifact (spec #4 §14.7: Preview build cùng version).
- Test parity so **mô tả animation** (recipe id, thuộc tính, thời lượng, hướng) mà runtime chọn cho cùng chuỗi `TransitionNotice`, không so pixel.

## 12. Test matrix

| ID | Kịch bản | Mong đợi | Loại |
|---|---|---|---|
| TM-6R01 | Toàn bộ luồng Sports và PC với Motion-none | đi hết mọi nhánh, submit được; không module Motion (spec #3 C02) | A |
| TM-6R02 | Mỗi preset × mỗi nhóm | recipe đúng; chỉ opacity/transform/box-shadow | A |
| TM-6R03 | Chuyển step tới/lui/jump | focus tới tiêu đề step **trước** khi animation kết thúc; giá trị giữ nguyên; history đúng; submit/next thất bại → focus field lỗi đầu tiên (spec #1 §11) | A |
| TM-6R04 | 店頭 → 宅配 → 店頭 nhanh liên tiếp (ngắt animation giữa chừng) | activity và giá trị theo engine tại mọi thời điểm; bóng exit không nhận input, không có trong payload; không còn bóng sau timeout | A |
| TM-6R05 | Validation lỗi rồi sửa | message có ngay cho screen reader; không rung/nhấp nháy; không "OK" khi còn pending | A + M |
| TM-6R06 | Submit: bấm hai lần trong lúc animation; backend 503 rồi 200 | đúng một submission (idempotency); success chỉ sau 200 | A |
| TM-6R07 | `prefers-reduced-motion: reduce` (từ đầu và đổi giữa phiên) | không tải group `motion` / không chuyển động; mọi thông tin vẫn có | A |
| TM-6R08 | Group `motion` không tải được / ném lỗi | form đủ chức năng, không animation, counter kỹ thuật | A |
| TM-6R09 | Static check package Motion | không import dispatcher, store hay selector của engine; không API mạng/storage (L3) | A |
| TM-6R10 | `ExitShell` | slot vẽ shell từ IR theo `regionId`; **không** giá trị khách nào (kể cả lựa chọn, kể cả giá trị inactive còn giữ trong bộ nhớ); không element con thật; không `Component` của plugin; ngoài flow; không shell khi Motion-none — VERIFICATION_PENDING (sau G1) | A |
| TM-6R11 | Focus đang ở trong node vừa inactive | focus về điều khiển gây thay đổi, có và không có Motion | A |
| TM-6A03 | Preview build | chứa mọi version `motion-presets` được hỗ trợ (INV-A2); preset pin không có → `E-ADMIN-MOTION-NOT-BUNDLED` | A |
| TM-6A04 | `preview.demo` | chỉ nhận `fieldId`/`optionValue` có trong IR; `setOption` đi qua engine; `simulatePending` dùng adapter mock, không gọi mạng | A |
| TM-6R12 | Bóng exit không PII: đổi nhánh khi field cũ có PII giả có marker (tên, điện thoại, email, địa chỉ) | marker không có trong DOM của shell, accessibility tree, snapshot | A |
| TM-6R13 | 店頭 → 宅配 → 店頭 rất nhanh | activity/giá trị đúng engine; animation cũ bị thay; không shell còn sót | A |
| TM-6R14 | 次へ → 戻る trước khi animation xong | step và focus đúng state cuối; không animation cũ ghi đè | A |
| TM-6R15 | Lỗi validation đến giữa animation | lỗi hiện ngay, focus field lỗi đầu tiên | A |
| TM-6R16 | Submit pending → failure; pending → success | chỉ báo đúng; success chỉ sau phản hồi backend; không submit lần hai | A |
| TM-6R17 | `reduced` đổi giữa phiên (bật và tắt) | bật: hủy animation ngay; tắt: tải group theo quy tắc | A |
| TM-6R18 | Component unmount giữa transition | không callback sau unmount; không lỗi | A |
| TM-6R19 | Focus target đã inactive | focus về điều khiển gây thay đổi | A |
| TM-6A05 | Preview reset giữa animation | hủy animation, áp state mới | A |
| TM-6B03 | `sports-demo-nomotion`: toàn bộ emitted artifact graph | không module, chunk, `import()`, file `motion.*`; workflow đầy đủ | A |
| TM-6B04 | Form có Motion, `reduced` bật từ đầu | không request tới chunk `motion` ở route đầu, kể cả prefetch | A (network log) |
| TM-6P02 | CLS khi reveal/exit; long task khi chuyển step | đo trên artifact, báo cáo kèm môi trường; không tuyên bố CWV PASS từ lab | đo |
| TM-6B01 | Artifact PC | chỉ recipe của `guided`; canary recipe khác không có; không feature thư viện ngoài danh sách | A |
| TM-6B02 | Rebuild cùng input | cùng `releaseId` (Motion không phá tính tất định) | A |
| TM-6P01 | Đo bytes, request, T2/T3, INP, long task, CLS, reduced motion, CPU chậm | báo cáo số đo kèm môi trường; không tuyên bố PASS CWV từ lab | đo |
| TM-6U01 | Usability: 7 bước hành trình §10 | ngưỡng do user chốt trước test | U |
| TM-6A01 | Preview parity | cùng mô tả animation cho cùng chuỗi notice ở preview và artifact | A |
| TM-6A02 | Admin: chọn preset / tắt nhóm / speed | chỉ qua command có kiểu; diagnostics đúng; không lộ JSON | A |

## 13. Phạm vi P0 / P1 / P2

| Hạng mục | P0 | P1 | P2 |
|---|---|---|---|
| Bốn nhóm tình huống | ✔ | | |
| Preset `none` / `subtle` / `guided`, bật/tắt nhóm, `speed` | ✔ | thêm preset; `motionPreset` plugin (spec #2 §7.1) nếu có nhu cầu | |
| Spring/stagger/micro-interaction tùy chỉnh (F-P1-09) | | ✔ | |
| Override theo step | | OD6-03 | |
| Exit animation cho step | | đánh giá | |
| Tab モーション với preview cô lập, so sánh, reduced motion | ✔ | | |

## 14. Cross-spec interfaces

| # | Interface | Spec khác | Spec #6 | Trạng thái |
|---|---|---|---|---|
| I6-01 | Schema slot `motion` trong definition; IR `motion` | spec #1 §7.1 (giữ chỗ) | §7.1, §7.3 | Đồng bộ (spec #1 rev 3.6) |
| I6-02 | `TransitionNotice`; trạng thái `submit` (`idle/pending/succeeded/failed`); focus tới tiêu đề step khi chuyển step; focus khi node chứa focus thành inactive | spec #1 §8.4, §9, §11 (engine, adapter React) | §6.2, §6.3 | Đồng bộ (spec #1 rev 3.6) |
| I6-03 | Motion là core, không plugin ở P0; luật L3 cho package `motion-presets` (không import dispatcher/store/selector của engine, không mạng/storage) | spec #2 §7.1, §11.2 (ADR-033) | §6.2, TM-6R09 | Đồng bộ (spec #2 rev 2.10) |
| I6-04 | Codegen group `motion` chỉ recipe dùng; K10 canary recipe (`E-ARTIFACT-MOTION-UNUSED-RECIPE`); LRM chứa version; mã `E-MOTION-*` vào catalog; đổi tên preset ví dụ `fade-slide`/`scale-spring` → `subtle`/`guided` | spec #3 §7, §8, §10, §11.1, §13, §18.1a | §7.3 | Đồng bộ (spec #3 rev 2.5) |
| I6-05 | Tab モーション; command `SetMotionCategory`, `SetMotionSpeed`, `UpgradeMotionPreset`; diagnostics; review diff; `preview.demo` / `preview.motionMode` | spec #4 §8, §13.2, §14.7, §16, §17 (I4-14) | §10 | Đồng bộ (spec #4 rev 2.4) |
| I6-06 | Preview build chứa Motion runtime + mọi version `motion-presets` được hỗ trợ (INV-A2, L1b); adapter submit mock của preview là module platform được phép (MINOR-14); phát hành preset qua trusted pipeline | spec #2 §10.1, §11.1 (rev 2.10–2.11); spec #5 I5-08, I5-09 | §7.2, §10 | Đồng bộ |

**Truy vết requirement → test:** F-P0-09 → TM-6R02, TM-6R05, TM-6R07, TM-6A02, TM-6U01 · MOTION-01 → §7.2 (engine/recipe hỗ trợ duration/delay/easing; UI P0 không mở tham số thấp cấp — ADR-067; **không** DONE vì đổi scope) · MOTION-02 → TM-6R02, TM-6A01, TM-6A02 · MOTION-03 → TM-6R07 · MOTION-04 → TM-6B01 · MOTION-05 → TM-6P01, §9 · MOTION-06 → TM-6R03, TM-6R04, TM-6R10..R19 · MOTION-07 → TM-6R01, TM-6B01, TM-6B03, TM-6B04 · PERF-07 → TM-6P01, TM-6P02 · TEST-07 → TM-6R02..R07 · DOD-03 → TM-6A01, TM-6A02.

## 15. Rủi ro

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| Thư viện làm tăng bytes đáng kể | Trung bình, chưa đo | adapter cách ly; cổng đo ở P04; phương án A làm dự phòng (cần ADR) |
| Bóng exit gây nhầm lẫn a11y hoặc nhận input | Thấp | `inert` + `aria-hidden` + engine bỏ qua input node inactive; timeout; TM-6R04 |
| Animation chồng nhau khi khách thao tác nhanh | Trung bình | recipe ngắn; ngắt animation cũ; state luôn theo engine |
| Group `motion` tải muộn làm vài chuyển step đầu không có animation | Thấp | chấp nhận (không bao giờ chờ); đo thời điểm tải |
| Cấu hình thư viện kéo feature thừa | Thấp | feature bundle tối thiểu; K10 kiểm |

## 16. Quyết định

**Đã quyết (review rev 1):** OD6-01 → ADR-064 (B, Motion Adapter) · OD6-02 → ADR-065 (preset, tween) · OD6-03 → ADR-066 (per-step P1) · OD6-04 → ADR-067 (tham số trong recipe). Không còn quyết định mở của spec #6.

Các lựa chọn *[Claude]*: step cũ biến mất ngay (chỉ enter cho step); `speed` ba mức; timeout shell 400 ms, shell ngoài flow, không giá trị khách; `outline-pulse-once` cho validation; không intro animation; `simulatePending` bằng adapter submit mock trong iframe.

## 17. Để builder tự quyết

Tên component, cách tổ chức recipe trong package, easing cụ thể trong enum, cách đếm "nơi áp dụng" từ IR, bố cục chi tiết tab モーション.

## 18. Mức độ sẵn sàng (revision 2)

Đề xuất **READY_FOR_CROSS_SPEC_REVIEW** sau khi đồng bộ I6-01..06 (đã làm cùng rev 2).


| Phần | Trạng thái | Còn mở |
|---|---|---|
| Tình huống, ranh giới (§4, §6) | Chờ review | — |
| Kiến trúc (§5) | ADR-064 | — |
| Độ lệch MOTION-01 | ADR-067 | — |
| Contract, preset (§7) | ADR-065, ADR-066 | — |
| A11y, hiệu năng (§8, §9) | Chờ review; số đo ở P04/P07 | — |
| Builder UX (§10) | Chờ review | — |
| Kiểm tra độc lập | §19 | — |

## 19. Builder check / consistency review (reviewer độc lập, chỉ đọc)

Kết luận: đúng mọi điểm của ADR-062, không overclaim; **0 BLOCKER, 5 MAJOR, 9 MINOR**; đã xử lý trong revision 1:

| # | Phát hiện | Xử lý |
|---|---|---|
| M1 | Preview build (INV-A2, L1b) không chứa Motion; mã `E-ADMIN-CAP-NOT-BUNDLED` không hợp với preset | I6-06 cần cập nhật spec #2; mã `E-ADMIN-MOTION-NOT-BUNDLED`; TM-6A03 |
| M2 | Bóng exit không làm được với `render(region, children)` theo node; chưa rõ ai giữ bóng | `MotionPresenceSlot` ở container cha; bóng là snapshot đóng băng, ngoài flow; không có bóng khi Motion-none (§6.2, §6.3); TM-6R10 |
| M3 | Focus khi submit thất bại trái spec #1; trích sai §8.4 | theo spec #1 §11 (focus field lỗi đầu tiên); focus tiêu đề step là bổ sung qua I6-02 |
| M4 | `submit.status` chưa có trong engine | I6-02 nêu bổ sung, khớp `disabled`/INV-N5; chỉ báo pending do core render |
| M5 | `preview.demo` gắn cứng PC | lệnh chung `setOption`/`next`/… với ID từ IR, schema, giới hạn, mode `partial`; `simulatePending` qua adapter mock |
| m | `reducedMotion` `user` vs `always` | tín hiệu `reduced` nội bộ + biến thể recipe (§7.4) |
| m | Tên preset ví dụ ở spec #3; Sports subtle vs none | I6-04; §9 sửa |
| m | `motionPreset` P1 vs P2 | theo spec #2: P1 |
| m | Non-goals vs OD6-03 | sửa §2 |
| m | Mã `E-MOTION-*`, diff review, command mới | I6-04, I6-05, §10 |
| m | Thiếu nâng version preset và ràng buộc tương thích | `UpgradeMotionPreset`, `compat.engine`, `E-MOTION-PRESET-INCOMPATIBLE` |
| m | Nhãn bytes đo trên fixture | 「標準サンプルでの測定値」 |
| m | TM-6R09 "không đọc giá trị" không kiểm tĩnh được | viết lại |
| m | Thiếu truy vết requirement → test | §14 |
| — | Builder hỏi: spring ở P0 | bỏ; P0 chỉ tween |
| — | Builder hỏi: độ lệch MOTION-01 | **OD6-04** cho user |

## 20. Thay đổi so với revision 1

- ADR-064..067 áp vào §5, §7.2, §16, §18.
- §6.3: bóng exit thành presentation shell đã làm sạch, không giá trị khách; TM-6R12.
- §6.4 mới: một animation mỗi region, hủy/thay; callback không khôi phục state.
- §7.4 viết lại: bảng tải/reduced motion (không Motion; reduced từ đầu — kiểm trước `import()`/prefetch; đổi giữa phiên; module đã tải không unload); không dùng `reducedMotion="user"` làm bằng chứng không tải.
- §12: TM-6R12..R19, TM-6A05, TM-6B03, TM-6B04, TM-6P02. §14: truy vết MOTION-01 theo ADR-067.
- Đồng bộ I6-01..06: spec #1 rev 3.6, spec #2 rev 2.10, spec #3 rev 2.5, spec #4 rev 2.4, spec #5 (I5-09).
