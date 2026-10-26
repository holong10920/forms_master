# UX-PREMIUM — Port browser test Admin sang Form Studio UI

> Ngày: 2026-10-26 · Branch: `ux/form-studio-premium` (worktree `forms_master-ux`) · Base: `45f10c9`
> Phạm vi: 12 file `tools/local_p0/test/*-browser.txt` + `browser-flow.txt` (Playwright run-code).
> `reference-browser.txt` (customer Sports/PC) **không sửa** (sha256 không đổi).

## 1. Nguyên tắc port

1. Chỉ đổi **selector và cách thao tác** để khớp UI mới (3 panel, inspector theo tab, save menu, chế độ 作成/翻訳/公開, confirm dialog tự dựng).
2. **Không xoá, không nới lỏng assertion nào.** Mọi `throw Error(...)` / `check(...)` cũ vẫn còn, cùng message.
3. Assertion nào phải viết lại (vì phần tử UI cũ không còn) đều ở mức **bằng hoặc chặt hơn**, liệt kê ở §4.
4. Giá trị trả về (`return {allPassed:true,...}`) giữ nguyên key.

Kiểm tra máy (script audit so sánh HEAD với working tree, đếm `throw Error(` / `check(` và trích message):

| File | sha256 cũ → mới (12 ký tự) | Message assertion bị mất | Assertion thêm | Return keys giống |
|---|---|---|---|---|
| autosave-browser.txt | f102629521ca → d32e99693a6c | 0 | `switch state` | ✅ |
| blocked-preview-browser.txt | 54456783d993 → f06b83d4429b | 0 | `switch state` | ✅ |
| browser-flow.txt | 0de03e053666 → 2af0f78d2bb4 | 0 | `switch state` | ✅ |
| clone-settings-browser.txt | ff4e189b5539 → 8d480cb49e71 | 0 | `switch state` | ✅ |
| l10n-browser.txt | 593a18a14cdd → e54f2975f89a | 0 | `switch state` | ✅ |
| numeric-browser.txt | d050f39b28c2 → 694d2dcd1425 | 0 | `switch state` | ✅ |
| oidc-browser.txt | 9cb21e98ad96 → 2fc7f3577bc9 | 0 | — | ✅ |
| partial-preview-browser.txt | 106cd72fed89 → 39526c13307b | 0 | `switch state` | ✅ |
| preview-revocation-browser.txt | 84fa0793fd4b → d294aac78bc1 | 0 | `switch state` | ✅ |
| reauth-draft-browser.txt | b951c66a05d7 → 514223b0b7d1 | 0 | `switch state` | ✅ |
| rules-browser.txt | d379de5c4284 → cf88164fb393 | 0 | `switch state` | ✅ |
| shared-block-browser.txt | 21b8a61016f2 → a6cc499ac101 | 0 | `switch state` | ✅ |
| reference-browser.txt | 2833bd5e186c → 2833bd5e186c | 0 | — | ✅ (không đổi) |

> Hash cũ được ghi trong evidence lịch sử (`docs/evidence/LOCAL-P0*`) **không bị sửa**; evidence cũ mô tả UI cũ tại commit tương ứng.
> Nếu sau bước format (prettier) hash test thay đổi, bảng trên được cập nhật ở `RESULTS.md`.

## 2. Bảng selector chung (cũ → mới)

