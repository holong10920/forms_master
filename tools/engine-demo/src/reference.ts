import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import {
  createSession,
  dispatch,
  snapshot,
  payloadPreview,
  validation,
  type Cell,
} from "@fb/form-engine";
import { fixtureIR } from "./parity.ts";
export interface ReferenceInput {
  category?: "golf" | "racket";
  condition?: "used" | "junk";
  device?: "desktop" | "laptop" | "tablet" | "peripheral";
  method?: "store" | "takuhai";
}
export function referenceDemo(name: "sports" | "pc-reference", input: ReferenceInput = {}) {
  const ir = fixtureIR(name);
  let state = createSession(ir, {}, { idempotencyKey: `synthetic-reference-${name}` });
  const trace: string[] = [state.current];
  const answers: Record<string, Cell> = {
    fld_category: input.category ?? "golf",
    fld_club: "iron",
    fld_racket: "tennis",
    fld_condition: input.condition ?? "junk",
    fld_damage: "Synthetic broken part",
    fld_method: name === "sports" ? "shuccho" : (input.method ?? "store"),
    fld_device: input.device ?? "laptop",
    fld_battery: "good",
    fld_defects: ["screen"],
    fld_store: "fictional-east",
    fld_kit: "yes",
    fld_customer: "Synthetic Customer",
    fld_consent: true,
  };
  const move = () => {
    state = dispatch(ir, state, {
      type: "next",
      fromStep: state.current,
      stateVersion: state.stateVersion,
    }).state;
  };
  for (let i = 0; i < ir.steps.length; i++) {
    const step = ir.steps.find((s) => s.id === state.current);
    if (!step) throw new Error("reference step missing");
    if (step.kind === "review") break;
    for (const item of step.content ?? []) {
      if (!("field" in item)) continue;
      const id = item.field.slice(7);
      if (snapshot(ir, state).active.has(id) && Object.hasOwn(answers, id))
        state = dispatch(ir, state, { type: "commit", field: id, value: answers[id] }).state;
    }
    const errors = validation(ir, state);
    if (errors.length) throw new Error(`reference invalid: ${JSON.stringify(errors)}`);
    move();
    trace.push(state.current);
  }
  if (ir.steps.find((s) => s.id === state.current)?.kind !== "review")
    throw new Error("reference did not reach review");
  const preview = payloadPreview(ir, state);
  const dir = mkdtempSync(join(tmpdir(), "fb-reference-submit-"));
  let authoritative: { ok: boolean; errors: unknown[]; payload: unknown };
  try {
    const file = join(dir, "ir.json");
    writeFileSync(file, JSON.stringify(ir));
    authoritative = JSON.parse(
      execFileSync(
        "uv",
        [
          "run",
          "--locked",
          "--offline",
          "python",
          resolve(import.meta.dirname, "../adapter.py"),
          "--ir",
          file,
          "--submission",
        ],
        {
          cwd: resolve(import.meta.dirname, "../../.."),
          input: JSON.stringify(preview),
          encoding: "utf8",
          timeout: 30000,
        },
      ),
    ) as typeof authoritative;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  if (!authoritative.ok)
    throw new Error(`reference rejected: ${JSON.stringify(authoritative.errors)}`);
  move();
  const request = state.request;
  if (!request || request.kind !== "submit") throw new Error("reference missing submit request");
  state = dispatch(ir, state, {
    type: "submitResult",
    id: request.id,
    fingerprint: request.fingerprint,
    ok: authoritative.ok,
  }).state;
  trace.push(state.current);
  return {
    definition: name,
    input,
    trace,
    terminal: state.current,
    status: state.status,
    preview,
    backend: authoritative,
  };
}
export function referenceSuite() {
  return {
    scenario: "references",
    runs: [
      referenceDemo("sports", { category: "golf", condition: "junk" }),
      referenceDemo("sports", { category: "racket", condition: "used" }),
      referenceDemo("pc-reference", { device: "laptop", method: "store" }),
      referenceDemo("pc-reference", { device: "peripheral", method: "takuhai" }),
    ],
  };
}
