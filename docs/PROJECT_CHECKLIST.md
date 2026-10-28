# Project Checklist

> **Checkpoint hiện hành 2026-10-27:** Go + React Workspace đã chạy; source Studio ở `tools/go-auth/studio`. Python/oracle/rollback host cũ đã retire theo yêu cầu user. Xem [CURRENT_STATUS](CURRENT_STATUS.md), [cleanup](evidence/SOURCE-CLEANUP/RESULTS.md), [Go route migration](../tools/go-auth/evidence/migration/ROUTE-MATRIX.md) và [legacy gap matrix](../tools/legacy-analyzer/evidence/CAPABILITY-MATRIX.md). Các bảng/checkpoint lịch sử dưới đây không phải khẳng định hệ thống vẫn ở design-only. T12/K13 vẫn VERIFICATION_PENDING; không nâng toàn bộ legacy thành supported.


> UX Premium local synthetic đã kiểm tra ngày 2026-10-26: ba panel, Canvas/Inspector,
> reorder bằng kéo-thả/bàn phím/nút, JA/VI, theme/Motion và publish/submission/rollback UAT PASS.
> Xem `docs/evidence/UX-PREMIUM/RESULTS.md`. Đây không phải full S2/G2 acceptance; T12/K13 giữ pending.


> Sinh từ master prompt (mọi checklist ID). Chỉ sửa cột **Status / Evidence / Note**; không sửa mô tả mục tiêu.
> Status: `TODO` · `IN_PROGRESS` · `DONE` (có evidence) · `BLOCKED` · `NEEDS_APPROVAL` · `N/A` (kèm lý do + approval).
> Mô tả được rút gọn từ master; xem master để đọc đầy đủ acceptance criteria.

## Gates

| Gate | Status | Date | Record |
|---|---|---|---|
| G0 Scope | **APPROVED WITH ADJUSTMENTS** | 2026-10-23 | DECISIONS.md ADR-001..007 |
| G1 Design | **APPROVED FOR LOCAL SYNTHETIC P0 IMPLEMENTATION** (baseline `6312f2b`) | 2026-10-25 | DECISIONS.md ADR-078 |
| G2–G8 | G2 conditional local S2 code/test authorized; G3 APPROVED / P03 DONE; G4–G8 TODO | 2026-10-25 | User approved S2 local code/test after G3 closure 161fef2ba5b65e4fdc6c3ac867e9449350022f19; T12 pending before S2 acceptance; không full PASS. Owner/scope/exit criterion: docs/evidence/P02/S0-SUMMARY.md |
| G9 GitHub | BLOCKED (user xử lý visibility/ownership) | | ADR-007 |
| G10 AWS | BLOCKED | | ADR-006 |
| G11–G12 | TODO | | |

## 0.1. Luật không đánh mất context