| Thao tác | UI cũ | Form Studio UI |
|---|---|---|
| Đăng nhập | `#account` select + nút `ログイン / 切替` | Chưa đăng nhập: thẻ tài khoản `#account-list [data-account=<user>]`. Đã đăng nhập: `#identity-btn` → menu → `[data-account=<user>]` |
| Đăng xuất | nút `ログアウト` | `#identity-btn` → menuitem `ログアウト` |
| Tạo form | `#new-name` + `フォーム作成` | `#new-form` → `#new-name` → `フォーム作成` |
| Lấy form id | `#forms` inputValue | query `?form=` trên URL |
| Mở form | `#forms` selectOption + `開く / 再読込` | `#home-link` → thẻ `#forms [data-form-id=<id>]` |
| Lưu / tải lại | nút `保存`, `開く / 再読込` | save menu `#save-state` → `#save` / `#load` |
| Tắt autosave | `#autosave`.uncheck() (luôn hiển thị) | save menu → switch `#autosave` (bàn phím Space) → Escape; chỉ có khi đã mở form |
| Thêm field | `#palette` select + `フィールド追加` | tab trái `追加` → `#palette [data-add-type=<type>]` |
| Thuộc tính field | cùng một panel | inspector tab: 基本 (`表示名`, 選択肢), 検証 (`必須`, `最大文字数`), 条件 (rule), 詳細 (`データキー`) |
| `required` | checkbox `required` | switch `必須` (tab 検証) |
| `maxLength` | ô `maxLength` | ô `最大文字数` (tab 検証) |
| Bulk 選択肢 | textarea luôn hiển thị | `<details>` `まとめて編集` trong tab 基本 |
| Thêm bước | `ステップ追加` | tab trái `構成` → `ステップを追加` |
| Chọn bước | nút `form · stp_details` | `#steps [data-focus-key="ol-step:<stepId>"]` |
| Chọn field | nút `<label> * · <type>` | `#steps` nút `<label> * · <tên loại tiếng Nhật>` (vd. `テキスト（1行）`) |
| Chọn block | nút `共通ブロック · customer · <pin>` | `#steps` nút `customer（共通ブロック）` |
| Chèn block | `#block-pin` select + `共通ブロックを挿入` | tab `追加` → nút `共通ブロック <pin> を挿入` |
| Đổi pin block | native `confirm()` | `固定リビジョン` → confirm dialog `変更する` |
| Named condition | khối `#named-conditions` luôn hiển thị | inspector form (bỏ chọn) → tab 条件 |
| Branch | khối `#branches` của bước | step inspector → tab 分岐 |
| Theme / Motion | select | radiogroup `テーマ` / `モーション` / `速さ` (thẻ radio) |
| Review | nút `レビュー依頼` (gửi ngay) | `レビュー依頼` → `#review-dialog` → `レビューを依頼する` (+ switch `#contract-ack` nếu Data Contract đổi) |
| Approve / Publish / Rollback | nút gửi ngay | nút → confirm dialog `承認する` / `公開する` / `ロールバックする` |
| Lịch sử | `#history` luôn hiển thị | chế độ `公開` (`#modes [data-mode=publish]`) |
| Xem snapshot | `スナップショット / Data Contract` | `内容を確認` |
| Translations | `#translations` luôn hiển thị | chế độ `翻訳` |

Helper dùng chung (khai báo trong từng file, ghi chú tiếng Anh ở đầu): `press` (focus + Enter), `setSwitch` (focus + Space, rồi assert trạng thái → `switch state`), `menu`, `tab`, `addField`, `confirm`, `publishMode`/`mode`.

**Vì sao switch dùng bàn phím:** switch của UI mới là `<input type=checkbox>` 1×1 px trong suốt, vùng click là `span.switch-track`. `check()`/`uncheck()` của Playwright timeout vì input không “visible”. `setSwitch` thao tác như người dùng bàn phím và **assert lại trạng thái** sau khi bấm (chặt hơn `check()`).

## 3. Thay đổi theo từng file

| File | Thay đổi chính |
|---|---|
| oidc | Login qua thẻ tài khoản / user menu; logout qua menuitem. |
| numeric | Tạo form qua `#new-form`; `データキー` tab 詳細; `必須` tab 検証. |
| reauth-draft | Re-login qua user menu sau 401 giả lập; form id từ URL. |
| autosave | Peer page mở form từ thẻ; xung đột CAS đọc `#conflict-details` như cũ. |
| partial-preview | `次のステップ` ở tab 分岐 của bước; review qua dialog. |
| preview-revocation / blocked-preview | Login qua thẻ; mở `frm_pc_reference` từ thẻ; autosave tắt qua save menu (bỏ lần uncheck trùng lặp của bản cũ). |
| clone-settings | Releases ở chế độ 公開; theme/motion/speed qua radiogroup; rule ở tab 条件 của field. |
| rules | Named condition ở inspector form tab 条件; `必須条件の組み合わせ` ở field tab 条件. |
| shared-block | Chèn block từ palette; đổi pin qua confirm dialog; review/approve/publish qua dialog; vai trò chuyển qua user menu + chế độ 公開. |
| browser-flow | Như trên + `内容を確認`; mở lại form qua `#home-link` + thẻ; chọn bước thứ 2 bằng outline. |
| l10n | Translations ở chế độ 翻訳; sửa ja ở inspector rồi quay lại 翻訳 để kiểm tra vi. |

