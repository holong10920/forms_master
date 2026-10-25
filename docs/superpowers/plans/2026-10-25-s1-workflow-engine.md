# S1 — Workflow/Form Engine chạy local

**Status: user approved S1 plan and D1-D3 subsets on 2026-10-25; implementation authorized.**
Codex SOLE WRITER. G2 **CONDITIONAL GO FOR LOCAL S1 IMPLEMENTATION**, không full PASS.
S0 core foundation VERIFIED; CP4 `292df4b`, CP5 `3340956`, documentation closure `c52102e`.
T12 vẫn BLOCKED_BY_ENVIRONMENT / VERIFICATION_PENDING; exception tại
[summary S0](../../evidence/P02/S0-SUMMARY.md#g2-conditional-exception), bắt buộc đóng trước
S2 Compiler/reproducible build acceptance. G9/G10 BLOCKED, synthetic/mock only.

## Baseline và giới hạn

Nguồn quyết định: G1 tại `6312f2b`, ADR-017/019/022/037/058/060/078 và sáu spec đã duyệt.
Contract trực tiếp: spec #1 §4, §6–§11, §18 (AC-26/29–36); spec #2 §6.6, §13.2, §18.3;
spec #3 §5.4 (IR envelope); spec #5 §5.3, §7, §9.2, §11. ADR-078 ưu tiên hơn các nhãn
G1/OD còn cũ trong spec: DAG đã chốt; division/date arithmetic P1, không hỏi lại.
**ADR-013/014 vẫn PROPOSED**; chỉ xin chốt các subset bên dưới, không đổi trạng thái toàn ADR.

S1 tạo pure engine TS + evaluator Python và demo CLI. Không React/Admin/Motion UI, bundler,
publish/rollback, HTTP API, auth hay connector thật. Không viết lại S0 đã PASS. Cần integration
nào mới thêm adapter đó; không scaffold sáu subsystem. Mock completion không phải submission
service, admission gate hay bằng chứng CT-26/VG-13/VG-17 đã PASS.

## Ba quyết định hẹp cần user chốt

| ID | Đề xuất contract | Chặn |
|---|---|---|
| **D1 — ADR-014 path/activity** | Dùng §8.2/8.7: `derivedPath(values)` eager, first-match/default; một hàm activity qua parent, không history riêng; FE loại upcoming, BE projection tới review. Back là predecessor trên path, không validate. Async làm mất current → step rẽ nhánh chung cuối (NR-06); jump/restore → `firstIncomplete` (NR-08), không nhập hai fallback làm một. | V1 |
| **D2 — ADR-014 inactive/privacy** | Giữ inactive chỉ trong session memory; không validate, aggregate, submit hoặc persist. Active→inactive với `clearOnDeactivate` thì xóa, bắt buộc cho `secret`; quay lại revalidate/recompute. Draft chỉ active + persist allowed + không taint personal/secret; reload không phục hồi inactive. | V1; persistence V4 |
| **D3 — ADR-013 calculated** | Chốt riêng `calculated`: catalog formula/aggregate hữu hạn của §7.4, typed/readOnly, topo + ID tie-break; thiếu input → absent, overflow mỗi phép → field error; classification theo input; `include` do BE recompute, `displayOnly` không vào payload. Không division/date, eval hoặc JS expression. | V2, **không chặn demo V1** |

`prefill` overwrite policies và lookup output-merge của ADR-013 chưa được duyệt bởi D3.
Không dùng chúng trong fixture V1/V2, không tự coi toàn ADR-013 APPROVED. Nếu cần triển khai
một slice sử dụng chúng, chốt đúng contract đó tại checkpoint, không mở brainstorming chung.
Các mock async V3 kiểm validation/capability/navigation, không ngầm implement lookup merge policy.

## Task breakdown theo bốn vertical slice

| Task | Phần runnable / đầu ra | Verification và điểm demo |
|---|---|---|
| **T1 / V1 — Definition + DAG** | Canonical schema/type cho executable subset của Form Definition và IR theo G1, shared TS/Python, dùng generator S0. Load synthetic fixture, kiểm ID/ref/type, transition/default, DAG, dominance và dependency cycle. Không viết Compiler K0–K14; fixture IR đã expanded, không âm thầm resolve block/plugin. | Negative fixtures: cycle, dangling ref, no default, type mismatch, forward ref, preview-only node; unsupported construct phải báo diagnostic, không bị bỏ qua. |
| **T2 / V1 — Engine demo đầu** | Reducer thuần + `createSession`, `dispatch`, selectors; rule `eq/isEmpty` tối thiểu để rẽ nhánh, activity, next/back, required và review projection. Fixture PC synthetic: method → nhánh 宅配/店頭 → review. CLI phát event và in trace/payload preview. | `pnpm engine:demo --scenario pc-branch`: nhập branch data, Back, đổi method, Next; inactive giữ trong memory nhưng không xuất payload; stale `fromStep` không nhảy hai bước. **Demo đầu tiên ở cuối V1**, chưa cần DB, browser hay container; chưa có submit thật. |
| **T3 / V2 — Rules + derived + parity** | Mở rộng catalog rule/formula P0 và calculated theo D3; repeatable group theo `itemId/order`, typed references và closure recompute tất định. Python evaluator cùng IR/fixtures, không resolve definition/block. | Golden + seeded differential TS/Python chạy ngay với từng semantics mới: missing/empty/null, false/0, `neq` vs `not(eq)`, type/no-coercion, safe-int/overflow, Unicode/code points, aggregate active-only, empty group. Log seed và ICU/Unicode versions; sai khác phải fail. |
| **T4 / V3 — Navigation/validation/completion** | Hoàn thiện T1–T3/E1–E10 trong §8.7; visibility/required/availability, built-in canonicalization/validators, jump/restore, nhóm lặp, serial event queue/stateVersion. Effects là descriptors; mock authoritative validation/capability/submit result. Complete chỉ sau submit success, không qua deep link. | Event regression C1–C11/INV-N1–N9 áp dụng cho core: double next/submit, stale seq/fingerprint, edit/back khi chờ, timeout/failure, immutable snapshot. IME/blur/touched là core events/selectors; không claim DOM/focus UI PASS. |
| **T5 / V3 — Server semantic boundary** | Python revalidate/projection từ **trusted fixture IR**, không nhận client IR làm authority. Recompute calculated; map deterministic errors theo field/itemId. Không tạo HTTP service hoặc admission repository. | Unknown/inactive/displayOnly data bị từ chối đúng contract; inactive `E-INACTIVE-DATA-PRESENT`, null `E-PAYLOAD-NULL`, wrong type `E-TYPE`; giả mạo calculated không được tin. Authoritative reject/unavailable không được mock thành success. Parity gồm path/activity/errors/calculated/projected payload, không chỉ boolean pass/fail. |
| **T6 / V4 — Local persistence + end-to-end demo** | Thin runner/effect adapter dùng S0 SQLite/blob primitives, save/restore filtered draft với metadata pin revision/release fixture, TTL 72h/FakeClock và CAS khi thực sự cần; core không gọi I/O. Không persist toàn bộ reducer state hay inactive values. | Restart demo: public allowed values được restore; inactive/secret/personal bị loại, TTL hết hạn không restore, wrong-release không apply, storage failure không phá nhập liệu. Backend evaluator từ trusted fixture đánh giá lại. `pnpm verify` + scanner/synthetic/network/boundaries giữ PASS. |

V1 là vertical slice nhỏ qua T1+T2, không đợi hoàn thiện toàn DSL. Mỗi bước công bố feature
matrix: supported / not yet supported / rejected. V2–V4 không được gọi full S1 PASS trước khi
coverage được nêu ở bảng đã chạy. Prefill/lookup integration chưa chốt là follow-up tường minh,
không được âm thầm đánh dấu implemented hoặc dùng làm điều kiện cho demo đầu.

## Phạm vi file/API dự kiến

- `contracts/schemas/{form-definition,engine-ir}/v1.schema.json`, types sinh từ cùng nguồn;
  `contracts/fixtures/engine/` chứa definition/IR/event traces và expected results có version.
  Không nới schema keyword allowlist S0 để né validation. Built-in canonicalization có fixture.
- `packages/form-engine/` (`@fb/form-engine`): TS pure, browser-safe; semantic guards của
  executable IR, rules/activity/reducer/validation/projection. Không DOM, clock/random/network
  trực tiếp; identity/time/fingerprints đầu vào tường minh. Không giả làm full form-analyzer/compiler.
- `python/fb_engine/`: pure evaluator chỉ phụ thuộc contracts; `tools/engine-demo/` chứa CLI,
  mock effect runner và bridge tới Python/store. Ports mỏng, không backend app mới.
- Khi package xuất hiện: thêm boundary + negative fixture, Volta extends, strict typecheck;
  contracts không import engine, engine không import tools/store/Node core. Adapter ở tầng tools
  mới dùng store. Không sửa FS/migration implementation S0 nếu không có regression thật.
- Submission payload/trace không mang inactive hoặc giá trị trong diagnostic; core chỉ emit
  effect request, backend/mock adapter mới quyết định success. Chưa có production submission API.

## Checkpoints và cách chạy

1. **S1-CP1 = V1+V2:** demo branch chạy được; rule/calculated subset và TS/Python parity PASS.
2. **S1-CP2 = V3+V4:** navigation/validation/completion và save/restore end-to-end PASS;
   cập nhật feature matrix, evidence và remaining plugin/prefill/lookup contracts.

Một lần review plan+D1–D3 trước code; sau đó Implement → targeted tests → self-review → demo.
Chỉ hai checkpoint commit đề xuất, trình scope theo chính sách Git hiện hành; không xin duyệt
mỗi file/test. Không tự tạo branch/commit ngoài quyền user đã cấp. Independent reviewer chỉ
khi có correctness/security phức tạp có bằng chứng hoặc implementation gate thực sự yêu cầu;
không review toàn bộ sáu subsystem, không lặp vòng review cho có thêm ý kiến.

Lệnh **dự kiến, chưa chạy/chưa implement**: `pnpm engine:demo --scenario pc-branch`,
`pnpm engine:parity`, `pnpm engine:demo --scenario restore`, và `pnpm verify` mở rộng test paths.
Evidence tại `docs/evidence/P03/S1-CP<n>/`: commands, source SHA/candidate label, fixture version,
seed và results. Không cần server/registry/Docker để demo V1. Không số liệu performance hoặc
security PASS ngoài coverage đã thực thi. Ngoại lệ T12 không được kéo dài qua S2 acceptance.

## User execution decision (2026-10-25)

S1 plan approved. D1: DAG/current-data active path; Back to a valid visited predecessor;
no stale forward history or inactive-step navigation. D2: inactive values stay in memory
but do not validate/submit/influence active logic; clearOnDeactivate deletes on transition;
test delivery to store to delivery. D3: deterministic calculated values, cycle rejection,
P0 operators only, backend recomputation, golden TS/Python parity. ADR-013/014 remain
PROPOSED outside these subsets. Commit this plan, create implementation branch, then
start V1. Implementation checkpoint commits require scope approval. No GitHub/AWS.