| ID | Requirement (rút gọn) | Status | Evidence | Note |
|---|---|---|---|---|
| CTX-01 | Đọc TOÀN BỘ file này và kiểm tra trạng thái repo, docs, git status/log, test baseline trước khi quyết định bước kế tiếp. | DONE | đã đọc toàn bộ master; docs/evidence/P00/environment.txt | đã kiểm tra git status/log + tools; test baseline: chưa có code |
| CTX-02 | Tạo `CLAUDE.md` ở repo root; trong đó ghi rõ quy trình bắt buộc: trước khi sửa code phải đọc `docs/PROJECT_CHARTER.md`, `docs/PROJECT_CHE… | DONE | CLAUDE.md |  |
| CTX-03 | Tạo `docs/PROJECT_CHARTER.md` mô tả mục tiêu, non-goals, constraints và định nghĩa thành công. | DONE | docs/PROJECT_CHARTER.md | cập nhật sau G0 |
| CTX-04 | Tạo `docs/PROJECT_CHECKLIST.md` bằng cách sao chép các checklist ID quan trọng từ master prompt, bổ sung cột/trường evidence và trạng thá… | DONE | docs/PROJECT_CHECKLIST.md | 235/235 ID, sinh từ master |
| CTX-05 | Tạo `docs/DECISIONS.md` (ADR index; mỗi quyết định gồm context, options, decision, trade-offs, approver, date). | DONE | docs/DECISIONS.md | ADR-000..007 ACCEPTED (G0, 2026-10-23) |
| CTX-06 | Tạo `docs/CURRENT_STATUS.md` (phase active, done/next/blocked, test evidence, git SHA, environment, phạm vi đã được duyệt, URL nếu có). | DONE | docs/CURRENT_STATUS.md |  |
| CTX-07 | Tạo `docs/CONTEXT_HANDOFF.md` ngắn gọn, cập nhật vào cuối mỗi phiên/milestone, đủ cho Claude mới tiếp tục không cần đọc toàn bộ transcrip… | DONE | docs/CONTEXT_HANDOFF.md |  |
| CTX-08 | Tạo `docs/REQUIREMENTS_TRACEABILITY.md` map `Requirement ID → Design → Implementation → Tests → Evidence → Status`. | DONE | docs/REQUIREMENTS_TRACEABILITY.md |  |
| CTX-09 | Nếu repo/docs chưa tồn tại, khởi tạo hồ sơ điều phối **trước**; không scaffold app/build features trước khi design được user duyệt. | IN_PROGRESS | đã tạo governance docs; chưa scaffold | quy tắc liên tục, giữ đến G1 |
| CTX-10 | Mỗi lần bắt đầu một phiên mới: đọc các file trên, báo cáo ngắn `vị trí hiện tại → checkpoint tiếp theo → điều kiện phê duyệt`, rồi mới ti… | IN_PROGRESS | CLAUDE.md §Bắt buộc mỗi phiên | áp dụng cho mọi phiên |

## 3.1. AWS training: CHẾ ĐỘ READ-ONLY MẶC ĐỊNH

| ID | Requirement (rút gọn) | Status | Evidence | Note |
|---|---|---|---|---|
| SAFE-01 | Xác nhận AWS profile thực tế, account ID, Region bằng read-only, **không suy đoán** theo tên profile. Không in AWS credentials. | BLOCKED | ADR-006 | user xác nhận profile/account trước G10; Claude không tự chọn |
| SAFE-02 | Inventory read-only các tài nguyên liên quan nếu có quyền. Không dò/ngó sâu dữ liệu nhạy cảm không cần thiết. | TODO | | |
| SAFE-03 | Đề xuất PoC isolated stack, prefix riêng ví dụ `form-builder-poc-*`, IAM role, tags, resource policy, network/auth, chi phí, teardown plan. | TODO | | |
| SAFE-04 | Lập danh sách **exact planned AWS writes**: tài nguyên nào sẽ được tạo, account, region, CDK/Terraform plan, quyền cần dùng, rủi ro va ch… | TODO | | |
| SAFE-05 | Chỉ thực hiện AWS write sau khi user xác nhận bằng lời cụ thể phạm vi **và** quyền chính sách công ty cho phép. Approval chỉ cho đúng sco… | TODO | | |
| SAFE-06 | Tuyệt đối không update/delete/deploy đè resources sẵn có của account training (master §3.1), CloudFront/distributions sẵn có, bucket công ty khác, API hoặc database production. | TODO | | |
| SAFE-07 | Không dùng AWS admin/owner permissions, không tạo access keys dài hạn, không bỏ bảo vệ S3/public access để làm demo nhanh. | TODO | | |
| SAFE-08 | Nếu chưa được duyệt AWS: vẫn làm **local demo + CI checks + IaC plan** và ghi AWS deploy `BLOCKED`; không tự triển khai AWS. | IN_PROGRESS | CLAUDE.md, CURRENT_STATUS | AWS deploy BLOCKED; mặc định chạy local |
| SAFE-09 | Khi đã được duyệt: validate stack diff/plan và quyền IAM, deploy resource scoped, smoke test, rollback, xác nhận logging và cost controls. | TODO | | |
| SAFE-10 | Teardown plan phải chỉ target đúng stack PoC, mọi hành động xóa cũng cần authorization cụ thể. Không cleanup shared resources. | TODO | | |

## 3.2. GitHub và quyền sở hữu source

| ID | Requirement (rút gọn) | Status | Evidence | Note |
|---|---|---|---|---|
| GIT-01 | Kiểm tra `git remote`, current user, `gh auth status` **không để lộ token**; xác nhận đúng GitHub owner/repo dự kiến. | DONE | docs/evidence/P00/environment.txt | remote holong10920/forms_master, PUBLIC; gh auth OK, không in token |
| GIT-02 | PoC phát triển mới từ đầu; không đưa source code/private docs/secrets của công ty vào GitHub cá nhân khi chưa được chủ sở hữu công ty cho… | IN_PROGRESS | .gitignore; ADR-001/007 | docs/internal + master prompt đã được gitignore; không có code công ty |
| GIT-03 | Nếu chưa có quyền đưa code lên personal GitHub: chỉ tạo local repo hoặc repo công ty được duyệt. Đánh dấu `BLOCKED` cho remote push; khôn… | BLOCKED | ADR-007 + addendum | local commit 0d4fe7b; chỉ push sau G9 |
| GIT-04 | GitHub repo mặc định là **private**; `.env*`, local AWS config, dữ liệu thật, artifacts chứa PII, credentials không được commit. | BLOCKED | docs/evidence/P00/environment.txt | repo đang PUBLIC, vi phạm yêu cầu mặc định private (B-01); đã tạo .gitignore |
| GIT-05 | Có README, `CONTRIBUTING.md`, branch strategy, protected main/required checks nếu có quyền. | TODO | | |
| GIT-06 | CI không có secret trên untrusted PRs; chỉ deploy từ trusted main/reviewed commit sau approval tương ứng. | TODO | | |

## 4. PHƯƠNG PHÁP SUPERPOWERS — DESIGN GATE

| ID | Requirement (rút gọn) | Status | Evidence | Note |
|---|---|---|---|---|
| SP-01 | Kiểm tra Superpowers skills đang thực sự cài và phiên bản: `brainstorming`, `writing-plans`, `test-driven-development`, `systematic-debug… | DONE | docs/evidence/P01/superpowers-install.txt; docs/evidence/P01/superpowers-verify-session2.txt | 7.0.0 (bb92a77); đã invoke `superpowers:brainstorming` thành công ở phiên 2 (2026-10-23) |
| SP-02 | Thực thi `superpowers:brainstorming`: explore repo/context, hỏi các câu cần thiết (mỗi lần một câu theo skill), mô tả 2–3 phương án, trad… | IN_PROGRESS | docs/evidence/P01/superpowers-verify-session2.txt; docs/discovery/P01_BRAINSTORM_NOTES.md | spec #1, #2 Q&A đã đóng; spec #2 rev 2 chờ review; spec #3 bắt đầu brainstorm; chưa DONE |
| SP-03 | Phải so sánh **Runtime JSON Renderer vs Code Generator vs Hybrid Compiler**; đưa recommendation nhưng không đóng kết luận trước khi khảo… | IN_PROGRESS | docs/discovery/P00_ARCHITECTURE_OPTIONS.md | matrix sơ bộ; chưa chốt |
| SP-04 | Vì dự án lớn, chia thành các **subsystem specs**: schema/workflow, builder UI, runtime/compiler, publishing/AWS, migration/quality. Không… | IN_PROGRESS | docs/CURRENT_STATUS.md (thứ tự spec); docs/superpowers/specs/2026-10-23-form-schema-workflow-design.md | đã soạn spec #1, #2, #3, #4 trên tổng số 6 |
| SP-05 | Ghi design specs theo convention skill (ví dụ `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`), tự review và lấy user approval trướ… | IN_PROGRESS | docs/superpowers/specs/2026-10-23-form-schema-workflow-design.md | spec #1 rev 3 (review #2: CONDITIONALLY ACCEPTED FOR DESIGN CONTINUATION); spec #1 rev 3.1 (đồng bộ plugin contract); spec #2 rev 2 (`2026-10-24-plugin-contracts-capability-registry-design.md`, review #1: CHANGES REQUIRED — DESIGN DIRECTION ACCEPTED) chờ review; chưa duyệt hoàn toàn; G1 NOT APPROVED |
| SP-06 | Sau khi design được duyệt mới dùng `superpowers:writing-plans`, chia task nhỏ có dependency, target paths, commands, acceptance criteria. | TODO | | |
| SP-07 | Với mỗi implementation unit: test trước khi code khi phù hợp, implement scoped, chạy checks, review spec compliance và code quality, cập… | TODO | | |
| SP-08 | Nếu phải sửa architecture đã duyệt, ghi ADR và xin duyệt phần thay đổi quan trọng trước khi tiếp tục. | TODO | | |

## 5.1. P0 — PoC core (phải có để demo end-to-end)

