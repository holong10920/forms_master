import type { FormDefinitionV1 } from "../../../packages/contracts/src/index.ts";
import { pcApplyDraft } from "./pc-apply.ts";

/** Synthetic, editable single-product instrument flow. No legacy code or API is executed. */
export function gakkiApplyDraft(): FormDefinitionV1 {
  const eq = (id: string, value: string) => ({
    op: "eq" as const,
    args: [{ ref: "$local:" + id }, { const: value }],
  });
  const instrument = eq("fld_product_family", "gakki_site");
  const chosen = {
    op: "or" as const,
    args: [
      eq("fld_product_family", "other"),
      { op: "isNotEmpty" as const, args: [{ ref: "$local:fld_category" }] },
    ],
  };
  const piano = eq("fld_category", "piano");
  const choice = (key: string, label: string, entries: [string, string][]) => ({
    id: "fld_" + key,
    key,
    type: "choice.select" as const,
    label: { ja: label },
    classification: "public" as const,
    persist: "allowed" as const,
    required: true,
    options: entries.map(([value, ja]) => ({ value, label: { ja } })),
    config: { presentation: "native" as const },
  });
  const reset = {
    resetOnChange: ["fld_product_family", "fld_category"] as [string, ...string[]],
    clearOnDeactivate: true,
  };
  const product: FormDefinitionV1["fields"] = [
    {
      ...choice("product_family", "商品カテゴリ", [
        ["gakki_site", "楽器"],
        ["other", "その他"],
      ]),
      config: { presentation: "native", queryParameter: "family" },
    },
    {
      ...choice("category", "楽器カテゴリ", [
        ["guitar-bass", "ギター、ベース"],
        ["piano", "ピアノ、エレクトーン"],
        ["keyboard", "キーボード、電子ピアノ"],
        ["inst", "管楽器・弦楽器・打楽器"],
        ["dtm-dj", "DTM・DJ・音響機器"],
        ["gakki-accessories", "周辺機器・アクセサリー"],
        ["gakki-o", "その他"],
      ]),
      visibleWhen: instrument,
      clearOnDeactivate: true,
      resetOnChange: ["fld_product_family"],
    },
    {
      id: "fld_title",
      key: "title",
      type: "text",
      label: { ja: "メーカー、モデル、型番など" },
      classification: "personal",
      persist: "never",
      required: true,
      validators: [{ use: "maxLength", params: { value: 250 } }],
      placeholder: { ja: "例）合成楽器 Model A" },
      visibleWhen: chosen,
      ...reset,
    },
    {
      ...choice("condition", "商品の状態", [
        ["used", "中古"],
        ["broken", "故障"],
        ["unused", "未使用"],
      ]),
      type: "choice.radio",
      visibleWhen: chosen,
      ...reset,
      appearance: { columns: 3, mobile: { columns: 3 } },
    },
    {
      ...choice("location", "建物の何階に設置していますか？", [
        ["1階", "1階"],
        ["2～3階", "2～3階"],
        ["4階以上", "4階以上"],
      ]),
      visibleWhen: piano,
      ...reset,
    },
    {
      ...choice("location2", "搬出について", [
        ["エレベーターを使用", "エレベーターを使用"],
        ["階段作業が必要", "階段作業が必要"],
        ["クレーン作業が必要", "クレーン作業が必要"],
      ]),
      visibleWhen: {
        op: "and",
        args: [
          piano,
          { op: "in", args: [{ ref: "$local:fld_location" }, { const: ["2～3階", "4階以上"] }] },
        ],
      },
      ...reset,
    },
    {
      id: "fld_item_comment",
      key: "item_comment",
      type: "textarea",
      label: { ja: "補足事項" },
      classification: "personal",
      persist: "never",
      required: false,
      placeholder: { ja: "例）付属品：合成ケース" },
      visibleWhen: chosen,
      ...reset,
    },
  ];
  // Share the existing contact controls; omit pickup/address because this path is consultation.
  const base = pcApplyDraft();
  const contact = base.fields.filter((f) =>
    ["kana", "email", "phone_number", "agree_policy", "subscribe_mm"].includes(f.key),
  );
  const confirmation: FormDefinitionV1["fields"] = [
    "title",
    "category",
    "condition",
    "item_comment",
  ].map((key) => ({
    id: "fld_confirm_" + key,
    key: "confirm_" + key,
    type: "calculated",
    label: {
      ja:
        {
          title: "商品名",
          category: "楽器カテゴリ",
          condition: "商品の状態",
          item_comment: "補足事項",
        }[key] ?? key,
    },
    classification: key === "title" || key === "item_comment" ? "personal" : "public",
    persist: "never",
    submit: "displayOnly",
    formula: { ref: "$local:fld_" + key },
  }));
  return {
    schemaVersion: "1.0.0",
    kind: "form",
    formId: "frm_gakki_apply_reference",
    siteId: "site_pc_synthetic",
    locale: { default: "ja", supported: ["ja", "vi"] },
    appearance: {
      maxWidth: 600,
      padding: 24,
      gap: 16,
      radius: 12,
      background: "#ffffff",
      mobile: { padding: 16 },
    },
    texts: {
      formTitle: { ja: "楽器買取のお申し込み" },
      formDescription: { ja: "合成データ専用・楽器1点のデモ" },
    },
    fields: [...product, ...confirmation, ...contact],
    steps: [
      {
        id: "stp_product",
        kind: "form",
        title: { ja: "商品情報を入力" },
        content: product.map((f) => ({ field: "$local:" + f.id })),
        transitions: [{ default: "stp_product_confirm" }],
      },
      {
        id: "stp_product_confirm",
        kind: "form",
        title: { ja: "商品確認" },
        content: confirmation.map((f) => ({ field: "$local:" + f.id })),
        transitions: [{ default: "stp_customer" }],
      },
      {
        id: "stp_customer",
        kind: "form",
        title: { ja: "お客様情報" },
        content: contact.map((f) => ({ field: "$local:" + f.id })),
        transitions: [{ default: "stp_review" }],
      },
      { id: "stp_review", kind: "review", transitions: [{ default: "stp_complete" }] },
      { id: "stp_complete", kind: "complete" },
    ],
  };
}
