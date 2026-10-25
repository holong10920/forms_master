# S0 checkpoint summary — 2026-10-25

CP1 c318c73; CP2 683e82e; CP3 090c537; CP4 292df4b. CP5 source `33409566fdc8502744902bbdb1f2d7988ce12363`.
T1–T11 local scope PASS; T10 alternative scanner ACCEPTED cho S0 synthetic P0.
Detect-secrets==1.5.0: 27 default detectors; separate working/index snapshots, all staged
ACMR files included; JSON findings classified using evidence, no secret values reported.
Negative fixtures PASS; Gitleaks NOT_EXECUTED, không bắt buộc tải để đóng T10 P0.
Hai scanner không được coi tương đương hoàn toàn.

CP4 index-only verification: TS 517 pass / 15 declared expected failures / 1 intentional
optional Gitleaks skip; Python 674 pass. Frozen installs, format/lint/typecheck/generated
schema drift and TS/Python boundaries PASS. CP5 candidate bổ sung preflight test: 518 pass.
Candidate overlay evidence không thay cho committed-source verification của CP5.

T12 offline specification ACCEPTED; container image/digest/build/test BLOCKED_BY_ENVIRONMENT.
VG-05 PARTIAL; VG-21 phương pháp PASS, baseline/budget S2 OPEN. S0 core foundation VERIFIED; không S0 DONE đầy đủ/G2 full PASS.
CP5 source đã commit theo scope user duyệt. Fresh local clone từ commit `33409566fdc8502744902bbdb1f2d7988ce12363`,
không overlay: Node/pnpm preflight, frozen install, uv sync --locked, pnpm verify PASS.
TS 518 pass / 15 expected failures / 1 optional Gitleaks skip; Python 674 pass.
Lockfile/generated SHA-256 unchanged, clone git status clean. README bootstrap đã chạy thật.
Final execution evidence/governance closure theo scope 5 file user duyệt, không sửa implementation.

Acceptance: toolchain/contracts/store/boundaries/security/perf method PASS; mandatory
container criterion PENDING; final committed-source CP5 verification PASS. GitHub CI PENDING G9.
G2 CONDITIONAL GO FOR LOCAL S1 IMPLEMENTATION theo user, không full PASS.
G9/G10 BLOCKED. ADR-013/014 vẫn PROPOSED. Không architecture review mới.

## G2 conditional exception

- **Decision owner:** user (2026-10-25). **Implementation/follow-up owner:** Codex, SOLE WRITER;
  user quyết định môi trường/nguồn image khi cần. Không tự mở rộng ngoại lệ.
- **Scope:** cho triển khai S1 Workflow/Form Engine trên local, chỉ synthetic/mock; plan S1
  phải được user review trước code. Không production, connector thật, privileged effect,
  GitHub/push hay AWS write. Không chấp nhận S2 Compiler/reproducible build khi T12 chưa đạt.
- **Deferred verification:** T12 BLOCKED_BY_ENVIRONMENT / VERIFICATION_PENDING. Chỉ offline
  build specification được chấp nhận; chưa Dockerfile pin digest, verified image digest,
  container build/toolchain/test. Không bịa digest, không retry registry vô hạn.
- **Exit criterion / deadline:** trước khi hoàn tất S2 Compiler/reproducible build acceptance,
  có base Node 24 digest được xác minh, builder build thật, version/environment checks và
  frozen install/typecheck/tests trên committed source trong container, kèm SHA/digest/log.
  A/B reproducibility/isolation của compiler vẫn cần evidence S2 riêng. Chỉ đóng exception
  theo evidence và checkpoint được user chấp nhận; host macOS PASS không thay container PASS.
- **Status:** ACTIVE controlled exception. S0 core foundation VERIFIED; S0 full acceptance
  chưa DONE; G2 conditional GO chỉ local S1, không phải full PASS. Security alternative
  ACCEPTED (detect-secrets==1.5.0, 27 default detectors); Gitleaks NOT_EXECUTED.
