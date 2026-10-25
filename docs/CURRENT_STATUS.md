# Current Status

> Cập nhật lần cuối: 2026-10-25 (**G1 APPROVED** cho local synthetic P0, ADR-078). Lịch sử chi tiết bên dưới giữ nguyên.

| Mục | Giá trị |
|---|---|
| Phase đang chạy | **P03 / S1 EXIT ASSESSMENT; CP1/CP2 committed, G3 PENDING user approval. S0 core foundation VERIFIED. G2 CONDITIONAL GO FOR LOCAL S1 IMPLEMENTATION — không full PASS, không S0 DONE đầy đủ.** |
| Plan đang active | S1 plan + D1–D3 approved. Local engine implemented; reference acceptance closure at `docs/evidence/P03/S1-EXIT.md`. No lookup/prefill merge; ADR-013/014 remain PROPOSED outside approved subsets. |
| Git | Local branch `codex/p03-s1-workflow-engine`; S1-CP1 `9d9e104`, S1-CP2 `2db4562822344c3aa66d8a424ffa8b8873c58ea1`. CP2 committed exactly 45 approved files. Reference/G3 closure candidate separately pending commit approval. No GitHub/push. |
| Remote | repo GitHub cá nhân, **PUBLIC**. G9 BLOCKED; user đang xử lý. |
| AWS | **KHÔNG GHI**, và chưa gọi AWS API nào. Chưa chọn profile (ADR-006). |
| Môi trường | macOS local; Node 24.22.1, pnpm 12.15.0, Python 3.13, uv 0.13.5. T12 container BLOCKED_BY_ENVIRONMENT. |
| Scope đã duyệt | G0: ADR-001..007. Nguyên tắc của spec #1: ADR-008..012, ADR-015, ADR-016. Design direction: ADR-017 (OD-01), ADR-018 (OD-14), ADR-019 (OD-02), ADR-020 (OD-04), ADR-021 (OD-07), ADR-022 (OD-12). Spec #2: ADR-023..025, ADR-027, ADR-028 (nguyên tắc), ADR-026 (APPROVED AS DESIGN DIRECTION WITH ADJUSTMENTS), ADR-029..035 (OD2-01..07, review #1). Spec #3: ADR-036 (self-contained form release), ADR-037 (session-pinned revision + stable/immutable URL), ADR-038 (CSR + Loading Shell), ADR-039 (reproducible build), ADR-040 (code splitting + prefetch), tất cả APPROVED AS DESIGN DIRECTION; ADR-041 (Vite 8.3.5 + Rolldown 1.2.15: CONDITIONALLY APPROVED); ADR-042 (SPIKE-GATE-01, đã chạy và review); ADR-043 (prefetch WebKit, ACCEPTED FOR P0); ADR-044 (pnpm: đánh giá ở P02); ADR-045 (Node 20 EOL → Node 24 LTS ở P02). Spec #4: ADR-046 (Business-first Visual Form Builder, APPROVED AS PRODUCT DIRECTION), ADR-047 (Hybrid Workspace, APPROVED AS PRODUCT/UX DESIGN DIRECTION), ADR-048 (Admin tiếng Nhật qua message catalog), ADR-049 (điều kiện gắn đích + named condition; APPROVED WITH CONDITIONS), ADR-050 (review trên snapshot bất biến), ADR-051 (shared block P0), ADR-052 (optimistic concurrency, không merge tự động), ADR-047 refinement (APPROVED), ADR-053 (Preview cô lập trên origin riêng). Spec #5: ADR-054 (yêu cầu publication/rollback, APPROVED AS DESIGN REQUIREMENTS), ADR-055 (phương án A, APPROVED AS DESIGN DIRECTION), ADR-056 (OIDC + BFF), ADR-057 (`T_stale` 60 s có giới hạn), ADR-058 (TTL draft 72 h, `G` 7 ngày, P0 defaults), ADR-059 (retention 30 ngày), ADR-060 (field inactive → 422), ADR-061 (Inspector P0 chỉ tự sinh). Spec #6: ADR-062 (Motion Product Direction), ADR-064..067. Security: ADR-063 (G-EXEC TOCTOU, P0 synthetic). ADR-013/014 + addenda vẫn PROPOSED. (không phải là duyệt architecture). **G1 APPROVED cho local synthetic P0. T10 alternative scanner ACCEPTED. G2 CONDITIONAL GO chỉ local S1; G9/G10 BLOCKED.** |
| URLs | không có |

## P02 cập nhật hiện hành — 2026-10-25

