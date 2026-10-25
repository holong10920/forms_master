import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import {
  createSession,
  dispatch,
  restoreDraft,
  payloadPreview,
  type DraftSnapshot,
} from "@fb/form-engine";
import { fixtureIR } from "./parity.ts";
export function restoreDemo(): unknown {
  const ir = fixtureIR("pc");
  let state = createSession(ir);
  state = dispatch(ir, state, { type: "commit", field: "fld_method", value: "takuhai" }).state;
  state = dispatch(ir, state, {
    type: "next",
    fromStep: state.current,
    stateVersion: state.stateVersion,
  }).state;
  state = dispatch(ir, state, { type: "commit", field: "fld_kit", value: "yes" }).state;
  state = dispatch(ir, state, {
    type: "commit",
    field: "fld_token",
    value: "synthetic-ephemeral",
  }).state;
  const dir = mkdtempSync(join(tmpdir(), "fb-draft-demo-"));
  try {
    const irPath = join(dir, "ir.json");
    writeFileSync(irPath, JSON.stringify(ir));
    const invoke = (action: string, input: unknown): unknown =>
      JSON.parse(
        execFileSync(
          "uv",
          [
            "run",
            "--locked",
            "--offline",
            "python",
            resolve(import.meta.dirname, "../local_adapter.py"),
            "--ir",
            irPath,
            "--db",
            join(dir, "drafts.sqlite"),
            "--action",
            action,
          ],
          {
            cwd: resolve(import.meta.dirname, "../../.."),
            encoding: "utf8",
            input: JSON.stringify(input),
            timeout: 30000,
          },
        ),
      );
    const saved = invoke("save", {
      expectedVersion: 0,
      current: state.current,
      values: state.values,
    });
    // A second Python process opens the committed SQLite draft, not reducer memory.
    const loaded = invoke("load", {}) as { status: string; version: number; draft: DraftSnapshot };
    if (loaded.status !== "restored") throw new Error("draft restore failed");
    const restored = restoreDraft(ir, loaded.draft, {
      releaseId: "synthetic-release-1",
      revision: "synthetic-revision-1",
      now: Date.now(),
    });
    return {
      scenario: "restore",
      saved,
      status: loaded.status,
      step: restored.current,
      preview: payloadPreview(ir, restored),
      secretAbsent: restored.values.fld_token === undefined,
    };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
