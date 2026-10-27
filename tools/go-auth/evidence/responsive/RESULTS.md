# Studio responsive refinement — 2026-10-27

Phạm vi: bố cục Admin Workspace/Studio. Không sửa dữ liệu biểu mẫu, release, backend hay quyền truy cập. Không staging/commit hoặc GitHub/AWS.

- Header Studio giảm từ 90px xuống 52px; mobile 48px.
- Editor dùng phần chiều cao còn lại của viewport, thay vì tính lại toàn bộ `100vh` bên dưới header. Trang ngoài không cuộn thừa hoặc để khoảng trắng cuối trang.
- CSS sidebar Workspace được giới hạn vào sidebar trực tiếp, tránh áp padding 35px/22px vào các panel Studio.
- Canvas, Outline và Inspector cuộn độc lập. Panel co theo container; tên trường không gây tràn ngang panel.
- Sidebar chuyển thành thanh icon trên laptop/tablet và điều hướng ngang trên mobile. Trang Studio con có trạng thái điều hướng đang chọn.
- Inspector hiển thị đầy đủ các tab theo hàng; toolbar mobile chia hàng và giữ tên truy cập cho nút thu gọn.
- Panel màn hình hẹp có nút mở/đóng, `aria-expanded`, Escape và khôi phục focus. Đây là panel không modal, không tuyên bố có focus trap.
- Nút chèn trường không còn tạo thêm một hàng cao 14px và nhân đôi khoảng cách cấu hình trong canvas. Không thay đổi giá trị style đã lưu hoặc giao diện runtime đã publish.

## Kiểm chứng

[Browser layout](browser-layout.json): 1920×1080, 1440×900, 1280×800, 1366×768, 1024×650, 768×1024, 390×844, 320×740, 844×390. Cả 9 kích thước: chiều rộng/cao trang bằng viewport; toolbar và panel đang hiển thị không tràn ngang. Stepper và thanh điều hướng mobile vẫn có cuộn ngang cục bộ khi nội dung dài, có chủ đích.

[Điều hướng/bàn phím](browser-navigation.json): deep link, active navigation, cuộn độc lập tới cuối, Dashboard và Back, JA/VI; không có page error. Tại laptop, đáy canvas bằng 800px, scrollTop của Studio và cửa sổ đều bằng 0.

[Trước sửa](before-metrics.json): viewport 1440×900 nhưng trang cao 964px; hai panel chịu padding từ sidebar. Sau sửa trang cao đúng 900px.

- [React](react-tests.txt): 14 tests PASS.
- [Regression TypeScript](ts-tests.txt): 651 PASS, 15 expected fail, 1 skipped (667 tổng).
- [Build](build.txt), [lint](lint.txt), [typecheck](typecheck.txt), [format](format.txt), [dependency boundaries](boundaries.txt): PASS.
- Lần chạy regression đầu bị sandbox chặn cache `uv` ngoài workspace. Chạy lại với cache đã có tại `/tmp/forms-master-uv-cache` đã qua; không hạ hoặc bỏ test.
- Go không thay đổi trong lượt chỉnh UI này; không tuyên bố đã chạy lại Go tests.

Ảnh trong `output/playwright/`: `studio-responsive-desktop.png`, `studio-responsive-mobile.png`, `studio-responsive-small-mobile-inspector.png`, `studio-responsive-laptop-scrolled.png` và ảnh của từng viewport. Đây là kiểm tra bố cục/chức năng; không phải chứng nhận WCAG toàn diện hoặc pixel-perfect.

## File nguồn thay đổi

- `tools/go-auth/web/src/App.tsx`
- `tools/go-auth/web/src/style.css`
- `tools/go-auth/generate-studio.ts`
- `tools/local_p0/web/index.html`
- `tools/local_p0/web/editor.js`
- `tools/local_p0/web/style.css`

Studio bundle/CSS được sinh lại từ nguồn hiện có. Các thay đổi Go migration và legacy capability trước đó được giữ nguyên. T12/K13 vẫn VERIFICATION_PENDING.
