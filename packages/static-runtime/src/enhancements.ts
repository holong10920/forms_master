import { progress as progressClass } from "./recipes.ts";
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
  type Value,
} from "@fb/form-engine";
import type { EngineIRV1, EngineField } from "@fb/contracts";
export { assertIR } from "@fb/form-engine";
export { applyAppearance, siteAppearance } from "./appearance.ts";
import { instrumentLogo } from "./local-logo.ts";
import { journey } from "./journey.ts";
import type { SiteAppearance } from "./appearance.ts";
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
export function progress(
  ir: EngineIRV1,
  state: State,
  text: (value: { ja?: string; vi?: string } | undefined, fallback: string) => string,
  msg: (key: string) => string,
  editing: Readonly<Record<string, boolean>> = {},
): HTMLElement {
  const nav = document.createElement("nav");
  nav.setAttribute("aria-label", msg("progressLabel"));
  nav.className = progressClass;
  const list = document.createElement("ol");
  if (ir.appearance?.progressStyle === "compact") {
    Object.assign(list.style, {
      justifyContent: "space-between",
      backgroundImage: "linear-gradient(#cbd5e1,#cbd5e1)",
      backgroundSize: "100% 2px",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
    });
    for (const stage of journey(ir, state, editing)) {
      const item = document.createElement("li");
      item.textContent = text(stage.label, msg("reviewTitle"));
      Object.assign(item.style, {
        flex: "0 0 auto",
        justifyContent: "center",
        backgroundColor: stage.status === "current" ? "var(--form-accent,#10b981)" : "#ffffff",
      });
      item.dataset.state = stage.status;
      if (stage.status === "current") item.setAttribute("aria-current", "step");
      list.append(item);
    }
    nav.append(list);
    return nav;
  }
  const path = snapshot(ir, state).path.filter(
    (id) =>
      ir.steps.find((step) => step.id === id)?.kind === "form" ||
      (ir.nodes.some((n) => n.type === "group") &&
        ir.steps.find((step) => step.id === id)?.kind === "review"),
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

export { cart, type CartEditor } from "./cart.ts";

let logoBitmap: Promise<ImageBitmap> | undefined;
export function header(appearance?: SiteAppearance): HTMLElement | undefined {
  if (
    !appearance?.headerText &&
    appearance?.headerLogo !== "instrument-local" &&
    appearance?.headerVariant !== "fullWidth"
  )
    return;
  const header = document.createElement("header");
  header.className = "site-header";
  const inner = document.createElement("div");
  inner.className = "site-header-inner";
  header.append(inner);
  if (appearance.headerLogo === "instrument-local") {
    // Decode trusted module bytes locally. No data/blob URL, remote request, or CSP expansion.
    const canvas = document.createElement("canvas");
    canvas.className = "site-logo";
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", appearance.headerText ?? "");
    logoBitmap ??= createImageBitmap(
      new Blob([Uint8Array.from(atob(instrumentLogo), (c) => c.charCodeAt(0))], {
        type: "image/png",
      }),
    );
    void logoBitmap
      .then((bitmap) => {
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        canvas.getContext("2d")?.drawImage(bitmap, 0, 0);
      })
      .catch(() => {
        canvas.replaceWith(document.createTextNode(appearance.headerText ?? ""));
      });
    inner.append(canvas);
  } else inner.textContent = appearance.headerText ?? "";
  return header;
}

export { choices, badge, decorateField, inlineIssues } from "./field-controls.ts";

/** Mount optional branding/progress outside or inside the existing form card. */
export function chrome(
  host: HTMLElement,
  root: HTMLElement,
  ir: EngineIRV1,
  state: State,
  text: (v: { ja?: string; vi?: string } | undefined, fallback: string) => string,
  msg: (key: string) => string,
  editors: ReadonlyMap<string, { cells?: unknown }>,
): void {
  root.className = "runtime-card";
  host.querySelector(":scope > .site-header")?.remove();
  host.querySelector(":scope > .synthetic-notice")?.remove();
  const fullWidth = ir.appearance?.headerVariant === "fullWidth";
  const mobile = matchMedia("(max-width: 639px)").matches;
  if (fullWidth) {
    Object.assign(host.style, {
      maxWidth: "none",
      padding: "0",
      margin: "0",
      background: "transparent",
      boxShadow: "none",
    });
    Object.assign(root.style, {
      boxSizing: "border-box",
      maxWidth: mobile
        ? "var(--fb-mobile-max-width,var(--fb-max-width,600px))"
        : "var(--fb-max-width,600px)",
      width: mobile ? "calc(100% - 32px)" : "100%",
      margin: mobile ? "96px auto 16px" : "80px auto 20px",
      padding: mobile ? "var(--fb-mobile-padding,16px)" : "var(--fb-padding,24px)",
      borderRadius: "var(--fb-radius,12px)",
      background: "var(--fb-background,#ffffff)",
      boxShadow: "var(--fb-shadow,0 2px 8px #00000012)",
    });
  }
  const notice = document.createElement("p");
  notice.className = "synthetic-notice";
  notice.textContent = msg("syntheticNotice");
  if (fullWidth) host.append(notice);
  else root.append(notice);
  const brand = header(ir.appearance);
  const nav = progress(
    ir,
    state,
    text,
    msg,
    Object.fromEntries([...editors].map(([id, editor]) => [id, !!editor.cells])),
  );
  if (fullWidth && brand) {
    Object.assign(brand.style, {
      position: "fixed",
      inset: "0 0 auto 0",
      zIndex: "20",
      padding: "0",
      background: "#ffffff",
      boxShadow: "0 2px 5px #00000014",
    });
    const inner = brand.querySelector<HTMLElement>(".site-header-inner");
    if (inner)
      Object.assign(inner.style, {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxSizing: "border-box",
        width: "100%",
        maxWidth: "var(--fb-max-width,600px)",
        height: mobile ? "84px" : "56px",
        flexDirection: mobile ? "column" : "row",
        gap: mobile ? "4px" : "12px",
        margin: "0 auto",
        padding: mobile ? "8px 16px" : "0",
      });
    const logo = brand.querySelector<HTMLElement>(".site-logo");
    if (logo)
      logo.style.height = mobile
        ? "var(--fb-mobile-logo-height,30px)"
        : "var(--fb-logo-height,36px)";
    Object.assign(notice.style, {
      fontSize: "10px",
      color: "#6b7280",
      textAlign: "center",
      margin: "8px",
    });
    if (mobile) nav.style.width = "100%";
    brand.querySelector(".site-header-inner")?.append(nav);
    host.prepend(brand);
  } else {
    if (brand) root.append(brand);
    root.append(nav);
  }
}
