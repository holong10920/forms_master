# Context Handoff — 2026-10-27

Đọc [CURRENT_STATUS](CURRENT_STATUS.md), [README](../README.md) và [cleanup evidence](evidence/SOURCE-CLEANUP/RESULTS.md) trước khi làm tiếp. Bàn giao cũ nằm ở [archive](archive/2026-10-26-CONTEXT_HANDOFF.md), chỉ dùng làm lịch sử.

- Chỉ chốt phần độc lập: user xác nhận có phiên khác đang sửa UI và yêu cầu giữ nguyên UI. Không ghi đè/khôi phục i18n.js.
- Không GitHub access hoặc Git mutation dưới bất kỳ hình thức nào; không AWS writes, production calls hoặc PII.
- Go + React Workspace chạy bằng `pnpm local:master`, URL duy nhất cho Admin là http://localhost:4180/. Customer/Preview giữ origin 127.0.0.1 riêng.
- Source editor hiện hành: `tools/go-auth/studio/`; React shell: `tools/go-auth/web/src/`. Không dựng lại editor hoặc đặt thêm một bản sao trong `local_p0`.
- Python đã được retire theo yêu cầu user. Không phục hồi oracle/rollback Python hoặc thêm `uv` để làm test xanh. Compiler/tests dùng Go verifier; security scanner là Gitleaks 8.30.1.
- Giữ database, audit, original migration baseline, immutable releases và backup trong `var`. Không dọn bằng `git clean`, reset/stash hoặc xóa cả `var`.
- Metadata plugin 1.0.0 và release pins cũ có thể còn thuật ngữ lịch sử; không phải lệnh thực thi Python. Host Go chỉ chấp nhận pin tương thích chính xác đã được ghi nhận; không nới verify tùy ý.
- Các kết quả Python và đường dẫn cũ trong evidence là lịch sử. Trạng thái sau cleanup phải dựa vào log mới, không sửa các báo cáo cũ để giả lập PASS.
- Legacy coverage vẫn 14/34 audit categories; PC prototype chưa gồm giỏ nhiều sản phẩm. Add/Entry/Raiten chưa hoàn tất. T12/K13 giữ pending.

Tiếp theo: đóng kiểm chứng cleanup còn mở nếu có, rồi làm capability tiếp theo trong gap matrix. Không mở lại chu kỳ brainstorm kiến trúc hoặc chuyển production.

UI handoff: cập nhật generator/locale bridge theo refactor đang làm; hiện generator còn import i18n.js đã xóa và admin.js còn handler admin-locale đã bỏ khỏi template. Chưa có latest-UI smoke PASS. Backend/Go bootstrap/test/race/vet độc lập đã qua; đọc báo cáo để phân biệt checkpoint.