| ID | Requirement (rút gọn) | Status | Evidence | Note |
|---|---|---|---|---|
| F-P0-01 | Site Management: tạo/sửa site demo, `siteId`, domain/path metadata, form gắn với site, theme; **không kết nối domain production**. | IN_PROGRESS | Go/React: tools/go-auth/evidence/migration; docs/evidence/SOURCE-CLEANUP | IN_PROGRESS — site membership/listing; chưa có site CRUD; global gates unchanged |
| F-P0-02 | Form Management: tạo, đổi tên, clone, list/search, save draft, formId stable, immutable published version. | IN_PROGRESS | Go/React: tools/go-auth/evidence/migration; docs/evidence/SOURCE-CLEANUP | LOCAL_VERIFIED; global gates unchanged |
| F-P0-03 | Visual Form Builder: canvas kéo-thả hoặc reorder field/sections/steps; chọn component, chỉnh properties; tránh chỉ là JSON textbox giả mạ… | IN_PROGRESS | Go/React: tools/go-auth/evidence/migration; docs/evidence/SOURCE-CLEANUP | LOCAL_VERIFIED; global gates unchanged |
| F-P0-04 | Basic Field Library: text, textarea, number, email/phone, select, radio, checkbox, section và submit; bổ sung field chuyên biệt chỉ khi p… | IN_PROGRESS | Go/React: tools/go-auth/evidence/migration; docs/evidence/SOURCE-CLEANUP | LOCAL_VERIFIED — core P0; không mọi legacy control; global gates unchanged |
| F-P0-05 | Multi-step Flow: start step, next/back, branch condition, confirmation/summary, terminal submit/success, prevent invalid loops. | IN_PROGRESS | Go/React: tools/go-auth/evidence/migration; docs/evidence/SOURCE-CLEANUP | LOCAL_VERIFIED; global gates unchanged |
| F-P0-06 | Validation: required, length, pattern, cross-field nếu cần, field-level và step-level errors; frontend và backend kiểm tra theo cùng vers… | IN_PROGRESS | Go/React: tools/go-auth/evidence/migration; docs/evidence/SOURCE-CLEANUP | LOCAL_VERIFIED; global gates unchanged |
| F-P0-07 | Conditional Logic: show/hide, require/unrequire, transition branch; deterministic evaluation và cycle detection. | IN_PROGRESS | Go/React: tools/go-auth/evidence/migration; docs/evidence/SOURCE-CLEANUP | LOCAL_VERIFIED; global gates unchanged |
| F-P0-08 | Theme/Branding: per-site logo (placeholder/mock), colors, typography, spacing, button, responsive layout. | IN_PROGRESS | Go/React: tools/go-auth/evidence/migration; docs/evidence/SOURCE-CLEANUP | LOCAL_VERIFIED — typed bounded style; global gates unchanged |
| F-P0-09 | Motion Animation: cấu hình từ Admin bằng preset, ít nhất 2 hiệu ứng enter/exit/step, feedback và reduced motion; không nhúng JS tùy ý. | IN_PROGRESS | Go/React: tools/go-auth/evidence/migration; docs/evidence/SOURCE-CLEANUP | LOCAL_VERIFIED — approved presets; global gates unchanged |
| F-P0-10 | Preview: desktop/mobile, thay dữ liệu giả lập, đi qua next/back/branch đầy đủ, preview draft khác bản publish. | IN_PROGRESS | Go/React: tools/go-auth/evidence/migration; docs/evidence/SOURCE-CLEANUP | LOCAL_VERIFIED; global gates unchanged |
| F-P0-11 | JSON Definitions: typed schema với `schemaVersion`, validator, JSON import/export an toàn, versioning và format ổn định. | IN_PROGRESS | Go/React: tools/go-auth/evidence/migration; docs/evidence/SOURCE-CLEANUP | IN_PROGRESS — validated import; không arbitrary React conversion; global gates unchanged |
| F-P0-12 | Persistence: save draft/load lại sau refresh, versions, optimistic concurrency hoặc conflict prevention; **không chỉ localStorage** ở dem… | IN_PROGRESS | Go/React: tools/go-auth/evidence/migration; docs/evidence/SOURCE-CLEANUP | LOCAL_VERIFIED — SQLite only; global gates unchanged |
| F-P0-13 | Basic Auth + Roles: admin login và role tối thiểu (editor vs publisher/viewer tùy thiết kế), server-side enforcement; không frontend-only… | IN_PROGRESS | Go/React: tools/go-auth/evidence/migration; docs/evidence/SOURCE-CLEANUP | LOCAL_VERIFIED; global gates unchanged |
| F-P0-14 | Publish/Build: compile JSON của một form thành static artifact tách biệt, giữ dependency tối thiểu, content hash, versioned release; chạy… | IN_PROGRESS | Go/React: tools/go-auth/evidence/migration; docs/evidence/SOURCE-CLEANUP | LOCAL_VERIFIED — T12/K13 pending; global gates unchanged |
| F-P0-15 | Rollback: form có thể quay lại release trước an toàn, có evidence không mất artifact cũ. | IN_PROGRESS | Go/React: tools/go-auth/evidence/migration; docs/evidence/SOURCE-CLEANUP | LOCAL_VERIFIED; global gates unchanged |
| F-P0-16 | Audit: ghi ai/when/version/action cho create, edit, publish, rollback; không log PII. | IN_PROGRESS | Go/React: tools/go-auth/evidence/migration; docs/evidence/SOURCE-CLEANUP | LOCAL_VERIFIED; global gates unchanged |
| F-P0-17 | Demo Forms: tối thiểu **Sports demo và PC demo** (hoặc 2 site khác được phê duyệt), có flow/fields/conditions khác nhau; có thể thêm Gakk… | IN_PROGRESS | Go/React: tools/go-auth/evidence/migration; docs/evidence/SOURCE-CLEANUP | LOCAL_VERIFIED — synthetic Sports/PC only; global gates unchanged |
| F-P0-18 | Submit Simulation: dữ liệu giả lập, request contract và idempotency; local stub hoặc isolated PoC API, tuyệt đối không gọi submit thật lê… | IN_PROGRESS | Go/React: tools/go-auth/evidence/migration; docs/evidence/SOURCE-CLEANUP | LOCAL_VERIFIED — mock effects only; global gates unchanged |
| F-P0-19 | Docs + CI/Tests: architecture, setup, user guide, automated checks, measured bundle report, traceability và rollback runbook. | IN_PROGRESS | Go/React: tools/go-auth/evidence/migration; docs/evidence/SOURCE-CLEANUP | IN_PROGRESS — local tests; CI/production chưa verified; global gates unchanged |

## 5.2. P1 — Khả năng mở rộng sau khi MVP đạt

| ID | Requirement (rút gọn) | Status | Evidence | Note |
|---|---|---|---|---|
| F-P1-01 | Advanced fields: date/time, image/file upload, repeatable product items, dependent selects, Japanese postal address autocomplete. | TODO | | |
| F-P1-02 | Product/maker/model catalog integration qua typed adapter; API mocks và quota/timeout handling. | TODO | | |
| F-P1-03 | Store/map selector và logic hình thức thu mua (店頭/宅配/出張) theo từng site. | TODO | | |
| F-P1-04 | Workflow actions registry: async check, upload, draft save, typed request mapping, retry/timeout policies. | TODO | | |
| F-P1-05 | Template library: template theo ngành hàng, duplication/safe overrides. | TODO | | |
| F-P1-06 | I18n/multi-locale: Japanese default, dictionary, label/error localization, accessibility. | PARTIAL (ja ⇄ vi local synthetic, ADR-080; chưa có provider dịch tự động) | `docs/evidence/L10N-JA-VI/RESULTS.md` | E2E `l10n-browser.txt` PASS; `l10n.test.ts` 3 PASS; `test_translation.py` 3 PASS |
| F-P1-07 | Release approval workflow: draft → review → approve → publish, compare revisions, scheduled publishing. | TODO | | |
| F-P1-08 | Analytics funnel/drop-off/conversion/error, consent và privacy-safe events. | TODO | | |
| F-P1-09 | Extended Motion Editor: stagger, spring, conditional sequences, micro-interactions, granular preview; preserve performance. | TODO | | |
| F-P1-10 | Full connector/config UI và robust lifecycle/state recovery. | TODO | | |

## 5.3. P2 — Chỉ triển khai khi được phê duyệt

