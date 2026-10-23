# Context Handoff

> For a fresh Claude session. Read this first, then `CURRENT_STATUS.md`. Updated 2026-10-23, end of session 1. **Last checkpoint: `0d4fe7b` on branch `p00-discovery` (local, not pushed).**

**Project:** a PoC multi-site form builder.
- Forms are defined as versioned JSON.
- An Admin UI edits them: fields/sections, steps/branches, rules, theme, Motion presets.
- A Hybrid compiler turns each form into its own static artifact.
- Publish and rollback happen locally first. An isolated AWS training stack is used only after G10.
- The master contract is `MASTER_PROMPT_*.md` at the repo root. It is gitignored and exists only on the local machine.

**Where things stand:**
- **P00 DONE. G0 APPROVED WITH ADJUSTMENTS** (2026-10-23, `docs/DECISIONS.md`):
  - Demo forms are synthetic Sports and PC (ADR-003).
  - The MVP is a vertical slice: Admin → JSON → Preview → Compiler → Static Artifact → Runtime → Local Publish/Rollback (ADR-004).
  - Undo/redo moves to P1, but the design must leave room for it.
  - Performance claims need measured artifacts only: the nomotion variant has no Motion, and Sports does not contain `store-selector` (ADR-005).
- **P01 ready:** Superpowers 7.0.0 is installed (user scope). The new session must verify that `superpowers:brainstorming` actually invokes before starting.

**First step in the next session:**
1. Check the skill list for `superpowers:brainstorming`.
   - If it is there: invoke it with the Skill tool and follow it for real, asking one question at a time. Start with the schema + workflow DSL spec and write it to `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md` (or the path the skill prescribes).
   - If it is not there: report BLOCKED. Do not fake a brainstorming session.

**Locked decisions:**
- Hybrid direction (ADR-002).
- Company-derived audit details live only in `docs/internal/` (ADR-001).
- Local commits are allowed for safe content, on a local branch. The hook allows git commit/push only in this repo, and only when the command does not `cd` or use `-C` to point elsewhere, so run `git commit` directly from the repo root. **No push before G9** (ADR-007), even though the hook technically allows it.
- Do not choose an AWS profile, and make no AWS writes (ADR-006).

**Do not:**
- implement before G1
- push, or change the remote
- touch AWS
- call company APIs
- copy company code
- write legacy-system weaknesses into tracked docs
