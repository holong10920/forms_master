import { expect, test } from "vitest";
import {
  createSession,
  dispatch,
  loadDefinition,
} from "../../../packages/form-engine/src/index.ts";
import { journey } from "../../../packages/static-runtime/src/journey.ts";
import { multiProductDraft } from "../../go-auth/templates/multi-product.ts";
const definition = multiProductDraft();
const group = definition.fields[0];
if (!group || group.type !== "group") throw Error("fixture");
group.label = { ja: "商品情報" };
group.listTitle = { ja: "商品確認" };
const ir = loadDefinition(definition);
const current = (state: ReturnType<typeof createSession>, editing = {}) =>
  journey(ir, state, editing).find((s) => s.status === "current")?.id;
test("progress follows actual new/edit/confirmed/customer/back states, not only labels", () => {
  let state = createSession(ir);
  expect(journey(ir, state).map((s) => s.label?.ja)).toEqual([
    "商品情報",
    "商品確認",
    "お客様情報",
  ]);
  expect(current(state)).toBe("stp_products:entry");
  state = dispatch(ir, state, {
    type: "next",
    fromStep: state.current,
    stateVersion: state.stateVersion,
  }).state;
  expect(current(state)).toBe("stp_products:entry"); // Empty cart is still blocked by engine validation.
  state = dispatch(ir, state, {
    type: "commit",
    field: "grp_products",
    value: {
      order: ["itm_a"],
      items: {
        itm_a: {
          fld_product_family: "gakki_site",
          fld_category: "keyboard",
          fld_title: "合成 Model A",
          fld_condition: "used",
        },
      },
    },
  }).state;
  expect(current(state)).toBe("stp_products:list");
  expect(current(state, { grp_products: true })).toBe("stp_products:entry"); // Real editor is open.
  expect(current(state, { grp_products: false })).toBe("stp_products:list"); // Cancel returns to confirmed list.
  state = dispatch(ir, state, {
    type: "next",
    fromStep: state.current,
    stateVersion: state.stateVersion,
  }).state;
  expect(state.current).toBe("stp_customer");
  expect(current(state)).toBe("stp_customer");
  expect(journey(ir, state).map((s) => s.status)).toEqual(["completed", "completed", "current"]);
  state = dispatch(ir, state, {
    type: "back",
    fromStep: state.current,
    stateVersion: state.stateVersion,
  }).state;
  expect(current(state)).toBe("stp_products:list");
  state = dispatch(ir, state, {
    type: "commit",
    field: "grp_products",
    value: { order: [], items: {} },
  }).state;
  expect(current(state)).toBe("stp_products:entry");
});
test("completion marks all stages done; existing non-group workflows retain their own step order", () => {
  const state = createSession(ir);
  expect(
    journey(ir, { ...state, current: "stp_complete", status: "complete" }).every(
      (s) => s.status === "completed",
    ),
  ).toBe(true);
  const plain = {
    ...definition,
    fields: definition.fields.slice(1),
    steps: definition.steps.slice(1),
  };
  const plainIR = loadDefinition(plain);
  expect(journey(plainIR, createSession(plainIR)).map((s) => s.id)).toEqual([
    "stp_customer",
    "stp_review",
  ]);
});

test("summary presentation cannot reference a missing item field", () => {
  const bad = multiProductDraft();
  const g = bad.fields[0];
  if (!g || g.type !== "group") throw Error("fixture");
  g.summaryFields = ["fld_missing"];
  expect(() => loadDefinition(bad)).toThrow("E-REF-SCOPE");
});
