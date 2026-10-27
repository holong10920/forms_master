# Legacy form compatibility tools

This increment adds reusable No-Code controls and a bounded **review-only** legacy analyzer. It does not claim complete migration or pixel parity for Apply/Add/Entry/Raiten.

Start Form Master from repository root:

```sh
export PATH="$PWD/.tools/bin:$PATH"
pnpm install --frozen-lockfile
pnpm local:master
```

Open http://localhost:4180/studio, sign in as synthetic-admin, and choose PC site. **参考フロー / Mẫu tham khảo** creates the editable PC desktop/notebook single-item prototype after confirmation. It uses normal form fields, conditional rules, styles and the ordinary review/publish pipeline, not a special customer React page. A separate synthetic-approver identity retains four-eyes approval.

New Inspector controls include date fields and contact format validators, native radio/checkbox cards, searchable static selects, synthetic postal lookup targets, public-choice URL initialization, public-only customer draft restore and bounded desktop/mobile styling. Existing Motion presets remain available. The only postal fixture is `0000000`; other well-formed codes return not-found. These are synthetic values, not production lookup results.

Run the analyzer against a read-only source tree:

```sh
node tools/legacy-analyzer/src/analyze.ts \
  --source ../takaku-forms/takaku-forms-ui \
  --component apply/src/sites/pc/components/NotePattern2.tsx \
  --out tools/legacy-analyzer/evidence/inventory.json
```

The tool uses the TypeScript AST and PostCSS AST. It never evaluates the inspected source, reads environment files, runs its package scripts or calls its APIs. It inventories routes, JSX/prop names, typed Props contracts, CSS and dependency candidates. The generated `candidate.json` is schema validated but deliberately unreviewed. Only static literal controls are mapped; custom components, callbacks, route semantics, repeated collections and dynamic data produce manual-mapping diagnostics. URL-bearing/sensitive/hidden/upload values are refused or diagnosed. Output inside the source, symlink output and hardlinked output are rejected.

In Studio, **下書きを取込 / Nhập bản nháp** accepts a candidate JSON file up to 1 MB. Review its diagnostics and confirm before creating a fresh site-scoped draft. It cannot overwrite the candidate's original form ID. No review, approval or publication occurs automatically. Configure the imported draft in the visual Inspector; ordinary server permissions and four-eyes approval still apply. Member cannot import/create, and forged role headers do not change that.

Customer/Preview remain on isolated 127.0.0.1 origins. Typed styles compile to host-owned CSS variables; raw CSS, JavaScript and URLs are not accepted as style values. The Go save boundary checks the shared structural schema while still allowing incomplete workflow drafts; review/publish applies full semantic checks. The retained TypeScript compiler is invoked through its fixed bounded IPC adapter, with no Python business runtime.

[Executed results and known differences](evidence/RESULTS.md) · [34-category gap matrix](evidence/CAPABILITY-MATRIX.md) · [Static inventory](evidence/inventory.json) · [Side-by-side screenshots](evidence/visual-comparison.html).

T12/K13 remains VERIFICATION_PENDING. No Git mutations, GitHub access, production backend requests or AWS writes are part of this workflow. Real adapters, repeated carts, remaining route initialization and production payload mapping remain explicit gaps.
