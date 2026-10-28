import { h, field, input, select, toggle, btn } from "./ui.js";
import { appearanceEditor } from "./appearance.js";
import { itemCondition } from "./item-conditions.js";
import { commit } from "./rules.js";
const opened = new Set();
const types = [
  ["text", "テキスト"],
  ["textarea", "補足事項"],
  ["choice.select", "選択"],
  ["choice.radio", "ラジオ"],
  ["number", "数値"],
];
/** Structured item configuration; no JSON, scripts or CSS authoring surface. */
export function cartEditor(group) {
  const edit = (value, callback, options = {}) =>
    input(value ?? "", {
      ...options,
      onCommit: (v) => {
        callback(v);
        commit();
      },
    });
  const out = [
    field(
      "商品グループ表示名",
      edit(group.label?.ja, (v) => (group.label = { ja: v })),
    ),
    field(
      "最少商品数",
      edit(group.minItems ?? 0, (v) => (group.minItems = Math.max(0, Math.min(100, Number(v)))), {
        type: "number",
        min: 0,
        max: 100,
      }),
    ),
    field(
      "最大商品数",
      edit(group.maxItems ?? 20, (v) => (group.maxItems = Math.max(1, Math.min(100, Number(v)))), {
        type: "number",
        min: 1,
        max: 100,
      }),
    ),
    h(
      "p",
      {},
      "一時入力 → 検証 → 確定。編集・削除は商品IDを保持します。公開項目のみセッション復元します。",
    ),
  ];
  for (const f of group.fields) {
    const sourceOptions = [
      ["", "なし"],
      ...group.fields
        .filter((x) => x.id !== f.id && x.options)
        .map((x) => [x.id, x.label?.ja ?? x.key]),
    ];
    const parts = [
      field(
        "データキー · " + f.key,
        input(f.key, {
          onCommit: (v, el) => {
            if (
              !/^[a-zA-Z][a-zA-Z0-9_]*$/.test(v) ||
              ["itemId", "constructor", "prototype", "__proto__"].includes(v) ||
              group.fields.some((other) => other.id !== f.id && other.key === v)
            ) {
              el.setAttribute("aria-invalid", "true");
              return;
            }
            f.key = v;
            commit();
          },
        }),
      ),
      field(
        "表示・リセット条件をコピー · " + f.key,
        select(
          [
            ["", "コピー元を選択"],
            ...group.fields
              .filter((other) => other.id !== f.id)
              .map((other) => [other.id, other.label?.ja ?? other.key]),
          ],
          "",
          (id) => {
            const source = group.fields.find((other) => other.id === id);
            if (!source) return;
            if (source.visibleWhen) f.visibleWhen = window.structuredClone(source.visibleWhen);
            else delete f.visibleWhen;
            if (source.resetOnChange) f.resetOnChange = [...source.resetOnChange];
            else delete f.resetOnChange;
            f.clearOnDeactivate = true;
            commit();
          },
        ),
      ),
      field(
        "項目ラベル · " + f.key,
        edit(f.label?.ja, (v) => (f.label = { ...f.label, ja: v })),
      ),
      toggle("必須 · " + f.key, !!f.required, (v) => {
        f.required = v;
        commit();
      }),
      field(
        "文字数上限 · " + f.key,
        edit(
          f.validators?.find((v) => v.use === "maxLength")?.params?.value,
          (v) => {
            f.validators = [
              ...(f.validators ?? []).filter((x) => x.use !== "maxLength"),
              ...(v
                ? [{ use: "maxLength", params: { value: Math.max(1, Math.min(5000, Number(v))) } }]
                : []),
            ];
          },
          { type: "number", min: 1, max: 5000 },
        ),
      ),
      field(
        "初期選択 · " + f.key,
        select(
          [["", "未選択"], ...(f.options ?? []).map((o) => [o.value, o.label.ja])],
          f.config?.defaultValue ?? "",
          (v) => {
            f.config ??= {};
            if (v) f.config.defaultValue = v;
            else delete f.config.defaultValue;
            commit();
          },
        ),
      ),
    ];
    for (const source of group.fields.filter((x) => x.id !== f.id && x.options))
      parts.push(
        toggle(
          "変更時クリア: " + source.label?.ja + " → " + f.key,
          f.resetOnChange?.includes(source.id) ?? false,
          (v) => {
            const ids = (f.resetOnChange ?? []).filter((id) => id !== source.id);
            if (v) ids.push(source.id);
            if (ids.length) f.resetOnChange = ids;
            else delete f.resetOnChange;
            commit();
          },
        ),
      );
    parts.push(
      ...itemCondition(
        group,
        f.visibleWhen,
        (v) => {
          if (v) f.visibleWhen = v;
          else delete f.visibleWhen;
          f.clearOnDeactivate = true;
        },
        "表示条件 · " + f.key,
      ),
    );
    parts.push(
      h("details", {}, h("summary", {}, "項目スタイル · " + f.key), ...appearanceEditor(f)),
    );
    if (f.options) {
      for (const [index, o] of f.options.entries()) {
        parts.push(
          toggle(
            "有効な場合の初期選択 · " + f.key + " · " + String(index + 1),
            !!o.initial,
            (v) => {
              if (v) o.initial = true;
              else delete o.initial;
              commit();
            },
          ),
        );
        const source = o.availableWhen?.args?.[0]?.item ?? "";
        parts.push(
          field(
            "選択肢 " + String(index + 1) + " · " + f.key,
            edit(o.label.ja, (v) => (o.label = { ...o.label, ja: v })),
          ),
          field(
            "値 · " + f.key + " · " + String(index + 1),
            edit(o.value, (v) => (o.value = v)),
          ),
          field(
            "依存元 · " + f.key + " · " + String(index + 1),
            select(sourceOptions, source, (v) => {
              if (v) o.availableWhen = { op: "eq", args: [{ item: v }, { const: "" }] };
              else delete o.availableWhen;
              commit();
            }),
          ),
        );
        if (source)
          parts.push(
            field(
              "依存元の値 · " + f.key + " · " + String(index + 1),
              edit(o.availableWhen.args[1]?.const, (v) => (o.availableWhen.args[1] = { const: v })),
            ),
          );
        parts.push(
          btn(
            "選択肢を削除 · " + f.key + " · " + String(index + 1),
            () => {
              f.options.splice(index, 1);
              commit();
            },
            { size: "sm" },
          ),
        );
      }
      parts.push(
        btn(
          "選択肢を追加 · " + f.key,
          () => {
            f.options.push({
              value: "option_" + String(f.options.length + 1),
              label: { ja: "新しい選択肢" },
            });
            commit();
          },
          { size: "sm" },
        ),
      );
    }
    parts.push(
      btn(
        "項目を削除 · " + f.key,
        () => {
          group.fields = group.fields.filter((x) => x.id !== f.id);
          commit();
        },
        { size: "sm" },
      ),
    );
    out.push(
      h(
        "details",
        {
          open: opened.has(group.id + f.id),
          ontoggle: (event) => {
            if (event.target.open) opened.add(group.id + f.id);
            else if (event.target.isConnected) opened.delete(group.id + f.id);
          },
        },
        h("summary", {}, f.label?.ja ?? f.key),
        ...parts,
      ),
    );
  }
  out.push(
    field(
      "追加する商品項目",
      select([["", "種類を選択"], ...types], "", (type) => {
        if (!type || group.fields.length >= 100) return;
        const suffix = crypto.randomUUID().replaceAll("-", "").slice(0, 12);
        group.fields.push({
          id: "fld_" + suffix,
          key: "item_" + suffix,
          type,
          label: { ja: "新しい商品項目" },
          classification: ["text", "textarea"].includes(type) ? "personal" : "public",
          persist: ["text", "textarea"].includes(type) ? "never" : "allowed",
          ...(type.startsWith("choice.")
            ? {
                options: [{ value: "yes", label: { ja: "はい" } }],
                config: { presentation: "native" },
              }
            : {}),
        });
        commit();
      }),
    ),
  );
  return out;
}
