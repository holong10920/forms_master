# UX Premium — kết quả thực thi local synthetic, 2026-10-26

## Trạng thái và hợp nhất hai tree

Theo yêu cầu trực tiếp của user, đã commit riêng JA/VI và UX rồi hợp nhất local, không reset/stash/clean:

| Commit | Nội dung |
| --- | --- |
| `f9f3313` | 13 file tài liệu/bằng chứng JA/VI từ tree gốc |
| `6c425eb` | 23 file snapshot UX Claude tại `forms_master-ux`, nhánh `ux/form-studio-premium` |
| `1cce3b7` | Merge hai snapshot, không conflict |

Tree làm việc chính: `/Users/hongocbaolong/Documents/marketenterprise/forms_master`.
Nhánh làm việc chính: `codex/p03-s1-workflow-engine`; không đổi nhánh `main` cũ.
Tree UX được fast-forward tới commit hợp nhất và chỉ giữ làm bản đồng bộ, không writer thứ hai.
Bản sửa cuối, test đã chạy và report này nằm trong checkpoint sau merge.
Không truy cập GitHub, không remote operation, không push, không AWS writes.
Runtime SQLite/artifact trong `var/` của mỗi tree được giữ nguyên; Git chỉ đồng bộ source và evidence.

## UX đã thực hiện

- Header gọn: breadcrumb/site tên dễ hiểu, form name, trạng thái, save state, language, role menu và CTA theo vai trò.
- Home: thẻ form, tìm kiếm, tạo form qua dialog; empty/loading/error + retry.
- Workspace ba panel: outline/step/shared block/palette, Canvas có cấu trúc, Inspector theo object/tab.
- Chọn field trên Canvas, selection outline, toolbar ngữ cảnh, F2/inline rename, thêm field giữa các field.
- Drag-and-drop, nút lên/xuống và Alt+ArrowUp/Down; chuyển field giữa các input step.
- Required/validation, choices, named rules, AND/OR, natural-language summaries, diagnostics giữ engine hiện có.
- Theme cards có swatch và phản hồi trên Canvas; Motion None/Subtle/Guided, speed và category controls.
- Desktop/mobile Canvas và Preview; Preview vẫn riêng origin 4175, không chạy plugin executable trong Admin.
- Review snapshot/Data Contract, approve/publish/rollback qua dialog; release history và customer URL.
- JA/VI chrome và nội dung song ngữ giữ nguyên; không có provider dịch tự động.

