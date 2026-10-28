import { expect, test } from "vitest";
import { gakkiApplyDraft } from "../../go-auth/templates/gakki-apply.ts";
import {
  createSession,
  dispatch,
  loadDefinition,
  payloadPreview,
  snapshot,
  validation,
} from "../../../packages/form-engine/src/index.ts";

test("instrument branches validate and clear category/floor-dependent answers", () => {
  const ir = loadDefinition(gakkiApplyDraft());
  let s = createSession(ir);
  const commit = (field: string, value: string) => {
    s = dispatch(ir, s, { type: "commit", field, value }).state;
  };
  expect([...snapshot(ir, s).active]).toEqual(["fld_product_family"]);
  s = dispatch(ir, s, { type: "next", fromStep: s.current, stateVersion: s.stateVersion }).state;
  expect(s.current).toBe("stp_product");
  commit("fld_product_family", "gakki_site");
  for (const category of [
    "guitar-bass",
    "piano",
    "keyboard",
    "inst",
    "dtm-dj",
    "gakki-accessories",
    "gakki-o",
  ]) {
    commit("fld_category", category);
    expect(s.values.fld_title).toBeUndefined();
    expect(s.values.fld_condition).toBeUndefined();
    commit("fld_title", "合成楽器 Model A");
    commit("fld_condition", "used");
    if (category === "piano") {
      expect(validation(ir, s)).toContainEqual({ code: "required", path: "fld_location" });
      commit("fld_location", "2～3階");
      expect(validation(ir, s)).toContainEqual({ code: "required", path: "fld_location2" });
      commit("fld_location2", "階段作業が必要");
      commit("fld_location", "1階");
      expect(s.values.fld_location2).toBeUndefined();
      expect(payloadPreview(ir, s)).not.toHaveProperty("location2");
    } else expect(snapshot(ir, s).active.has("fld_location")).toBe(false);
    expect(validation(ir, s)).toEqual([]);
    const next = dispatch(ir, s, {
      type: "next",
      fromStep: s.current,
      stateVersion: s.stateVersion,
    }).state;
    expect(next.current).toBe("stp_product_confirm");
    s = dispatch(ir, next, {
      type: "back",
      fromStep: next.current,
      stateVersion: next.stateVersion,
    }).state;
    expect(s.values.fld_title).toBe("合成楽器 Model A");
    commit("fld_category", category); // Same selection must preserve the answer.
    expect(s.values.fld_title).toBe("合成楽器 Model A");
  }
  commit("fld_title", "x".repeat(251));
  expect(validation(ir, s)).toContainEqual({ code: "maxLength", path: "fld_title" });
  commit("fld_title", "  ");
  expect(validation(ir, s)).toContainEqual({ code: "required", path: "fld_title" });
});

test("reset dependencies reject cycles, dangling, forward and item scope references", () => {
  for (const source of ["fld_title", "fld_missing", "fld_email"]) {
    const d = gakkiApplyDraft();
    const title = d.fields.find((f) => f.id === "fld_title");
    if (!title || title.type === "group") throw Error("fixture");
    title.resetOnChange = [source];
    expect(() => loadDefinition(d)).toThrow();
  }
});

test("changing the parent clears the instrument branch and confirmation stays display-only", () => {
  const ir = loadDefinition(gakkiApplyDraft());
  let s = createSession(ir);
  const commit = (field: string, value: string) => {
    s = dispatch(ir, s, { type: "commit", field, value }).state;
  };
  commit("fld_product_family", "gakki_site");
  commit("fld_category", "piano");
  commit("fld_title", "合成楽器");
  commit("fld_condition", "used");
  commit("fld_location", "1階");
  s = dispatch(ir, s, { type: "next", fromStep: s.current, stateVersion: s.stateVersion }).state;
  expect(s.current).toBe("stp_product_confirm");
  expect(snapshot(ir, s).effective.fld_confirm_title).toBe("合成楽器");
  expect(payloadPreview(ir, s)).not.toHaveProperty("confirm_title");
  s = dispatch(ir, s, { type: "back", fromStep: s.current, stateVersion: s.stateVersion }).state;
  commit("fld_product_family", "other");
  expect(s.values.fld_category).toBeUndefined();
  expect(s.values.fld_title).toBeUndefined();
  expect(s.values.fld_location).toBeUndefined();
});
