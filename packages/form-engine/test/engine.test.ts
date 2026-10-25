import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "vitest";
import type { FormDefinitionV1 } from "@fb/contracts";
import {
  createSession,
  dispatch,
  loadDefinition,
  loadIR,
  payloadPreview,
  snapshot,
  validation,
  type State,
} from "../src/index.ts";
function definition(): FormDefinitionV1 {
  return JSON.parse(
    readFileSync(
      resolve(import.meta.dirname, "../../../contracts/fixtures/engine/pc.json"),
      "utf8",
    ),
  ) as FormDefinitionV1;
}
function setup() {
  const ir = loadDefinition(definition());
  let state = createSession(ir, {}, { idempotencyKey: "synthetic-test-session" });
  return {
    ir,
    get state() {
      return state;
    },
    commit(id: string, value: unknown) {
      state = dispatch(ir, state, { type: "commit", field: id, value }).state;
    },
    move(type: "next" | "back") {
      state = dispatch(ir, state, {
        type,
        fromStep: state.current,
        stateVersion: state.stateVersion,
      }).state;
    },
  };
}
test("required, next/back, branch round trip, preserve and clear, active-only payload", () => {
  const e = setup();
  e.move("next");
  expect(e.state.current).toBe("stp_method");
  expect(e.state.errors).toContainEqual({ code: "required", path: "fld_method" });
  e.commit("fld_method", "takuhai");
  e.move("next");
  e.commit("fld_kit", "yes");
  e.commit("fld_token", "synthetic");
  e.move("next");
  expect(e.state.current).toBe("stp_review");
  expect(validation(e.ir, e.state, true)).toEqual([]);
  e.move("back");
  e.move("back");
  e.commit("fld_method", "store");
  e.move("next");
  expect(e.state.current).toBe("stp_store");
  expect(e.state.values.fld_kit).toBe("yes");
  expect(e.state.values.fld_token).toBeUndefined();
  e.commit("fld_store", "fictional-store");
  e.move("next");
  expect(payloadPreview(e.ir, e.state)).toEqual({
    purchaseMethod: "store",
    store: "fictional-store",
  });
  e.move("back");
  e.move("back");
  e.commit("fld_method", "takuhai");
  e.move("next");
  expect(e.state.current).toBe("stp_takuhai");
  expect(e.state.values.fld_kit).toBe("yes");
  expect(e.state.values.fld_token).toBeUndefined();
  expect(payloadPreview(e.ir, e.state)).toEqual({ purchaseMethod: "takuhai", packingKit: "yes" });
});
test("stale navigation cannot skip a step and previous snapshots are immutable", () => {
  const e = setup();
  e.commit("fld_method", "store");
  const previous = structuredClone(e.state);
  const event = {
    type: "next" as const,
    fromStep: e.state.current,
    stateVersion: e.state.stateVersion,
  };
  const first = dispatch(e.ir, e.state, event);
  expect(dispatch(e.ir, first.state, event).state).toBe(first.state);
  expect(e.state).toEqual(previous);
  expect(() => dispatch(e.ir, e.state, { type: "commit", field: "fld_store", value: "x" })).toThrow(
    "E-INACTIVE-EDIT",
  );
});
test("off-path and complete navigation rejected, incomplete jump redirected", () => {
  const e = setup();
  const jump = (to: string) =>
    dispatch(e.ir, e.state, {
      type: "jumpTo",
      to,
      fromStep: e.state.current,
      stateVersion: e.state.stateVersion,
    }).state;
  expect(jump("stp_store").current).toBe("stp_method");
  expect(jump("stp_done").current).toBe("stp_method");
  expect(jump("stp_review").current).toBe("stp_method");
});
test.each([
  [
    "cycle",
    (d: FormDefinitionV1) => {
      const s = d.steps.at(1);
      if (s) s.transitions = [{ default: "stp_method" }];
    },
    "E-GRAPH-CYCLE",
  ],
  [
    "default",
    (d: FormDefinitionV1) => {
      const s = d.steps.at(0);
      if (s) s.transitions = [];
    },
    "E-GRAPH-NO-DEFAULT",
  ],
  [
    "reference",
    (d: FormDefinitionV1) => {
      const s = d.steps.at(0);
      if (s) s.content = [{ field: "$local:fld_missing" }];
    },
    "E-REF-DANGLING",
  ],
  [
    "type",
    (d: FormDefinitionV1) => {
      const s = d.steps.at(0);
      if (s)
        s.transitions = [
          {
            when: { op: "eq", args: [{ ref: "$local:fld_method" }, { const: 1 }] },
            to: "stp_store",
          },
          { default: "stp_takuhai" },
        ];
    },
    "E-TYPE-OPERATOR",
  ],
  [
    "forward",
    (d: FormDefinitionV1) => {
      const s = d.steps.at(0);
      if (s)
        s.transitions = [
          { when: { op: "isEmpty", args: [{ ref: "$local:fld_store" }] }, to: "stp_store" },
          { default: "stp_takuhai" },
        ];
    },
    "E-FORWARD-REF",
  ],
  [
    "secret",
    (d: FormDefinitionV1) => {
      const f = d.fields.find((f) => f.id === "fld_token");
      if (f) f.clearOnDeactivate = false;
    },
    "E-SECRET-CLEAR",
  ],
  [
    "prototype",
    (d: FormDefinitionV1) => {
      const s = d.steps.at(0);
      if (s)
        s.transitions = [
          { when: { cond: "toString" }, to: "stp_store" },
          { default: "stp_takuhai" },
        ];
    },
    "E-REF-DANGLING",
  ],
] as const)("invalid definition %s fails closed", (_name, edit, code) => {
  const d = definition();
  edit(d);
  expect(() => loadDefinition(d)).toThrow(code);
});
test("unknown constructs and preview-only IR are rejected instead of ignored", () => {
  expect(() => loadDefinition({ ...definition(), pluginUrl: "https://shop.invalid" })).toThrow(
    "E-DEFINITION-SCHEMA",
  );
  const ir = loadDefinition(definition());
  expect(() => loadIR({ ...ir, previewOnly: true })).toThrow("E-IR-SCHEMA");
});
test("null and wrong input type reject without modifying state", () => {
  const e = setup();
  const old = e.state;
  expect(() => {
    e.commit("fld_method", null);
  }).toThrow("E-PAYLOAD-NULL");
  expect(() => {
    e.commit("fld_method", true);
  }).toThrow("E-TYPE");
  expect(e.state).toBe(old);
});
test("completion requires matching current submit result, duplicates/stale results ignored", () => {
  const e = setup();
  e.commit("fld_method", "store");
  e.move("next");
  e.commit("fld_store", "fictional");
  e.move("next");
  const result = dispatch(e.ir, e.state, {
    type: "next",
    fromStep: e.state.current,
    stateVersion: e.state.stateVersion,
  });
  const request = result.state.request;
  expect(request).toBeDefined();
  if (!request) throw new Error("missing submit");
  expect(result.state.status).toBe("pending");
  expect(JSON.stringify(result.effects)).not.toContain("fictional");
  expect(
    dispatch(e.ir, result.state, {
      type: "submitResult",
      id: "stale",
      fingerprint: request.fingerprint,
      ok: true,
    }).state,
  ).toBe(result.state);
  const complete = dispatch(e.ir, result.state, {
    type: "submitResult",
    id: request.id,
    fingerprint: request.fingerprint,
    ok: true,
  }).state;
  expect(complete.status).toBe("complete");
  expect(complete.current).toBe("stp_done");
  expect(
    dispatch(e.ir, complete, {
      type: "submitResult",
      id: request.id,
      fingerprint: request.fingerprint,
      ok: true,
    }).state,
  ).toBe(complete);
});
test("each seeded branch trace maintains active path and inactive projection invariants", () => {
  for (let seed = 0; seed < 40; seed++) {
    const e = setup();
    e.commit("fld_method", seed % 2 ? "store" : "takuhai");
    e.move("next");
    e.commit(seed % 2 ? "fld_store" : "fld_kit", seed % 2 ? `synthetic_${String(seed)}` : "yes");
    e.move("next");
    const view = snapshot(e.ir, e.state);
    expect(view.path).toContain(e.state.current);
    const payload = payloadPreview(e.ir, e.state);
    expect(Object.hasOwn(payload, seed % 2 ? "packingKit" : "store")).toBe(false);
  }
});
export type FixtureState = State;
test("first matching transition wins and skipWhen removes step content from activity", () => {
  const d = definition();
  d.steps[0].transitions = [
    { when: { const: true }, to: "stp_store" },
    { when: { const: true }, to: "stp_takuhai" },
    { default: "stp_takuhai" },
  ];
  let ir = loadDefinition(d);
  expect(snapshot(ir, createSession(ir, { fld_method: "store" })).path[1]).toBe("stp_store");
  const store = d.steps.find((s) => s.id === "stp_store");
  if (!store) throw new Error("fixture");
  store.skipWhen = { const: true };
  ir = loadDefinition(d);
  const state = {
    ...createSession(ir, { fld_method: "store", fld_store: "synthetic" }),
    current: "stp_review",
  };
  expect(snapshot(ir, state).path).not.toContain("stp_store");
  expect(payloadPreview(ir, state)).toEqual({ purchaseMethod: "store" });
  expect(validation(ir, state, true)).toEqual([]);
});
