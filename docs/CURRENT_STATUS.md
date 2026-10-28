# Current Status — 2026-10-27

Tài liệu này thay thế trạng thái vận hành cũ. Bản trước được giữ tại [archive](archive/2026-10-26-CURRENT_STATUS.md); các lệnh/branch/quyền ghi trong lịch sử không phải quyền hiện hành.

- Làm việc tại một checkout `forms_master`. User xác nhận có phiên khác đang sửa UI; Codex chỉ chốt backend/compiler/verifier, cleanup và docs. Giữ nguyên UI đang sửa.
- Cấm toàn bộ GitHub access và Git mutation. Không staging/commit/push; không AWS write hoặc production API. Chỉ synthetic data.
- Entrypoint: **http://localhost:4180/**, Form Builder `/studio` trong React shell. API/BFF Go 4181, mock OIDC 4182, Customer 4183, isolated Preview 4185.
- Go là business authority: auth/session/CSRF/RBAC, memberships, forms/CAS, workflow recompute, review/four-eyes approval, preview/revocation, release/publish/rollback, submission/idempotency, outbox/mock effects và audit.
- TypeScript Compiler, Workflow Engine và Customer Runtime vẫn là source đang sử dụng, không phải legacy cần xóa.
- Source editor duy nhất đã chuyển từ `tools/local_p0/web` sang `tools/go-auth/studio`, giữ nguyên byte khi di chuyển. Generator, Go Preview/fingerprint và ESLint đã cập nhật.
- User yêu cầu gỡ Python thay vì giữ oracle/rollback. Đã retire Python packages, old local host, Python compiler adapters, uv configs và restore demo cũ; semantic/release tests chuyển sang Go. Secret scan chuyển sang native Gitleaks 8.30.1. Không dùng kết quả 798 Python lịch sử làm số test hiện tại.
- Database Go ở `var/master`; dữ liệu gốc và immutable releases ở `var/s2-publication` được giữ để chứng minh tính toàn vẹn, không còn launcher Python phục vụ chúng.
- Root README hiện mô tả startup/kiến trúc hiện hành. Evidence cũ được giữ nguyên theo thời điểm, không sửa thành kết quả mới.

## Bằng chứng

- [Go migration và route matrix](../tools/go-auth/evidence/migration/RESULTS.md).
- [Capability expansion](../tools/legacy-analyzer/evidence/RESULTS.md): prototype PC 27 trường, 14/34 audit categories fully supported. Không phải ALL_LEGACY_FORMS_SUPPORTED.
- [Responsive](../tools/go-auth/evidence/responsive/RESULTS.md): 9 viewport 320–1920px, keyboard/drawer/navigation checks.
- [Cleanup và kiểm chứng sau gỡ Python](evidence/SOURCE-CLEANUP/RESULTS.md): xem log mới; không kế thừa PASS từ trước cleanup.

## Blocker UI đã giải quyết

Chức năng translate (tab 翻訳, panel dịch song ngữ Nhật/Việt, auto-translate stub) đã được xóa hoàn toàn khỏi form builder. Các file đã sửa: `tools/go-auth/studio/admin.js`, `workflow.js`, `editor.js`, `state.js`, `index.html`, `style.css`; xóa `i18n.js`; `tools/go-auth/internal/studio/http.go`; `tools/go-auth/generate-studio.ts`; `tools/go-auth/web/src/Studio.tsx`, `Studio.test.tsx`; `packages/static-runtime/src/index.ts`, `style.css`; `tools/compiler/src/l10n.ts`. Build output trong `web/dist/` và `web/public/` cần tái tạo bằng `generate-studio`.

## Việc còn lại

1. Hoàn thiện capability legacy: repeated cart, catalog/dependent selectors, pickup/calendar/eligibility và payload mappings; rồi kiểm chứng từng site/form.
2. T12/container và canonical K13: **VERIFICATION_PENDING**, không nâng trạng thái khi chưa chạy đúng môi trường.
3. Production/ECS/PostgreSQL, provider thật, real integrations và comprehensive accessibility/performance audit chưa được xác minh.

Chạy `pnpm local:master`. Cấu trúc source và các lệnh hiện hành ở [README](../README.md). Không chạy `local:p0`, `compiler:serve` hoặc lệnh `uv` lịch sử nữa.

### Checkpoint Gakki demo — 2026-10-27

Mẫu instrument Pattern A một sản phẩm, reset phụ thuộc và template boundaries đã triển khai; xem [bằng chứng mới](evidence/GAKKI-DEMO/RESULTS.md). Root 654 PASS + 15 expected fail; React 17 PASS; Go tests/race/vet PASS; TS/Go 284 cases PASS. Browser/review/publish xem `evidence/GAKKI-DEMO/browser.json`. Legacy browser parity NOT_VERIFIED; cart và production mapping chưa hỗ trợ. T12/K13 giữ VERIFICATION_PENDING. Không commit/GitHub/AWS writes.

### Real local legacy parity review

Đã chạy launcher legacy gốc qua overlay Docker synthetic/read-only và so sánh browser thật. Kết quả **NOT_READY cho full legacy parity**: 8/12 scenarios PASS, 4 FAIL; 4/12 nhóm No-Code được chứng minh đầy đủ. Đã sửa parent/child trong nhánh hỗ trợ, single-item confirmation, inline validation/scroll và container width. Còn catalog 12 nhóm, repeated cart/staged edit, header và committed-product restore. Xem [báo cáo thực chứng](evidence/REAL-LEGACY-PARITY/RESULTS.md), thay cho suy diễn từ checkpoint Gakki trước. T12/K13 không đổi.
