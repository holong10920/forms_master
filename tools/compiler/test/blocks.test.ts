import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { test, expect } from "vitest";
import { expandBlocks, bindBlocks } from "../src/blocks.ts";
import { compile, root } from "../src/build.ts";
import { loadDefinition, assertIR, createSession, payloadPreview, snapshot } from "@fb/form-engine";
import type { FormDefinitionV1 } from "@fb/contracts";
const definition = (): FormDefinitionV1 => ({
  schemaVersion: "1.0.0",
  kind: "form",
  formId: "frm_shared_fixture",
  siteId: "site_sports_synthetic",
  fields: [
    {
      id: "fld_mode",
      key: "mode",
      type: "choice.radio",
      classification: "public",
      required: true,
      options: [{ value: "yes" }, { value: "no" }],
    },
  ],
  dependencies: { blocks: { a: "blk_customer_info@r1", b: "blk_customer_info@r2" } },
  blockInstances: [
    { id: "inst_first", alias: "customer", block: "a", inputs: {} },
    { id: "inst_second", alias: "other", block: "b", inputs: { requireKana: false } },
  ],
  steps: [
    {
      id: "stp_mode",
      kind: "form",
      content: [{ field: "$local:fld_mode" }],
      transitions: [{ default: "stp_customer" }],
    },
    {
      id: "stp_customer",
      kind: "form",
      content: [{ block: "inst_first" }, { block: "inst_second" }],
      skipWhen: { op: "eq", args: [{ ref: "$local:fld_mode" }, { const: "no" }] },
      transitions: [{ default: "stp_review" }],
    },
    { id: "stp_review", kind: "review", transitions: [{ default: "stp_done" }] },
    { id: "stp_done", kind: "complete" },
  ],
});
function pins(d: FormDefinitionV1) {
  if (!d.dependencies?.blocks) throw Error("missing fixture pins");
  return d.dependencies.blocks;
}
function instance(d: FormDefinitionV1, n: number) {
  const item = d.blockInstances?.[n];
  if (!item) throw Error("missing fixture instance");
  return item;
}
test("exact shared-block pins, stable instance identities, const inputs and TS/Python nested payload parity", () => {
  const d = definition(),
    expanded = expandBlocks(d),
    ir = loadDefinition(expanded.definition);
  bindBlocks(ir, expanded.bindings);
  assertIR(ir);
  const values: Record<string, string> = { fld_mode: "yes" };
  for (const f of ir.nodes)
    if (f.type !== "group" && f.outputPath) {
      if (f.outputPath[1] === "name") values[f.id] = "Synthetic Name";
      if (f.outputPath[1] === "email") values[f.id] = "synthetic@example.invalid";
    }
  let state = { ...createSession(ir, values), current: "stp_review" };
  const expected = {
    mode: "yes",
    customer: { name: "Synthetic Name", email: "synthetic@example.invalid" },
    other: { name: "Synthetic Name", email: "synthetic@example.invalid" },
  };
  expect(payloadPreview(ir, state)).toEqual(expected);
  const python = execFileSync(
    join(root, ".venv/bin/python"),
    [
      "-c",
      "import sys,json;from fb_engine.core import evaluate_submission;d=json.load(sys.stdin);print(json.dumps(evaluate_submission(d['ir'],d['payload'])))",
    ],
    { input: JSON.stringify({ ir, payload: expected }), encoding: "utf8" },
  );
  expect(JSON.parse(python)).toMatchObject({ ok: true, payload: expected });
  state = { ...state, values: { ...state.values, fld_mode: "no" } };
  expect(payloadPreview(ir, state)).toEqual({ mode: "no" });
  expect(snapshot(ir, state, true).active.size).toBe(1);
  const bad = JSON.parse(
    execFileSync(
      join(root, ".venv/bin/python"),
      [
        "-c",
        "import sys,json;from fb_engine.core import evaluate_submission;d=json.load(sys.stdin);print(json.dumps(evaluate_submission(d['ir'],d['payload'])))",
      ],
      { input: JSON.stringify({ ir, payload: { ...expected, mode: "no" } }), encoding: "utf8" },
    ),
  ) as { ok: boolean; errors: { code: string }[] };
  expect(bad.ok).toBe(false);
  expect(bad.errors[0]?.code).toBe("E-INACTIVE-DATA-PRESENT");
  const second = structuredClone(d);
  pins(second).a = "blk_customer_info@r2";
  const upgrade = expandBlocks(second);
  for (const [id, b] of expanded.bindings) expect(upgrade.bindings.get(id)).toEqual(b);
});
test("unknown pins, private refs, alias collisions and unknown const inputs fail closed", () => {
  const pin = definition();
  pins(pin).a = "blk_customer_info@r99";
  expect(() => expandBlocks(pin)).toThrow("E-BLOCK-PIN");
  const alias = definition();
  instance(alias, 1).alias = "customer";
  expect(() => expandBlocks(alias)).toThrow("E-BLOCK-IDENTITY");
  const inputs = definition();
  instance(inputs, 0).inputs = { unknown: true };
  expect(() => expandBlocks(inputs)).toThrow("E-BLOCK-INPUT");
  const ref = definition();
  ref.conditions = {
    cnd_private: {
      label: { ja: "Private" },
      when: { op: "isNotEmpty", args: [{ ref: "inst_first:fld_name" }] },
    },
  };
  expect(() => expandBlocks(ref)).toThrow("E-BLOCK-PRIVATE-REF");
});
test("shared-block artifact is deterministic and pins private lock; Motion-none remains isolated", async () => {
  const out = mkdtempSync(join(tmpdir(), "fb-blocks-"));
  try {
    const a = await compile(definition(), out),
      b = await compile(definition(), out);
    expect(a.candidateId).toBe(b.candidateId);
    expect(
      a.chunks.flatMap((c) => c.modules).some((m) => /motion|store-selector/iu.test(m.id)),
    ).toBe(false);
    const privateDir = join(out, "private", a.candidateId);
    const lock = JSON.parse(readFileSync(join(privateDir, "block-lock.json"), "utf8")) as {
      pin: string;
    }[];
    expect(lock).toHaveLength(2);
    expect(lock.map((v: { pin: string }) => v.pin)).toEqual([
      "blk_customer_info@r1",
      "blk_customer_info@r2",
    ]);
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
}, 30000);
