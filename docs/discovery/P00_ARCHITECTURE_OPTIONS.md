# P00-06 — Architecture Options & Decision Matrix

> Trạng thái: **Hướng C (Hybrid) ACCEPTED tại G0** (ADR-002, 2026-10-23). Thiết kế chi tiết, stack và budgets chốt tại G1 sau `superpowers:brainstorming` (P01).
> Số liệu bundle/performance dưới đây là **ước lượng định tính**, chưa đo. Sẽ có spike đo thật ở P01 trước khi chốt.

## A. Runtime-driven renderer

Một bundle chung (engine + toàn bộ field/plugin registry) cho mọi form; trang static chỉ khác `form.json` được fetch hoặc inline lúc runtime.

- **+** Đơn giản nhất; preview = production (cùng renderer); publish form = upload JSON, không cần build job.
- **+** Iteration nhanh: đổi label không cần build.
- **−** Mọi form tải mọi plugin (hoặc phải dùng dynamic import theo registry → nhiều request, waterfall sau khi đọc JSON).
- **−** Không đạt BUILD-02 / BUILD-06 / MOTION-07 nếu không thêm lớp chọn lọc.
- **−** Lỗi ở một plugin ảnh hưởng tất cả form dùng chung bundle version.

## B. Code generator

JSON → sinh source React độc lập per form (TSX files) → build như app riêng.

- **+** Bundle isolation tối đa; dev có thể đọc/sửa output.
- **−** Preview khó giống output (Admin phải build hoặc dùng renderer riêng → vi phạm UX-05/BUILD-08 nếu không cẩn thận).
- **−** Generated code drift: người sửa tay → không round-trip về JSON; review diff sinh tự động khó.
- **−** Template generator là một ngôn ngữ thứ hai cần maintain; bug sinh code khó test.
- **−** Rủi ro bảo mật cao hơn (string templating → code injection nếu escape sai).

## C. Hybrid compiler (hypothesis của master)

JSON versioned + **một engine dùng chung** (state machine, rules, validation) + **compiler chỉ sinh entrypoint nhỏ** import đúng các capability (field components, plugins, motion presets) mà form tham chiếu; bundler (Vite/Rollup) tree-shake phần còn lại. JSON snapshot inline vào artifact.

- **+** Preview dùng cùng engine + cùng registry (Admin nạp full registry, artifact nạp subset) → UX-05/BUILD-08.
- **+** Đạt BUILD-02/06, MOTION-07 bằng import graph tĩnh, kiểm chứng được qua module manifest/analyzer.
- **+** Generated code chỉ là import list + bootstrap (~vài chục dòng) → không có drift, không có logic sinh ra.
- **−** Cần build job per publish (API-06: worker riêng), phức tạp hơn A.
- **−** Đổi label vẫn phải rebuild (có thể giảm bằng cache vendor chunk / affected rebuild BUILD-07).
- **−** Tree-shaking phụ thuộc kỷ luật module (side-effect-free packages, `sideEffects: false`, không barrel import nạp hết registry) — phải verify bằng analyzer, không giả định.

### Biến thể đáng cân nhắc: A → C migration path

MVP dùng A (renderer + registry đầy đủ) cho preview, rồi compiler C cho publish. Thực chất đây là C với preview chạy “full registry mode”. Contract JSON không đổi.

## Decision matrix (1 = kém, 5 = tốt; định tính, chưa đo)

| Tiêu chí | Trọng số | A Runtime | B Codegen | C Hybrid |
|---|---|---|---|---|
| Bundle isolation per form | 3 | 2 | 5 | 4 |
| Extension safety (không chạy code tùy ý, plugin contract) | 3 | 4 | 2 | 4 |
| Độ phức tạp xây dựng/vận hành | 2 | 5 | 2 | 3 |
| Preview ↔ publish consistency | 3 | 5 | 2 | 4 |
| Tốc độ iteration (đổi field → live) | 2 | 5 | 2 | 3 |
| Khả năng review / multi-dev / AI-friendly | 2 | 3 | 2 | 4 |
| **Tổng có trọng số** (max 75) | | **59** | **38** | **58** |

Đọc ma trận: A và C gần ngang nhau về điểm, nhưng **A trượt hai acceptance criteria cứng** của master (BUILD-02/06, MOTION-07; DOD-05) nếu không bổ sung chọn lọc. Vì vậy:

**Recommendation: C (Hybrid) — đã được user chấp nhận làm hướng đi tại G0**, triển khai theo thứ tự “engine + renderer + full-registry preview trước, compiler entrypoint sau”, để demo được sớm mà không đổi contract. Điều kiện để giữ khuyến nghị: spike P01 chứng minh Vite/Rollup loại được plugin không dùng (đo bằng `rollup-plugin-visualizer` hoặc module manifest).

## Stack sơ bộ (chờ G1)

| Layer | Đề xuất | Lý do | Cần xác minh |
|---|---|---|---|
| Admin + runtime UI | React 19 + TypeScript strict + Vite | Stack phổ biến, team quen thuộc | Version mới nhất tại thời điểm P02 |
| Form state | Engine thuần TS (không phụ thuộc React) + React adapter (subscription per field) | Test được không cần DOM; tránh re-render toàn form (PERF-04) | — |
| Schema validation | JSON Schema (Ajv) hoặc Zod → JSON Schema export, dùng chung FE/BE | ARCH-07: cùng contract ở Python (jsonschema) | Chọn 1 nguồn sự thật ở P01-02 |
| Builder DnD | dnd-kit | Accessible, keyboard DnD | — |
| Flow editor | React Flow (`@xyflow/react`) | Node/edge editor có sẵn | License MIT — xác minh |
| Motion | `motion` (LazyMotion + `m`) | Master chỉ định | Đo bundle thật (MOTION-04) |
| Admin API | Python 3.12 + FastAPI, Mangum adapter cho Lambda | API-01; local chạy uvicorn | Máy local chỉ có Python 3.9.6 → dùng Docker hoặc cài 3.12 (cần user đồng ý) |
| Storage | Local: SQLite/file adapter; AWS: DynamoDB | API-02 | — |
| Build worker | Node script (Vite build API) chạy local; AWS: CodeBuild | API-06 | — |
| IaC | AWS CDK (TypeScript) hoặc Terraform | Chọn ở P10; chưa cài cả hai | — |
| Package manager | pnpm workspaces | Monorepo | Chưa cài; cần `corepack enable` hoặc Volta |

## Ràng buộc bổ sung từ G0 (ADR-004, ADR-005)

- Undo/redo là P1 nhưng builder state phải là immutable document + typed commands/patches để thêm history stack sau không cần refactor.
- Bằng chứng performance bắt buộc trên artifact thật: biến thể nomotion không chứa Motion runtime; Sports không chứa `store-selector`; raw/gzip/Brotli; chunk/dependency graph. Budgets đặt từ số đo, duyệt tại G1.
