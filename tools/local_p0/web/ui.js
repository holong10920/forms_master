// Small DOM toolkit for the Admin (no framework, CSP-safe: no inline styles/handlers, no HTML strings).
export const $ = (id) => document.getElementById(id);
const SVG = "http://www.w3.org/2000/svg";

export function append(el, children) {
  for (const c of children.flat(Infinity)) {
    if (c === null || c === undefined || c === false || c === "") continue;
    el.append(c instanceof window.Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

// Null-safe Element.append / replaceChildren: the native ones render null children as the text "null".
export const add = (el, ...children) => append(el, children);
export const fill = (el, ...children) => (el.replaceChildren(), append(el, children));

// h("button", { class: "btn", onclick }, "Text") — attributes with "-" (aria-*, data-*) and role are
// set as attributes; everything else as DOM properties when the element supports them.
export function h(tag, props, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props ?? {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k === "class") el.className = v;
    else if (k === "dataset") Object.assign(el.dataset, v);
    else if (k === "text") el.textContent = v;
    else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
    else if (k === "translate") el.setAttribute("translate", v === "no" ? "no" : "yes");
    else if (k === "role" || k.includes("-") || k === "for" || !(k in el))
      el.setAttribute(k === "for" ? "for" : k, v === true ? "" : String(v));
    else el[k] = v;
  }
  return append(el, children);
}

const PATHS = {
  plus: "M12 5v14M5 12h14",
  x: "M18 6 6 18M6 6l12 12",
  check: "M20 6 9 17l-5-5",
  trash: "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6",
  copy: "M9 9h11v11H9zM5 15H4V4h11v1",
  up: "M12 19V5M5 12l7-7 7 7",
  down: "M12 5v14M19 12l-7 7-7-7",
  chevR: "m9 18 6-6-6-6",
  chevD: "m6 9 6 6 6-6",
  chevL: "m15 18-6-6 6-6",
  eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  send: "M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z",
  layers: "M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
  grip: "M9 5h.01M9 12h.01M9 19h.01M15 5h.01M15 12h.01M15 19h.01",
  text: "M4 7V4h16v3M9 20h6M12 4v16",
  lines: "M3 6h18M3 12h18M3 18h12",
  hash: "M4 9h16M4 15h16M10 3 8 21M16 3l-2 18",
  toggle: "M8 6h8a6 6 0 0 1 0 12H8A6 6 0 0 1 8 6zM16 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  radio: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4z",
  select: "M3 5h18v14H3zM10 10l2-2 2 2M10 14l2 2 2-2",
  checks: "m3 6 2 2 3-3M3 13l2 2 3-3M11 6h10M11 13h10M11 19h10",
  calc: "M5 2h14v20H5zM8 6h8v4H8zM8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01",
  mail: "M3 5h18v14H3zM3 7l9 6 9-6",
  phone: "M7 2h10v20H7zM11 18h2",
  postal: "M5 4h14M5 9h14M12 9v11",
  kana: "M4 5h9M8 3v2M5 11s2 4 6 5M11 5c0 4-3 8-6 9M13 21l4-9 4 9M14.5 18h5",
  store:
    "M3 9l1.5-5h15L21 9M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0zM5 13v8h14v-8M10 21v-5h4v5",
  branch:
    "M6 3v12M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 9a9 9 0 0 1-9 9",
  globe:
    "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20",
  sparkles:
    "M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 3v4M21 5h-4M5 17v4M7 19H3",
  rocket:
    "M5 15c-1.5 1.3-2 5-2 5s3.7-.5 5-2M12 15l-3-3M9 12a22 22 0 0 1 2-4A12.9 12.9 0 0 1 22 2c0 2.7-.8 7.5-6 11a22 22 0 0 1-4 2zM9 12H4s.6-3 2-4c1.6-1.1 5 0 5 0M12 15v5s3-.6 4-2c1.1-1.6 0-5 0-5",
  clock: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 6v6l4 2",
  alert:
    "M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01",
  info: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 16v-4M12 8h.01",
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.3-4.3",
  more: "M5 12h.01M12 12h.01M19 12h.01",
  user: "M20 21a8 8 0 0 0-16 0M12 3a5 5 0 1 0 0 10 5 5 0 0 0 0-10z",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  refresh: "M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5",
  monitor: "M2 3h20v14H2zM8 21h8M12 17v4",
  rollback: "M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5",
  external: "M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6",
  pencil: "M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z",
  box: "M21 8 12 3 3 8v8l9 5 9-5zM3 8l9 5 9-5M12 13v8",
  flow: "M3 3h6v6H3zM15 15h6v6h-6zM6 9v3a3 3 0 0 0 3 3h6",
  palette:
    "M12 2a10 10 0 1 0 0 20c1 0 2-1 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.3 0-1 1-2 2-2h2.3A5.7 5.7 0 0 0 22 10c0-4.4-4.5-8-10-8zM7.5 11h.01M10 7h.01M14 7h.01M17 10.5h.01",
  wind: "M5 12h10M3 7h12a3 3 0 1 0-3-3M3 17h14a3 3 0 1 1-3 3",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  lock: "M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4",
  cloudCheck: "M17.5 19H9a7 7 0 1 1 6.7-9h1.8a4.5 4.5 0 1 1 0 9zM9 14l2 2 4-4",
  cloud: "M17.5 19H9a7 7 0 1 1 6.7-9h1.8a4.5 4.5 0 1 1 0 9z",
  loader:
    "M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.2 16.2l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.2 7.8l2.8-2.8",
  dot: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
  history: "M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l4 2",
  file: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5",
  grid: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
  flag: "M4 22V4s1-1 4-1 5 2 8 2 4-1 4-1v12s-1 1-4 1-5-2-8-2-4 1-4 1",
  review:
    "M9 2h6v4H9zM16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M9 14l2 2 4-4",
  brand: "M5 5h14M5 11h14M5 17h8M17 15v6M14 18h6",
  keyboard: "M2 6h20v12H2zM6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10",
  settings:
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z",
};

export function icon(name, cls = "") {
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("class", ("icon " + cls).trim());
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  const path = document.createElementNS(SVG, "path");
  path.setAttribute("d", PATHS[name] ?? PATHS.dot);
  svg.append(path);
  return svg;
}

export function css(el, values) {
  for (const [k, v] of Object.entries(values)) el.style.setProperty(k, v);
  return el;
}

// Async-safe button: disables while running and reports failures through `onError`.
let errorSink = (e) => window.console.error(e);
export const setErrorSink = (fn) => (errorSink = fn);
export function btn(label, fn, { variant = "", size = "", iconName, title, aria, id, type } = {}) {
  const b = h(
    "button",
    {
      type: type ?? "button",
      class: ["btn", variant && "btn-" + variant, size && "btn-" + size, !label && "btn-icon"]
        .filter(Boolean)
        .join(" "),
      title,
      "aria-label": aria,
      id,
    },
    iconName ? icon(iconName) : null,
    label ? h("span", { class: "btn-label" }, label) : null,
  );
  if (fn)
    b.addEventListener("click", (e) => {
      if (b.disabled) return;
      b.disabled = true;
      Promise.resolve()
        .then(() => fn(e))
        .catch((err) => errorSink(err))
        .finally(() => {
          b.disabled = false;
        });
    });
  return b;
}

let uid = 0;
export const nextId = (p = "ui") => `${p}-${++uid}`;

export function field(label, control, { hint, error, id } = {}) {
  const cid = control.id || id || nextId("f");
  control.id = cid;
  return h(
    "div",
    { class: "field" },
    h("label", { class: "field-label", for: cid }, label),
    control,
    hint ? h("span", { class: "field-hint" }, hint) : null,
    error ? h("span", { class: "field-error", role: "alert" }, error) : null,
  );
}

export function input(
  value,
  { type = "text", placeholder, onInput, onCommit, cls = "", ...rest } = {},
) {
  const el = h("input", { class: "input " + cls, type, placeholder, ...rest });
  el.value = value ?? "";
  if (onInput) el.addEventListener("input", () => onInput(el.value, el));
  if (onCommit) el.addEventListener("change", () => onCommit(el.value, el));
  return el;
}

export function textarea(value, { onInput, onCommit, rows = 3, ...rest } = {}) {
  const el = h("textarea", { class: "textarea", rows, ...rest });
  el.value = value ?? "";
  if (onInput) el.addEventListener("input", () => onInput(el.value, el));
  if (onCommit) el.addEventListener("change", () => onCommit(el.value, el));
  return el;
}

// values: [[value, label, { noTranslate, disabled }]]
export function select(values, chosen, onChange, { cls = "", ...rest } = {}) {
  const el = h("select", { class: "select " + cls, ...rest });
  fillSelect(el, values, chosen);
  if (onChange) el.addEventListener("change", () => onChange(el.value, el));
  return el;
}
export function fillSelect(el, values, chosen) {
  el.replaceChildren();
  for (const [value, label, opts] of values) {
    const o = new Option(label, value);
    if (opts?.noTranslate) o.setAttribute("translate", "no");
    if (opts?.disabled) o.disabled = true;
    el.append(o);
  }
  if (chosen !== undefined && chosen !== null) el.value = String(chosen);
}

// The switch's accessible name is exactly `label`; the hint is exposed as its description.
export function toggle(label, checked, onChange, { hint, id, disabled, role = "switch" } = {}) {
  const hintId = hint ? nextId("hint") : undefined;
  const box = h("input", {
    type: "checkbox",
    id,
    role,
    disabled: !!disabled,
    "aria-label": label,
    "aria-describedby": hintId,
  });
  box.checked = !!checked;
  if (onChange) box.addEventListener("change", () => onChange(box.checked, box));
  return h(
    "label",
    { class: "switch" },
    box,
    h("span", { class: "switch-track", "aria-hidden": "true" }),
    h(
      "span",
      { class: "switch-text" },
      h("b", {}, label),
      hint ? h("small", { id: hintId }, hint) : null,
    ),
  );
}

// options: [[value, label, iconName]]
export function segmented(name, label, values, chosen, onChange, { full = false } = {}) {
  const group = h("div", {
    class: "segmented" + (full ? " full" : ""),
    role: "radiogroup",
    "aria-label": label,
  });
  for (const [value, text, iconName] of values) {
    const radio = h("input", { type: "radio", name, value });
    radio.checked = value === chosen;
    radio.addEventListener("change", () => radio.checked && onChange(value));
    group.append(h("label", {}, radio, iconName ? icon(iconName) : null, h("span", {}, text)));
  }
  return group;
}

// Accessible tab strip (roving tabindex, arrow keys).
export function tabs(container, items, selected, onSelect) {
  container.replaceChildren();
  const buttons = items.map(([key, label, extra]) => {
    const b = h(
      "button",
      {
        type: "button",
        class: "tab",
        role: "tab",
        "aria-selected": String(key === selected),
        tabIndex: key === selected ? 0 : -1,
        dataset: { tab: key },
      },
      label,
      extra ?? null,
    );
    b.addEventListener("click", () => onSelect(key));
    return b;
  });
  // Containers are re-rendered often: bind the arrow-key handler once and read the current buttons.
  const firstBind = !container.tabButtons;
  container.tabButtons = buttons;
  if (firstBind)
    container.addEventListener("keydown", (e) => {
      const buttons = container.tabButtons;
      const i = buttons.indexOf(document.activeElement);
      if (i < 0 || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
      e.preventDefault();
      const n =
        e.key === "Home"
          ? 0
          : e.key === "End"
            ? buttons.length - 1
            : (i + (e.key === "ArrowRight" ? 1 : -1) + buttons.length) % buttons.length;
      buttons[n].focus();
      buttons[n].click();
    });
  container.append(...buttons);
  scrollHint(container);
  buttons.find((b) => b.tabIndex === 0)?.scrollIntoView({ block: "nearest", inline: "nearest" });
  return buttons;
}

// Marks a horizontally scrolling strip with data-more="start|end|both" so CSS can fade the clipped edge.
export function scrollHint(strip) {
  const update = () => {
    const max = strip.scrollWidth - strip.clientWidth;
    const start = strip.scrollLeft > 1;
    const end = strip.scrollLeft < max - 1;
    strip.dataset.more = start && end ? "both" : start ? "start" : end ? "end" : "";
  };
  if (!strip.scrollHint) {
    strip.scrollHint = new window.ResizeObserver(update);
    strip.addEventListener("scroll", update, { passive: true });
  }
  // Watch the children too: a locale switch changes their width without resizing the strip.
  for (const el of [strip, ...strip.children]) strip.scrollHint.observe(el);
  update();
}

// ---------- Popovers (static elements in index.html, positioned next to their anchor) ----------
let openPopover = null;
export function closePopover(restoreFocus = false) {
  if (!openPopover) return;
  const { pop, anchor } = openPopover;
  pop.hidden = true;
  anchor.setAttribute("aria-expanded", "false");
  openPopover = null;
  if (restoreFocus) anchor.focus();
}
export function togglePopover(anchor, pop, build) {
  if (openPopover?.pop === pop) return closePopover(true);
  closePopover();
  if (build) build(pop);
  pop.hidden = false;
  const r = anchor.getBoundingClientRect();
  const w = pop.offsetWidth;
  const left = Math.max(8, Math.min(window.innerWidth - w - 8, r.right - w));
  css(pop, { top: r.bottom + 6 + "px", left: left + "px" });
  anchor.setAttribute("aria-expanded", "true");
  openPopover = { pop, anchor };
  (pop.querySelector(".menu-item:not(:disabled), input, button") ?? pop).focus?.();
}
document.addEventListener(
  "pointerdown",
  (e) => {
    if (!openPopover) return;
    if (openPopover.pop.contains(e.target) || openPopover.anchor.contains(e.target)) return;
    closePopover();
  },
  true,
);
document.addEventListener("keydown", (e) => {
  if (!openPopover) return;
  if (e.key === "Escape") {
    e.preventDefault();
    closePopover(true);
    return;
  }
  if (!["ArrowDown", "ArrowUp"].includes(e.key)) return;
  const items = [...openPopover.pop.querySelectorAll(".menu-item:not(:disabled)")];
  if (!items.length) return;
  e.preventDefault();
  const i = items.indexOf(document.activeElement);
  items[(i + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length].focus();
});
window.addEventListener("resize", () => closePopover());

// ---------- Dialogs ----------
export function confirmDialog({
  title,
  body,
  confirm = "OK",
  cancel = "キャンセル",
  tone = "default",
  iconName = tone === "danger" ? "alert" : "info",
  content,
}) {
  return new Promise((resolve) => {
    const ok = h(
      "button",
      { type: "button", class: "btn " + (tone === "danger" ? "btn-danger-solid" : "btn-primary") },
      confirm,
    );
    const no = h("button", { type: "button", class: "btn" }, cancel);
    const titleId = nextId("dlg");
    const dlg = h(
      "dialog",
      { class: "dialog", "aria-labelledby": titleId, dataset: { confirm: "true" } },
      h(
        "div",
        { class: "dialog-head" },
        h("span", { class: "dialog-icon " + (tone === "default" ? "" : tone) }, icon(iconName)),
        h(
          "div",
          {},
          h("h2", { class: "dialog-title", id: titleId }, title),
          body ? h("p", { class: "dialog-sub" }, body) : null,
        ),
      ),
      content ? h("div", { class: "dialog-body" }, content) : null,
      h("div", { class: "dialog-foot" }, no, ok),
    );
    // Resolve inside the click task: the "close" event is queued, and an action started in between
    // (e.g. a review request) would otherwise run before the confirmed change is applied.
    ok.addEventListener("click", () => {
      resolve(true);
      dlg.close();
    });
    no.addEventListener("click", () => dlg.close());
    dlg.addEventListener("close", () => {
      dlg.remove();
      resolve(false);
    });
    document.body.append(dlg);
    dlg.showModal();
    (tone === "danger" ? no : ok).focus();
  });
}

// ---------- Toast (keeps the last message in #notice; fades but stays readable to AT/tests) ----------
let fadeTimer;
// `quiet`: routine confirmations (autosave) update the live region without popping a toast.
export function toast(message, { quiet = false } = {}) {
  const el = $("notice");
  el.textContent = message;
  window.clearTimeout(fadeTimer);
  el.dataset.fade = String(quiet);
  if (!quiet) fadeTimer = window.setTimeout(() => (el.dataset.fade = "true"), 4500);
}

export const isVi = () => document.documentElement.lang.startsWith("vi");
// Locale-aware composite text (used inside translate="no" where user content is mixed in).
export const L = (ja, vi) => (isVi() ? vi : ja);

export function emptyState(iconName, title, text, ...actions) {
  return h(
    "div",
    { class: "empty" },
    h("div", { class: "empty-art" }, icon(iconName)),
    h("h3", {}, title),
    text ? h("p", {}, text) : null,
    actions.length ? h("div", { class: "row" }, ...actions) : null,
  );
}

export function callout(tone, iconName, ...content) {
  return h("div", { class: "callout callout-" + tone }, icon(iconName), h("div", {}, ...content));
}

// User content wrapper: never machine-translated by the chrome localizer.
export const userText = (text, cls = "") =>
  h("span", { translate: "no", class: cls || undefined }, text);
