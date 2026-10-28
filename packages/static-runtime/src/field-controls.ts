import { choiceGroup, choiceOption, badge as badgeClass } from "./recipes.ts";
import { evaluate, type Cell, type Value } from "@fb/form-engine";
import type { EngineField, EngineIRV1 } from "@fb/contracts";
export function choices(
  f: EngineField,
  options: NonNullable<EngineField["options"]>,
  value: Value | undefined,
  label: (
    v:
      | {
          ja?: string;
          vi?: string;
        }
      | undefined,
    fallback: string,
  ) => string,
  disabled: boolean,
  invalid: boolean,
  commit: (v: Cell) => void,
): HTMLElement {
  const group = document.createElement("fieldset");
  group.className = choiceGroup;
  const legend = document.createElement("legend");
  legend.textContent = label(f.label, f.key);
  group.append(legend);
  if (f.type === "choice.radio") {
    group.setAttribute("role", "radiogroup");
    group.setAttribute("aria-required", String(!!f.required));
  }
  if (invalid) group.setAttribute("aria-invalid", "true");
  for (const option of options) {
    const row = document.createElement("label");
    row.className = choiceOption;
    const input = document.createElement("input");
    input.type = f.type === "choice.radio" ? "radio" : "checkbox";
    input.name = f.key;
    input.value = option.value;
    input.checked =
      f.type === "choice.radio"
        ? value === option.value
        : Array.isArray(value) && value.includes(option.value);
    input.disabled = disabled;
    input.addEventListener("change", () => {
      commit(
        f.type === "choice.radio"
          ? option.value
          : [...group.querySelectorAll<HTMLInputElement>("input:checked")].map((c) => c.value),
      );
    });
    const span = document.createElement("span");
    span.textContent = label(option.label, option.value);
    row.append(input, span);
    group.append(row);
  }
  if (f.help) {
    const help = document.createElement("p");
    help.id = f.id + "-help";
    help.textContent = label(f.help, "");
    group.setAttribute("aria-describedby", help.id);
    group.append(help);
  }
  return group;
}
export function badge(required: boolean, text: string): HTMLElement {
  const span = document.createElement("span");
  span.className = badgeClass;
  span.dataset.required = String(required);
  span.textContent = text;
  return span;
}
export function decorateField(
  wrap: HTMLElement,
  f: EngineField,
  values: Record<string, Value>,
  conditions: EngineIRV1["conditions"],
  msg: (key: string) => string,
): void {
  const required =
    !!f.required ||
    !!f.validators?.some((v) => v.use === "required") ||
    !!(f.requiredWhen && evaluate(f.requiredWhen, (id) => values[id], conditions) === true);
  const label = wrap.querySelector("legend, label");
  label?.append(badge(required, msg(required ? "requiredBadge" : "optionalBadge")));
  wrap
    .querySelector("input, select, textarea, fieldset")
    ?.setAttribute("aria-required", String(required));
}
export function inlineIssues(wrap: HTMLElement, id: string, messages: string[]): void {
  if (!messages.length) return;
  const help = document.createElement("p");
  help.id = id + "-errors";
  help.className = "field-errors [color:#b91c1c] [font-size:0.875rem] [margin:0.35rem_0_0]";
  help.textContent = messages.join(" · ");
  wrap.append(help);
  for (const input of wrap.querySelectorAll("input, select, textarea, fieldset"))
    input.setAttribute(
      "aria-describedby",
      [input.getAttribute("aria-describedby"), help.id].filter(Boolean).join(" "),
    );
}
