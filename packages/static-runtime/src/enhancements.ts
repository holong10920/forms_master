/** Optional host-owned renderer. Loaded only from the pinned, hash-verified enhancement group. */
import {
  createSession,
  canonical,
  evaluate,
  restoreDraft,
  draftValues,
  type DraftSnapshot,
  type State,
  type SessionPorts,
  type Cell,
  type Value,
} from "@fb/form-engine";
import type { EngineIRV1, EngineField } from "@fb/contracts";
export { applyAppearance } from "./appearance.ts";
type Pin = { releaseId: string; revision: string };
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
  label: (v: { ja?: string; vi?: string } | undefined, fallback: string) => string,
  disabled: boolean,
  invalid: boolean,
  commit: (v: Cell) => void,
): HTMLElement {
  const group = document.createElement("fieldset");
  group.className = "choice-group";
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
    row.className = "choice-option";
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
        const data = (await r.json()) as { synthetic?: boolean; address?: string };
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
