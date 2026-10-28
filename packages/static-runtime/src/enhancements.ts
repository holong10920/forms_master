import {
  choiceGroup,
  choiceOption,
  badge as badgeClass,
  progress as progressClass,
} from "./recipes.ts";
/** Optional host-owned renderer. Loaded only from the pinned, hash-verified enhancement group. */
import {
  createSession,
  canonical,
  evaluate,
  snapshot,
  restoreDraft,
  draftValues,
  type DraftSnapshot,
  type State,
  type SessionPorts,
  type Cell,
  type Value,
} from "@fb/form-engine";
import type { EngineIRV1, EngineField } from "@fb/contracts";
export { assertIR } from "@fb/form-engine";
export { applyAppearance } from "./appearance.ts";
type Pin = {
  releaseId: string;
  revision: string;
};
const key = (pin: Pin) => `fb.draft.${pin.releaseId}`;
export function restore(
  ir: EngineIRV1,
  pin: Pin,
  initial: Record<string, string>,
  ports: SessionPorts,
  preview: boolean,
): State {
  if (!preview && ir.customerDraft)
    try {
      const raw = sessionStorage.getItem(key(pin));
      if (raw && raw.length <= 200000)
        return restoreDraft(
          ir,
          JSON.parse(raw) as DraftSnapshot,
          { ...pin, now: Date.now() },
          ports,
        );
    } catch {
      try {
        sessionStorage.removeItem(key(pin));
      } catch {
        /* unavailable storage */
      }
    }
  return createSession(ir, initial, ports);
}
export function persist(ir: EngineIRV1, pin: Pin, state: State, preview: boolean): void {
  if (preview || !ir.customerDraft) return;
  try {
    if (state.status === "complete") sessionStorage.removeItem(key(pin));
    else
      sessionStorage.setItem(
        key(pin),
        JSON.stringify({
          ...pin,
          expiresAt: Date.now() + ir.customerDraft.ttlMinutes * 60000,
          current: state.current,
          values: draftValues(ir, state),
        }),
      );
  } catch {
    /* anonymous runtime remains usable without storage */
  }
}
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
export function postal(
  input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  active: () => boolean,
  commit: (address: string) => boolean,
): HTMLElement {
  const group = document.createElement("div");
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "合成住所を検索 / Tra địa chỉ giả lập";
  const status = document.createElement("p");
  status.setAttribute("role", "status");
  group.append(button, status);
  button.addEventListener("click", () => {
    const zip = canonical(input.value, "postal");
    button.disabled = true;
    status.textContent = "検索中… / Đang tìm…";
    void fetch(new URL("api/postal-lookup?zip=" + encodeURIComponent(zip), location.href), {
      credentials: "omit",
      redirect: "error",
      signal: AbortSignal.timeout(3000),
    })
      .then(async (r) => {
        const data = (await r.json()) as {
          synthetic?: boolean;
          address?: string;
        };
        if (
          !r.ok ||
          data.synthetic !== true ||
          typeof data.address !== "string" ||
          data.address.length > 256
        )
          throw Error("lookup");
        if (!input.isConnected || canonical(input.value, "postal") !== zip || !active()) return;
        if (!commit(data.address)) throw Error("target");
      })
      .catch(() => {
        status.textContent =
          "住所が見つからないか、通信できません。手入力してください。 / Không tìm thấy; hãy nhập thủ công.";
      })
      .finally(() => {
        button.disabled = false;
      });
  });
  return group;
}
export function initial(ir: EngineIRV1, search: string): Record<string, string> {
  const out: Record<string, string> = {};
  const query = new URLSearchParams(search);
  for (const f of ir.nodes)
    if (
      f.type !== "group" &&
      f.classification === "public" &&
      f.config?.queryParameter &&
      ["choice.radio", "choice.select"].includes(f.type)
    ) {
      const v = query.get(f.config.queryParameter);
      if (v && f.options?.some((o) => o.value === v)) out[f.id] = v;
    }
  return out;
}
export function searchable(select: HTMLSelectElement, label: string): HTMLInputElement {
  const search = document.createElement("input");
  search.type = "search";
  search.setAttribute("aria-label", label + " — 検索 / Tìm kiếm");
  search.setAttribute("aria-controls", select.id);
  search.addEventListener("input", () => {
    const q = search.value.toLocaleLowerCase();
    for (const o of select.options) o.hidden = !!o.value && !o.text.toLocaleLowerCase().includes(q);
  });
  return search;
}
export function inputMetadata(
  input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  type: string,
): void {
  if (type === "tel") input.autocomplete = "tel";
  if (type === "email") input.autocomplete = "email";
  if (type === "postal") {
    input.inputMode = "numeric";
    input.autocomplete = "postal-code";
  }
}
export function availableOptions(
  f: EngineField,
  values: Record<string, Value>,
  conditions: EngineIRV1["conditions"],
): NonNullable<EngineField["options"]> {
  return (f.options ?? []).filter(
    (o) => !o.availableWhen || evaluate(o.availableWhen, (id) => values[id], conditions) === true,
  );
}

/** Accessible adornments derive from the same workflow and required rules as validation. */
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
export function progress(
  ir: EngineIRV1,
  state: State,
  text: (value: { ja?: string; vi?: string } | undefined, fallback: string) => string,
  msg: (key: string) => string,
): HTMLElement {
  const nav = document.createElement("nav");
  nav.setAttribute("aria-label", msg("progressLabel"));
  nav.className = progressClass;
  const list = document.createElement("ol");
  const path = snapshot(ir, state).path.filter(
    (id) => ir.steps.find((step) => step.id === id)?.kind === "form",
  );
  const current = path.includes(state.current) ? state.current : path.at(-1);
  for (const id of path) {
    const step = ir.steps.find((s) => s.id === id);
    if (!step) continue;
    const item = document.createElement("li");
    item.textContent = text(
      step.title,
      step.kind === "review"
        ? msg("reviewTitle")
        : step.kind === "complete"
          ? msg("completeTitle")
          : step.id.replace("stp_", ""),
    );
    if (step.id === current) item.setAttribute("aria-current", "step");
    list.append(item);
  }
  nav.append(list);
  return nav;
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

export function displayValue(
  ir: EngineIRV1,
  field: EngineField,
  value: Value | undefined,
  text: (label: { ja?: string; vi?: string } | undefined, fallback: string) => string,
): string {
  const source =
    field.formula && "ref" in field.formula
      ? ir.nodes.find(
          (node) =>
            "$local:" + node.id ===
            (field.formula && "ref" in field.formula ? field.formula.ref : ""),
        )
      : undefined;
  const option =
    source && source.type !== "group"
      ? source.options?.find((option) => option.value === value)
      : undefined;
  return typeof value === "string"
    ? text(option?.label, value)
    : value === undefined
      ? ""
      : JSON.stringify(value);
}
