import type { EngineDisplay, EngineDisplayLeaf, EngineIRV1 } from "@fb/contracts";
import { displayVisible, snapshot, type GroupValue, type State } from "@fb/form-engine";
import { applyAppearance } from "./appearance.ts";
import { answerSummary, fieldText, groupItems, type SummaryRow } from "./summary.ts";
import { display as displayClasses } from "./display-recipes.ts";
import { formFields } from "./recipes.ts";
import { APPROVED_IMAGES, APPROVED_LINKS } from "./display-assets.ts";
type Label = { ja?: string; vi?: string } | undefined;
export interface DisplayContext {
  ir: EngineIRV1;
  state: State;
  text: (t: Label, fallback: string) => string;
  /** The runtime's guarded submit, present only on the render that first arrives at the step. */
  arrival: (() => void) | undefined;
}
const SIZES = { small: 48, medium: 96, large: 160 } as const;
const SPACES = { small: 8, medium: 24, large: 48 } as const;
const SVG = "http://www.w3.org/2000/svg";
function node<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string) {
  const out = document.createElement(tag);
  if (text !== undefined) out.textContent = text;
  return out;
}
// Summary layout uses CSSOM styles (CSP-safe) so the initial stylesheet carries none of it.
// Each row wraps label over value on narrow screens without a media query.
function row(label: string, value: string): HTMLElement {
  const box = node("div"),
    dt = node("dt", label),
    dd = node("dd", value);
  Object.assign(box.style, {
    display: "flex",
    flexWrap: "wrap",
    gap: "0 0.5rem",
    padding: "0.5rem 0",
    borderBottom: "1px solid #e2e8f0",
  });
  Object.assign(dt.style, { flex: "1 1 8rem", fontWeight: "600" });
  Object.assign(dd.style, { flex: "999 1 14rem", margin: "0", overflowWrap: "anywhere" });
  box.append(dt, dd);
  return box;
}
function rows(list: Pick<SummaryRow, "label" | "value">[]): HTMLElement {
  const dl = node("dl");
  dl.className = "summary-rows";
  dl.style.margin = "0";
  for (const r of list) dl.append(row(r.label, r.value));
  return dl;
}
function groupList(title: string, items: SummaryRow[][]): HTMLElement {
  const box = node("section");
  box.className = "summary-group";
  box.append(node("h3", title));
  items.forEach((item, index) => {
    const card = node("article");
    card.dataset.item = String(index + 1);
    Object.assign(card.style, {
      border: "1px solid #e2e8f0",
      padding: "0.5rem 0.75rem",
      marginBottom: "0.5rem",
    });
    card.append(rows(item));
    box.append(card);
  });
  return box;
}
/** Default readable confirmation (no raw payload): one section per visited input step. */
export function answerSections(ctx: DisplayContext, title?: string): HTMLElement {
  const box = node("div");
  box.className = "answer-summary";
  if (title) box.append(node("h2", title));
  for (const s of answerSummary(ctx.ir, ctx.state, ctx.text)) {
    const section = node("section");
    section.dataset.step = s.stepId;
    if (s.title) section.append(node("h2", s.title));
    if (s.rows.length) section.append(rows(s.rows));
    for (const g of s.groups) section.append(groupList(g.label, g.items));
    box.append(section);
  }
  return box;
}
function image(d: Extract<EngineDisplayLeaf, { type: "image" }>, ctx: DisplayContext): Element {
  const svg = document.createElementNS(SVG, "svg");
  const px = String(SIZES[d.size ?? "medium"]);
  for (const [k, v] of [
    ["viewBox", "0 0 24 24"],
    ["width", px],
    ["height", px],
    ["fill", "none"],
    ["stroke", "currentColor"],
    ["stroke-width", "1.6"],
    ["stroke-linecap", "round"],
    ["stroke-linejoin", "round"],
    ["role", "img"],
    ["aria-label", ctx.text(d.alt, "")],
  ] as [string, string][])
    svg.setAttribute(k, v);
  for (const d2 of APPROVED_IMAGES[d.asset]) {
    const path = document.createElementNS(SVG, "path");
    path.setAttribute("d", d2);
    svg.append(path);
  }
  return svg;
}
function leaf(d: EngineDisplayLeaf, ctx: DisplayContext): Element | undefined {
  const { ir, state, text } = ctx;
  switch (d.type) {
    case "heading":
      return node(d.level === 3 ? "h3" : "h2", text(d.text, ""));
    case "text": {
      const p = node("p", text(d.text, ""));
      p.dataset.tone = d.tone ?? "normal";
      return p;
    }
    case "image":
      return image(d, ctx);
    case "divider":
      return node("hr");
    case "spacer": {
      const s = node("div");
      s.setAttribute("aria-hidden", "true");
      s.style.height = `${String(SPACES[d.size ?? "medium"])}px`;
      return s;
    }
    case "fieldValue": {
      const f = ir.nodes.find((n) => `$local:${n.id}` === d.field);
      if (!f || f.type === "group") return undefined;
      const value = snapshot(ir, state).effective[f.id];
      return rows([
        {
          label: text(d.label ?? f.label, f.key),
          value: fieldText(f, value, text, d.mask ?? "none", ir.texts),
        },
      ]);
    }
    case "groupSummary": {
      const g = ir.nodes.find((n) => `$local:${n.id}` === d.group);
      if (!g || g.type !== "group") return undefined;
      const value = snapshot(ir, state).effective[g.id] as GroupValue | undefined;
      return groupList(
        text(d.title ?? g.listTitle ?? g.label, g.key),
        groupItems(g, value, text, ir.texts),
      );
    }
    case "summary":
      return answerSections(ctx, d.title ? text(d.title, "") : undefined);
    case "reference": {
      const box = node("p");
      box.className = "request-reference";
      box.append(node("span", text(d.label ?? ir.texts?.referenceLabel, "受付番号") + ": "));
      const value = issued
        ? node("strong", issued)
        : node("span", text(ir.texts?.referencePreview, "プレビューでは受付番号は発行されません"));
      box.append(value);
      return box;
    }
    case "button": {
      if (d.action === "link" && d.link) {
        const a = node("a", text(d.label, ""));
        a.href = APPROVED_LINKS[d.link];
        a.rel = "noopener noreferrer";
        a.className = "display-cta";
        if (d.variant === "secondary") a.dataset.secondary = "true";
        return a;
      }
      const b = node("button", text(d.label, ""));
      b.type = "button";
      if (d.variant === "secondary") b.dataset.secondary = "true";
      // Completion already removed the draft, so a reload starts a fresh session with a new
      // idempotency key; the completed request is never resubmitted.
      b.addEventListener("click", () => {
        location.reload();
      });
      return b;
    }
  }
}
/** Renders one typed display component. Text goes through textContent only; never HTML. */
export function renderDisplay(d: EngineDisplay, ctx: DisplayContext): HTMLElement | undefined {
  if (!displayVisible(ctx.ir, ctx.state, d)) return undefined;
  let out: Element | undefined;
  if (d.type === "section") {
    const section = node("section");
    if (d.title) section.append(node("h2", ctx.text(d.title, "")));
    for (const child of d.children) {
      const c = renderDisplay(child, ctx);
      if (c) section.append(c);
    }
    out = section;
  } else out = leaf(d, ctx);
  if (!out) return undefined;
  const wrap = node("div");
  wrap.className = displayClasses;
  wrap.dataset.display = d.type;
  wrap.dataset.displayId = d.id;
  applyAppearance(wrap, d.appearance, "field");
  wrap.append(out);
  return wrap;
}
/** Renders a step's display items. On the review/complete screens it wraps them in the field grid
 * and, when none are authored, falls back to the readable answer summary / default completion.
 * Positional parameters keep the runtime call site small (object keys survive minification). */
