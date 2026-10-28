import { expect, test } from "vitest";
import { multiProductDraft } from "../../go-auth/templates/multi-product.ts";
import {
  createSession,
  dispatch,
  loadDefinition,
  payloadPreview,
  validation,
  draftValues,
  restoreDraft,
  type GroupValue,
  type Cell,
} from "../../../packages/form-engine/src/index.ts";
import { stageChange } from "../../../packages/form-engine/src/groups.ts";
import {
  productFamilies,
  productCategories,
  productSubcategories,
} from "../../go-auth/templates/product-catalog.ts";
const ir = loadDefinition(multiProductDraft());
const group = ir.nodes[0];
if (!group || group.type !== "group") throw Error("fixture");
const row = (title: string): Record<string, Cell> => ({
  fld_product_family: "gakki_site",
  fld_category: "guitar-bass",
  fld_title: title,
  fld_condition: "used",
  fld_item_comment: "合成ケース付き",
});
test("complete local catalog: 12 parents, correct branch membership and deep leaves", () => {
  expect(productFamilies).toHaveLength(12);
  expect(group.fields[0].config?.defaultValue).toBe("gakki_site");
  for (const [family] of productFamilies) {
    const categories = productCategories[family] ?? [[family, family]];
    for (const [category] of categories) {
      const cells = {
        ...row("合成 Model A"),
        fld_product_family: family,
        ...(productCategories[family] ? { fld_category: category } : {}),
      };
      if (!productCategories[family]) Reflect.deleteProperty(cells, "fld_category");
      if (productSubcategories[category])
        Object.assign(cells, { fld_subcategory: productSubcategories[category][0]?.[0] ?? "" });
      if (category === "piano") Object.assign(cells, { fld_location: "1階" });
      const s = createSession(ir, { grp_products: { order: ["itm_a"], items: { itm_a: cells } } });
      expect(validation(ir, s), family + "/" + category).toEqual([]);
    }
  }
});
test("staged new/edit reset is independent, cancel preserves committed rows and stable order", () => {
  const a = row("合成 Model A"),
    b = row("合成 Model B");
  const committed: GroupValue = { order: ["itm_a", "itm_b"], items: { itm_a: a, itm_b: b } };
  let state = createSession(ir, { grp_products: committed });
  const stage = stageChange(group, structuredClone(a), "fld_product_family", "pc_site");
  expect(stage.fld_category).toBeUndefined();
  expect(stage.fld_title).toBeUndefined();
  expect(state.values.grp_products).toEqual(committed);
  const edit = { ...a, fld_title: "合成 Edited" };
  state = dispatch(ir, state, {
    type: "commit",
    field: group.id,
    value: { ...committed, items: { itm_a: edit, itm_b: b } },
  }).state;
  expect(payloadPreview(ir, state).products).toEqual([
    {
      itemId: "itm_a",
      product_family: "gakki_site",
      category: "guitar-bass",
      title: "合成 Edited",
      condition: "used",
      item_comment: "合成ケース付き",
    },
    {
      itemId: "itm_b",
      product_family: "gakki_site",
      category: "guitar-bass",
      title: "合成 Model B",
      condition: "used",
      item_comment: "合成ケース付き",
    },
  ]);
  state = dispatch(ir, state, {
    type: "commit",
    field: group.id,
    value: { order: ["itm_b"], items: { itm_b: b } },
  }).state;
  expect((state.values.grp_products as GroupValue).order).toEqual(["itm_b"]);
  expect(() => dispatch(ir, state, { type: "commit", field: group.id, value: committed })).toThrow(
    "E-ITEM-ID-REUSE",
  );
});
test("item validation rejects missing/foreign category and keeps other products", () => {
  const s = createSession(ir, {
    grp_products: {
      order: ["itm_a", "itm_b"],
      items: { itm_a: row("合成"), itm_b: { ...row(""), fld_category: "desktop" } },
    },
  });
  expect(validation(ir, s)).toContainEqual({
    code: "E-OPTION-UNAVAILABLE",
    path: "grp_products[itm_b]/fld_category",
  });
  expect(validation(ir, s).some((e) => e.path.includes("itm_a"))).toBe(false);
});
test("DEMO_RESTORE only public item cells; personal values are removed even from injected storage", () => {
  const state = createSession(ir, {
    grp_products: { order: ["itm_a"], items: { itm_a: row("合成秘密 Model A") } },
  });
  const values = draftValues(ir, state);
  expect(JSON.stringify(values)).not.toContain("合成秘密");
  expect(JSON.stringify(values)).not.toContain("合成ケース");
  expect((values.grp_products as GroupValue).items.itm_a?.fld_category).toBe("guitar-bass");
  const restored = restoreDraft(
    ir,
    {
      releaseId: "demo",
      revision: "demo",
      expiresAt: 100,
      current: state.current,
      values: state.values,
    },
    { releaseId: "demo", revision: "demo", now: 1 },
  );
  expect(JSON.stringify(restored.values)).not.toContain("合成秘密");
  expect(validation(ir, restored)).toContainEqual({
    code: "required",
    path: "grp_products[itm_a]/fld_title",
  });
});

test("piano floor deactivation clears carry-out without touching other confirmed items", () => {
  const original = {
    ...row("合成"),
    fld_category: "piano",
    fld_location: "2～3階",
    fld_location2: "階段作業が必要",
  };
  const staged = stageChange(group, original, "fld_location", "1階");
  expect(staged.fld_location2).toBeUndefined();
  expect(stageChange(group, staged, "fld_location", "2～3階").fld_location2).toBeUndefined();
  expect(original.fld_location2).toBe("階段作業が必要");
});

test("branch defaults follow local catalog and explicit empty selection is preserved", () => {
  const laundry = stageChange(group, row("合成"), "fld_product_family", "laundry");
  expect(laundry.fld_category).toBe("laundry-f");
  expect(stageChange(group, laundry, "fld_category", "").fld_category).toBe("");
  const fishing = stageChange(
    group,
    { fld_product_family: "sports_outdoor" },
    "fld_category",
    "fishing",
  );
  expect(fishing.fld_subcategory).toBe("rod");
  expect(stageChange(group, fishing, "fld_category", "bicycle_site").fld_subcategory).toBe("bike");
});