## 4. Assertion phải viết lại (bằng hoặc chặt hơn)

| # | File | Cũ | Mới | Vì sao bằng/chặt hơn |
|---|---|---|---|---|
| A1 | browser-flow | `#branches` textContent chứa `等しい値` | combobox `等しい値` trong `#branches` có giá trị `no` | UI mới để `等しい値` ở aria-label, không ở text. Bản mới kiểm cả việc branch tồn tại **và** giá trị đã lưu. |
| A2 | l10n | nút `Lưu` (vi) / `保存` (ja) tồn tại | `#save` có text `Lưu ngay` / `今すぐ保存` (attached) | Nút lưu nằm trong save menu. Vẫn xác nhận chrome được dịch; text cụ thể hơn. |
| A3 | l10n | kiểm ô vi ngay sau khi sửa ja ở inspector (panel cùng màn hình) | chuyển sang chế độ 翻訳 rồi mới kiểm | Rows được render lại **từ draft**, nên kiểm được việc lưu vào draft, không chỉ DOM cũ. |
| A4 | rules | `getByLabel('名前付き条件: 等しい値')` (strict, khớp 1) | `getByRole('spinbutton', {name:'名前付き条件: 等しい値'})` | UI cũ bọc control bằng `<label>`, text option của select làm nhãn select không khớp exact, nên locator cũ chỉ trúng ô number. UI mới dùng aria-label nên cả hai khớp. Bản mới nhắm đúng ô cũ **và** kiểm role số. |
| A5 | shared-block, browser-flow, l10n | approve/publish/rollback gửi ngay | thêm bước bấm nút confirm | Thêm bước xác nhận; các assertion trạng thái (`OPEN`/`APPROVED`/link release) giữ nguyên. |
| A6 | shared-block | handler native `dialog` accept | bấm `変更する` trong confirm dialog | Hành vi tương đương; không còn native dialog. |
| A7 | `#identity` filter | `waitFor()` (visible) | `waitFor({state:'attached'})` | Ở ≤1600 px khi mở form, tên user chỉ ẩn bằng visually-hidden (vẫn trong accessibility tree). Nội dung kiểm giữ nguyên. |
| A8 | tất cả | `check()`/`uncheck()` | `setSwitch` | Thêm assert `switch state`. |

## 5. Lỗi thật phát hiện nhờ port (đã sửa trong UI, không sửa test)

| # | Triệu chứng | Nguyên nhân gốc (đã chứng minh bằng trace) | Sửa |
|---|---|---|---|
| B1 | shared-block: đổi pin r1→r2, bấm `変更する` rồi `レビュー依頼` ngay → review được tạo **không** yêu cầu xác nhận Data Contract; snapshot review vẫn là r1. | `confirmDialog` resolve trong sự kiện `close` (được queue sang task sau). Trace: `close()` 2362 ms → Enter vào `レビュー依頼` 2372 ms → `save` gửi r1 2372 ms → `close` event 2376 ms. Thay đổi đã xác nhận bị áp dụng **sau** khi review đã gửi. Native `confirm()` của UI cũ đồng bộ nên không có lỗi này. | `ui.js` `confirmDialog`: resolve ngay trong handler click (cùng task), `close` chỉ resolve `false` cho Escape/huỷ. |
| B2 | browser-flow: bấm `内容を確認` ngay sau khi vào chế độ 公開 thì nội dung snapshot biến mất. | Vào 公開 gọi `loadHistory()` nền; khi trả về, `renderPublish()` dựng lại `#history` và xoá `<details>` vừa mở. Mọi lần refresh lịch sử đều làm sụp nội dung reviewer đang đọc. | `workflow.js`: giữ snapshot đang mở theo review id (`openSnapshots`), render lại khi refresh; đồng bộ `aria-expanded` (trước đây `e.currentTarget` sau `await` là `null` nên `aria-expanded` không bao giờ được set). |

## 6. Kết quả chạy

Xem `RESULTS.md` (lần chạy cuối sau lint/format).