CP1/CP2/CP3/CP4 đã commit. T9 PASS, T10 detect-secrets==1.5.0 ACCEPTED (27 default detectors,
negative fixtures PASS), T11 PASS và Volta fix APPROVED. Gitleaks NOT_EXECUTED, không bắt buộc
đóng T10 synthetic P0. T12 chỉ offline specification được chấp nhận; chưa có digest, image build
hoặc container test. CP5 code/docs đã chuẩn bị và scope commit được user duyệt; candidate verification PASS.
Committed-source verification đã PASS từ `33409566fdc8502744902bbdb1f2d7988ce12363`, không overlay.
Preflight/frozen install/uv sync/pnpm verify/drift PASS. S0 core foundation VERIFIED.
User đã duyệt G2 CONDITIONAL GO cho local S1; không full PASS và không S0 DONE đầy đủ.
T12 BLOCKED_BY_ENVIRONMENT / VERIFICATION_PENDING. Exception owner/scope/exit criterion
ở `docs/evidence/P02/S0-SUMMARY.md` §G2 conditional exception.
Codex SOLE WRITER; S1 plan/D1–D3 were approved before implementation. Next: G3 approval package; no S2 implementation yet.

Các mục P01 bên dưới là lịch sử, không phải next action hiện tại.

## Đã xong (có evidence)
- P00-01..07 → xem `docs/PROJECT_CHECKLIST.md` (mục PHASE 00) và `docs/discovery/P00_DISCOVERY.md`
- Đã ghi G0 → gate log trong `docs/DECISIONS.md` + ADR-001..007
- SP-01 → `docs/evidence/P01/superpowers-install.txt` + `docs/evidence/P01/superpowers-verify-session2.txt` (đã invoke brainstorming ở phiên 2)

