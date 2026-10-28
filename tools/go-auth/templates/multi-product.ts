import type {
  FormDefinitionV1,
  EngineExpression,
  EngineField,
} from "../../../packages/contracts/src/index.ts";
import { gakkiApplyDraft } from "./gakki-apply.ts";
import { productFamilies, productCategories, productSubcategories } from "./product-catalog.ts";
const eq = (id: string, value: string): EngineExpression => ({
  op: "eq",
  args: [{ item: id }, { const: value }],
});
const any = (id: string, values: string[]): EngineExpression => ({
  op: "in",
  args: [{ item: id }, { const: values }],
});
function scoped(e: EngineExpression): EngineExpression {
  if ("ref" in e) return { item: e.ref.replace("$local:", "") };
  if ("args" in e) return { ...e, args: e.args.map(scoped) };
  return e;
}
/** New template: previous single-item draft/releases remain untouched. */
export function multiProductDraft(): FormDefinitionV1 {
  const old = gakkiApplyDraft();
  const source = old.fields.filter(
    (f) =>
      f.type !== "group" &&
      !f.id.startsWith("fld_confirm_") &&
      old.steps[0].content?.some((c) => "field" in c && c.field === "$local:" + f.id),
  ) as EngineField[];
  const fields = source.map((f): EngineField => ({
    ...f,
    ...(f.visibleWhen ? { visibleWhen: scoped(f.visibleWhen) } : {}),
    ...(f.requiredWhen ? { requiredWhen: scoped(f.requiredWhen) } : {}),
  }));
  const parent = fields.find((f) => f.key === "product_family");
  if (!parent) throw Error("template parent");
  parent.options = productFamilies.map(([value, ja]) => ({ value, label: { ja } }));
  parent.config = { presentation: "native", defaultValue: "gakki_site" };
  const child = fields.find((f) => f.key === "category");
  if (!child) throw Error("template child");
  child.label = { ja: "商品カテゴリ詳細" };
  child.visibleWhen = any(parent.id, Object.keys(productCategories));
  child.options = Object.entries(productCategories).flatMap(([family, options]) =>
    options.map(([value, ja]) => ({
      value,
      label: { ja },
      ...(value === "laundry-f" ? { initial: true } : {}),
      availableWhen: eq(parent.id, family),
    })),
  );
  const grandchild: EngineField = {
    id: "fld_subcategory",
    key: "subcategory",
    type: "choice.select",
    label: { ja: "種類" },
    classification: "public",
    persist: "allowed",
    required: true,
    visibleWhen: any(child.id, Object.keys(productSubcategories)),
    clearOnDeactivate: true,
    resetOnChange: [parent.id, child.id],
    config: { presentation: "native" },
    options: Object.entries(productSubcategories).flatMap(([category, options]) =>
      options.map(([value, ja]) => ({
        value,
        label: { ja },
        ...(["bike", "rod"].includes(value) ? { initial: true } : {}),
        availableWhen: eq(child.id, category),
      })),
    ),
  };
  fields.splice(2, 0, grandchild);
  const ready: EngineExpression = {
    op: "or",
    args: [
      { op: "not", args: [any(parent.id, Object.keys(productCategories))] },
      { op: "isNotEmpty", args: [{ item: child.id }] },
    ],
  };
  for (const f of fields.filter((f) => ["title", "condition", "item_comment"].includes(f.key)))
    f.visibleWhen = ready;
  const contact = old.fields.filter((f) =>
    ["kana", "email", "phone_number", "agree_policy", "subscribe_mm"].includes(f.key),
  );
  const customer = old.steps[2],
    review = old.steps[3],
    complete = old.steps[4];
  if (!customer || !review || !complete) throw Error("template steps");
  return {
    ...old,
    formId: "frm_multi_product_demo",
    texts: { formTitle: { ja: "" }, formDescription: { ja: "" } },
    appearance: {
      maxWidth: 600,
      padding: 24,
      gap: 24,
      radius: 0,
      background: "#ffffff",
      color: "#333333",
      fontFamily: "hiragino",
      primaryColor: "#008b46",
      secondaryColor: "#666666",
      requiredColor: "#e53935",
      inputBorderColor: "#cccccc",
      focusColor: "#008b46",
      headerLogo: "instrument-local",
      headerText: "楽器高く売れるドットコム",
      progressStyle: "circles",
      mobile: { padding: 16 },
    },
    customerDraft: { ttlMinutes: 30 },
    fields: [
      {
        id: "grp_products",
        key: "products",
        type: "group",
        label: { ja: "商品情報" },
        classification: "personal",
        persist: "allowed",
        minItems: 1,
        maxItems: 20,
        fields: fields as [EngineField, ...EngineField[]],
      },
      ...contact,
    ],
    steps: [
      {
        id: "stp_products",
        kind: "form",
        title: { ja: "商品情報を入力" },
        content: [{ group: "$local:grp_products" }],
        transitions: [{ default: "stp_customer" }],
      },
      { ...customer, transitions: [{ default: "stp_review" }] },
      review,
      complete,
    ],
  };
}
