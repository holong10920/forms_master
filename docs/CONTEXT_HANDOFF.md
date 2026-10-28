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

- Chức năng translate (tab 翻訳, panel dịch song ngữ, auto-translate stub, admin locale switcher `i18n.js`) đã bị xóa hoàn toàn khỏi form builder. Build output (`web/dist/`, `web/public/`) cần tái tạo bằng `generate-studio`.

### Checkpoint Gakki demo — 2026-10-27

Mẫu instrument Pattern A một sản phẩm, reset phụ thuộc và template boundaries đã triển khai; xem [bằng chứng mới](evidence/GAKKI-DEMO/RESULTS.md). Root 654 PASS + 15 expected fail; React 17 PASS; Go tests/race/vet PASS; TS/Go 284 cases PASS. Browser/review/publish xem `evidence/GAKKI-DEMO/browser.json`. Legacy browser parity NOT_VERIFIED; cart và production mapping chưa hỗ trợ. T12/K13 giữ VERIFICATION_PENDING. Không commit/GitHub/AWS writes.

### Real local legacy parity review

Đã chạy launcher legacy gốc qua overlay Docker synthetic/read-only và so sánh browser thật. Kết quả **NOT_READY cho full legacy parity**: 8/12 scenarios PASS, 4 FAIL; 4/12 nhóm No-Code được chứng minh đầy đủ. Đã sửa parent/child trong nhánh hỗ trợ, single-item confirmation, inline validation/scroll và container width. Còn catalog 12 nhóm, repeated cart/staged edit, header và committed-product restore. Xem [báo cáo thực chứng](evidence/REAL-LEGACY-PARITY/RESULTS.md), thay cho suy diễn từ checkpoint Gakki trước. T12/K13 không đổi.