## Đang làm
- P01-01 / SP-02: brainstorming spec #1. Các câu trả lời đã xác nhận của user được ghi trong `docs/discovery/P01_BRAINSTORM_NOTES.md`.
  - Đã ghi Answer #1 (As-Is/To-Be) và Answer #2 (người dùng, ranh giới no-code vs developer, nguyên tắc DSL, roles).
  - Đã ghi Answer #3 (versioning shared-block, đã review T-01..T-05) → ADR-008..010 (chỉ là nguyên tắc của spec #1, không phải G1).
  - Đã ghi Answer #4 (điều chỉnh T-06..T-08, khôi phục draft theo hướng privacy-first) → ADR-011, ADR-012.
  - Answer #5: đã thống nhất hướng đi của P-01..P-06 nhưng chưa duyệt. Đã ghi lại proposal v2 (R-01..R-08) và các proposal derived-state D-01..D-07, kèm EC-01..16 và AC-01..11.
  - Addendum ADR-011/012 và ADR-013 đang PROPOSED.
  - Answer #6: policy đổi branch đã được xác nhận sơ bộ và ghi trong ADR-014 (PROPOSED). Đã ghi lại proposal navigation N-01..N-08, EC-17..25 và AC-12..16.
  - Answer #7: user yêu cầu bổ sung navigation (A1..A5) → đề xuất N-09..N-13. Đã xác nhận Validation UX → ADR-015 (nguyên tắc được chấp nhận, contract V-01..V-09 đang đề xuất). Đã thêm EC-26..35 và AC-17..22.
  - Answer #8: đã ghi các điều chỉnh A1–A6 và ranh giới plugin → ADR-016 (nguyên tắc được chấp nhận, contract PL-01..10 đang đề xuất). User đã đóng phần Q&A.
  - **Proposal spec #1:** `docs/superpowers/specs/2026-10-23-form-schema-workflow-design.md`. Đã chạy builder check (subagent độc lập), kết quả ở §24.
  - **Review #1 của user (CHANGES / VERIFICATION REQUIRED):**
    - OD-01 (a) → ADR-017 và OD-14 (a) → ADR-018, cả hai APPROVED AS DESIGN DIRECTION.
    - Đã viết thêm vào spec:
      - §7.6 ngữ nghĩa dữ liệu
      - §8.7 navigation review (NR-01..11, T1–T3, E1–E10)
      - §12 bảng ranh giới contract với spec #2/#3
      - §21 Decision Matrix OD-02..13 (OPEN)
      - §25 kế hoạch Cross-Subsystem Review
      - §26 mức độ sẵn sàng
      - AC-29..33 về parity
    - Docs đã chuyển sang tiếng Việt theo CLAUDE.md. Riêng file evidence giữ nguyên vì là output gốc.

  - **Review #2 (CONDITIONALLY ACCEPTED FOR DESIGN CONTINUATION):**
    - OD-02/04/07/12 → ADR-019..022, APPROVED AS DESIGN DIRECTION kèm điều kiện.
    - Spec #1 rev 3:
      - bỏ NFC cho văn bản tự do (phát hiện mất 異体字)
      - §7.6.9/§7.6.10, §7.7, §7.8
      - §8.7.6 race condition (INV-N1..N8, C1–C10)
      - §11, §16, AC-34..38
    - Chờ user review rev 3 trước khi chuyển sang READY_FOR_CROSS_REVIEW.
  - **Spec #2:** đang brainstorm.
    - Answer #1 (governance) → ADR-023. Answer #2 (taxonomy, facet, registry R2, action) → ADR-024, ADR-025. Cả ba là nguyên tắc ACCEPTED; chi tiết PROPOSED.
    - Answer #3 (manifest, pre-submit, final submission, provisional, governance) → ADR-026 (APPROVED AS DESIGN DIRECTION WITH ADJUSTMENTS), ADR-027, ADR-028 (nguyên tắc ACCEPTED). ADR-025 được làm rõ bởi ADR-027.
    - **Spec #2 Design Proposal rev 1:** `docs/superpowers/specs/2026-10-24-plugin-contracts-capability-registry-design.md`. Builder check đã chạy (§25.1).
    - **Review #1 (CHANGES REQUIRED — DESIGN DIRECTION ACCEPTED):** OD2-01..07 → ADR-029..035. **Rev 2** áp quyết định, sửa `valueOrigin` (→ provenance/authority/verification), `storeExists` = `storeIdValid`, postal-code lookup, React singleton, negative fixture; thêm Cross-Spec Interface Matrix #1 ↔ #2 (§19, I-01..I-21). Ví dụ JSON kiểm lại: PASS (`docs/evidence/P01/spec2-manifest-example-check.txt`). OPEN mới: OD2-08, OD2-09.
    - **Spec #1 rev 3.1:** chỉ đồng bộ contract plugin theo spec #2 §19 (ví dụ §7.2/§7.3, §7.1, §7.8, §10 D-03, §11, §12, §13, §16, §20, §26).
  - **Spec #3 (Compiler & Bundle Architecture):** đang brainstorm. Q3-1 → ADR-036. Answer #2 (revision pinning, URL, recovery) → ADR-037; đề xuất S3-P01..P11 (release identity, bootstrap/resolver, INV-R1/R2, trạng thái release, consistency model, activation protocol, error contract, TM-R01..R14) trong notes, chờ chuyển vào tài liệu spec #3. Q3-3 → ADR-038 (CSR + Loading Shell trung tính; measurement contract; prerender tương lai); đề xuất S3-P12 (release identity tất định, thay định nghĩa cũ), S3-P13 (bootstrap B + CSP), S3-P14 (T1/T2/T3), S3-P15, S3-P16 (TM-L01..L14). Q3-4 → ADR-039 (byte-for-byte reproducible build; đề xuất S3-P12 rev 2, S3-P13 rev 2, S3-P17..P21, TM-B01..B11). Answer #5 → ADR-040 (hybrid code splitting, prefetch có điều kiện).
  - **Spec #3 Architecture Proposal rev 1:** `docs/superpowers/specs/2026-10-24-compiler-bundle-release-design.md` (pipeline K0–K14, IR, chunk plan Sports/PC, LRM/attestation/provenance, reproducible build, runtime loading, prefetch/failure, measurement contract, TM-C/B/L/R, cross-spec mapping). Ví dụ JSON: PASS (`docs/evidence/P01/spec3-json-example-check.txt`). Consistency review độc lập: §25.1. OPEN: OD3-01 (bundler), OD3-02 (gate cho spike).
  - Spec #1 rev 3.3: C11 + INV-N9 (`awaitingCapability`).
  - **Review #1 spec #3:** CONDITIONALLY ACCEPTED FOR TECHNICAL VERIFICATION → ADR-041 (Vite + Rolldown đánh giá), ADR-042 (SPIKE-GATE-01).
  - **SPIKE-GATE-01 đã chạy:** tiêu chí chốt trước ở `22ecfaf`. EXP-01 PASS, EXP-02 PASS, EXP-03 FAIL (hai điều kiện đã chốt: import tương đối vượt qua `exports` cho design và `.py`; L3 và quét canary bắt đúng), EXP-04 PASS (giả định "reload luôn phục hồi" FAIL trên WebKit của Playwright), EXP-05 PASS (lab-only). Báo cáo `docs/discovery/P01_SPIKE_GATE_01_REPORT.md`; evidence `docs/evidence/P01/spike-gate-01/`; source trên branch `spike/compiler-feasibility` @ `b3070d2`.
  - **Spike review (user):** giữ kết quả; OD3-01 → ADR-041 CONDITIONALLY APPROVED; OD3-03 → ADR-043; OD3-04 → ADR-044; Node → ADR-045. Risk còn mở thành **VG-01..VG-10** trong `docs/REQUIREMENTS_TRACEABILITY.md`.
  - **Spec #4 (Admin Form Builder UX & Architecture):** Answer #1 → ADR-046 (persona, hành trình 9 bước, thành công A/B, nguyên tắc UX). Đề xuất S4-P01..P04 (IA, mô hình A/B/C — khuyến nghị C hybrid workspace, interaction model, chỉ số UX đề xuất). Answer #2 → ADR-047 (chọn C Hybrid Workspace, P0 giới hạn; 5 loại state; typed command; 3 mức draft; autosave). **Spec #4 Design Proposal rev 1:** `docs/superpowers/specs/2026-10-24-admin-form-builder-design.md` (builder check §26). Review #1 → ADR-048..052. **Spec #4 rev 2** (cùng file): Design Canvas = Presentational Renderer + Design-time Adapter + Selection Layer (bỏ `inert`); năm chế độ Edit Canvas / Partial Preview / Full Simulation / Review-ready Preflight / Published Runtime; tập con phân tích an toàn cho browser + phát hiện lệch; Admin capability set; identity ULID; pin version theo support matrix; ngữ nghĩa rule + mapping chuẩn (đóng OD-03); review snapshot + stale detection; test matrix §19. Consistency review độc lập: §27. **Rev 2.1** (review rev 2: targeted corrections): bảng bốn mức sẵn sàng, §14.7 cô lập Preview (ADR-053), khôi phục trùng key, test 4Z01–4Z09; không còn OD mở.
  - **Spec #3 rev 2** (ma trận stage, L1b, retry token, gỡ shell cùng commit) và **spec #2 rev 2.4** (L1b).
  - **Đồng bộ theo ADR-037:** spec #1 rev 3.2 (§9 `session`, §13), spec #2 rev 2.1 (§10.3, §10.6, §19 I-19/I-22); rev 2.2 (§10.2 LRM vs FRM); rev 2.3 (lock identity/resolution context, rebuild, INV-F1 Motion, L3, `Summary`).
  - **Pending cho spec #5 (chưa thiết kế chi tiết):** release record + active pointer, status API, activation protocol + reconciler, CDN invalidation và cache header thật (sau G10), retention job, HTTP status cuối cùng, TTL draft (OD-08), grace window (OD2-09), `T_edge_max` (notes S3-P11).