| ID | Requirement (rút gọn) | Status | Evidence | Note |
|---|---|---|---|---|
| F-P2-01 | A/B testing, feature flags và traffic segmentation. | TODO | | |
| F-P2-02 | Advanced workflow automation, external integration orchestration. | TODO | | |
| F-P2-03 | Form usage analytics dashboard và experimentation insights. | TODO | | |
| F-P2-04 | Enterprise governance, cross-team library marketplace, fine-grained role matrix. | TODO | | |
| F-P2-05 | Migration assistant cho legacy React forms, compatibility reports, mass rollout. | TODO | | |

## 5.4. UX yêu cầu ở Admin

| ID | Requirement (rút gọn) | Status | Evidence | Note |
|---|---|---|---|---|
| UX-01 | Site list → Form list → Builder → Preview → Versions/Publish là primary navigation rõ ràng. | TODO | | |
| UX-02 | Builder 3 vùng: Components palette, Canvas, Properties/Rules inspector; responsive trên desktop; không bắt buộc chính Builder hoạt động f… | TODO | | |
| UX-03 | Flow editor hiển thị step nodes/edges rõ ràng, branch conditions debug được. | TODO | | |
| UX-04 | Validation và errors cho Admin rõ ràng (field ID trùng, rule chu kỳ, undefined plugin, unreachable step, thiếu required config). | TODO | | |
| UX-05 | Preview phải đúng runtime behavior, không tạo renderer/logic khác khiến preview một kiểu production một kiểu. | TODO | | |
| UX-06 | Undo/redo và keyboard support: làm ở P0 nếu chi phí hợp lý, nếu không ghi rõ P1 và không hứa sai. | N/A (P0) → P1 | ADR-004 | User chuyển mục này sang P1 ở G0; architecture phải cho phép bổ sung sau (immutable doc + typed commands) |
| UX-07 | Empty/loading/error states và accessibility đủ để demo như sản phẩm thật; không chỉ một dashboard đẹp nhưng không tương tác. | TODO | | |

## 6.3. Form schema và workflow

| ID | Requirement (rút gọn) | Status | Evidence | Note |
|---|---|---|---|---|
| ARCH-01 | Schema có `schemaVersion`, `formId`, `siteId`, `revision`, `locale`, `themeRef`, fields/sections/steps/rules/actions. | TODO | | |
| ARCH-02 | Field IDs ổn định, không phụ thuộc label hoặc thứ tự; rename/delete field có phân tích tác động tới dependencies/mapping. | TODO | | |
| ARCH-03 | Conditional rules là **data AST/DSL**, không là strings chứa code; operator allowlist (`eq`, `in`, comparisons, `and`/`or`...), strict ty… | TODO | | |
| ARCH-04 | Step transitions xác định rõ rule priority/default, semantic of back navigation, validation-before-transition, terminal/retry behavior. | TODO | | |
| ARCH-05 | Graph validation: start tồn tại, reachable nodes, reachable terminal, dead ends, unconditional cycles và branch coverage; không bắt buộc… | TODO | | |
| ARCH-06 | Field dependencies được theo dõi bằng DAG/topological sort; phát hiện circular dependencies; incremental reevaluation chỉ khi field liên… | TODO | | |
| ARCH-07 | Cấu hình và user answers được kiểm tra riêng; backend không tin dữ liệu từ client. | TODO | | |
| ARCH-08 | Schema migration version N → N+1 có validation và regression fixtures; không silently mutate published revision. | TODO | | |
| ARCH-09 | Plugin registry có `id`, semantic version, capabilities, input/output contracts, validator, renderer/config editor, allowed side effects. | TODO | | |
| ARCH-10 | API connector không cho Admin gõ URL để backend gọi tùy ý; tránh SSRF; chỉ allowlist server-owned integrations và secrets ở server. | TODO | | |

## 6.4. Build compiler & artifact isolation

