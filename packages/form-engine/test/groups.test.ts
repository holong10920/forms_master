import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "vitest";
import {
  addItem,
  createSession,
  dispatch,
  loadDefinition,
  moveItems,
  payloadPreview,
  removeItem,
  validation,
  type GroupValue,
} from "../src/index.ts";
const fixture = (): unknown =>
  JSON.parse(
    readFileSync(
      resolve(import.meta.dirname, "../../../contracts/fixtures/engine/groups.json"),
      "utf8",
    ),
  );
test("group stable IDs, reorder error identity and retired IDs", () => {
  const ir = loadDefinition(fixture());
  let state = createSession(ir);
  state = dispatch(ir, state, { type: "commit", field: "fld_show", value: true }).state;
  let value: GroupValue = { order: [], items: {} };
  value = addItem(value, "itm_a", { fld_qty: 2, fld_enabled: true });
  value = addItem(value, "itm_b", { fld_enabled: false });
  state = dispatch(ir, state, { type: "commit", field: "grp_products", value }).state;
  expect(validation(ir, state)).toContainEqual({
    code: "required",
    path: "grp_products[itm_b]/fld_qty",
  });
  state = dispatch(ir, state, {
    type: "commit",
    field: "grp_products",
    value: moveItems(value, ["itm_b", "itm_a"]),
  }).state;
  expect(validation(ir, state)).toContainEqual({
    code: "required",
    path: "grp_products[itm_b]/fld_qty",
  });
  state = dispatch(ir, state, {
    type: "commit",
    field: "grp_products",
    value: removeItem(value, "itm_b"),
  }).state;
  expect(() => dispatch(ir, state, { type: "commit", field: "grp_products", value })).toThrow(
    "E-ITEM-ID-REUSE",
  );
});
test("group child clear/preserve and inactive aggregation", () => {
  const ir = loadDefinition(fixture());
  let state = createSession(ir, {
    fld_show: true,
    grp_products: {
      order: ["itm_a"],
      items: { itm_a: { fld_qty: 7, fld_enabled: true, fld_note: "clear", fld_memo: "preserve" } },
    },
  });
  state = dispatch(ir, state, {
    type: "commit",
    field: "grp_products",
    value: {
      order: ["itm_a"],
      items: { itm_a: { fld_qty: 7, fld_enabled: false, fld_note: "clear", fld_memo: "preserve" } },
    },
  }).state;
  const group = state.values.grp_products as GroupValue;
  expect(group.items.itm_a?.fld_note).toBeUndefined();
  expect(group.items.itm_a?.fld_memo).toBe("preserve");
  state = dispatch(ir, state, { type: "commit", field: "fld_show", value: false }).state;
  expect(payloadPreview(ir, state)).toEqual({ show: false, sum: 0, rows: 0, yes: 0 });
});
test("group nested dependency cycle fails before evaluation", () => {
  const d = fixture() as {
    fields: { type: string; fields?: { id: string; visibleWhen?: unknown }[] }[];
  };
  const g = d.fields.find((n) => n.type === "group");
  if (!g?.fields) throw new Error("fixture");
  const a = g.fields[0],
    b = g.fields[1];
  if (!a || !b) throw new Error("fixture");
  a.visibleWhen = { op: "isEmpty", args: [{ item: b.id }] };
  b.visibleWhen = { op: "isEmpty", args: [{ item: a.id }] };
  expect(() => loadDefinition(d)).toThrow("E-DEPENDENCY-CYCLE");
});

test("clearing an inactive group retires item identities", () => {
  const d = fixture() as { fields: { type: string; clearOnDeactivate?: boolean }[] };
  const group = d.fields.find((n) => n.type === "group");
  if (!group) throw new Error("fixture");
  group.clearOnDeactivate = true;
  const ir = loadDefinition(d);
  const value: GroupValue = {
    order: ["itm_a"],
    items: { itm_a: { fld_qty: 1, fld_enabled: true } },
  };
  let state = createSession(ir, { fld_show: true, grp_products: value });
  state = dispatch(ir, state, { type: "commit", field: "fld_show", value: false }).state;
  expect(state.values.grp_products).toBeUndefined();
  state = dispatch(ir, state, { type: "commit", field: "fld_show", value: true }).state;
  expect(() => dispatch(ir, state, { type: "commit", field: "grp_products", value })).toThrow(
    "E-ITEM-ID-REUSE",
  );
});
