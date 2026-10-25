# CP5 scope APPROVED

CP4 committed `292df4b024ecbd66c7ebe786e2e6103abeafaec9`. User đã duyệt commit đúng 16 file; chuẩn bị stage/commit.
Đề xuất message: `docs(s0): CP5 verify entrypoint, conventions, governance`.

## Phạm vi (16 files)

- `README.md`
- `docs/CONTEXT_HANDOFF.md`
- `docs/CURRENT_STATUS.md`
- `docs/PROJECT_CHECKLIST.md`
- `docs/REQUIREMENTS_TRACEABILITY.md`
- `docs/engineering/CONVENTIONS.md`
- `docs/evidence/P02/CP5-PROPOSED-SCOPE.md`
- `docs/evidence/P02/S0-CP45-local-verification.txt`
- `docs/evidence/P02/S0-SUMMARY.md`
- `docs/evidence/P02/S0-T12-G2-DECISION.md`
- `docs/evidence/P02/S0-T13-verify-clean-clone.txt`
- `package.json`
- `tools/verify/package.json`
- `tools/verify/src/preflight.ts`
- `tools/verify/test/preflight.test.ts`
- `tools/verify/tsconfig.json`

`package.json` chỉ còn hai script CP5: preflight và verify. Không sửa implementation
CP4 đã PASS. Không spikes, GitHub, AWS, hook bypass, hoặc thay đổi ADR-013/014.
README/conventions/toolchain preflight và verify code đã PASS trong candidate run trước.
Governance ghi T10 accepted, T12 môi trường blocked, G2 chưa approve.

Để thực hiện yêu cầu committed-source verification: đã được user cho phép stage/commit đúng scope
CP5 này rồi clone local commit đó, frozen install, uv sync --locked và pnpm verify,
kiểm lockfile/generated drift. Không dùng overlay để gọi là committed-source PASS.
Evidence sau execution sẽ ghi rõ SHA thực tế, kết quả thật và remaining gates.
