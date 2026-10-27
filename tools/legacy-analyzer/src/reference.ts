import type { FormDefinitionV1 } from "../../../packages/contracts/src/index.ts";
/** Curated mapping of the inspected PC desktop/notebook path. Every value remains editable data.
 * Deliberately excludes the hub's other product families, repeated cart and external submission adapter. */
export function pcApplyDraft(): FormDefinitionV1 {
  const eq = (key: string, value: string) => ({
    op: "eq" as const,
    args: [{ ref: "$local:fld_" + key }, { const: value }],
  });
  const isPC = {
    op: "in" as const,
    args: [{ ref: "$local:fld_category" }, { const: ["desktop", "note"] }],
  };
  const radio = (key: string, label: string, options: [string, string][], extra: object = {}) => ({
    id: "fld_" + key,
    key,
    type: "choice.radio" as const,
    label: { ja: label },
    classification: "public" as const,
    persist: "allowed" as const,
    required: true,
    options: options.map(([value, ja]) => ({ value, label: { ja } })),
    config: { presentation: "native" as const },
    appearance: { columns: 2, gap: 12, mobile: { columns: 2, gap: 12 } },
    ...extra,
  });
  const text = (key: string, label: string, extra: object = {}) => ({
    id: "fld_" + key,
    key,
    type: "text" as const,
    label: { ja: label },
    classification: "personal" as const,
    persist: "allowed" as const,
    required: true,
    ...extra,
  });
  const product = [
    radio(
      "category",
      "商品カテゴリ",
      [
        ["desktop", "デスクトップPC"],
        ["note", "ノートPC"],
      ],
      { config: { queryParameter: "category", presentation: "native" } },
    ),
    text("title", "メーカー、モデルなど", { placeholder: { ja: "例）合成PC Model A" } }),
    ...["cpu", "memory", "os"].map((k) =>
      text(k, { cpu: "CPU", memory: "メモリ", os: "OS" }[k] ?? k),
    ),
    radio("boot_check", "動作の可否", [
      ["正常に起動する", "正常に起動する"],
      ["起動しない", "起動しない"],
    ]),
    radio(
      "battery",
      "バッテリーの状態",
      [
        ["normal", "問題なし"],
        ["degraded", "劣化あり"],
      ],
      { visibleWhen: eq("category", "note"), clearOnDeactivate: true },
    ),
    radio("adapter", "電源コード、ACアダプタの有無", [
      ["yes", "あり"],
      ["no", "なし"],
    ]),
    radio("has_original_box", "元箱（外箱）の有無", [
      ["yes", "箱あり"],
      ["no", "箱なし"],
    ]),
    ...["model_number", "storage_type_capacity", "graphic_card"].map((k) =>
      text(
        k,
        {
          model_number: "型番",
          storage_type_capacity: "ストレージ種類・容量",
          graphic_card: "グラフィックボード",
        }[k] ?? k,
        {
          required: false,
          ...(k === "graphic_card"
            ? { visibleWhen: eq("category", "desktop"), clearOnDeactivate: true }
            : {}),
        },
      ),
    ),
    text("screen_size", "ディスプレイのサイズ", {
      required: false,
      visibleWhen: eq("category", "note"),
      clearOnDeactivate: true,
      placeholder: { ja: "例）13.6インチ" },
    }),
    {
      ...radio("internal_problems", "故障の有無・症状", [
        ["power", "電源が入らない"],
        ["screen", "画面が表示されない"],
        ["noise", "異音がする"],
      ]),
      type: "choice.checkboxes" as const,
      required: false,
    },
    {
      ...radio("external_problems", "外観の状態", [
        ["scratch", "目立つ傷や凹みがある"],
        ["broken", "破損箇所がある"],
        ["dirty", "汚れ、シール跡がある"],
        ["color", "色落ちがある"],
      ]),
      type: "choice.checkboxes" as const,
      required: false,
    },
  ];
  const pickup = [
    radio("pickup_method", "買取方法", [
      ["delivery", "宅配買取"],
      ["shop", "店頭買取"],
      ["dither", "相談して決める"],
    ]),
    {
      ...text("delivery_date", "集荷希望日"),
      type: "date" as const,
      validators: [{ use: "formatDate" as const }],
      visibleWhen: eq("pickup_method", "delivery"),
      clearOnDeactivate: true,
    },
    {
      ...radio("delivery_time", "集荷時間", [
        ["am", "午前"],
        ["pm", "午後"],
      ]),
      type: "choice.select" as const,
      visibleWhen: eq("pickup_method", "delivery"),
      clearOnDeactivate: true,
    },
    {
      ...radio("has_box", "梱包箱はありますか", [
        ["yes", "あり"],
        ["no", "なし"],
      ]),
      visibleWhen: eq("pickup_method", "delivery"),
      clearOnDeactivate: true,
    },
    {
      ...radio("business_domain", "希望店舗（合成）", [
        ["ST-0001", "合成 東京センター"],
        ["ST-0002", "合成 大阪センター"],
      ]),
      type: "choice.select" as const,
      config: { searchable: true },
      visibleWhen: eq("pickup_method", "shop"),
      clearOnDeactivate: true,
    },
  ];
  const customer = [
    {
      ...text("kana", "お名前（カナ）"),
      type: "katakana" as const,
      classification: "personal" as const,
      persist: "never" as const,
      validators: [{ use: "formatKatakana" as const }],
    },
    {
      ...text("email", "メールアドレス"),
      type: "email" as const,
      classification: "personal" as const,
      persist: "never" as const,
      validators: [{ use: "formatEmail" as const }],
    },
    {
      ...text("phone_number", "電話番号"),
      type: "tel" as const,
      classification: "personal" as const,
      persist: "never" as const,
      validators: [{ use: "formatPhoneJP" as const }],
    },
    {
      ...text("zip", "郵便番号"),
      type: "postal" as const,
      classification: "personal" as const,
      persist: "never" as const,
      validators: [{ use: "formatPostalJP" as const }],
      config: { postalAddressTarget: "fld_address" },
      help: { ja: "合成データ専用: 0000000。住所は手入力も可能です。" },
    },
    text("address", "住所", {
      classification: "personal",
      persist: "never",
      visibleWhen: eq("pickup_method", "delivery"),
      clearOnDeactivate: true,
    }),
    {
      ...radio("agree_policy", "個人情報保護方針に同意する", []),
      type: "boolean" as const,
      options: undefined,
      validators: [{ use: "mustBeTrue" as const }],
    },
    {
      ...radio("subscribe_mm", "メールマガジンを受け取る", []),
      type: "boolean" as const,
      options: undefined,
      required: false,
    },
  ];
  // Omit undefined members: serialized DSL contains data only.
  const fields = JSON.parse(
    JSON.stringify([...product, ...pickup, ...customer]),
  ) as FormDefinitionV1["fields"];
  const ids = (items: { id: string }[]) => items.map((f) => ({ field: "$local:" + f.id }));
  return {
    schemaVersion: "1.0.0",
    kind: "form",
    formId: "frm_pc_apply_reference",
    siteId: "site_pc_synthetic",
    locale: { default: "ja", supported: ["ja", "vi"] },
    customerDraft: { ttlMinutes: 30 },
    appearance: {
      maxWidth: 600,
      padding: 24,
      gap: 20,
      radius: 8,
      background: "#ffffff",
      mobile: { padding: 16, columns: 1 },
    },
    texts: {
      formTitle: {
        ja: "PC買取申込 — 合成互換プロトタイプ",
        vi: "Đăng ký thu mua PC — mẫu tương thích giả lập",
      },
      formDescription: {
        ja: "PCデスクトップ・ノート単品。商品カート・他カテゴリ・実送信は未対応。",
        vi: "Một PC để bàn hoặc laptop. Chưa có giỏ nhiều sản phẩm hay gửi thực tế.",
      },
    },
    fields,
    conditions: { cnd_pc: { label: { ja: "PC" }, when: isPC } },
    steps: [
      {
        id: "stp_product",
        kind: "form",
        title: { ja: "商品情報", vi: "Thông tin sản phẩm" },
        content: ids(product),
        transitions: [{ default: "stp_pickup" }],
      },
      {
        id: "stp_pickup",
        kind: "form",
        title: { ja: "買取方法", vi: "Phương thức thu mua" },
        content: ids(pickup),
        transitions: [{ default: "stp_customer" }],
      },
      {
        id: "stp_customer",
        kind: "form",
        title: { ja: "お客様情報", vi: "Thông tin khách hàng" },
        content: ids(customer),
        transitions: [{ default: "stp_review" }],
      },
      { id: "stp_review", kind: "review", transitions: [{ default: "stp_complete" }] },
      { id: "stp_complete", kind: "complete" },
    ],
  };
}
