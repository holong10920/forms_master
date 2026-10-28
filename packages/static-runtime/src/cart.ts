/** Host-owned staged editor over the existing typed group engine. No private item data is persisted here. */
import type { EngineGroup, EngineIRV1 } from "@fb/contracts";
import { evaluate, type Cell, type GroupValue, type Value } from "@fb/form-engine";
import { effectiveGroup, groupIssues, stageChange, itemDefaults } from "@fb/form-engine";
import { field, formFields, actions } from "./recipes.ts";
import { applyAppearance } from "./appearance.ts";
import { choices, decorateField, inlineIssues } from "./field-controls.ts";
type Label = (v: { ja?: string; vi?: string } | undefined, fallback: string) => string;
export interface CartEditor {
  id?: string;
  cells?: Record<string, Cell>;
  attempted?: boolean;
}
const empty = (): GroupValue => ({ order: [], items: {} });
function node<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string) {
  const e = document.createElement(tag);
  if (text !== undefined) e.textContent = text;
  return e;
}
export function newRow(
  g: EngineGroup,
  conditions: EngineIRV1["conditions"] = {},
  readGlobal: (id: string) => Value | undefined = () => undefined,
): Record<string, Cell> {
  return itemDefaults(g, {}, conditions, readGlobal);
}
export function cart(
  g: EngineGroup,
  value: GroupValue | undefined,
  editor: CartEditor,
  ir: EngineIRV1,
  text: Label,
  msg: (key: string) => string,
  commit: (v: GroupValue) => void,
  render: () => void,
  readGlobal: (id: string) => Value | undefined,
): HTMLElement {
  const root = node("section");
  root.className = "product-cart";
  root.setAttribute("aria-label", text(g.label, g.key));
  const confirmed = value ?? empty();
  if (!editor.cells && !confirmed.order.length) editor.cells = newRow(g, ir.conditions, readGlobal);
  const button = (label: string, action: () => void) => {
    const b = node("button", label);
    b.type = "button";
    if (!["商品を確認", "商品を追加", "削除する"].includes(label)) b.dataset.secondary = "true";
    b.onclick = action;
    return b;
  };
  if (editor.cells) {
    root.append(node("h1", editor.id ? "商品を編集" : "商品情報を入力"));
    const id = editor.id ?? "itm_staged";
    const raw = { order: [id], items: { [id]: editor.cells } };
    const effective = effectiveGroup(g, raw, readGlobal, ir.conditions);
    const row = effective.value.items[id] ?? {};
    const read = (name: string) => row[name.replace("$item:", "")];
    const issues = [
      ...effective.errors,
      ...groupIssues(g, effective.value, new Set(effective.active), readGlobal, ir.conditions),
    ];
    const fields = node("div");
    fields.className = formFields;
    root.append(fields);
    const change = (key: string, v: Cell | undefined, redraw: boolean) => {
      editor.cells = stageChange(g, editor.cells ?? {}, key, v, ir.conditions, readGlobal);
      if (redraw) render();
    };
    for (const f of g.fields) {
      const address = `${g.id}[${id}]/${f.id}`;
      if (!effective.active.includes(address)) continue;
      const wrap = node("div");
      wrap.className = field;
      applyAppearance(wrap, f.appearance, "field");
      const label = node("label", text(f.label, f.key));
      const inputId = `${g.id}-${f.id}`;
      label.htmlFor = inputId;
      wrap.append(label);
      const options = (f.options ?? []).filter(
        (o) => !o.availableWhen || evaluate(o.availableWhen, read, ir.conditions) === true,
      );
      const value = editor.cells[f.id];
      if (f.type === "choice.radio") {
        label.remove();
        wrap.append(
          choices(
            { ...f, id: inputId },
            options,
            value,
            text,
            false,
            !!editor.attempted && issues.some((e) => e.path === address),
            (v) => {
              change(f.id, v, true);
            },
          ),
        );
      } else {
        const input = f.options
          ? node("select")
          : f.type === "textarea"
            ? node("textarea")
            : node("input");
        if (input instanceof HTMLSelectElement) {
          input.append(new Option(msg("selectPrompt"), ""));
          for (const o of options) input.append(new Option(text(o.label, o.value), o.value));
        } else if (input instanceof HTMLInputElement)
          input.type = f.type === "number" ? "number" : "text";
        input.id = inputId;
        input.value = typeof value === "string" || typeof value === "number" ? String(value) : "";
        input.setAttribute("aria-required", String(!!f.required));
        if (!(input instanceof HTMLSelectElement)) {
          input.placeholder = text(f.placeholder, "");
          input.oninput = () => {
            change(f.id, f.type === "number" ? Number(input.value) : input.value, false);
          };
        }
        input.onchange = () => {
          change(
            f.id,
            f.type === "number" ? Number(input.value) : input.value,
            input instanceof HTMLSelectElement,
          );
        };
        wrap.append(input);
      }
      decorateField(wrap, f, {}, ir.conditions, msg);
      if (f.help) wrap.append(node("p", text(f.help, "")));
      if (editor.attempted && issues.some((e) => e.path === address))
        wrap
          .querySelector("input, select, textarea, fieldset")
          ?.setAttribute("aria-invalid", "true");
      if (editor.attempted)
        inlineIssues(
          wrap,
          inputId,
          issues
            .filter((e) => e.path === address)
            .map((e) =>
              msg(e.code).replace(
                "{n}",
                String(f.validators?.find((v) => v.use === e.code)?.params?.value ?? ""),
              ),
            ),
        );
      fields.append(wrap);
    }
    const controls = node("div");
    controls.className = actions;
    controls.append(
      button("商品を確認", () => {
        editor.attempted = true;
        const latest = effectiveGroup(
          g,
          { order: [id], items: { [id]: editor.cells ?? {} } },
          readGlobal,
          ir.conditions,
        );
        const latestIssues = [
          ...latest.errors,
          ...groupIssues(g, latest.value, new Set(latest.active), readGlobal, ir.conditions),
        ];
        if (latestIssues.length) {
          render();
          document.querySelector('[aria-invalid="true"]')?.scrollIntoView({ block: "center" });
          return;
        }
        const itemId = editor.id ?? "itm_" + crypto.randomUUID().replaceAll("-", "");
        const next = {
          order: editor.id ? [...confirmed.order] : [...confirmed.order, itemId],
          items: { ...confirmed.items, [itemId]: latest.value.items[id] ?? {} },
        };
        delete editor.cells;
        delete editor.id;
        delete editor.attempted;
        commit(next);
      }),
    );
    if (confirmed.order.length)
      controls.append(
        button("商品一覧に戻る（変更を破棄）", () => {
          delete editor.cells;
          delete editor.id;
          delete editor.attempted;
          render();
        }),
      );
    root.append(controls);
  } else {
    root.append(node("h1", "商品確認"));
    const restored = effectiveGroup(g, confirmed, readGlobal, ir.conditions);
    if (groupIssues(g, restored.value, new Set(restored.active), readGlobal, ir.conditions).length)
      root.append(node("p", "未入力の項目があります。編集して商品名などを再入力してください。"));
    for (const [index, id] of confirmed.order.entries()) {
      const card = node("article");
      card.setAttribute("data-item-id", id);
      card.append(node("h3", `商品 ${String(index + 1)}`));
      const row = confirmed.items[id] ?? {};
      for (const f of g.fields) {
        if (row[f.id] === undefined) continue;
        const v = row[f.id];
        const label = f.options?.find((o) => o.value === v);
        card.append(
          node("p", `${text(f.label, f.key)}: ${label ? text(label.label, String(v)) : String(v)}`),
        );
      }
      card.append(
        button("編集", () => {
          editor.id = id;
          editor.cells = structuredClone(row);
          render();
        }),
        button("削除", () => {
          const dialog = node("dialog");
          dialog.setAttribute("aria-label", "商品を削除する");
          dialog.append(
            node("p", "この商品を本当に削除しますか？"),
            button("キャンセル", () => {
              dialog.close();
              dialog.remove();
            }),
            button("削除する", () => {
              dialog.close();
              commit({
                order: confirmed.order.filter((x) => x !== id),
                items: Object.fromEntries(
                  Object.entries(confirmed.items).filter(([key]) => key !== id),
                ),
              });
            }),
          );
          root.append(dialog);
          dialog.showModal();
        }),
      );
      root.append(card);
    }
    if (confirmed.order.length < (g.maxItems ?? 100))
      root.append(
        button("商品を追加", () => {
          editor.cells = newRow(g, ir.conditions, readGlobal);
          delete editor.id;
          delete editor.attempted;
          render();
        }),
      );
  }
  return root;
}
