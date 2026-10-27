import { test, expect } from "vitest";
import { pcApplyDraft } from "../src/reference.ts";
import {
  loadDefinition,
  createSession,
  dispatch,
  snapshot,
  validation,
  payloadPreview,
} from "../../../packages/form-engine/src/index.ts";
import { appearanceVariables } from "../../../packages/static-runtime/src/appearance.ts";
import { validateSchema } from "../../../packages/contracts/src/index.ts";
test("typed styles reject CSS text, URLs, positioning and out-of-range overrides", () => {
  const d = pcApplyDraft();
  expect(validateSchema("form-definition/v1", d).valid).toBe(true);
  for (const appearance of [
    { background: "url(https://unsafe.invalid)" },
    { css: "display:none" },
    { padding: -1 },
    { mobile: { columns: 50 } },
    { position: "fixed" },
  ])
    expect(validateSchema("form-definition/v1", { ...d, appearance }).valid).toBe(false);
  expect(appearanceVariables({ padding: 12, mobile: { padding: 8 } })).toEqual({
    "--fb-padding": "12px",
    "--fb-mobile-padding": "8px",
  });
  expect(appearanceVariables({ padding: 12 }, "field-")).toEqual({ "--fb-field-padding": "12px" });
});
test("PC branch clears notebook-only value and customer format errors stay authoritative", () => {
  const ir = loadDefinition(pcApplyDraft());
  let s = createSession(ir);
  const commit = (field: string, value: unknown) => {
    s = dispatch(ir, s, { type: "commit", field, value }).state;
  };
  commit("fld_category", "note");
  commit("fld_battery", "degraded");
  commit("fld_category", "desktop");
  expect(s.values.fld_battery).toBeUndefined();
  expect(snapshot(ir, s).active.has("fld_battery")).toBe(false);
  s = { ...s, current: "stp_pickup" };
  commit("fld_pickup_method", "delivery");
  s = { ...s, current: "stp_customer" };
  commit("fld_email", "bad");
  expect(validation(ir, s, true)).toContainEqual({ code: "formatEmail", path: "fld_email" });
  s = { ...s, current: "stp_pickup" };
  commit("fld_delivery_date", "2028-02-29");
  commit("fld_pickup_method", "dither");
  expect(s.values.fld_delivery_date).toBeUndefined();
  expect(payloadPreview(ir, s)).not.toHaveProperty("delivery_date");
});
test("URL bindings cannot initialize personal inputs or hidden authority", () => {
  const d = pcApplyDraft();
  const f = d.fields.find((f) => f.id === "fld_email");
  if (!f || f.type === "group") throw Error("fixture");
  f.config = { queryParameter: "email" };
  expect(() => loadDefinition(d)).toThrow("E-REF-SCOPE");
});