Admin thực tế là DOM JavaScript modules, không phải React app. Không thêm React, UI framework hay dependency.
Skill Playwright và React best practices đã đọc; không có TSX thay đổi nên checklist React hooks/component không áp dụng.
Tham khảo ngắn các pattern: [Fillout](https://www.fillout.com/), [Typeform](https://www.typeform.com/),
[Framer](https://www.framer.com/), [Webflow](https://webflow.com/), [Tally](https://tally.so/).
Chỉ dùng nguyên tắc editing/navigation/action hierarchy; không sao chép branding.

## Phạm vi source và lỗi phát hiện

Source chủ yếu trong `tools/local_p0/web/`: shell, state, editor, rules, workflow, localization và CSS.
Ngoài Admin UI: `host.ts` thêm đúng 5 module Admin vào allowlist static; 12 browser script được port selector.
Không đổi API/backend behavior, contracts/DSL, compiler, engine, Customer runtime, Sports/PC bundles hoặc dependency lock.
Không xoá/nới lỏng assertion cũ: xem `TEST-PORT-MAPPING.md`; SHA test port khớp bảng đã ghi.

Sau tiếp nhận, UAT loading/error phát hiện request race: response của site trước có thể về sau response mới,
ghi đè list hoặc error. `refreshForms` nay khóa theo request sequence + site hiện tại và xóa list cũ khi đổi site.
`premium-browser.txt` tái hiện bằng cách giữ request PC, tạo lỗi Sports, rồi cho response PC về muộn;
assert error Sports còn nguyên và không có card PC, sau đó retry thành công.

## Kiểm thử đã chạy

`PATH="$PWD/.tools/bin:$PATH" pnpm verify` chạy tại tree chính sau bản sửa race: **exit 0**.
Log kiểm thử: `verify.log` (phần scanner chỉ giữ metadata/findings, bỏ danh sách hash của mọi file).
Raw stdout và manifest gốc được giữ tại `output/playwright/ux-refactor/` (gitignored).

| Kiểm tra | Kết quả |
| --- | --- |
| Preflight, format, ESLint, workspace typecheck | PASS |
| Vitest | 638 PASS, 15 declared expected fail, 1 optional Gitleaks skip |
| Generated files, schema lint, package boundaries | PASS |
| Ruff lint/format, mypy, import boundaries | PASS |
| Python regression | 798 PASS |
| Synthetic-data check | PASS, không finding |
| detect-secrets 1.5.0, 27 detectors, working/index | 0 unresolved; không detector bị tắt |

Hai index snapshot trước commit đã quét riêng (report dưới đây giữ metadata/findings, không lặp toàn bộ hash manifest): `checkpoint-secrets-main.json`, `checkpoint-secrets-ux.json`.
Gitleaks NOT_EXECUTED; không tuyên bố tương đương Gitleaks hay scan production.

Browser: Chromium **156.0.8078.47**, UI interactions qua Playwright CLI.
Các suite có context/cookie riêng; chỉ localhost synthetic, không API nghiệp vụ ngoài.
`browser-flow-result.json`: create/edit → required/branch → save/reload → Preview → request review →
self-approval denied → authorized approve → publish → customer submit/idempotency → mock receipt →
revision 2 → rollback → pinned revision unchanged → cross-site denied. Admin plugin runtime requests = 0.

`suite-results.json` chứa 12 suite **allPassed=true**:

| Suite | Nội dung |
| --- | --- |
| oidc | Authorization Code + PKCE, cookie flags, replay rejection, Viewer/cross-site denial |
| autosave | Debounce 1 save, CAS conflict, giữ local edit và server state |
| numeric | Từ chối decimal, integer payload, cookie metadata |
| rules | Named AND, typed comparisons, conditional required, save/reload |
| clone-settings | Clone identity, block export rule, theme, subtle/slow Motion, Preview |
| l10n | Admin/customer JA/VI, fallback, validation, preserve data, provider unavailable |
| shared-block | Hai instances, namespace payload/backend receipt, nâng một pin, Data Contract ack |
| partial-preview | Dừng path chưa cấu hình, Back giữ dữ liệu, không submit/approve |
| preview-revocation | Preview bị thu hồi và iframe bị tháo |
| blocked-preview | Reopen placeholder, ổn định qua polling, không plugin chunk, submit denied |
| reauth-draft | Inject expired save, OIDC re-auth thật, giữ unsaved schema, save/reload |
| reference | Sports none/subtle/reduced motion; PC delivery/store; capability failure/retry; rollback |

Sau sửa race, `premium-result.json` có **allPassed=true**, 0 page errors:
2 input steps được thêm (tổng 3), 3 fields, required, OR với 2 giá trị, inline rename,
keyboard/button/drag reorder, theme feedback, Guided/Fast Motion, JA→VI→JA,
save/reload giữ rules/order/Motion, desktop/mobile Canvas, Preview navigation,
empty search, loading/error/retry và stale-response protection.
Re-run: dùng Playwright CLI `run-code` với nội dung `tools/local_p0/test/premium-browser.txt`.
`clone-settings-browser.txt` kế thừa một fixture form ID local cố định; chưa biến thành suite độc lập với database seed.

## Responsive và accessibility

Đã xem ảnh 1440×900, 1280×800, 1024×768; scrollWidth đúng viewport tại cả ba kích thước.
Desktop/mobile Canvas hoạt động. Tab strips hỗ trợ arrow-key/roving tabindex và giữ focus khi render.
Focus ring được kiểm bằng keyboard modality thật: `:focus-visible=true`, outline `solid`.
Reorder không bắt buộc dragging: Alt+Arrow và toolbar buttons đều có assertion riêng.
Required/field labels, accessible button names, Inspector controls và authorized/read-only mode đã chạy browser.
`contrast.json`: 6 cặp token chữ/nền kiểm tra đạt 4.5:1 trở lên (thấp nhất 5.29:1).
Đây là kiểm tra các token chính, không phải chứng nhận accessibility toàn sản phẩm hay audit screen reader đầy đủ.

Ảnh trước/sau: `before-1440.png`, `before-1280.png`, `before-1024.png` và `after-*.png`.
Ảnh trước chụp baseline UI với form rỗng có sẵn; ảnh sau dùng form synthetic UAT mới, không phải pixel-diff cùng dữ liệu.
Ảnh bổ sung: empty, style, Motion, VI, mobile Canvas, keyboard focus, Preview, search empty và load error.

## Demo và giới hạn

Admin: http://localhost:4174/ — chọn mock `synthetic-editor` để tạo/sửa form.
Review: `synthetic-reviewer`; publish/rollback: `synthetic-publisher`.
Sports: http://127.0.0.1:4173/forms/site_sports_synthetic/frm_sports/
PC: http://127.0.0.1:4173/forms/site_pc_synthetic/frm_pc_reference/

Style contract hiện chỉ có approved theme references: màu/font/spacing do theme quản lý.
Chưa có field-level arbitrary color/font/width/alignment/padding/margin/border/radius hoặc responsive DSL.
Không có Elementor-like free positioning, arbitrary CSS/JS, custom easing/keyframes hoặc workflow engine thứ hai.
Motion timing chỉ có speed presets và category toggles đã hỗ trợ; tôn trọng prefers-reduced-motion.
Group editing đầy đủ, undo/redo, custom style schema và provider dịch tự động vẫn là phần mở rộng tương lai.

**LOCAL_POC_FUNCTIONALLY_COMPLETE = YES** trong phạm vi local synthetic đã bàn giao.
**LOCAL_POC_VERIFIED = NO**. G2 vẫn conditional; T12/canonical container K13 còn pending.
Host/browser proof không thay thế canonical container reproducibility, Cognito hoặc AWS acceptance.