## Bị chặn
- G9 (GitHub) và G10 (AWS): đang chờ user.

## Tiếp theo
1. C1 (`2f514a1`) → re-review → C1b (`60fcf9d`, `0510369`); SR-04 → ADR-074 (`26c59d4`). **Closure review độc lập trên `0510369`** (V5-01 12 điểm + Batch A/B/C; report §10.6): 0 BLOCKER, **8 MAJOR** (M-01..M-08) + contract SR-08 (ADR-076, CONDITIONALLY_ACCEPTED — ENFORCEMENT/VERIFICATION_PENDING). **C1c** (`cc83ceb`) → targeted re-review: 0 BLOCKER, 5 MAJOR (R1-01, R1-02, R2-01, R2-02, R2-03; report §10.7) → **C1d** (spec #2 rev 2.15, #3 rev 2.10, #4 rev 2.9, #5 + C1d): DESIGN_RESOLVED, **chờ targeted re-review độc lập trên commit C1d**; không còn BLOCKER/MAJOR → G1 Approval Package ngắn (không tự approve). Sole writer: `forms-master-61` (ADR-077, Closure Mode). — ưu tiên trải nghiệm Business Editor và hiệu năng runtime.
2. Spec #3 rev 2: final review + Cross-Spec Review (spec #1 §25). VG-01..VG-10 giữ OPEN tới khi có evidence.
3. User review spec #2 rev 2.5 và quyết OD2-08/OD2-09 (cần trước spec #5, không chặn spec #3).
4. User review spec #1 rev 3.3. Nếu đồng ý thì spec #1 chuyển sang READY_FOR_CROSS_REVIEW (chỉ khi user xác nhận).
5. Tiếp theo: spec #5 (API/persistence/publish/review workflow; nhận các pending từ spec #3 S3-P11 và spec #4 I4-13), spec #6 (Motion). Spike đo isolation phải qua gate riêng (ADR-018).
6. Cross-Subsystem Integration Review (spec #1 §25), rồi mới trình G1.
7. Trong P01 được phép: design review, kiểm chứng lý thuyết, viết test matrix. Không scaffold, không viết code.

## Câu hỏi mở cho G1 (đã ghi lại, không cần hỏi lại trước khi brainstorming)
- F-P0-13/16/18/19 giữ P0, xếp lịch sau vertical slice (ADR-004). Cần xác nhận.
- Spike bundle-isolation: đây là code dùng xong bỏ để đo tree-shaking, nên cần user approval trước khi chạy (không phải feature code, nhưng vẫn là code).

## Tests
- Chưa có code. G1 đã duyệt (ADR-078); test bắt đầu từ S0. Không test nào được coi là PASS trước khi chạy thật.
