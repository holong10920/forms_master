# S0 checkpoint summary — 2026-10-25

CP1 c318c73; CP2 683e82e; CP3 090c537; CP4 292df4b. CP5 chưa commit.
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
VG-05 PARTIAL; VG-21 phương pháp PASS, baseline/budget S2 OPEN. Không S0 DONE/G2 PASS.
CP5 README/preflight/verify/conventions/governance prepared; user đã duyệt scope 16 file.
Commit rồi clean-clone verification từ committed source, không overlay; execution result
báo cùng SHA trong log sau commit.

Acceptance: toolchain/contracts/store/boundaries/security/perf method PASS; mandatory
container criterion và final committed-source CP5 verification PENDING. GitHub CI PENDING G9.
G2 đề xuất BLOCKED. G9/G10 BLOCKED. ADR-013/014 không thay đổi. Không architecture review mới.
