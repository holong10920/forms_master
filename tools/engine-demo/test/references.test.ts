import { expect, test } from "vitest";
import { createSession, dispatch, payloadPreview, validation, type State } from "@fb/form-engine";
import { referenceDemo } from "../src/reference.ts";
import { fixtureIR } from "../src/parity.ts";
for (const category of ["golf", "racket"] as const)
  for (const condition of ["used", "junk"] as const) {
    test(`Sports ${category}/${condition} -> 出張 completion, backend projection`, () => {
      const result = referenceDemo("sports", { category, condition });
      expect(result.status).toBe("complete");
      expect(result.terminal).toBe("stp_done_shuccho");
      expect(result.backend).toEqual({ ok: true, errors: [], payload: result.preview });
      expect(Object.hasOwn(result.preview, "damageDescription")).toBe(condition === "junk");
      expect(Object.hasOwn(result.preview, "clubType")).toBe(category === "golf");
      expect(Object.hasOwn(result.preview, "racketType")).toBe(category === "racket");
    });
  }
for (const device of ["desktop", "laptop", "tablet", "peripheral"] as const)
  for (const method of ["store", "takuhai"] as const) {
    test(`PC ${device}/${method} -> branch-specific completion, backend projection`, () => {
      const result = referenceDemo("pc-reference", { device, method });
      expect(result.terminal).toBe(`stp_done_${method}`);
      expect(result.status).toBe("complete");
      expect(result.backend).toEqual({ ok: true, errors: [], payload: result.preview });
      expect(Object.hasOwn(result.preview, "store")).toBe(method === "store");
      expect(Object.hasOwn(result.preview, "packingKit")).toBe(method === "takuhai");
      expect(Object.hasOwn(result.preview, "batteryHealth")).toBe(
        device === "laptop" || device === "tablet",
      );
      expect(result.trace.includes("stp_condition")).toBe(device !== "peripheral");
      expect(Object.hasOwn(result.preview, "defectCount")).toBe(false);
    });
  }
test("Sports Junk dynamically requires damage; inactive description stays in memory only", () => {
  const ir = fixtureIR("sports");
  let state = createSession(ir);
  const commit = (field: string, value: unknown) => {
    state = dispatch(ir, state, { type: "commit", field, value }).state;
  };
  const next = () => {
    state = dispatch(ir, state, {
      type: "next",
      fromStep: state.current,
      stateVersion: state.stateVersion,
    }).state;
  };
  commit("fld_category", "golf");
  next();
  commit("fld_club", "iron");
  next();
  commit("fld_condition", "junk");
  next();
  expect(state.current).toBe("stp_condition");
  expect(state.errors).toContainEqual({ code: "required", path: "fld_damage" });
  commit("fld_damage", "Synthetic broken part");
  commit("fld_condition", "used");
  expect(validation(ir, state)).toEqual([]);
  expect(state.values.fld_damage).toBe("Synthetic broken part");
  expect(payloadPreview(ir, state)).not.toHaveProperty("damageDescription");
  next();
  expect(state.current).toBe("stp_method");
});
test("PC reference Back switches delivery/store/delivery without reusing invalid forward history", () => {
  const ir = fixtureIR("pc-reference");
  let state = createSession(ir, {
    fld_device: "laptop",
    fld_battery: "good",
    fld_defects: ["screen"],
  });
  const commit = (field: string, value: unknown) => {
    state = dispatch(ir, state, { type: "commit", field, value }).state;
  };
  const move = (type: "next" | "back") => {
    state = dispatch(ir, state, {
      type,
      fromStep: state.current,
      stateVersion: state.stateVersion,
    }).state;
  };
  move("next");
  move("next");
  commit("fld_method", "takuhai");
  move("next");
  commit("fld_kit", "yes");
  move("next");
  move("back");
  move("back");
  commit("fld_method", "store");
  expect(state.visited).not.toContain("stp_takuhai");
  move("next");
  commit("fld_store", "fictional-east");
  expect(payloadPreview(ir, state)).not.toHaveProperty("packingKit");
  move("back");
  commit("fld_method", "takuhai");
  move("next");
  expect(state.values.fld_kit).toBe("yes");
  expect(payloadPreview(ir, state)).not.toHaveProperty("store");
});
test("PC exclusive defects and customer consent reject invalid combinations", () => {
  const ir = fixtureIR("pc-reference");
  const state: State = {
    ...createSession(ir, {
      fld_device: "laptop",
      fld_battery: "good",
      fld_defects: ["none", "screen"],
      fld_method: "store",
      fld_store: "fictional-east",
      fld_customer: "Synthetic Customer",
      fld_consent: false,
    }),
    current: "stp_review",
  };
  expect(validation(ir, state, true)).toContainEqual({
    code: "exclusiveOption",
    path: "fld_defects",
  });
  expect(validation(ir, state, true)).toContainEqual({ code: "mustBeTrue", path: "fld_consent" });
});