| ID | Requirement (rút gọn) | Status | Evidence | Note |
|---|---|---|---|---|
| BUILD-01 | Build đọc **snapshot immutable** của published definition, validate full schema/workflow/plugin dependencies. | TODO | | |
| BUILD-02 | Compiler tạo entrypoint/import graph **chỉ** chứa UI/widgets/actions mà form dùng; không bundle toàn bộ plugins rồi hide bằng CSS. | TODO | | |
| BUILD-03 | Chia chunk async cho tính năng nặng (maps/images), cache vendor dependencies hợp lý. | TODO | | |
| BUILD-04 | Artifact riêng per form/site, static `HTML/JS/CSS/assets`, code revision + form revision + plugin versions traceable. | TODO | | |
| BUILD-05 | Manifest có content hash, file inventory, sizes, build metadata và reproducibility inputs; không có secrets/PII trong bundle. | TODO | | |
| BUILD-06 | Build 2 form khác nhau để chứng minh module chỉ thuộc PC không bị kéo vào Sports nếu không sử dụng (dùng bundle analyzer hoặc module mani… | TODO | | |
| BUILD-07 | Có build cache/affected rebuild trên dependency graph khi justified; tránh tối ưu khi chưa đo. | TODO | | |
| BUILD-08 | Preview sử dụng cùng engine/schema semantics như runtime; khác biệt external API được mock rõ ràng. | TODO | | |
| BUILD-09 | Support asset base path/query parameters/SPA route fallback được kiểm thử. Không suy đoán CDN rewrite production. | TODO | | |
| BUILD-10 | Build failures không ảnh hưởng version published hiện tại. | TODO | | |

## 6.5. Motion / animation architecture

| ID | Requirement (rút gọn) | Status | Evidence | Note |
|---|---|---|---|---|
| MOTION-01 | `animation` là typed configuration, hỗ trợ `preset`, `trigger`, `duration`, `delay`, `easing` hoặc spring options có bounded ranges. | TODO | | |
| MOTION-02 | Preset registry, field enter/exit, step transition, validation feedback; editing và live preview trong Admin. | TODO | | |
| MOTION-03 | `MotionConfig reducedMotion="user"` hoặc equivalent; có fallback không chuyển động mạnh theo user preferences. | TODO | | |
| MOTION-04 | `LazyMotion` + `m` và optional async features nếu có lợi; verify tree-shaking trong production bundle (không chỉ dựa vào lý thuyết). | TODO | | |
| MOTION-05 | Không animation layout/height phức tạp trên mỗi keystroke gây reflow; ưu tiên `transform`/`opacity`, measure INP. | TODO | | |
| MOTION-06 | Không để animation làm mất focus/ARIA semantics, focus trap hoặc đánh mất form values khi chuyển step. | TODO | | |
| MOTION-07 | Form không dùng Motion không bị import Motion runtime vô điều kiện nếu compiler/architecture cho phép. | TODO | | |

## 6.6. Backend, persistence, publishing

| ID | Requirement (rút gọn) | Status | Evidence | Note |
|---|---|---|---|---|
| API-01 | Thiết kế Python API contract cho form CRUD/draft/revision/publish/rollback; chọn FastAPI/Lambda adapter/architecture sau khi đánh giá. | TODO | | |
| API-02 | Storage: local durable adapter để demo không có AWS; DynamoDB cho AWS PoC nếu phù hợp, design interface không lock-in UI. | TODO | | |
| API-03 | Admin authentication và server-side authorization; editor không thể tự publish nếu role không được phép. | TODO | | |
| API-04 | Concurrency control `revision`/ETag/conditional write tránh lost updates khi 2 admin sửa cùng form. | TODO | | |
| API-05 | Publish là operation có idempotency key, immutable snapshot, job status, retry semantics, failure handling. | TODO | | |
| API-06 | Separate build worker/job khi build có thể vượt request timeout; không compile nặng trực tiếp trong user-facing Lambda. | TODO | | |
| API-07 | Versioned artifacts trên S3, atomic-ish release activation bằng stable manifest/entrypoint và rollback pointer; document consistency/cach… | TODO | | |
| API-08 | CloudFront cache policies phù hợp: fingerprinted JS/CSS long cache, HTML/manifest TTL thấp hoặc invalidation targeted; preserve old asset… | TODO | | |
| API-09 | S3 private + CloudFront Origin Access Control (OAC) nếu dùng standard S3 origin; không dùng S3 website endpoint với OAC. | TODO | | |
| API-10 | Giữ legacy submit integration bên ngoài PoC; muốn kết nối backend thật phải có approved compatibility contract và test sandbox riêng. | TODO | | |

## 7.2. CI/CD checklists

| ID | Requirement (rút gọn) | Status | Evidence | Note |
|---|---|---|---|---|
| CICD-01 | PR workflow: install từ lockfile, lint, format check, typecheck, unit, API/schema contract tests, build; Playwright critical-flow E2E khi… | TODO | | |
| CICD-02 | Reproducible Node/Python versions và lockfiles; pin GitHub Actions versions theo chính sách. | TODO | | |
| CICD-03 | Dependency/security scanning (ít false positive nhất có thể), secret scanning và SARIF nếu phù hợp. | TODO | | |
| CICD-04 | `main` protected với required checks, approval nếu quyền repo hỗ trợ; không claim đã cài nếu chưa xác minh. | TODO | | |
| CICD-05 | CD chỉ sau authorization; GitHub OIDC -> scoped AWS IAM role, trust restricted đúng GitHub repo/branch/environment; không dùng AWS access… | TODO | | |
| CICD-06 | Preview builds cho PR chạy local/artifacts không cần AWS writes; PR từ fork/untrusted code không có privileged credentials. | TODO | | |
| CICD-07 | Deployment logs có SHA, build manifest, deployed resources/URLs, tests, rollback plan, no secrets. | TODO | | |
| CICD-08 | Khi deploy thất bại giữ release trước; rollback test có evidence và không xóa dữ liệu/version cũ. | TODO | | |
| CICD-09 | Tag resources (project, owner, environment, ttl nếu phù hợp); ước tính chi phí, monitoring, cost alarm **nếu đã được duyệt tạo**. | TODO | | |
| CICD-10 | Smoke test URL: HTTPS, auth Admin, create form, draft/preview, publish demo, reload/submit giả lập, rollback. | TODO | | |

## 8.1. Performance

| ID | Requirement (rút gọn) | Status | Evidence | Note |
|---|---|---|---|---|
| PERF-01 | Benchmark form hiện tại khi có quyền và tooling phù hợp; nếu không có source/baseline, công bố `baseline unavailable` chứ không fabricate. | TODO | ADR-005 | số liệu legacy chỉ mang tính tham khảo (docs/internal), không phải baseline |
| PERF-02 | Với 2 demo forms: ghi total uncompressed, gzip/Brotli JS/CSS, initial route assets, plugin chunks, requests, local build time, analyzed d… | TODO | | |
| PERF-03 | LCP/INP/CLS trên demo mobile; nếu không đủ real-user data thì ghi **lab-only**, không trình bày là p75 production RUM. | TODO | | |
| PERF-04 | Sử dụng profiler để tìm excessive React renders; chọn local subscriptions/memoization theo evidence, không blanket memo. | TODO | | |
| PERF-05 | Dynamic imports và bundle budgets cụ thể được quyết định sau baseline; CI fail khi vượt budget đã duyệt. | TODO | | |
| PERF-06 | So sánh form có/không plugin nặng; plugin vắng mặt phải không xuất hiện trong initial bundle tương ứng. | TODO | | |
| PERF-07 | Benchmark animation on/off và reduced-motion mode; không giảm accessibility. | TODO | | |

## 8.2. Testing layers

| ID | Requirement (rút gọn) | Status | Evidence | Note |
|---|---|---|---|---|
| TEST-01 | Schema parser: valid/invalid fixtures, invalid types, unknown plugin/schema version, safe sanitization. | TODO | | |
| TEST-02 | Workflow graph: branches, back, hidden fields, cycles, unreachable states, required validation, terminal path. | TODO | | |
| TEST-03 | Rule dependency DAG: changed inputs update đúng computed/visibility fields; cycle detection. | TODO | | |
| TEST-04 | Persistence: create/update/version, concurrent edits, refresh recovery, conflict resolution, immutable publish. | TODO | | |
| TEST-05 | Compiler: snapshot → assets, no unused plugin, deterministic manifest where feasible, failure atomicity. | TODO | | |
| TEST-06 | API: unauthorized editor/viewer, bad payload, malformed JSON, idempotency, retries. | TODO | | |
| TEST-07 | Motion: preset rendering, reduced-motion, enter/exit, values preserved across steps. | TODO | | |
| TEST-08 | E2E Playwright: Admin tạo Sports form mới → preview → save → reload → edit → publish → mở static form; PC flow branch khác; rollback. | TODO | | |
| TEST-09 | Responsive: desktop và mobile form, keyboard navigation, screen reader semantics nếu tooling hỗ trợ; zero critical accessibility issues. | TODO | | |
| TEST-10 | Mock data only; test không được gửi request tới company production APIs/AWS environment ngoài allowlisted demo. | TODO | | |
| TEST-11 | Report tests là pass/fail/skip/not-run thực tế; không che giấu flaky tests bằng rerun đến pass rồi xóa lịch sử lỗi. | TODO | | |

## 8.3. Security & privacy

| ID | Requirement (rút gọn) | Status | Evidence | Note |
|---|---|---|---|---|
| SEC-01 | AuthN/AuthZ server-side; workspace/site isolation và scope checks mọi API. | TODO | | |
| SEC-02 | Không `eval`, `new Function`, DOM injection từ raw HTML không sanitize, hoặc thực thi arbitrary script trong JSON config. | TODO | | |
| SEC-03 | API connector allowlist tránh SSRF; giới hạn payload size, file types, timeout, retries, rate limit. | TODO | | |
| SEC-04 | Không expose credentials/server secrets trong client bundle, JS sourcemaps công khai hoặc CI logs. | TODO | | |
| SEC-05 | Threat model cho stored XSS trong labels/options/markdown, CSRF nếu cookie auth, CORS, dependency supply chain. | TODO | | |
| SEC-06 | Với demo public/customer forms: chống spam/submission duplicate bằng idempotency, validation, abuse control; không ngụy tạo dữ liệu Analy… | TODO | | |
| SEC-07 | Data retention, logging minimization, no PII in analytics, access log review, secure error messages. | TODO | | |
| SEC-08 | AWS S3/CloudFront/Cognito/IAM config theo least privilege và giới hạn truy cập Admin; CloudFront OAC **không thay thế** Admin authenticat… | TODO | | |

## PHASE 00 — Bootstrap context và discovery (`P00`)

| ID | Requirement (rút gọn) | Status | Evidence | Note |
|---|---|---|---|---|
| P00-01 | Check working directory, local repo, git status, installed tools/skills. | DONE | docs/evidence/P00/environment.txt |  |
| P00-02 | Tạo 6–8 file quản trị context ở mục 0 (chỉ tài liệu/plan, không feature code). | DONE | commit 0d4fe7b: CLAUDE.md + docs/* | chỉ docs |
| P00-03 | Nếu repo form cũ có sẵn và được phép đọc: audit component/flows/API/assets/build output; nếu không có, không bịa kết quả. | DONE | docs/internal/LEGACY_AUDIT_UI.md, docs/internal/LEGACY_AUDIT_API_EFO.md | read-only; đã kiểm tra lại dist sizes bằng du/stat |
| P00-04 | Tạo `docs/FORM_CAPABILITY_MATRIX.md` map site × fields × steps × conditions × APIs × plugins × animation × unique business logic; phân bi… | DONE | docs/FORM_CAPABILITY_MATRIX.md | CONFIRMED/ASSUMED/UNKNOWN |
| P00-05 | Chọn 2 form demo có flow khác nhau (mặc định Sports/PC), dùng mock nội dung Nhật, dữ liệu giả. | DONE | docs/discovery/P00_DISCOVERY.md §4; ADR-003 | đã duyệt ở G0 |
| P00-06 | Đưa 2–3 architecture approaches và decision matrix, xác định MVP scope/non-goals. | DONE | P00_ARCHITECTURE_OPTIONS.md; P00_DISCOVERY.md §5; ADR-002/004 | đã duyệt có điều chỉnh ở G0 |
| P00-07 | Ghi các blockers: source permissions, GitHub personal policy, AWS write access. | DONE | docs/discovery/P00_DISCOVERY.md §6 | B-01..B-08 |

## PHASE 01 — Brainstorming, architecture specs (`P01`)

| ID | Requirement (rút gọn) | Status | Evidence | Note |
|---|---|---|---|---|
| P01-01 | Run installed `superpowers:brainstorming` theo skill thật. | IN_PROGRESS | docs/evidence/P01/superpowers-verify-session2.txt | đã invoke skill ở phiên 2; đang brainstorming spec #1 |
| P01-02 | Design schema + workflow/rules. | IN_PROGRESS | docs/superpowers/specs/2026-10-23-form-schema-workflow-design.md; docs/DECISIONS.md ADR-017..022 | rev 3; chờ user review trước READY_FOR_CROSS_REVIEW; OD-03/05/06/08..11/13 OPEN |
| P01-03 | Design Admin UX + feature flags + capability registry. | IN_PROGRESS | docs/discovery/P01_BRAINSTORM_NOTES.md (Session 3); docs/superpowers/specs/2026-10-24-plugin-contracts-capability-registry-design.md; docs/DECISIONS.md ADR-023..035; docs/evidence/P01/spec2-manifest-example-check.txt | capability registry: spec #2 rev 2.4 chờ user review (OD2-01..07 đã quyết; OD2-08/09 OPEN); Admin UX (spec #4): ADR-046..053; **rev 2.3** (`docs/superpowers/specs/2026-10-24-admin-form-builder-design.md`) READY_FOR_CROSS_SPEC_REVIEW (ADR-061); capability registry: spec #2 rev 2.9 |
| P01-04 | Design runtime/compiler + bundle strategy. | IN_PROGRESS | docs/discovery/P01_BRAINSTORM_NOTES.md (Session 3: Spec #3) | spec #3 đang brainstorm: Q3-1 → ADR-036; Q3-2 → ADR-037 (S3-P01..P11, TM-R01..R14 trong notes); Q3-3 → ADR-038 (S3-P12..P16, TM-L01..L14); Q3-4 → ADR-039; Q3-5 → ADR-040; **Spec #3 Architecture Proposal rev 1** (`docs/superpowers/specs/2026-10-24-compiler-bundle-release-design.md`, evidence `docs/evidence/P01/spec3-json-example-check.txt`); review #1: CONDITIONALLY ACCEPTED FOR TECHNICAL VERIFICATION; ADR-041/042; SPIKE-GATE-01 đã chạy và review (`docs/discovery/P01_SPIKE_GATE_01_REPORT.md`, `docs/evidence/P01/spike-gate-01/`, branch `spike/compiler-feasibility` @ `b3070d2`); ADR-041 CONDITIONALLY APPROVED, ADR-043..045; spec #3 rev 2.4 cần final/cross-spec review; VG-01..10 OPEN; input từ spec #2 §9–§11 |
| P01-05 | Design API/persistence/auth, publish/rollback và AWS PoC isolated architecture. | IN_PROGRESS | docs/superpowers/specs/2026-10-24-api-persistence-publishing-design.md; docs/DECISIONS.md ADR-054, ADR-055 | spec #5 rev 2 (ADR-054..060; submission admission gate) READY_FOR_CROSS_SPEC_REVIEW; AWS chỉ là thiết kế đích sau G10 |
| P01-06 | Design Motion subsystem và reduced motion. | IN_PROGRESS | docs/superpowers/specs/2026-10-24-motion-design.md; docs/DECISIONS.md ADR-062 | spec #6 rev 2 (ADR-062, ADR-064..067), đồng bộ I6-01..06; số đo Motion ở P04/P07 |
| P01-07 | Threat model, ADRs, milestones, acceptance matrix. | TODO | ADR-017, ADR-018; docs/superpowers/specs/2026-10-23-form-schema-workflow-design.md §25 | đã lên kế hoạch Cross-Subsystem Integration Review sau khi đủ 6 spec; threat model chưa làm |
| P01-08 | Review docs, get explicit user approval; invoke `writing-plans` only after sign-off. | DONE | docs/DECISIONS.md ADR-078 (G1); docs/discovery/P01_CROSS_SUBSYSTEM_REVIEW.md §10.6–§10.7; commit `6312f2b` | G1 APPROVED cho local synthetic P0; tiếp theo `writing-plans` cho S0 (P02) |

## PHASE 02 — Engineering foundation (`P02`)

| ID | Requirement (rút gọn) | Status | Evidence | Note |
|---|---|---|---|---|
| P02-01 | Scaffold monorepo đã được duyệt; setup TS strict, Python tooling, lint/format/typecheck/lockfiles. | DONE | docs/evidence/P02/S0-T1-toolchain.txt; S0-T2-ts-baseline.txt; S0-T3-py-baseline.txt | CP1; frozen lockfiles, TS strict/Python tooling PASS |
| P02-02 | Implement typed shared contracts/schemas và tests. | DONE | docs/evidence/P02/S0-T4-jcs-parity.txt; S0-T5-schema-pipeline.txt; S0-T6-jsts.txt | CP2; generated/parity/semantic/JSTS checks PASS |
| P02-03 | CI pull-request checks, README, ADR index, component/package conventions. | IN_PROGRESS | README.md; docs/engineering/CONVENTIONS.md; docs/evidence/P02/S0-T13-verify-clean-clone.txt | S0 core verified: CP5 source 3340956, fresh committed-source verify PASS; G2 conditional local S1; GitHub CI blocked G9 |
| P02-04 | Tách module boundaries, verify no import cycles. | DONE | docs/evidence/P02/S0-T9-boundaries.txt | CP4 292df4b: five TS rules + Python negative fixture PASS; repo no cycles/violations |
| P02-05 | Local dev setup chạy được với demo fixtures, không cần AWS. | IN_PROGRESS | docs/evidence/P02/S0-T7-fsstore.txt; S0-T8-sqlite.txt | Local primitives/init and synthetic contract fixtures PASS; demo forms belong to S1/S2; T12 environment blocked |

## PHASE 03 — Workflow/form engine (`P03`)

| ID | Requirement (rút gọn) | Status | Evidence | Note |
|---|---|---|---|---|
| P03-01 | Step graph, state/transition engine. | DONE | docs/evidence/P03/S1-CP2/RESULTS.md; S1-EXIT.md | Core/local mock scope; CP1 9d9e104, CP2 2db4562; G3 user APPROVED at 161fef2ba5b65e4fdc6c3ac867e9449350022f19 |
| P03-02 | Declarative conditions, typed operators, DAG dependencies. | DONE | packages/form-engine/test/operators.test.ts; tools/engine-demo/test/parity.test.ts | Finite P0 operators, combined dependency DAG, cycle/type guards; lookup/prefill excluded |
| P03-03 | Frontend/backend schema validation, schema version fixtures. | DONE | contracts/schemas/{form-definition,engine-ir}; tools/engine-demo/test/parity.test.ts; python/fb_engine/tests/test_submission.py | Version 1 typed contract and TS/Python parity; trusted backend projection/recompute |
| P03-04 | Unit tests: branching/back/validation/dead-end/cycles. | DONE | packages/form-engine/test; tools/engine-demo/test/references.test.ts | Branching/back, validation/default/dead-end/cycles, async guards; reference closure committed 161fef2ba5b65e4fdc6c3ac867e9449350022f19 |
| P03-05 | Stable contract for field values, preview vs published behavior. | DONE | docs/evidence/P03/S1-EXIT.md; G3 161fef2ba5b65e4fdc6c3ac867e9449350022f19 | G3 user approved; stable core contract verified. Actual Preview/published artifact verification explicitly assigned to S2, not G3 prerequisite. |

## PHASE 04 — Shared UI + Motion (`P04`)

| ID | Requirement (rút gọn) | Status | Evidence | Note |
|---|---|---|---|---|
| P04-01 | Accessible field components và responsive layouts. | TODO | | |
| P04-02 | Theme token system cho Sports/PC. | TODO | | |
| P04-03 | Animation schema, presets, Motion registry, reduced-motion fallback. | TODO | | |
| P04-04 | LazyMotion/import split thực tế; verify bundle impact. | TODO | | |
| P04-05 | Component tests, keyboard/focus tests. | TODO | | |

## PHASE 05 — Admin Builder MVP (`P05`)

| ID | Requirement (rút gọn) | Status | Evidence | Note |
|---|---|---|---|---|
| P05-01 | Site list, form list, create/clone/rename. | TODO | | |
| P05-02 | Builder canvas: add/reorder/delete fields/sections/steps. | TODO | | |
| P05-03 | Properties inspector: label, type, required, rules, options. | TODO | | |
| P05-04 | Visual flow editor hoặc step/branch editor có tương tác thật. | TODO | | |
| P05-05 | Theme editor + animation preset/config editor. | TODO | | |
| P05-06 | Preview desktop/mobile dùng shared engine. | TODO | | |
| P05-07 | Undo/conflict handling theo scope đã duyệt; hiển thị lỗi schema/workflow thân thiện. | TODO | | |
| P05-08 | Playwright UI interactions/screenshots cho 2 forms. | TODO | | |

## PHASE 06 — API, persistence, basic security (`P06`)

| ID | Requirement (rút gọn) | Status | Evidence | Note |
|---|---|---|---|---|
| P06-01 | Python API CRUD/draft/version contract và durable local store. | TODO | | |
| P06-02 | Login + server-side role checks; isolation giữa sites. | TODO | | |
| P06-03 | Revision conflicts/optimistic locking, immutable published versions. | TODO | | |
| P06-04 | Audit log, API validation, idempotency core. | TODO | | |
| P06-05 | E2E save → refresh → reload exact form + auth-negative tests. | TODO | | |

## PHASE 07 — Hybrid compiler/static artifacts (`P07`)

| ID | Requirement (rút gọn) | Status | Evidence | Note |
|---|---|---|---|---|
| P07-01 | JSON snapshot → build manifest → independent static artifacts. | IN_PROGRESS | docs/evidence/P07/CP1/RESULTS.md | Sports executable definition -> canonical IR -> actual static candidate PASS; full LRM/attestation pending T12 |
| P07-02 | Compile selection per form; verify no irrelevant plugin chunks. | IN_PROGRESS | docs/evidence/P07/CP1/chunk-manifest.json; browser-proof.json | Sports closed module graph PASS; plugin resolution and PC isolation/lazy integration pending |
| P07-03 | Motion only when referenced; chunk analyzer + sizes evidence. | IN_PROGRESS | docs/evidence/P07/CP1/artifact-sizes.json; chunk-manifest.json | Sports Motion-none zero modules/bytes/dynamic imports with browser network proof; Motion referenced form pending |
| P07-04 | Build determinism, failure handling, artifact naming/cache policy. | IN_PROGRESS | tools/compiler/test/build.test.ts; docs/evidence/P07/CP1/local-build-times.json | Two clean output roots and five fresh Node builds match; local pin/write-once/integrity PASS; canonical container K13 pending |
| P07-05 | Local static serve cả Sports và PC; run real E2E on generated output. | IN_PROGRESS | docs/evidence/P07/CP1/browser-proof.json | Sports actual Chromium golf/Junk and racket/used flows PASS; PC static artifact pending |

## PHASE 08 — Publishing + rollback LOCAL (`P08`)

| ID | Requirement (rút gọn) | Status | Evidence | Note |
|---|---|---|---|---|
| P08-01 | Publish API/jobs, version status, idempotency. | TODO | | |
| P08-02 | Local/mock publishing backend mô phỏng staging/activation/rollback. | TODO | | |
| P08-03 | Fail-safe build/publish không làm hỏng release trước. | TODO | | |
| P08-04 | Restore prior form version, check active routes/reference assets. | TODO | | |
| P08-05 | E2E publish/rollback với 2 revisions. | TODO | | |

## PHASE 09 — GitHub repository + CI (`P09`)

| ID | Requirement (rút gọn) | Status | Evidence | Note |
|---|---|---|---|---|
| P09-01 | Kiểm tra authorization về source ownership và repo target. | TODO | | |
| P09-02 | Tạo **private** GitHub repo nếu được phép; không push source thuộc công ty khi chưa được duyệt. | TODO | | |
| P09-03 | PR CI: lint, typecheck, unit, integration, bundle build, E2E critical. | TODO | | |
| P09-04 | Configure branch protection/required checks nếu có quyền. | TODO | | |
| P09-05 | Push/test PR, record live GitHub Actions links và SHA, không fake success. | TODO | | |

## PHASE 10 — AWS planning & security review (`P10`)

| ID | Requirement (rút gọn) | Status | Evidence | Note |
|---|---|---|---|---|
| P10-01 | AWS read-only identity/account/region/resources/quota discovery. | TODO | | |
| P10-02 | IaC PoC stack isolated `form-builder-poc-*` và diagram. | TODO | | |
| P10-03 | IAM/OIDC trust scope, auth Admin, private S3 OAC, DynamoDB/Lambda/API limits. | TODO | | |
| P10-04 | Estimate cost (low/high traffic assumptions), blast radius và teardown/rollback. | TODO | | |
| P10-05 | Produce exact plan/diff + proposed mutating operations list. | TODO | | |
| P10-06 | Yêu cầu user **explicit written approval**, company authorization và approved scope. | TODO | | |

## PHASE 11 — AWS training PoC deployment (`P11`, chỉ sau G10)

| ID | Requirement (rút gọn) | Status | Evidence | Note |
|---|---|---|---|---|
| P11-01 | Provision isolated stack đúng account/region/resources được duyệt. | TODO | | |
| P11-02 | Deploy Admin S3/CloudFront hoặc approved Amplify; bảo vệ Admin auth, HTTPS. | TODO | | |
| P11-03 | Deploy isolated Python API và durable config store. | TODO | | |
| P11-04 | Wire publishing worker và isolated form demo artifacts S3/CloudFront. | TODO | | |
| P11-05 | GitHub Actions OIDC-based CD cho reviewed `main` và manual approval nếu policy yêu cầu; không deploy từ untrusted PR. | TODO | | |
| P11-06 | Smoke/E2E production-like trên PoC URLs, test failure/rollback. | TODO | | |
| P11-07 | Record actual URLs/commit/account (có thể mask account ID khi báo cáo), logs, costs và tested roles. | TODO | | |

## PHASE 12 — Quality review / Demo for PO (`P12`)

| ID | Requirement (rút gọn) | Status | Evidence | Note |
|---|---|---|---|---|
| P12-01 | Independent architecture/code/security/performance review; phân loại issue critical/high/medium/low. | TODO | | |
| P12-02 | Fix blockers, rerun affected suites, summarize residual risks. | TODO | | |
| P12-03 | Demo scenario 5–8 phút: tạo Sports form → drag/drop → conditional branch → Motion → preview → publish → CloudFront form → nhập giả lập →… | TODO | | |
| P12-04 | Explain old vs new developer effort, bundle sizes và feature coverage, **chỉ dùng số đo thực tế**. | TODO | | |
| P12-05 | Provide PO decision memo: business value, out-of-scope, cost, security, migration phases, staffing estimates dựa trên scope. | TODO | | |
| P12-06 | Update `docs/CURRENT_STATUS.md`, `CONTEXT_HANDOFF.md`, `PROJECT_CHECKLIST.md` và handover runbook. | TODO | | |

## 11. DEFINITION OF DONE — PO/PM DEMO

| ID | Requirement (rút gọn) | Status | Evidence | Note |
|---|---|---|---|---|
| DOD-01 | Một Admin đã đăng nhập được tạo form mới qua UI, không tự chỉnh React source để đổi field/branch. | TODO | | |
| DOD-02 | Có ít nhất 2 site mock với workflow khác nhau, chạy đúng multi-step, validation, conditional branch, back/next. | TODO | | |
| DOD-03 | Theme và Motion preset được chỉnh từ Admin và thể hiện đúng ở preview **lẫn generated static form**. | TODO | | |
| DOD-04 | Draft persisted; version publish immutable; rollback có bằng chứng. | TODO | | |
| DOD-05 | Compiler tạo artifact độc lập per form; analyzer chứng minh unused plugins không bị include ngoài ý muốn. | TODO | | |
| DOD-06 | Tests chạy thật: unit, integration, Playwright happy/negative paths; không critical defect. | TODO | | |
| DOD-07 | CI checks có URL/log/SHA xác minh được (nếu GitHub đã được phép). | TODO | | |
| DOD-08 | AWS deploy Admin + published form URL hoạt động và smoke test pass (nếu đã có AWS permission). Nếu không, báo đúng local demo scope. | TODO | | |
| DOD-09 | Không dùng PII/backend production, không AWS writes trái phép, không public secrets/company source. | TODO | | |
| DOD-10 | Có ADRs, docs handoff, ops/rollback, demo script, cost/performance report đủ để PO quyết định phase tiếp theo. | TODO | | |

### Checkpoint Gakki demo — 2026-10-27

Mẫu instrument Pattern A một sản phẩm, reset phụ thuộc và template boundaries đã triển khai; xem [bằng chứng mới](evidence/GAKKI-DEMO/RESULTS.md). Root 654 PASS + 15 expected fail; React 17 PASS; Go tests/race/vet PASS; TS/Go 284 cases PASS. Browser/review/publish xem `evidence/GAKKI-DEMO/browser.json`. Legacy browser parity NOT_VERIFIED; cart và production mapping chưa hỗ trợ. T12/K13 giữ VERIFICATION_PENDING. Không commit/GitHub/AWS writes.

### Real local legacy parity review

Đã chạy launcher legacy gốc qua overlay Docker synthetic/read-only và so sánh browser thật. Kết quả **NOT_READY cho full legacy parity**: 8/12 scenarios PASS, 4 FAIL; 4/12 nhóm No-Code được chứng minh đầy đủ. Đã sửa parent/child trong nhánh hỗ trợ, single-item confirmation, inline validation/scroll và container width. Còn catalog 12 nhóm, repeated cart/staged edit, header và committed-product restore. Xem [báo cáo thực chứng](evidence/REAL-LEGACY-PARITY/RESULTS.md), thay cho suy diễn từ checkpoint Gakki trước. T12/K13 không đổi.


### 2026-10-28 — multi-product internal demo closure

Corrected v10 is READY_WITH_KNOWN_GAPS for Gakki multi-product demo: 14/14 bounded browser checks PASS, catalog 12/12 parents, No-Code 9/12 groups fully demonstrated. Public-only session recovery retains no personal cells; full legacy personal restore and specialist non-Gakki forms are not certified. Review/approve/publish, desktop/mobile touch and Go 422/200 verified. T12/K13 remain VERIFICATION_PENDING. See [closure evidence](evidence/CLOSE-LEGACY-PARITY/RESULTS.md). No commit/GitHub/AWS writes.


### 2026-10-28 — final internal demo polish

Gakki v13 (`rel_ckzoawdxgnwqnusqfgkvdecnhz`) is READY_FOR_INTERNAL_DEMO within the selected multi-product scope: 14 targeted browser checks PASS, reusable full-width responsive branding, actual staged progress, clean labels, 11/12 No-Code groups demonstrated. Restore stays public-only; specialist forms/full PII retention are follow-ups. T12/K13 remain VERIFICATION_PENDING. No staging/commit/GitHub/AWS writes. See [final polish evidence](evidence/FINAL-DEMO-POLISH/RESULTS.md).