export function displays(
  into: HTMLElement,
  target: "review" | "complete" | { display: EngineDisplay },
  ir: EngineIRV1,
  state: State,
  text: DisplayContext["text"],
  arrival: DisplayContext["arrival"],
): void {
  const ctx: DisplayContext = { ir, state, text, arrival };
  const step = ctx.ir.steps.find((s) => s.id === ctx.state.current);
  if (typeof target === "object") {
    const out = renderDisplay(target.display, ctx);
    if (out) into.append(out);
    return;
  }
  const items = (step?.content ?? []).flatMap((c) => ("display" in c ? [c.display] : []));
  const texts = ctx.ir.texts;
  if (target === "complete")
    into.append(node("h1", ctx.text(texts?.completeTitle, "completeTitle")));
  const box = node("div");
  box.className = formFields;
  into.append(box);
  // Without authored components: the readable answer summary, or the default completion text.
  if (!items.length)
    box.append(
      target === "review"
        ? answerSections(ctx)
        : node("p", ctx.text(texts?.completeBody, "completeBody")),
    );
  // Two-screen option: an autoSubmit review submits once on arrival through the same guarded
  // engine path; after a rejection the readable confirmation stays visible with the errors.
  if (target === "review" && step?.autoSubmit && ctx.arrival && ctx.state.status === "editing")
    queueMicrotask(ctx.arrival);
  for (const d of items) {
    const out = renderDisplay(d, ctx);
    if (out) box.append(out);
  }
}
// One runtime per page and "restart" reloads, so the receipt lives with this module.
let issued: string | undefined;
/** Keeps the receipt only when the Go submit endpoint accepted this request; never fabricated. */
export function receipt(ok: boolean, outcome: { receipt?: unknown }): void {
  const r = outcome.receipt;
  issued =
    ok && typeof r === "string" && /^synthetic_[A-Za-z0-9_-]{8,64}$/u.test(r) ? r : undefined;
}
