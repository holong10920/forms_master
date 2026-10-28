import { classes } from "./recipes.js";
import { cartEditor } from "./cart-editor.js";
import { appearanceEditor } from "./appearance.js";
import { applyAppearance } from "../../../packages/static-runtime/src/appearance.ts";
import {
  APPROVED_IMAGES,
  APPROVED_LINKS,
} from "../../../packages/static-runtime/src/display-assets.ts";
// Build mode: outline + palette (left), canvas (center), inspector (right).
import {
  $,
  h,
  add,
  fill,
  icon,
  css,
  btn,
  field,
  input,
  textarea,
  select,
  toggle,
  segmented,
  tabs,
  scrollHint,
  togglePopover,
  closePopover,
  confirmDialog,
  callout,
  L,
} from "./ui.js";
import {
  S,
  emit,
  notice,
  canEdit,
  TYPES,
  TEXT_LIKE,
  PERSONAL_TYPES,
  typeLabel,
  typeIcon,
  fieldLabel,
  stepLabel,
  stepById,
  currentStep,
  fieldById,
  fieldOfContent,
  stepOfField,
  blockInstance,
  blockEntryFor,
  formSteps,
  formTitleText,
  ruleFields,
  setText,
  catalogText,
  lint,
  newId,
  clone,
  DISPLAY_TYPES,
  displayTypeLabel,
  displayText,
  displayById,
  displayBinding,
} from "./state.js";
import { ruleEditor, namedConditions, branches, skipEditor, commit, fieldUsage } from "./rules.js";
const ed = { leftTab: "outline", inspTab: {}, device: "desktop", drag: null };
export const editorState = ed;
// ---------- Selection / content helpers ----------
const contentKey = (c) =>
  c.field
    ? c.field
    : c.block
      ? "block:" + c.block
      : c.display
        ? "display:" + c.display.id
        : c.group;
const selectionKey = (sel) =>
  sel?.startsWith("block:") || sel?.startsWith("display:") ? sel : "$local:" + sel;
const keyToSelection = (key) => (key.startsWith("$local:") ? key.slice(7) : key);
// Section children are located through their section (`parent`), one level deep.
function locate(key) {
  for (const step of S.draft.steps) {
    const index = (step.content ?? []).findIndex((c) => contentKey(c) === key);
    if (index >= 0) return { step, index };
  }
  const child = key.startsWith("display:") ? displayById(key.slice(8)) : null;
  if (child?.parent)
    return {
      step: child.step,
      index: child.parent.children.indexOf(child.display),
      parent: child.parent,
    };
  return null;
}
export function select_(sel, { step } = {}) {
  S.selected = sel;
  if (step) S.currentStep = step;
  else if (sel && !sel.startsWith("step:")) {
    const at = locate(selectionKey(sel));
    if (at) S.currentStep = at.step.id;
  }
  emit("render");
}
const isSelectedKey = (key) => S.selected && selectionKey(S.selected) === key;
export function currentTheme() {
  const approved = (S.catalog.themes ?? []).filter((t) => t.site === S.draft.siteId);
  return approved.find((t) => t.id === S.draft.themeRef) ?? approved[0];
}
// ---------- Mutations ----------
export function addField(type, { stepId, index } = {}) {
  if (!S.draft || !canEdit()) return;
  let step = stepById(stepId ?? S.currentStep);
  if (step?.kind !== "form") step = formSteps()[0];
  if (!step) return notice("入力ステップを選択してください");
  const suffix = newId("", 12);
  const f = {
    id: "fld_" + suffix,
    key: "field_" + suffix,
    type,
    label: { ja: "新しいフィールド" },
    classification: PERSONAL_TYPES.includes(type) ? "personal" : "public",
    persist: "allowed",
    required: false,
  };
  if (type === "group") {
    f.id = "grp_" + suffix;
    f.key = "products_" + suffix;
    f.classification = "personal";
    delete f.required;
    f.minItems = 1;
    f.maxItems = 20;
    f.label = { ja: "商品一覧" };
    f.fields = [
      {
        id: "fld_item_title",
        key: "title",
        type: "text",
        label: { ja: "商品名" },
        classification: "personal",
        persist: "never",
        required: true,
      },
    ];
  }
  if (type.startsWith("choice.")) f.config = { presentation: "native" };
  if (type.startsWith("choice."))
    f.options = [
      { value: "yes", label: { ja: "はい" } },
      { value: "no", label: { ja: "いいえ" } },
    ];
  if (type === "calculated") {
    f.formula = { const: 0 };
    f.submit = "displayOnly";
  }
  if (type === "plugin:storeSel")
    S.draft.dependencies = {
      ...S.draft.dependencies,
      capabilities: {
        ...S.draft.dependencies?.capabilities,
        storeSel: {
          plugin: "@platform/store-selector",
          version: "1.0.0",
          capability: "storeSelector",
          kind: "fieldType",
        },
      },
    };
  const format = {
    email: "formatEmail",
    tel: "formatPhoneJP",
    postal: "formatPostalJP",
    katakana: "formatKatakana",
    date: "formatDate",
  }[type];
  if (format) f.validators = [{ use: format }];
  S.draft.fields.push(f);
  step.content.splice(
    index ?? step.content.length,
    0,
    f.type === "group" ? { group: "$local:" + f.id } : { field: "$local:" + f.id },
  );
  S.currentStep = step.id;
  S.selected = f.id;
  ed.inspTab.field = "basic";
  ed.focusLabel = true;
  commit();
  notice(L("フィールドを追加しました: ", "Đã thêm trường: ") + typeLabel(type));
}
// Inserts an input step at `position` among the input steps (default: last). The new step takes
// over the previous step's "next" so the flow stays connected; branches are left untouched.
export function addStep(position = formSteps().length, base) {
  if (!S.draft || !canEdit()) return;
  const forms = formSteps(),
    prior = forms[position - 1],
    id = "stp_" + newId("", 10);
  const next =
    prior?.transitions.find((t) => t.default)?.default ??
    forms[position]?.id ??
    S.draft.steps.find((s) => s.kind === "review").id;
  if (prior) prior.transitions = prior.transitions.map((t) => (t.default ? { default: id } : t));
  const step = { content: [], ...base, id, kind: "form", transitions: [{ default: next }] };
  const anchor = forms[position] ?? S.draft.steps.find((s) => s.kind === "review");
  S.draft.steps.splice(S.draft.steps.indexOf(anchor), 0, step);
  S.currentStep = id;
  S.selected = "step:" + id;
  commit();
  notice(L("ステップを追加しました", "Đã thêm bước"));
  return step;
}
// The default flow follows the step order: each input step whose "next" pointed at its old
// neighbour is re-linked to its new neighbour. Branches keep their targets; a branch that now
// points backwards is reported by the diagnostics instead of being silently rewritten.
function relinkDefaults(update) {
  const review = S.draft.steps.find((s) => s.kind === "review").id;
  const following = () => {
    const forms = formSteps();
    return new Map(forms.map((s, i) => [s, forms[i + 1]?.id ?? review]));
  };
  const before = following();
  update();
  const after = following();
  for (const [step, next] of before)
    for (const t of step.transitions ?? []) if (t.default === next) t.default = after.get(step);
}
export function moveStep(step, delta) {
  const forms = formSteps(),
    target = forms[forms.indexOf(step) + delta];
  if (!target || !canEdit()) return;
  relinkDefaults(() => {
    const steps = S.draft.steps,
      a = steps.indexOf(step),
      b = steps.indexOf(target);
    [steps[a], steps[b]] = [steps[b], steps[a]];
  });
  S.currentStep = step.id;
  ed.refocus = null;
  commit();
  notice(L("ステップを移動しました", "Đã di chuyển bước"));
}
// Copies an input step after the original. Fields and display components get new IDs/keys, and
// rules inside the copy are re-pointed at the copied fields. Shared blocks are not copied.
export function duplicateStep(step) {
  if (!canEdit()) return;
  const ids = new Map();
  const copyField = (f) => {
    const suffix = newId("", 12);
    const copy = {
      ...clone(f),
      id: (f.type === "group" ? "grp_" : "fld_") + suffix,
      key: f.key + "_copy_" + suffix.slice(0, 4),
    };
    ids.set("$local:" + f.id, "$local:" + copy.id);
    return copy;
  };
  const fields = [];
  const content = (step.content ?? []).flatMap((c) => {
    if (c.block) return [];
    if (c.display) return [{ display: renewDisplay(clone(c.display)) }];
    const f = fieldOfContent(c);
    if (!f) return [];
    const copy = copyField(f);
    fields.push(copy);
    return [f.type === "group" ? { group: "$local:" + copy.id } : { field: "$local:" + copy.id }];
  });
  const remap = (value) =>
    typeof value === "string"
      ? (ids.get(value) ?? value)
      : Array.isArray(value)
        ? value.map(remap)
        : value && typeof value === "object"
          ? Object.fromEntries(Object.entries(value).map(([k, v]) => [k, remap(v)]))
          : value;
  S.draft.fields.push(...fields.map(remap));
  const base = remap({
    content,
    ...(step.title ? { title: { ...step.title, ja: step.title.ja + "（コピー）" } } : {}),
    ...(step.description ? { description: step.description } : {}),
  });
  addStep(formSteps().indexOf(step) + 1, base);
  if (step.content?.some((c) => c.block))
    notice(L("共通ブロックは複製されません", "Khối dùng chung không được nhân bản"));
}
// ---------- Display components ----------
const DISPLAY_DEFAULTS = {
  heading: () => ({ text: { ja: "見出し" }, level: 2 }),
  text: () => ({ text: { ja: "説明文を入力してください" }, tone: "normal" }),
  image: (step) => ({
    asset: step.kind === "complete" ? "success" : "info",
    alt: { ja: "イメージ" },
    size: "medium",
  }),
  divider: () => ({}),
  spacer: () => ({ size: "medium" }),
  fieldValue: () => {
    const f = S.draft.fields.find((x) => x.type !== "group" && x.classification === "public");
    return f ? { field: "$local:" + f.id } : null;
  },
  groupSummary: () => {
    const g = S.draft.fields.find((x) => x.type === "group");
    return g ? { group: "$local:" + g.id } : null;
  },
  summary: () => ({}),
  section: () => ({ title: { ja: "セクション" }, children: [] }),
  reference: () => ({}),
  button: (step) =>
    step.kind === "complete"
      ? { label: { ja: "トップへ戻る" }, action: "link", link: "home", variant: "primary" }
      : { label: { ja: "よくある質問" }, action: "link", link: "faq", variant: "secondary" },
};
const newDisplayId = () => "dsp_" + newId("", 12);
function renewDisplay(d) {
  d.id = newDisplayId();
  for (const child of d.children ?? []) child.id = newDisplayId();
  return d;
}
export function addDisplay(type, { stepId, index, parent } = {}) {
  if (!S.draft || !canEdit()) return;
  const step = stepById(stepId ?? S.currentStep);
  if (!step) return;
  if (type === "reference" && step.kind !== "complete")
    return notice(
      L("受付番号は完了画面にだけ置けます", "Mã tiếp nhận chỉ đặt ở màn hình hoàn tất"),
    );
  if (parent && type === "section")
    return notice(L("セクションの中にセクションは置けません", "Không lồng khu vực"));
  const props = DISPLAY_DEFAULTS[type]?.(step);
  if (!props)
    return notice(
      type === "groupSummary"
        ? L("商品一覧（繰り返し項目）がまだありません", "Chưa có danh sách lặp lại")
        : L("表示できる公開項目がまだありません", "Chưa có trường công khai để hiển thị"),
    );
  const d = { id: newDisplayId(), type, ...props };
  if (parent) parent.children.splice(index ?? parent.children.length, 0, d);
  else (step.content ??= []).splice(index ?? step.content.length, 0, { display: d });
  S.currentStep = step.id;
  S.selected = "display:" + d.id;
  ed.inspTab.display = "basic";
  commit();
  notice(L("表示部品を追加しました: ", "Đã thêm thành phần: ") + displayTypeLabel(type));
}
export function duplicateDisplay(id) {
  const at = displayById(id);
  if (!at || !canEdit()) return;
  const copy = renewDisplay(clone(at.display));
  if (at.parent) at.parent.children.splice(at.parent.children.indexOf(at.display) + 1, 0, copy);
  else {
    const index = at.step.content.findIndex((c) => c.display === at.display);
    at.step.content.splice(index + 1, 0, { display: copy });
  }
  S.selected = "display:" + copy.id;
  commit();
}
export function deleteDisplay(id) {
  const at = displayById(id);
  if (!at || !canEdit()) return;
  if (at.parent) at.parent.children = at.parent.children.filter((d) => d !== at.display);
  else at.step.content = at.step.content.filter((c) => c.display !== at.display);
  S.selected = at.parent ? "display:" + at.parent.id : null;
  commit();
  notice(L("表示部品を削除しました", "Đã xóa thành phần"));
}
export function insertBlock(pin) {
  if (!S.draft || !canEdit()) return;
  let step = currentStep();
  if (step?.kind !== "form") step = formSteps()[0];
  const entry = S.catalog.blocks.find((b) => b.pin === pin);
  if (!entry || ["vulnerable", "unknown"].includes(entry.state))
    return notice("ブロックが利用できません");
  const suffix = newId(""),
    id = "inst_" + suffix,
    dep = "block_" + suffix;
  const used = new Set((S.draft.blockInstances ?? []).map((i) => i.alias));
  let alias = "customer";
  for (let n = 2; used.has(alias); n++) alias = "customer" + n;
  S.draft.dependencies = {
    ...S.draft.dependencies,
    blocks: { ...S.draft.dependencies?.blocks, [dep]: entry.pin },
  };
  S.draft.blockInstances = [
    ...(S.draft.blockInstances ?? []),
    { id, alias, block: dep, inputs: {} },
  ];
  step.content.push({ block: id });
  S.currentStep = step.id;
  S.selected = "block:" + id;
  commit();
  notice(L("共通ブロックを挿入しました", "Đã chèn khối dùng chung"));
}
export function moveContent(key, toStepId, toIndex) {
  const from = locate(key);
  const to = stepById(toStepId);
  if (!from || from.parent || !to || (to.kind !== "form" && !key.startsWith("display:"))) return;
  const [item] = from.step.content.splice(from.index, 1);
  let index = toIndex;
  if (from.step === to && from.index < toIndex) index--;
  to.content.splice(Math.max(0, Math.min(index, to.content.length)), 0, item);
  S.currentStep = to.id;
  commit();
}
// Keyboard/button reorder; at the edge of a step the item moves into the neighbouring input step.
export function moveBy(key, delta) {
  const at = locate(key);
  if (!at || !canEdit()) return;
  const steps = formSteps();
  const target = at.index + delta;
  const list = at.parent ? at.parent.children : at.step.content;
  if (target >= 0 && target < list.length) {
    const [item] = list.splice(at.index, 1);
    list.splice(target, 0, item);
  } else {
    if (at.parent || at.step.kind !== "form") return;
    const neighbour = steps[steps.indexOf(at.step) + delta];
    if (!neighbour) return;
    const [item] = at.step.content.splice(at.index, 1);
    if (delta < 0) neighbour.content.push(item);
    else neighbour.content.unshift(item);
    S.currentStep = neighbour.id;
    notice(L("「", "Đã chuyển sang 「") + stepLabel(neighbour) + L("」へ移動しました", "」"));
  }
  ed.refocus = key;
  commit();
}
export function duplicateField(id) {
  const f = fieldById(id);
  const at = locate("$local:" + id);
  if (!f || !at || !canEdit()) return;
  const suffix = newId("", 12);
  const copy = {
    ...clone(f),
    id: (f.type === "group" ? "grp_" : "fld_") + suffix,
    key: f.key + "_copy_" + suffix.slice(0, 4),
  };
  copy.label = { ...copy.label, ja: (f.label?.ja ?? "") + "（コピー）" };
  S.draft.fields.push(copy);
  at.step.content.splice(
    at.index + 1,
    0,
    copy.type === "group" ? { group: "$local:" + copy.id } : { field: "$local:" + copy.id },
  );
  S.selected = copy.id;
  commit();
  notice(L("フィールドを複製しました", "Đã nhân bản trường"));
}
export async function deleteField(id) {
  const f = fieldById(id);
  if (!f || !canEdit()) return;
  const refs = fieldUsage(id);
  const ok = await confirmDialog({
    title: L("「", "Xóa trường 「") + fieldLabel(f) + L("」を削除しますか？", "」?"),
    body: refs
      ? L(
          `このフィールドを参照する条件・計算が ${refs} 件あります。削除後は診断で修正が必要です。`,
          `Có ${refs} điều kiện/phép tính tham chiếu trường này. Sau khi xóa cần sửa theo chẩn đoán.`,
        )
      : L("この操作は元に戻せません。", "Không thể hoàn tác thao tác này."),
    confirm: "削除",
    tone: "danger",
  });
  if (!ok) return;
  S.draft.fields = S.draft.fields.filter((x) => x.id !== f.id);
  for (const s of S.draft.steps)
    if (s.content) s.content = s.content.filter((c) => (c.field ?? c.group) !== "$local:" + f.id);
  if (
    !S.draft.fields.some((x) => x.type === "plugin:storeSel") &&
    S.draft.dependencies?.capabilities
  )
    delete S.draft.dependencies.capabilities.storeSel;
  S.selected = null;
  commit();
  notice(L("フィールドを削除しました", "Đã xóa trường"));
}
export async function deleteBlock(instanceId) {
  const instance = blockInstance(instanceId);
  if (!instance || !canEdit()) return;
  const refs = JSON.stringify(S.draft).split(instance.id + ":@").length - 1;
  const ok = await confirmDialog({
    title: L("共通ブロック「", "Xóa khối 「") + instance.alias + L("」を削除しますか？", "」?"),
    body: refs
      ? `参照 ${refs} 件が残ります。削除後は診断で修正が必要です。`
      : "ブロックはこのフォームから外れます。他のフォームは変更されません。",
    confirm: "削除",
    tone: "danger",
  });
  if (!ok) return;
  S.draft.blockInstances = S.draft.blockInstances.filter((i) => i.id !== instance.id);
  for (const s of S.draft.steps)
    if (s.content) s.content = s.content.filter((c) => c.block !== instance.id);
  S.draft.dependencies.blocks = Object.fromEntries(
    Object.entries(S.draft.dependencies.blocks).filter(([k]) => k !== instance.block),
  );
  S.selected = null;
  commit();
}
async function deleteStep(step) {
  const forms = formSteps();
  if (forms.length <= 1) return notice("入力ステップは最低 1 つ必要です");
  const count = (step.content ?? []).length;
  const ok = await confirmDialog({
    title: L("「", "Xóa 「") + stepLabel(step) + L("」を削除しますか？", "」?"),
    body: count
      ? L(
          `このステップの項目 ${count} 件も削除されます。このステップへの移動は次のステップへ付け替えます。`,
          `${count} mục trong bước này cũng sẽ bị xóa. Các chuyển hướng tới bước này sẽ chuyển sang bước tiếp theo.`,
        )
      : L(
          "このステップへの移動は次のステップへ付け替えます。",
          "Các chuyển hướng tới bước này sẽ chuyển sang bước tiếp theo.",
        ),
    confirm: "削除",
    tone: "danger",
  });
  if (!ok) return;
  const fallback = step.transitions.find((t) => !t.when)?.default ?? "";
  for (const s of S.draft.steps)
    for (const t of s.transitions ?? []) {
      if (t.default === step.id) t.default = fallback;
      if (t.to === step.id) t.to = fallback;
    }
  const removed = new Set(
    (step.content ?? [])
      .filter((c) => c.field || c.group)
      .map((c) => (c.field ?? c.group).replace("$local:", "")),
  );
  S.draft.fields = S.draft.fields.filter((f) => !removed.has(f.id));
  const blocks = new Set((step.content ?? []).filter((c) => c.block).map((c) => c.block));
  for (const instance of S.draft.blockInstances?.filter((i) => blocks.has(i.id)) ?? [])
    delete S.draft.dependencies?.blocks?.[instance.block];
  if (blocks.size) S.draft.blockInstances = S.draft.blockInstances.filter((i) => !blocks.has(i.id));
  const index = forms.indexOf(step);
  S.draft.steps = S.draft.steps.filter((s) => s !== step);
  S.currentStep = formSteps()[Math.max(0, index - 1)].id;
  S.selected = null;
  commit();
}
// ---------- Rendering ----------
// Re-rendering replaces DOM nodes; remember what had focus so keyboard users keep their place.
const REGIONS = "#left-panel, #stepper, #canvas, #inspector-head, #inspector-tabs, #inspector";
const accessibleName = (el) =>
  el.getAttribute("aria-label") ?? el.labels?.[0]?.textContent ?? el.textContent.trim();
function focusMemo() {
  const el = document.activeElement;
  if (!el || el === document.body) return null;
  if (el.dataset.focusKey) return { key: el.dataset.focusKey };
  if (el.id && !/^(f|ui|dlg|hint)-\d+$/.test(el.id)) return { id: el.id };
  const region = el.closest(REGIONS);
  if (!region) return null;
  const name = accessibleName(el);
  const same = [...region.querySelectorAll(el.tagName)].filter((x) => accessibleName(x) === name);
  return {
    region: region.id,
    tag: el.tagName,
    name,
    index: same.indexOf(el),
    toolbar: !!el.closest(".cv-toolbar"),
  };
}
function restoreFocus(memo) {
  if (!memo || (document.activeElement && document.activeElement !== document.body)) return;
  let el = null;
  if (ed.refocus) {
    const prefix = memo.key?.startsWith("ol:") ? "ol:" : "cv:";
    el = document.querySelector(`[data-focus-key="${window.CSS.escape(prefix + ed.refocus)}"]`);
    if (memo.toolbar && el) {
      const again = el
        .closest(".cv-block")
        ?.querySelector(
          `.cv-toolbar [aria-label="${window.CSS.escape(memo.name)}"]:not(:disabled)`,
        );
      el = again ?? el;
    }
  }
  if (!el && memo.key)
    el = document.querySelector(`[data-focus-key="${window.CSS.escape(memo.key)}"]`);
  if (!el && memo.id) el = document.getElementById(memo.id);
  if (!el && memo.region) {
    const same = [...($(memo.region)?.querySelectorAll(memo.tag) ?? [])].filter(
      (x) => accessibleName(x) === memo.name,
    );
    el = same[memo.index] ?? same[0] ?? null;
  }
  el?.focus({ preventScroll: false });
}
export function renderBuild() {
  if (!S.draft) return;
  if (!currentStep()) S.currentStep = S.draft.steps[0].id;
  if (S.selected?.startsWith("step:") && !stepById(S.selected.slice(5))) S.selected = null;
  if (S.selected && !S.selected.startsWith("step:") && !locate(selectionKey(S.selected)))
    S.selected = null;
  const memo = ed.focusLabel ? null : focusMemo();
  renderLeft();
  renderStage();
  renderInspector();
  restoreFocus(memo);
  ed.refocus = null;
}
// Partial refresh while typing: never rebuild the region that holds the focused input.
export function refresh(except) {
  renderOutline();
  renderStepper();
  if (except !== "canvas") renderCanvas();
  if (except !== "inspector") renderInspector();
  else renderInspectorHead();
}
function renderLeft() {
  const editable = canEdit();
  const items = [["outline", "構成"]];
  if (editable) items.push(["add", "追加"]);
  if (!editable) ed.leftTab = "outline";
  tabs($("left-tabs"), items, ed.leftTab, (key) => {
    ed.leftTab = key;
    renderLeft();
    $("left-tabs").querySelector('[aria-selected="true"]')?.focus();
  });
  $("steps").hidden = ed.leftTab !== "outline";
  $("palette").hidden = ed.leftTab !== "add";
  renderOutline();
  renderPalette();
}
function itemAria(f, required) {
  return `${fieldLabel(f)}${required ? " *" : ""} · ${typeLabel(f.type)}`;
}
function renderOutline() {
  const box = $("steps");
  const editable = canEdit();
  const list = h("ol", { class: "outline", "aria-label": "フォームの構成" });
  let n = 0;
  for (const step of S.draft.steps) {
    const isForm = step.kind === "form";
    if (isForm) n++;
    const head = h(
      "button",
      {
        type: "button",
        class: "ol-step-head",
        translate: "no",
        "aria-pressed": String(S.selected === "step:" + step.id),
        "aria-label":
          stepLabel(step) +
          (isForm
            ? L(` · ${step.content?.length ?? 0} 項目`, ` · ${step.content?.length ?? 0} mục`)
            : ""),
        dataset: { focusKey: "ol-step:" + step.id },
        onclick: () => select_("step:" + step.id, { step: step.id }),
      },
      h(
        "span",
        { class: "ol-num", "aria-hidden": "true" },
        isForm ? String(n) : icon(step.kind === "review" ? "review" : "flag"),
      ),
      h("span", { class: "ol-name" }, stepLabel(step)),
      isForm
        ? h("span", { class: "ol-count", "aria-hidden": "true" }, String(step.content?.length ?? 0))
        : null,
    );
    const forms = formSteps();
    const li = h(
      "li",
      {
        class: "ol-step",
        dataset: {
          stepId: step.id,
          current: String(step.id === S.currentStep),
          system: String(!isForm),
        },
      },
      head,
      editable && isForm && forms.length > 1
        ? h(
            "span",
            { class: "ol-tools", translate: "no" },
            btn("", () => moveStep(step, -1), {
              variant: "ghost",
              size: "sm",
              iconName: "up",
              aria: L(
                "「" + stepLabel(step) + "」を前へ移動",
                "Chuyển 「" + stepLabel(step) + "」lên",
              ),
            }),
            btn("", () => moveStep(step, 1), {
              variant: "ghost",
              size: "sm",
              iconName: "down",
              aria: L(
                "「" + stepLabel(step) + "」を後ろへ移動",
                "Chuyển 「" + stepLabel(step) + "」xuống",
              ),
            }),
          )
        : null,
    );
    const items = h("ol", { class: "ol-items" });
    (step.content ?? []).forEach((c, index) => add(items, outlineItem(step, c, index, editable)));
    if (!step.content?.length)
      add(
        items,
        h(
          "li",
          { class: "ol-empty" },
          isForm ? "フィールドなし" : L("既定の表示", "Hiển thị mặc định"),
        ),
      );
    add(li, items);
    if (editable) dropTarget(li, step, () => step.content.length, true);
    add(list, li);
  }
  fill(box, list);
  if (editable)
    add(
      box,
      h(
        "div",
        { class: "row", dataset: { pad: "top" } },
        btn("ステップを追加", () => addStep(), {
          variant: "ghost",
          size: "sm",
          iconName: "plus",
          id: "add-step",
        }),
      ),
    );
}
function outlineItem(step, c, index, editable) {
  const key = contentKey(c);
  let label, typeName, aria;
  if (c.field || c.group) {
    const f = fieldOfContent(c);
    label = f ? fieldLabel(f) : c.field;
    typeName = f?.type;
    aria = f ? itemAria(f, f.required) : label;
  } else if (c.block) {
    const instance = blockInstance(c.block);
    label = (instance?.alias ?? c.block) + L("（共通ブロック）", " (khối dùng chung)");
    typeName = "block";
    aria = label;
  } else if (c.display) {
    label = displayText(c.display);
    typeName = "display:" + c.display.type;
    aria = label + " · " + displayTypeLabel(c.display.type);
  } else {
    label = L("グループ", "Nhóm") + " · " + c.group;
    typeName = "group";
    aria = label;
  }
  const li = h(
    "li",
    {
      class: "ol-item",
      draggable: editable ? "true" : undefined,
      dataset: c.field
        ? { fieldId: c.field.replace("$local:", ""), key }
        : c.block
          ? { blockId: c.block, key }
          : c.display
            ? { displayId: c.display.id, key }
            : { key },
    },
    editable ? h("span", { class: "drag-handle", "aria-hidden": "true" }, icon("grip")) : null,
    h(
      "button",
      {
        type: "button",
        class: "ol-item-btn",
        translate: "no",
        "aria-pressed": String(isSelectedKey(key)),
        "aria-label": aria,
        "aria-keyshortcuts": editable ? "Alt+ArrowUp Alt+ArrowDown" : undefined,
        dataset: { focusKey: "ol:" + key },
        onclick: () => select_(keyToSelection(key)),
        onkeydown: (e) => {
          if (!editable || !e.altKey || !["ArrowUp", "ArrowDown"].includes(e.key)) return;
          e.preventDefault();
          moveBy(key, e.key === "ArrowUp" ? -1 : 1);
        },
      },
      h(
        "span",
        { class: "ol-type", "aria-hidden": "true" },
        icon(
          typeName === "block"
            ? "box"
            : typeName === "group"
              ? "layers"
              : typeName.startsWith("display:")
                ? DISPLAY_TYPES[typeName.slice(8)]?.icon
                : typeIcon(typeName),
        ),
      ),
      h("span", { class: "ol-name" }, label),
    ),
    editable
      ? h(
          "span",
          { class: "ol-tools", translate: "no" },
          btn("", () => moveBy(key, -1), {
            variant: "ghost",
            size: "sm",
            iconName: "up",
            aria: L("「" + label + "」を上へ移動", "Chuyển 「" + label + "」lên"),
          }),
          btn("", () => moveBy(key, 1), {
            variant: "ghost",
            size: "sm",
            iconName: "down",
            aria: L("「" + label + "」を下へ移動", "Chuyển 「" + label + "」xuống"),
          }),
        )
      : null,
  );
  if (editable) {
    dragSource(li, key);
    dropTarget(li, step, () => index);
  }
  return li;
}
// ---------- Drag and drop (outline + canvas share the same model) ----------
function clearDrop() {
  for (const el of document.querySelectorAll("[data-drop]")) delete el.dataset.drop;
}
function dragSource(el, key) {
  el.addEventListener("dragstart", (e) => {
    ed.drag = key;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", key);
    el.classList.add("dragging");
  });
  el.addEventListener("dragend", () => {
    ed.drag = null;
    el.classList.remove("dragging");
    clearDrop();
  });
}
function dropTarget(el, step, indexOf, container = false) {
  el.addEventListener("dragover", (e) => {
    if (!ed.drag) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    clearDrop();
    if (container) el.dataset.drop = "into";
    else {
      const r = el.getBoundingClientRect();
      el.dataset.drop = e.clientY < r.top + r.height / 2 ? "before" : "after";
    }
  });
  el.addEventListener("dragleave", (e) => {
    if (!el.contains(e.relatedTarget)) delete el.dataset.drop;
  });
  el.addEventListener("drop", (e) => {
    if (!ed.drag) return;
    e.preventDefault();
    e.stopPropagation();
    const where = el.dataset.drop;
    clearDrop();
    const key = ed.drag;
    ed.drag = null;
    moveContent(key, step.id, indexOf() + (where === "after" ? 1 : 0));
  });
}
// ---------- Palette ----------
const GROUPS = [
  ["basic", "基本"],
  ["choice", "選択"],
  ["contact", "連絡先・個人情報"],
  ["advanced", "高度な項目"],
];
function blockTitle(entry) {
  const id = entry.block.blockId ?? entry.pin.split("@")[0];
  return id.replace(/^blk_/, "").replaceAll("_", " ");
}
const DISPLAY_GROUPS = [
  ["display", L("表示", "Hiển thị")],
  ["layout", L("レイアウト", "Bố cục")],
  ["system", L("システム操作", "Thao tác hệ thống")],
];
const displayTypesIn = (group) =>
  Object.keys(DISPLAY_TYPES).filter((t) => DISPLAY_TYPES[t].group === group);
function displayPaletteItem(t, onAdd) {
  return h(
    "button",
    {
      type: "button",
      class: "palette-item",
      translate: "no",
      dataset: { addDisplay: t },
      title: L("現在のステップに追加", "Thêm vào bước hiện tại"),
      onclick: onAdd,
    },
    h("span", { class: "ol-type", "aria-hidden": "true" }, icon(DISPLAY_TYPES[t].icon)),
    h("span", {}, displayTypeLabel(t)),
  );
}
function renderPalette() {
  const box = $("palette");
  if (!canEdit()) return fill(box);
  const types = [
    ...(S.schema?.$defs?.Field?.properties?.type?.enum ?? Object.keys(TYPES)),
    "group",
  ];
  const inputStep = currentStep()?.kind === "form";
  fill(
    box,
    h("h2", { class: "section-title" }, L("入力項目", "Trường nhập")),
    inputStep
      ? null
      : h(
          "p",
          { class: "small muted" },
          L(
            "確認・完了画面には入力項目を置けません。追加先は最初の入力ステップになります。",
            "Màn hình xác nhận/hoàn tất không chứa trường nhập; trường sẽ được thêm vào bước nhập đầu tiên.",
          ),
        ),
    ...GROUPS.map(([group, title]) =>
      h(
        "div",
        { class: "palette-group" },
        h("h3", { class: "section-title" }, title),
        h(
          "div",
          { class: "palette-grid" },
          types
            .filter((t) => TYPES[t]?.group === group)
            .map((t) =>
              h(
                "button",
                {
                  type: "button",
                  class: "palette-item",
                  translate: "no",
                  dataset: { addType: t },
                  title: L("現在のステップに追加", "Thêm vào bước hiện tại"),
                  onclick: () => addField(t),
                },
                h("span", { class: "ol-type", "aria-hidden": "true" }, icon(typeIcon(t))),
                h("span", {}, typeLabel(t)),
              ),
            ),
        ),
      ),
    ),
    ...DISPLAY_GROUPS.map(([group, title]) =>
      h(
        "div",
        { class: "palette-group", dataset: { paletteGroup: group } },
        h("h2", { class: "section-title" }, title),
        h(
          "div",
          { class: "palette-grid" },
          displayTypesIn(group).map((t) => displayPaletteItem(t, () => addDisplay(t))),
        ),
      ),
    ),
    h(
      "div",
      { class: "palette-group" },
      h("h3", { class: "section-title" }, "共通ブロック"),
      ...S.catalog.blocks.map((entry) => {
        const usable = !["vulnerable", "unknown"].includes(entry.state);
        return h(
          "div",
          { class: "block-card", dataset: { blockPin: entry.pin } },
          h(
            "div",
            { class: "row" },
            h("span", { class: "ol-type", "aria-hidden": "true" }, icon("box")),
            h("h4", { translate: "no" }, blockTitle(entry)),
            h("span", { class: "spacer" }),
            h(
              "span",
              { class: "chip " + (usable ? "chip-success" : "chip-danger") },
              usable ? "利用可" : "利用不可",
            ),
          ),
          h(
            "p",
            { class: "small muted", translate: "no" },
            entry.pin + " · " + entry.block.fields.map((f) => f.label?.ja ?? f.key).join("、"),
          ),
          usable
            ? btn("挿入", () => insertBlock(entry.pin), {
                size: "sm",
                iconName: "plus",
                aria: L("共通ブロック ", "Chèn khối ") + entry.pin + L(" を挿入", ""),
              })
            : h("p", { class: "small" }, "ブロックが利用できません"),
        );
      }),
    ),
  );
}
// ---------- Stage: stepper, device toggle, canvas ----------
function renderStage() {
  renderStepper();
  const device = $("device-toggle");
  device.dataset.ui = "true";
  fill(
    device,
    segmented(
      "device",
      "表示サイズ",
      [
        ["desktop", "PC", "monitor"],
        ["mobile", "スマホ", "phone"],
      ],
      ed.device,
      (value) => {
        ed.device = value;
        $("canvas-frame").dataset.device = value;
      },
    ),
  );
  $("canvas-frame").dataset.device = ed.device;
  fill($("toggle-left"), icon("layers"));
  fill($("toggle-right"), icon("settings"));
  const workspace = $("mode-build");
  const setPanel = (side, restoreFocus = false) => {
    const previous = workspace.dataset.panel;
    workspace.dataset.panel = side;
    for (const name of ["left", "right"]) {
      $("toggle-" + name).setAttribute("aria-expanded", String(side === name));
    }
    if (side) $("close-" + side).focus();
    else if (restoreFocus && previous) $("toggle-" + previous).focus();
  };
  for (const side of ["left", "right"]) {
    const toggle = $("toggle-" + side);
    toggle.setAttribute("aria-controls", side + "-panel");
    toggle.setAttribute("aria-expanded", String(workspace.dataset.panel === side));
    toggle.onclick = () => setPanel(workspace.dataset.panel === side ? "" : side);
    const close = $("close-" + side);
    close.setAttribute("aria-label", L("パネルを閉じる", "Đóng bảng"));
    fill(close, icon("x"));
    close.onclick = () => setPanel("", true);
  }
  $("left-panel-title").textContent = L("構成とフィールド", "Cấu trúc và trường");
  $("right-panel-title").textContent = L("プロパティ", "Thuộc tính");
  workspace.onkeydown = (event) => {
    if (event.key === "Escape" && workspace.dataset.panel) {
      event.preventDefault();
      setPanel("", true);
    }
  };
  renderCanvas();
}
function renderStepper() {
  const box = $("stepper");
  fill(box);
  let n = 0;
  S.draft.steps.forEach((step, i) => {
    if (i) add(box, h("span", { class: "step-arrow", "aria-hidden": "true" }, icon("chevR")));
    const isForm = step.kind === "form";
    if (isForm) n++;
    add(
      box,
      h(
        "span",
        { role: "listitem" },
        h(
          "button",
          {
            type: "button",
            class: "step-pill",
            translate: "no",
            "aria-current": step.id === S.currentStep ? "step" : undefined,
            dataset: { system: String(!isForm), focusKey: "pill:" + step.id },
            onclick: () => {
              S.currentStep = step.id;
              if (S.selected && !S.selected.startsWith("step:")) S.selected = null;
              else if (S.selected) S.selected = "step:" + step.id;
              emit("render");
            },
          },
          h(
            "span",
            { class: "ol-num", "aria-hidden": "true" },
            isForm ? String(n) : icon(step.kind === "review" ? "review" : "flag"),
          ),
          h("span", {}, stepLabel(step)),
        ),
      ),
    );
  });
  scrollHint(box);
  box
    .querySelector('[aria-current="step"]')
    ?.scrollIntoView({ block: "nearest", inline: "nearest" });
}
const optionLabel = (o) => o.label?.ja ?? o.value;
function mockControl(f) {
  const ph = f.placeholder?.ja ?? "";
  switch (f.type) {
    case "group":
      return h(
        "div",
        { class: "cv-control" },
        "商品一覧 · " + f.fields.length + " 項目 · 追加 / 編集 / 削除",
      );
    case "textarea":
      return h("div", { class: "cv-control tall" }, ph);
    case "boolean":
      return h(
        "div",
        { class: "cv-option" },
        h("span", { class: "cv-box" }),
        h("span", {}, L("チェックを入れる", "Đánh dấu chọn")),
      );
    case "choice.radio":
    case "choice.checkboxes": {
      const mark = f.type === "choice.radio" ? "cv-dot" : "cv-box";
      const shown = (f.options ?? []).slice(0, 6);
      return h(
        "div",
        { class: "cv-options" },
        shown.map((o) =>
          h("div", { class: "cv-option" }, h("span", { class: mark }), optionLabel(o)),
        ),
        (f.options?.length ?? 0) > 6
          ? h(
              "div",
              { class: "cv-help" },
              L(`ほか ${f.options.length - 6} 件`, `và ${f.options.length - 6} mục khác`),
            )
          : null,
        !f.options?.length
          ? h("div", { class: "cv-help" }, L("選択肢がありません", "Chưa có lựa chọn"))
          : null,
      );
    }
    case "choice.select":
      return h(
        "div",
        { class: "cv-control select-like" },
        S.draft.texts?.selectPrompt?.ja ?? (catalogText("selectPrompt") || "選択してください"),
        icon("chevD"),
      );
    case "calculated":
      return h(
        "div",
        { class: "cv-control select-like" },
        L("自動計算された値が表示されます", "Hiển thị giá trị tính tự động"),
        icon("calc"),
      );
    case "plugin:storeSel":
      return h(
        "div",
        { class: "cv-plugin" },
        icon("store"),
        h(
          "span",
          {},
          L(
            "店舗選択（プラグイン）· 実際の動作はプレビューで確認できます",
            "Chọn cửa hàng (plugin) · Xem hoạt động thực tế trong bản xem trước",
          ),
        ),
      );
    default:
      return h("div", { class: "cv-control" }, ph);
  }
}
function badges(f) {
  const out = [];
  if (f.visibleWhen) out.push(["chip-info", L("条件付き表示", "Hiển thị có điều kiện")]);
  if (f.requiredWhen) out.push(["chip-warning", L("条件付き必須", "Bắt buộc có điều kiện")]);
  if (f.submit === "displayOnly") out.push(["", L("送信しない", "Không gửi")]);
  if (f.classification === "secret") out.push(["chip-danger", L("機密", "Bí mật")]);
  return h(
    "span",
    { class: "cv-badges" },
    out.map(([cls, text]) => h("span", { class: "chip " + cls }, text)),
  );
}
function startRename(block, f) {
  const labelEl = block.querySelector(".cv-label");
  if (!labelEl || !canEdit()) return;
  const editor = input(f.label?.ja ?? "", {
    cls: "inline-input cv-inline-edit",
    "aria-label": "表示名を編集",
    translate: "no",
  });
  let done = false;
  const finish = (save) => {
    if (done) return;
    done = true;
    const value = editor.value.trim();
    if (save && value && value !== f.label?.ja) {
      f.label = { ...f.label, ja: value };
      ed.refocus = "$local:" + f.id;
      commit();
    } else {
      ed.refocus = "$local:" + f.id;
      emit("render");
    }
  };
  editor.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      finish(true);
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      finish(false);
    }
  });
  editor.addEventListener("blur", () => finish(true));
  labelEl.replaceWith(editor);
  editor.focus();
  editor.select();
}
function toolbar(key, f) {
  const at = locate(key);
  const steps = formSteps();
  // Items inside a section or on the confirmation/completion screens stay where they are.
  const fixed = at.parent || at.step.kind !== "form";
  const length = (at.parent?.children ?? at.step.content).length;
  const first = at.index === 0 && (fixed || steps.indexOf(at.step) === 0);
  const last = at.index === length - 1 && (fixed || steps.indexOf(at.step) === steps.length - 1);
  const display = key.startsWith("display:") ? key.slice(8) : null;
  const tool = (iconName, label, fn, disabled) =>
    h(
      "button",
      {
        type: "button",
        "aria-label": label,
        title: label,
        disabled,
        onclick: (e) => {
          e.stopPropagation();
          fn();
        },
      },
      icon(iconName),
    );
  return h(
    "div",
    { class: "cv-toolbar", role: "toolbar", "aria-label": "フィールド操作" },
    tool("up", "上へ移動", () => moveBy(key, -1), first),
    tool("down", "下へ移動", () => moveBy(key, 1), last),
    f || display
      ? tool("copy", "複製", () => (f ? duplicateField(f.id) : duplicateDisplay(display)))
      : null,
    f
      ? tool("pencil", "名前を変更", () =>
          startRename(document.querySelector(`.cv-block[data-key="${window.CSS.escape(key)}"]`), f),
        )
      : null,
    tool("trash", "削除", () =>
      f ? deleteField(f.id) : display ? deleteDisplay(display) : deleteBlock(key.slice(6)),
    ),
  );
}
function insertPoint(step, index, parent) {
  const label = L("ここに項目を追加", "Thêm mục tại đây");
  return h(
    "div",
    { class: "cv-insert" },
    h(
      "button",
      {
        type: "button",
        "aria-label": label,
        "aria-haspopup": "true",
        "aria-expanded": "false",
        title: label,
        onclick: (e) => openInsertMenu(e.currentTarget, step.id, index, parent),
      },
      icon("plus"),
    ),
  );
}
let insertMenu;
function openInsertMenu(anchor, stepId, index, parent) {
  insertMenu ??= document.body.appendChild(
    h("div", {
      class: "popover",
      id: "insert-menu",
      role: "menu",
      "aria-label": "フィールドを追加",
      hidden: true,
    }),
  );
  anchor.setAttribute("aria-controls", "insert-menu");
  const types = [
    ...(S.schema?.$defs?.Field?.properties?.type?.enum ?? Object.keys(TYPES)),
    "group",
  ];
  const inputs = !parent && stepById(stepId)?.kind === "form";
  const item = (iconName, label, fn) =>
    h(
      "button",
      {
        type: "button",
        class: "menu-item",
        role: "menuitem",
        translate: "no",
        onclick: () => {
          closePopover();
          fn();
        },
      },
      icon(iconName),
      label,
    );
  togglePopover(anchor, insertMenu, (pop) =>
    fill(
      pop,
      ...(inputs
        ? types.map((t) => item(typeIcon(t), typeLabel(t), () => addField(t, { stepId, index })))
        : []),
      ...Object.keys(DISPLAY_TYPES)
        .filter((t) => !(parent && t === "section"))
        .map((t) =>
          item(DISPLAY_TYPES[t].icon, displayTypeLabel(t), () =>
            addDisplay(t, { stepId, index, parent }),
          ),
        ),
    ),
  );
}
// Studio mock of a display component; the published runtime renders the same typed data.
function displayMock(d) {
  const text = (v) => v?.ja ?? "";
  const bound = displayBinding(d) && fieldById(displayBinding(d).slice(7));
  switch (d.type) {
    case "heading":
      return h(d.level === 3 ? "h4" : "h3", {}, text(d.text));
    case "text":
      return h("p", { dataset: { tone: d.tone ?? "normal" } }, text(d.text));
    case "image": {
      const px = { small: 48, medium: 96, large: 160 }[d.size ?? "medium"];
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      for (const [k, v] of Object.entries({
        viewBox: "0 0 24 24",
        width: px,
        height: px,
        fill: "none",
        stroke: "currentColor",
        "stroke-width": 1.6,
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        role: "img",
        "aria-label": text(d.alt),
      }))
        svg.setAttribute(k, String(v));
      for (const path of APPROVED_IMAGES[d.asset] ?? []) {
        const el = document.createElementNS("http://www.w3.org/2000/svg", "path");
        el.setAttribute("d", path);
        svg.append(el);
      }
      return svg;
    }
    case "divider":
      return h("hr");
    case "spacer": {
      const space = h("div", { "aria-hidden": "true" });
      space.style.height = `${{ small: 8, medium: 24, large: 48 }[d.size ?? "medium"]}px`;
      return space;
    }
    case "fieldValue":
      return h(
        "dl",
        {},
        h("dt", {}, text(d.label) || fieldLabel(bound)),
        h(
          "dd",
          {},
          d.mask && d.mask !== "none"
            ? L("＊＊＊＊（マスク表示）", "＊＊＊＊ (che)")
            : L("〈お客様の入力値〉", "〈giá trị khách nhập〉"),
        ),
      );
    case "groupSummary":
      return h(
        "div",
        { class: "cv-display" },
        h("h4", {}, text(d.title) || fieldLabel(bound)),
        ...[1, 2].map((n) =>
          h(
            "dl",
            { class: "cv-block-group" },
            ...(bound?.fields ?? []).flatMap((f) => [
              h("dt", {}, fieldLabel(f)),
              h("dd", {}, L(`〈${n} 件目の入力値〉`, `〈mục ${n}〉`)),
            ]),
          ),
        ),
      );
    case "summary":
      return h(
        "div",
        { class: "cv-display" },
        text(d.title) ? h("h4", {}, text(d.title)) : null,
        ...formSteps().map((s) =>
          h(
            "dl",
            {},
            h("dt", {}, stepLabel(s)),
            h(
              "dd",
              {},
              (s.content ?? []).map(fieldOfContent).filter(Boolean).map(fieldLabel).join("、") ||
                "—",
            ),
          ),
        ),
      );
    case "reference":
      return h(
        "p",
        {},
        (text(d.label) || catalogText("referenceLabel") || "受付番号") + ": ",
        h(
          "strong",
          {},
          L("synthetic_…（送信成功後に表示）", "synthetic_… (hiện sau khi gửi thành công)"),
        ),
      );
    case "button":
      return h(
        "div",
        {},
        h(
          "span",
          { class: "cv-btn" + (d.variant === "secondary" ? "" : " primary") },
          text(d.label),
        ),
        h(
          "span",
          { class: "small muted", translate: "no" },
          " " +
            (d.action === "link"
              ? (APPROVED_LINKS[d.link] ?? "")
              : L("最初からやり直す", "Làm lại từ đầu")),
        ),
      );
  }
  return null;
}
function displayBlock(step, d, index, editable, issues, parent) {
  const key = "display:" + d.id;
  const selected = isSelectedKey(key);
  const warn = issues.some((x) => x.display === d.id);
  const content = h("div", { class: "cv-content cv-display", translate: "no" });
  if (d.type === "section") {
    const inner = h("div", { class: "cv-section" });
    if (d.title?.ja) add(inner, h("h3", {}, d.title.ja));
    d.children.forEach((child, i) => {
      if (editable) add(inner, insertPoint(step, i, d));
      add(inner, displayBlock(step, child, i, editable, issues, d));
    });
    if (editable) add(inner, insertPoint(step, d.children.length, d));
    if (!d.children.length)
      add(inner, h("p", { class: "cv-help" }, L("＋ で部品を追加", "Nhấn ＋ để thêm thành phần")));
    add(content, inner);
  } else add(content, displayMock(d));
  const block = h(
    "div",
    {
      class: "cv-block",
      draggable: editable && !parent ? "true" : undefined,
      dataset: {
        kind: "display",
        displayId: d.id,
        displayType: d.type,
        key,
        selected: String(selected),
        warn: String(warn),
      },
    },
    h(
      "span",
      { class: "cv-type-tag", translate: "no", "aria-hidden": "true" },
      icon(DISPLAY_TYPES[d.type]?.icon),
      displayTypeLabel(d.type),
    ),
    h("button", {
      type: "button",
      class: "cv-hit",
      translate: "no",
      "aria-label": displayText(d) + " · " + displayTypeLabel(d.type),
      "aria-pressed": String(selected),
      dataset: { focusKey: "cv:" + key },
      onclick: (e) => {
        e.stopPropagation();
        select_("display:" + d.id, { step: step.id });
      },
      onkeydown: (e) => {
        if (editable && e.altKey && ["ArrowUp", "ArrowDown"].includes(e.key)) {
          e.preventDefault();
          moveBy(key, e.key === "ArrowUp" ? -1 : 1);
        }
      },
    }),
    content,
    selected && editable ? toolbar(key, null) : null,
  );
  if (editable && !parent) {
    dragSource(block, key);
    dropTarget(block, step, () => index);
  }
  applyAppearance(block, d.appearance, "field");
  return block;
}
function fieldBlock(step, c, index, editable, issues) {
  if (c.display) return displayBlock(step, c.display, index, editable, issues);
  const key = contentKey(c);
  const selected = isSelectedKey(key);
  if (c.field || c.group) {
    const f = fieldOfContent(c);
    if (!f)
      return h(
        "div",
        { class: "cv-block", dataset: { warn: "true", key } },
        callout("danger", "alert", "参照先のフィールドが見つかりません"),
      );
    const warn = issues.some((x) => x.field === f.id);
    const block = h(
      "div",
      {
        class: "cv-block",
        draggable: editable ? "true" : undefined,
        dataset: {
          kind: "field",
          fieldId: f.id,
          key,
          selected: String(selected),
          warn: String(warn),
        },
        ondblclick: () => editable && startRename(block, f),
      },
      h(
        "span",
        { class: "cv-type-tag", translate: "no", "aria-hidden": "true" },
        icon(typeIcon(f.type)),
        typeLabel(f.type),
      ),
      h("button", {
        type: "button",
        class: "cv-hit",
        translate: "no",
        "aria-label": itemAria(f, f.required),
        "aria-pressed": String(selected),
        dataset: { focusKey: "cv:" + key },
        onclick: () => select_(f.id),
        onkeydown: (e) => {
          if (editable && e.altKey && ["ArrowUp", "ArrowDown"].includes(e.key)) {
            e.preventDefault();
            moveBy(key, e.key === "ArrowUp" ? -1 : 1);
          } else if (editable && e.key === "F2") {
            e.preventDefault();
            startRename(block, f);
          }
        },
      }),
      h(
        "div",
        { class: "cv-content", translate: "no" },
        h(
          "div",
          { class: "cv-label-row" },
          h("span", { class: "cv-label" }, fieldLabel(f)),
          f.required ? h("span", { class: "cv-req", "aria-hidden": "true" }, "*") : null,
          badges(f),
        ),
        mockControl(f),
        f.help?.ja ? h("div", { class: "cv-help" }, f.help.ja) : null,
      ),
      selected && editable ? toolbar(key, f) : null,
    );
    if (editable) {
      dragSource(block, key);
      dropTarget(block, step, () => index);
    }
    applyAppearance(block, f.appearance, "field");
    return block;
  }
  if (c.block) {
    const instance = blockInstance(c.block);
    const entry = blockEntryFor(instance);
    const block = h(
      "div",
      {
        class: "cv-block",
        draggable: editable ? "true" : undefined,
        dataset: {
          kind: "block",
          blockId: c.block,
          key,
          selected: String(selected),
          warn: String(!entry),
        },
      },
      h(
        "span",
        { class: "cv-type-tag", "aria-hidden": "true" },
        icon("box"),
        L("共通ブロック", "Khối dùng chung"),
      ),
      h("button", {
        type: "button",
        class: "cv-hit",
        translate: "no",
        "aria-label": L("共通ブロック · ", "Khối dùng chung · ") + (instance?.alias ?? c.block),
        "aria-pressed": String(selected),
        dataset: { focusKey: "cv:" + key },
        onclick: () => select_("block:" + c.block),
        onkeydown: (e) => {
          if (editable && e.altKey && ["ArrowUp", "ArrowDown"].includes(e.key)) {
            e.preventDefault();
            moveBy(key, e.key === "ArrowUp" ? -1 : 1);
          }
        },
      }),
      h(
        "div",
        { class: "cv-content", translate: "no" },
        h(
          "div",
          { class: "cv-block-group" },
          h(
            "div",
            { class: "cv-block-group-head" },
            icon("box"),
            h("span", {}, instance?.alias ?? c.block),
            h(
              "span",
              { class: "chip chip-accent" },
              S.draft.dependencies?.blocks?.[instance?.block] ?? "?",
            ),
          ),
          ...(entry?.block.fields ?? []).map((bf) =>
            h(
              "div",
              {},
              h(
                "div",
                { class: "cv-label-row" },
                h("span", { class: "cv-label" }, bf.label?.ja ?? bf.key),
                bf.required ? h("span", { class: "cv-req" }, "*") : null,
              ),
              mockControl(bf),
            ),
          ),
          entry
            ? null
            : callout("danger", "alert", L("ブロックが見つかりません", "Không tìm thấy khối")),
        ),
      ),
      selected && editable ? toolbar(key, null) : null,
    );
    if (editable) {
      dragSource(block, key);
      dropTarget(block, step, () => index);
    }
    return block;
  }
  return h(
    "div",
    { class: "cv-block", dataset: { key } },
    h(
      "div",
      { class: "cv-content" },
      callout(
        "info",
        "layers",
        L("グループ（この画面では編集できません）", "Nhóm (không chỉnh sửa tại đây)"),
      ),
    ),
  );
}
function systemStep(step) {
  const t = (key, fallback) => S.draft.texts?.[key]?.ja ?? (catalogText(key) || fallback);
  if (step.kind === "review")
    return h(
      "div",
      { class: "cv-system" },
      h("h3", {}, t("reviewTitle", "入力内容の確認")),
      h(
        "p",
        { class: "cv-help" },
        L(
          "お客様が入力した内容がここに自動で一覧表示されます。",
          "Nội dung khách hàng đã nhập sẽ tự động hiển thị tại đây.",
        ),
      ),
      h(
        "ul",
        { class: "cv-help" },
        S.draft.fields.slice(0, 8).map((f) => h("li", {}, fieldLabel(f))),
      ),
    );
  return h(
    "div",
    { class: "cv-system" },
    h("h3", {}, t("completeTitle", "送信が完了しました")),
    h("p", {}, t("completeBody", "")),
  );
}
export function renderCanvas() {
  const canvas = $("canvas");
  const theme = currentTheme();
  if (theme)
    css(canvas, {
      "--form-accent": theme.accent,
      "--form-background": theme.background,
      "--form-foreground": theme.foreground,
    });
  const editable = canEdit();
  const step = currentStep();
  const forms = formSteps();
  const issues = lint();
  canvas.classList.toggle("canvas-readonly", !editable);
  canvas.className = classes(canvas.className, canvas.id);
  const body = h("div", { class: "form-page-body", translate: "no" });
  const stepIssues = issues.filter((x) => x.step === step.id && !x.field && !x.display);
  if (stepIssues.length)
    add(
      body,
      callout(
        "warning",
        "alert",
        h(
          "ul",
          { class: "small", dataset: { stepIssues: step.id } },
          stepIssues.map((x) => h("li", {}, x.text)),
        ),
      ),
    );
  if (step.kind === "form") {
    const title = input(step.title?.ja ?? "", {
      cls: "inline-input step-title-input",
      placeholder: stepLabel(step),
      "aria-label": "ステップ名",
      translate: "no",
      readOnly: !editable,
      onInput: (v) => {
        if (v.trim()) step.title = { ...step.title, ja: v };
        else delete step.title;
        refresh("canvas");
      },
    });
    add(
      body,
      title,
      textarea(step.description?.ja ?? "", {
        class: "textarea inline-input",
        rows: 2,
        placeholder: L("ステップの説明（任意）", "Mô tả bước (tùy chọn)"),
        "aria-label": L("ステップの説明", "Mô tả bước"),
        translate: "no",
        readOnly: !editable,
        maxLength: 2000,
        onInput: (v) => {
          if (v.trim()) step.description = { ...step.description, ja: v };
          else delete step.description;
          refresh("canvas");
        },
      }),
    );
    const list = h("div", { class: "cv-list" });
    if (!step.content?.length) {
      add(
        list,
        h(
          "div",
          { class: "cv-empty", translate: "yes" },
          icon("plus", "icon-lg"),
          h("h3", {}, "このステップにはまだフィールドがありません"),
          editable
            ? h("p", {}, "よく使う項目をすぐ追加するか、左の「追加」タブから選んでください。")
            : null,
          editable
            ? h(
                "div",
                { class: "row row-wrap" },
                ["text", "choice.radio", "email"].map((t) =>
                  btn(typeLabel(t), () => addField(t), { size: "sm", iconName: typeIcon(t) }),
                ),
                btn(
                  "その他の項目",
                  () => {
                    ed.leftTab = "add";
                    renderLeft();
                    $("palette").querySelector(".palette-item")?.focus();
                  },
                  { size: "sm", variant: "ghost", iconName: "grid" },
                ),
              )
            : null,
        ),
      );
      if (editable) dropTarget(list, step, () => 0, true);
    } else {
      step.content.forEach((c, index) => {
        if (editable) add(list, insertPoint(step, index));
        add(list, fieldBlock(step, c, index, editable, issues));
      });
      if (editable) add(list, insertPoint(step, step.content.length));
    }
    add(body, list);
    const position = forms.indexOf(step);
    add(
      body,
      h(
        "div",
        { class: "cv-nav", "aria-hidden": "true" },
        position > 0
          ? h(
              "span",
              { class: "cv-btn" },
              S.draft.texts?.back?.ja ?? (catalogText("back") || "戻る"),
            )
          : null,
        h(
          "span",
          { class: "cv-btn primary" },
          S.draft.texts?.next?.ja ?? (catalogText("next") || "次へ"),
        ),
      ),
    );
  } else {
    // Confirmation/completion: authored display components replace the default screen.
    const t = (key, fallback) => S.draft.texts?.[key]?.ja ?? (catalogText(key) || fallback);
    if (step.content?.length) {
      add(
        body,
        h(
          "h3",
          { class: "step-title-input" },
          step.kind === "review"
            ? t("reviewTitle", "入力内容の確認")
            : t("completeTitle", "送信が完了しました"),
        ),
      );
      const list = h("div", { class: "cv-list" });
      step.content.forEach((c, index) => {
        if (editable) add(list, insertPoint(step, index));
        add(list, fieldBlock(step, c, index, editable, issues));
      });
      if (editable) add(list, insertPoint(step, step.content.length));
      add(body, list);
    } else {
      add(body, systemStep(step));
      if (editable)
        add(
          body,
          h(
            "div",
            { class: "cv-empty", translate: "yes" },
            h(
              "p",
              {},
              L(
                "表示部品を追加すると、この画面を自由に構成できます（既定の表示の代わりに使われます）。",
                "Thêm thành phần hiển thị để tự thiết kế màn hình này (thay cho hiển thị mặc định).",
              ),
            ),
            h(
              "div",
              { class: "row row-wrap" },
              (step.kind === "review"
                ? ["summary", "heading", "text"]
                : ["image", "heading", "reference", "button"]
              ).map((type) =>
                btn(displayTypeLabel(type), () => addDisplay(type, { stepId: step.id }), {
                  size: "sm",
                  iconName: DISPLAY_TYPES[type].icon,
                }),
              ),
            ),
          ),
        );
    }
    if (editable) dropTarget(body, step, () => step.content?.length ?? 0, true);
    if (step.kind === "review")
      add(
        body,
        h(
          "div",
          { class: "cv-nav", "aria-hidden": "true" },
          h(
            "span",
            { class: "cv-btn" },
            S.draft.texts?.back?.ja ?? (catalogText("back") || "戻る"),
          ),
          h(
            "span",
            { class: "cv-btn primary" },
            S.draft.texts?.submit?.ja ?? (catalogText("submit") || "送信"),
          ),
        ),
      );
  }
  const index = S.draft.steps.indexOf(step);
  fill(
    canvas,
    h(
      "div",
      { class: "form-page" },
      h(
        "div",
        { class: "form-page-head", translate: "no" },
        h("div", { class: "form-page-title" }, formTitleText()),
        S.draft.texts?.formDescription?.ja
          ? h("div", { class: "form-page-desc" }, S.draft.texts.formDescription.ja)
          : null,
        h(
          "div",
          { class: "form-progress", "aria-hidden": "true" },
          S.draft.steps
            .filter((s) => s.kind !== "complete")
            .map((_, i) => h("span", { dataset: { done: String(i <= index) } })),
        ),
      ),
      body,
    ),
  );
  applyAppearance(canvas.querySelector(".form-page"), S.draft.appearance);
}
// ---------- Inspector ----------
function section(title, iconName, ...content) {
  return h(
    "section",
    { class: "insp-section" },
    title ? h("h3", {}, iconName ? icon(iconName) : null, title) : null,
    ...content,
  );
}
function selection() {
  const sel = S.selected;
  if (!sel) return { kind: "form" };
  if (sel.startsWith("step:")) return { kind: "step", step: stepById(sel.slice(5)) };
  if (sel.startsWith("block:")) return { kind: "block", instance: blockInstance(sel.slice(6)) };
  if (sel.startsWith("display:")) return { kind: "display", ...displayById(sel.slice(8)) };
  return { kind: "field", field: fieldById(sel) };
}
function renderInspectorHead() {
  const s = selection();
  let iconName = "settings",
    title,
    crumb;
  if (s.kind === "field") {
    iconName = typeIcon(s.field.type);
    title = fieldLabel(s.field);
    crumb = typeLabel(s.field.type) + " · " + stepLabel(stepOfField(s.field.id) ?? currentStep());
  } else if (s.kind === "block") {
    iconName = "box";
    title = s.instance.alias;
    crumb =
      L("共通ブロック · ", "Khối dùng chung · ") +
      (S.draft.dependencies?.blocks?.[s.instance.block] ?? "");
  } else if (s.kind === "display") {
    iconName = DISPLAY_TYPES[s.display.type]?.icon;
    title = displayText(s.display);
    crumb = displayTypeLabel(s.display.type) + " · " + stepLabel(s.step);
  } else if (s.kind === "step") {
    iconName = s.step.kind === "form" ? "file" : s.step.kind === "review" ? "review" : "flag";
    title = stepLabel(s.step);
    crumb =
      s.step.kind === "form"
        ? L("入力ステップ", "Bước nhập liệu")
        : L("システム画面", "Màn hình hệ thống");
  } else {
    title = formTitleText();
    crumb = L("フォーム全体の設定", "Cài đặt toàn biểu mẫu");
  }
  $("inspector-head").className = classes("insp-head", $("inspector-head").id);
  fill(
    $("inspector-head"),
    h("span", { class: "insp-icon", "aria-hidden": "true" }, icon(iconName)),
    h(
      "div",
      { class: "grow", translate: "no" },
      h("div", { class: "insp-title" }, title),
      h("div", { class: "insp-crumb" }, crumb),
    ),
    s.kind !== "form"
      ? btn("", () => select_(null), {
          variant: "ghost",
          size: "sm",
          iconName: "x",
          aria: "選択を解除してフォーム設定を表示",
          title: "選択を解除",
        })
      : null,
  );
}
const TABS = {
  field: [
    ["basic", "基本"],
    ["style", "スタイル"],
    ["validation", "検証"],
    ["logic", "条件"],
    ["advanced", "詳細"],
  ],
  step: [
    ["basic", "基本"],
    ["branches", "分岐"],
    ["advanced", "詳細"],
  ],
  block: [
    ["basic", "基本"],
    ["advanced", "詳細"],
  ],
  display: [
    ["basic", "基本"],
    ["style", "スタイル"],
    ["logic", "条件"],
  ],
  form: [
    ["basic", "基本"],
    ["style", "スタイル"],
    ["motion", "モーション"],
    ["logic", "条件"],
    ["advanced", "詳細"],
  ],
};
export function renderInspector() {
  if (!S.draft) return;
  renderInspectorHead();
  const s = selection();
  let tabList = TABS[s.kind];
  if (s.kind === "step" && s.step.kind !== "form") tabList = [["basic", "基本"]];
  let tab = ed.inspTab[s.kind] ?? "basic";
  if (!tabList.some(([k]) => k === tab)) tab = "basic";
  const issues = lint();
  const withCount = tabList.map(([k, label]) => {
    let count = 0;
    if (s.kind === "field" && k === "logic")
      count = (s.field.visibleWhen ? 1 : 0) + (s.field.requiredWhen ? 1 : 0);
    if (s.kind === "step" && k === "branches")
      count = s.step.transitions?.filter((t) => t.when).length ?? 0;
    if (s.kind === "form" && k === "logic") count = Object.keys(S.draft.conditions ?? {}).length;
    if (s.kind === "display" && k === "logic") count = s.display.visibleWhen ? 1 : 0;
    return [
      k,
      label,
      count ? h("span", { class: "count", "aria-hidden": "true" }, String(count)) : null,
    ];
  });
  tabs($("inspector-tabs"), withCount, tab, (key) => {
    ed.inspTab[s.kind] = key;
    renderInspector();
    $("inspector-tabs").querySelector('[aria-selected="true"]')?.focus();
  });
  const form = $("inspector");
  form.onsubmit = (e) => e.preventDefault();
  const fieldset = h("fieldset", { disabled: !canEdit() });
  if (!canEdit())
    fill(
      form,
      callout("info", "lock", "閲覧のみの権限です。内容を確認できますが変更はできません。"),
      fieldset,
    );
  else fill(form, fieldset);
  const builders = {
    field: fieldInspector,
    step: stepInspector,
    block: blockInspector,
    display: displayInspector,
    form: formInspector,
  };
  add(fieldset, ...builders[s.kind](s, tab, issues));
  if (ed.focusLabel) {
    ed.focusLabel = false;
    const label = form.querySelector('[data-focus="label"]');
    label?.focus();
    label?.select?.();
  }
}
function fieldInspector({ field: f }, tab, issues) {
  if (f.type === "group") return cartEditor(f);
  const out = [];
  const step = stepOfField(f.id) ?? currentStep();
  const own = issues.filter((x) => x.field === f.id);
  if (own.length)
    out.push(
      callout(
        "warning",
        "alert",
        h(
          "ul",
          { class: "small" },
          own.map((x) => h("li", {}, x.text)),
        ),
      ),
    );
  if (tab === "style") out.push(section("スタイル / Kiểu dáng", "palette", ...appearanceEditor(f)));
  if (tab === "basic") {
    const label = input(f.label?.ja ?? "", {
      translate: "no",
      maxLength: 2000,
      dataset: { focus: "label" },
      onInput: (v) => {
        f.label = { ...f.label, ja: v };
        refresh("inspector");
      },
    });
    const parts = [field("表示名", label, { hint: "お客様に表示される質問文です。" })];
    if (TEXT_LIKE.includes(f.type))
      parts.push(
        field(
          "プレースホルダー",
          input(f.placeholder?.ja ?? "", {
            translate: "no",
            maxLength: 2000,
            onInput: (v) => {
              if (v) f.placeholder = { ...f.placeholder, ja: v };
              else if (f.placeholder?.vi) f.placeholder = { vi: f.placeholder.vi };
              else delete f.placeholder;
              refresh("inspector");
            },
          }),
          { hint: "入力欄に薄く表示される例です（任意）。" },
        ),
      );
    if (f.type !== "plugin:storeSel")
      parts.push(
        field(
          "ヘルプ",
          textarea(f.help?.ja ?? "", {
            translate: "no",
            rows: 2,
            maxLength: 2000,
            onInput: (v) => {
              if (v) f.help = { ...f.help, ja: v };
              else if (f.help?.vi) f.help = { vi: f.help.vi };
              else delete f.help;
              refresh("inspector");
            },
          }),
          { hint: "質問の下に表示される補足説明です（任意）。" },
        ),
      );
    out.push(section("", null, ...parts));
    if (f.options) out.push(section("選択肢", "checks", optionsEditor(f)));
    if (["choice.radio", "choice.checkboxes"].includes(f.type))
      out.push(
        toggle(
          "カード形式の選択肢 / Lựa chọn dạng thẻ",
          f.config?.presentation === "native",
          (on) => {
            f.config = { ...f.config, presentation: on ? "native" : "compact" };
            commit();
          },
        ),
      );
    if (f.type === "choice.select")
      out.push(
        toggle("選択肢を検索 / Tìm lựa chọn", !!f.config?.searchable, (v) => {
          f.config = { ...f.config, searchable: v };
          commit();
        }),
      );
    if (["choice.radio", "choice.select"].includes(f.type) && f.classification === "public")
      out.push(
        field(
          "URL初期値パラメータ / Tham số URL",
          input(f.config?.queryParameter ?? "", {
            placeholder: "category",
            onCommit: (v, el) => {
              if (v && !/^[a-z][a-z0-9_]{0,30}$/.test(v)) {
                el.setAttribute("aria-invalid", "true");
                return;
              }
              f.config ??= {};
              if (v) f.config.queryParameter = v;
              else delete f.config.queryParameter;
              commit();
            },
          }),
          {
            hint: "公開された選択肢だけ。ステップや権限は変更しません。 / Chỉ giá trị lựa chọn công khai.",
          },
        ),
      );
    if (f.type === "postal")
      out.push(
        field(
          "合成住所の入力先 / Trường địa chỉ giả lập",
          select(
            [
              ["", "なし / Không"],
              ...S.draft.fields
                .filter((n) => n.type === "text" && n.id !== f.id)
                .map((n) => [n.id, fieldLabel(n)]),
            ],
            f.config?.postalAddressTarget ?? "",
            (v) => {
              f.config ??= {};
              if (v) f.config.postalAddressTarget = v;
              else delete f.config.postalAddressTarget;
              commit();
            },
          ),
        ),
      );
    if (f.type === "calculated") out.push(section("計算", "calc", ...calculatedEditor(f)));
    if (f.type === "plugin:storeSel")
      out.push(section("プラグイン設定", "store", ...pluginEditor(f)));
  }
  if (tab === "validation") {
    out.push(
      section(
        "入力ルール",
        "shield",
        toggle(
          "必須",
          f.required,
          (v) => {
            f.required = v;
            commit();
          },
          { hint: "未入力のまま次へ進めないようにします。" },
        ),
      ),
    );
    const validators = validatorEditor(f);
    if (validators.length) out.push(section("入力の制限", "hash", ...validators));
  }
  if (tab === "logic") {
    const fields = ruleFields(step.id, f.id);
    out.push(
      section(
        "表示ルール",
        "eye",
        ruleEditor({
          prefix: "表示",
          rule: f.visibleWhen,
          change: (value) => {
            if (value) f.visibleWhen = value;
            else delete f.visibleWhen;
          },
          fields,
          alwaysLabel: "常に表示",
          action: L("このフィールドを表示", "hiển thị trường này"),
        }),
      ),
      section(
        "必須ルール",
        "shield",
        ruleEditor({
          prefix: "必須",
          rule: f.requiredWhen,
          change: (value) => {
            if (value) f.requiredWhen = value;
            else delete f.requiredWhen;
          },
          fields,
          alwaysLabel: "条件なし（「検証」の必須設定に従う）",
          action: L("入力を必須にする", "bắt buộc nhập"),
        }),
      ),
    );
    if (!f.formula && S.draft.fields.some((node) => node.id === f.id))
      out.push(
        section(
          "回答のリセット / Đặt lại câu trả lời",
          "refresh",
          ...fields
            .filter((source) =>
              S.draft.fields.some((node) => node.id === source.id && node.type !== "group"),
            )
            .map((source) =>
              toggle(
                fieldLabel(source),
                f.resetOnChange?.includes(source.id),
                (on) => {
                  const ids = new Set(f.resetOnChange ?? []);
                  if (on) ids.add(source.id);
                  else ids.delete(source.id);
                  if (ids.size) f.resetOnChange = [...ids];
                  else delete f.resetOnChange;
                  commit();
                },
                { hint: "この項目が変わったら回答をクリア / Xóa câu trả lời khi mục này thay đổi" },
              ),
            ),
        ),
      );
    if (S.schema?.$defs?.Field?.properties?.clearOnDeactivate)
      out.push(
        section(
          "",
          null,
          toggle(
            "非表示になったら入力値をクリア",
            f.clearOnDeactivate,
            (v) => {
              f.clearOnDeactivate = v;
              commit();
            },
            { hint: "非表示になった項目の値は送信されません。" },
          ),
        ),
      );
    if (!fields.length)
      out.push(
        callout(
          "info",
          "info",
          "条件に使えるフィールドがまだありません。先に選択肢などの項目を追加してください。",
        ),
      );
  }
  if (tab === "advanced") {
    const order = ["public", "personal", "secret"];
    const names = {
      public: L("公開", "Công khai"),
      personal: L("個人情報", "Cá nhân"),
      secret: L("機密", "Bí mật"),
    };
    const forms = formSteps();
    out.push(
      section(
        "データ",
        "file",
        field(
          "データキー",
          input(f.key, {
            cls: "mono",
            translate: "no",
            onCommit: (v) => {
              f.key = v.trim();
              commit();
            },
          }),
          { hint: "送信データの項目名です。公開後に変更すると受け取り側に影響します。" },
        ),
        field(
          "データ分類",
          select(
            order
              .filter((v) => order.indexOf(v) >= order.indexOf(f.classification))
              .map((v) => [v, names[v]]),
            f.classification,
            (v) => {
              f.classification = v;
              commit();
            },
          ),
          { hint: "分類は上げることのみできます（下げられません）。" },
        ),
        field(
          "配置するステップ",
          select(
            forms.map((s) => [s.id, stepLabel(s), { noTranslate: true }]),
            step.id,
            (v) => {
              const at = locate("$local:" + f.id);
              if (at)
                moveContent(
                  "$local:" + f.id,
                  v,
                  stepById(v).content.length + (at.step.id === v ? 1 : 0),
                );
            },
          ),
        ),
      ),
      section(
        "情報",
        "info",
        h(
          "dl",
          { class: "kv" },
          h("dt", {}, "種類"),
          h("dd", { translate: "no" }, typeLabel(f.type)),
          h("dt", {}, "送信"),
          h("dd", {}, f.submit === "displayOnly" ? "表示のみ（送信しない）" : "送信データに含める"),
          h("dt", {}, "一時保存"),
          h("dd", {}, f.persist === "never" ? "保存しない" : "許可"),
          h("dt", {}, "ID"),
          h("dd", { class: "mono", translate: "no" }, f.id),
        ),
      ),
      section(
        "",
        null,
        btn("フィールド削除", () => deleteField(f.id), {
          variant: "danger",
          iconName: "trash",
          size: "sm",
        }),
      ),
    );
  }
  return out;
}
function optionsEditor(f) {
  const isCheck = f.type === "choice.checkboxes";
  const list = h("div", { class: "opt-list" });
  const values = f.options.map((o) => o.value);
  f.options.forEach((o, i) => {
    const duplicate = values.indexOf(o.value) !== i;
    add(
      list,
      h(
        "div",
        { class: "opt-row" },
        h("span", { class: "opt-mark" + (isCheck ? " box" : ""), "aria-hidden": "true" }),
        input(optionLabel(o), {
          translate: "no",
          "aria-label": "選択肢 " + (i + 1) + " の表示名",
          onInput: (v) => {
            o.label = { ...o.label, ja: v };
            refresh("inspector");
          },
        }),
        input(o.value, {
          cls: "mono input-sm",
          translate: "no",
          "aria-label": "選択肢 " + (i + 1) + " の値",
          "aria-invalid": duplicate ? "true" : undefined,
          title: "送信される値",
          onCommit: (v) => {
            o.value = v.trim();
            commit();
          },
        }),
        h(
          "span",
          { class: "opt-tools" },
          btn(
            "",
            () => {
              if (i === 0) return;
              [f.options[i - 1], f.options[i]] = [f.options[i], f.options[i - 1]];
              commit();
            },
            {
              variant: "ghost",
              size: "sm",
              iconName: "up",
              aria: "選択肢 " + (i + 1) + " を上へ移動",
            },
          ),
          btn(
            "",
            () => {
              if (f.options.length <= 1) return notice("選択肢は最低 1 つ必要です");
              f.options.splice(i, 1);
              commit();
            },
            { variant: "ghost", size: "sm", iconName: "x", aria: "選択肢 " + (i + 1) + " を削除" },
          ),
        ),
      ),
    );
    add(
      list,
      ruleEditor({
        prefix: "選択肢 " + (i + 1),
        rule: o.availableWhen,
        change: (value) => {
          if (value) o.availableWhen = value;
          else delete o.availableWhen;
        },
        fields: ruleFields(S.currentStep, f.id),
        alwaysLabel: "常に選択可能",
        action: L("この選択肢を表示", "hiển thị lựa chọn này"),
      }),
    );
  });
  const bulk = textarea(f.options.map((o) => o.value + "|" + optionLabel(o)).join("\n"), {
    translate: "no",
    rows: 4,
    "aria-label": "選択肢 (値|表示名、1行1件)",
    onCommit: (v) => {
      const prior = new Map(f.options.map((o) => [o.value, o]));
      f.options = v
        .split("\n")
        .filter(Boolean)
        .map((row) => {
          const [value, label] = row.split("|");
          const old = prior.get(value);
          return { ...old, value, label: { ...old?.label, ja: label || value } };
        });
      commit();
    },
  });
  return h(
    "div",
    {},
    list,
    values.some((v, i) => values.indexOf(v) !== i)
      ? h("p", { class: "field-error", role: "alert" }, "選択肢の値が重複しています")
      : null,
    h(
      "div",
      { class: "row" },
      btn(
        "選択肢を追加",
        () => {
          let n = f.options.length + 1;
          while (values.includes("option" + n)) n++;
          f.options.push({ value: "option" + n, label: { ja: "選択肢 " + n } });
          commit();
        },
        { size: "sm", variant: "ghost", iconName: "plus" },
      ),
    ),
    h(
      "details",
      { class: "small" },
      h("summary", {}, "まとめて編集"),
      h("p", { class: "field-hint" }, "1 行に 1 件、「値|表示名」の形式で入力します。"),
      bulk,
    ),
  );
}
function calculatedEditor(f) {
  const other = S.draft.fields.filter((x) => x.id !== f.id && x.type !== "group");
  const op = f.formula?.ref ? "copy" : (f.formula?.op ?? "add");
  const out = [
    field(
      "計算方法",
      select(
        [
          ["add", "足し算（+）"],
          ["subtract", "引き算（−）"],
          ["multiply", "掛け算（×）"],
          ["concat", "文字列をつなげる"],
          ["copy", "回答を表示 / Hiển thị câu trả lời"],
        ],
        op,
        (v) => {
          f.formula =
            v === "copy"
              ? {
                  ref:
                    "$local:" +
                    (other.find((field) => field.type !== "choice.checkboxes")?.id ?? ""),
                }
              : { op: v, args: [{ const: 0 }, { const: 0 }] };
          commit();
        },
      ),
    ),
  ];
  if (op === "copy") {
    out.push(
      field(
        "表示する回答 / Câu trả lời hiển thị",
        select(
          other
            .filter((field) => field.type !== "choice.checkboxes")
            .map((field) => [field.id, fieldLabel(field), { noTranslate: true }]),
          f.formula.ref.replace("$local:", ""),
          (id) => {
            f.formula = { ref: "$local:" + id };
            commit();
          },
        ),
      ),
    );
    return out;
  }
  for (let i = 0; i < 2; i++)
    out.push(
      field(
        "値 " + (i + 1),
        select(
          [
            ["", "定数 0"],
            ...other
              .filter((x) => x.type === "number" || op === "concat")
              .map((x) => [x.id, fieldLabel(x), { noTranslate: true }]),
          ],
          f.formula?.args?.[i]?.ref?.replace("$local:", "") ?? "",
          (v) => {
            if (!f.formula?.args) f.formula = { op, args: [{ const: 0 }, { const: 0 }] };
            f.formula.args[i] = v ? { ref: "$local:" + v } : { const: 0 };
            commit();
          },
        ),
      ),
    );
  out.push(h("p", { class: "small muted" }, "計算結果は表示のみで、送信データには含まれません。"));
  return out;
}
function pluginEditor(f) {
  const spec = S.schema?.$defs?.Field?.properties?.config?.properties ?? {};
  const out = [];
  if (spec.filterByPrefecture)
    out.push(
      toggle("都道府県で絞り込む", f.config?.filterByPrefecture, (v) => {
        f.config = { ...f.config, filterByPrefecture: v };
        commit();
      }),
    );
  if (spec.placeholder)
    out.push(
      field(
        "店舗選択の案内文",
        input(f.config?.placeholder ?? "", {
          translate: "no",
          maxLength: spec.placeholder.maxLength ?? 40,
          onCommit: (v) => {
            f.config = { ...f.config, placeholder: v };
            if (!v) delete f.config.placeholder;
            commit();
          },
        }),
        { hint: "最大 40 文字。" },
      ),
    );
  out.push(
    callout(
      "info",
      "shield",
      "プラグインのプログラムは管理画面では実行されません。動作は隔離プレビューで確認してください。",
    ),
  );
  return out;
}
const VALIDATORS = [
  ["minLength", "最小文字数", ["text", "textarea", "email", "tel", "postal", "katakana"]],
  ["maxLength", "最大文字数", ["text", "textarea", "email", "tel", "postal", "katakana"]],
  ["min", "最小値", ["number"]],
  ["max", "最大値", ["number"]],
  ["minItems", "最小選択数", ["choice.checkboxes"]],
  ["maxItems", "最大選択数", ["choice.checkboxes"]],
];
function validatorEditor(f) {
  const out = [];
  const applicable = VALIDATORS.filter(([, , types]) => types.includes(f.type));
  const pair = [];
  for (const [use, label] of applicable) {
    const old = f.validators?.find((v) => v.use === use);
    pair.push(
      field(
        label,
        input(old?.params?.value ?? "", {
          type: "number",
          step: "1",
          inputMode: "numeric",
          placeholder: "制限なし",
          onCommit: (v, el) => {
            if (v !== "" && !Number.isSafeInteger(Number(v))) {
              el.setAttribute("aria-invalid", "true");
              return notice("整数を入力してください");
            }
            f.validators = (f.validators ?? []).filter((x) => x.use !== use);
            if (v !== "") f.validators.push({ use, params: { value: Number(v) } });
            if (!f.validators.length) delete f.validators;
            commit();
          },
        }),
      ),
    );
  }
  for (let i = 0; i < pair.length; i += 2)
    out.push(h("div", { class: "grid-2" }, pair[i], pair[i + 1] ?? null));
  if (f.type === "boolean")
    out.push(
      toggle(
        "チェックを必須にする（同意など）",
        f.validators?.some((v) => v.use === "mustBeTrue"),
        (on) => {
          f.validators = (f.validators ?? []).filter((x) => x.use !== "mustBeTrue");
          if (on) f.validators.push({ use: "mustBeTrue" });
          if (!f.validators.length) delete f.validators;
          commit();
        },
      ),
    );
  const formats = {
    email: ["formatEmail", "メール形式 / Định dạng email"],
    tel: ["formatPhoneJP", "電話形式 / Số điện thoại JP"],
    postal: ["formatPostalJP", "郵便番号7桁 / Mã bưu điện"],
    katakana: ["formatKatakana", "カタカナ / Katakana"],
    date: ["formatDate", "有効な日付 / Ngày hợp lệ"],
  };
  const format = formats[f.type];
  if (format)
    out.push(
      toggle(format[1], !!f.validators?.some((v) => v.use === format[0]), (on) => {
        f.validators = (f.validators ?? []).filter((v) => v.use !== format[0]);
        if (on) f.validators.push({ use: format[0] });
        commit();
      }),
    );
  const known = new Set([
    ...(format ? [format[0]] : []),
    ...applicable.map(([use]) => use),
    ...(f.type === "boolean" ? ["mustBeTrue"] : []),
  ]);
  const other = (f.validators ?? []).filter((v) => !known.has(v.use));
  if (other.length)
    out.push(
      h(
        "p",
        { class: "small muted" },
        "この画面で編集できない検証（保持されます）: ",
        h("span", { class: "mono", translate: "no" }, other.map((v) => v.use).join(", ")),
      ),
    );
  return out;
}
function stepInspector({ step }, tab) {
  const out = [];
  const editable = canEdit();
  if (step.kind !== "form") {
    const text = (key, label, multiline) => {
      const control = (multiline ? textarea : input)(S.draft.texts?.[key]?.ja ?? "", {
        translate: "no",
        placeholder: catalogText(key),
        maxLength: 2000,
        onInput: (v) => {
          setText(key, "ja", v);
          refresh("inspector");
        },
      });
      return field(label, control, { hint: "空欄の場合は既定の文言が表示されます。" });
    };
    if (step.kind === "review")
      out.push(
        section(
          "確認画面",
          "review",
          text("reviewTitle", "確認画面タイトル"),
          text("submit", "ボタン: 送信"),
          toggle(
            L("確認画面を省略する（2 画面構成）", "Bỏ qua màn hình xác nhận (2 màn hình)"),
            !!step.autoSubmit,
            (on) => {
              if (on) step.autoSubmit = true;
              else delete step.autoSubmit;
              commit();
            },
            {
              id: "auto-submit",
              disabled: !editable,
              hint: L(
                "入力 → 送信 → 完了 の流れになります。最後の「次へ」で 1 回だけ送信され、エラー時はこの確認画面にエラーと入力内容を表示します。",
                "Luồng Nhập → Gửi → Hoàn tất. Gửi đúng một lần khi bấm 「次へ」 cuối; nếu lỗi sẽ hiện lỗi và nội dung tại màn hình xác nhận.",
              ),
            },
          ),
        ),
      );
    else
      out.push(
        section(
          "完了画面",
          "flag",
          text("completeTitle", "完了タイトル"),
          text("completeBody", "完了メッセージ", true),
        ),
      );
    out.push(
      h(
        "p",
        { class: "small muted" },
        L(
          "確認画面と完了画面は並び替え・削除できません。表示部品を追加すると、既定の表示の代わりに使われます。",
          "Không thể sắp xếp/xóa màn hình xác nhận và hoàn tất. Khi thêm thành phần hiển thị, chúng sẽ thay cho hiển thị mặc định.",
        ),
      ),
    );
    return out;
  }
  if (tab === "basic") {
    out.push(
      section(
        "",
        null,
        field(
          "ステップ名",
          input(step.title?.ja ?? "", {
            translate: "no",
            placeholder: stepLabel(step),
            maxLength: 2000,
            onInput: (v) => {
              if (v.trim()) step.title = { ...step.title, ja: v };
              else delete step.title;
              refresh("inspector");
            },
          }),
          { hint: "ステップの見出しとして表示されます（任意）。" },
        ),
        field(
          L("説明", "Mô tả"),
          textarea(step.description?.ja ?? "", {
            translate: "no",
            maxLength: 2000,
            rows: 2,
            onInput: (v) => {
              if (v.trim()) step.description = { ...step.description, ja: v };
              else delete step.description;
              refresh("inspector");
            },
          }),
          { hint: L("見出しの下に表示されます（任意）。", "Hiển thị dưới tiêu đề (tùy chọn).") },
        ),
        h(
          "p",
          { class: "small muted" },
          L(
            `このステップの項目: ${step.content?.length ?? 0} 件`,
            `Số mục trong bước: ${step.content?.length ?? 0}`,
          ),
        ),
        editable
          ? btn(
              "フィールドを追加",
              () => {
                S.currentStep = step.id;
                ed.leftTab = "add";
                renderLeft();
                $("palette").querySelector(".palette-item")?.focus();
              },
              { size: "sm", iconName: "plus" },
            )
          : null,
      ),
      editable ? section(L("ステップの操作", "Thao tác bước"), "flow", ...stepTools(step)) : null,
      section("スキップ条件", "chevR", skipEditor(step, !editable)),
    );
  }
  if (tab === "branches") out.push(branches(step, !editable));
  if (tab === "advanced") {
    out.push(
      section(
        "情報",
        "info",
        h(
          "dl",
          { class: "kv" },
          h("dt", {}, "種類"),
          h("dd", {}, "入力ステップ"),
          h("dt", {}, "ID"),
          h("dd", { class: "mono", translate: "no" }, step.id),
        ),
      ),
    );
    if (editable)
      out.push(
        section(
          "",
          null,
          btn("ステップを削除", () => deleteStep(step), {
            variant: "danger",
            size: "sm",
            iconName: "trash",
          }),
          formSteps().length <= 1
            ? h("p", { class: "field-hint" }, "入力ステップが 1 つだけのため削除できません。")
            : null,
        ),
      );
  }
  return out;
}
function stepTools(step) {
  const forms = formSteps(),
    position = forms.indexOf(step);
  return [
    h(
      "div",
      { class: "row row-wrap" },
      btn(L("前へ移動", "Lên trước"), () => moveStep(step, -1), {
        size: "sm",
        iconName: "up",
        id: "step-move-up",
      }),
      btn(L("後ろへ移動", "Xuống sau"), () => moveStep(step, 1), {
        size: "sm",
        iconName: "down",
        id: "step-move-down",
      }),
      btn(L("前に追加", "Thêm trước"), () => addStep(position), {
        size: "sm",
        iconName: "plus",
        id: "step-insert-before",
      }),
      btn(L("後ろに追加", "Thêm sau"), () => addStep(position + 1), {
        size: "sm",
        iconName: "plus",
        id: "step-insert-after",
      }),
      btn(L("複製", "Nhân bản"), () => duplicateStep(step), {
        size: "sm",
        iconName: "copy",
        id: "step-duplicate",
      }),
    ),
    h(
      "p",
      { class: "field-hint" },
      L(
        "並び替えると「次のステップ」は新しい順番に付け替えられます。分岐先は変わらないため、前のステップへ戻る分岐や後ろの項目を参照する条件は診断に表示されます。",
        "Khi sắp xếp lại, 「次のステップ」 được nối theo thứ tự mới. Đích rẽ nhánh giữ nguyên; nhánh quay lui hoặc điều kiện tham chiếu trường phía sau sẽ hiện trong chẩn đoán.",
      ),
    ),
  ];
}
const IMAGE_LABELS = {
  success: ["完了（チェック）", "Hoàn tất"],
  info: ["お知らせ", "Thông tin"],
  box: ["荷物", "Hộp hàng"],
  mail: ["メール", "Thư"],
};
const SIZE_OPTIONS = () => [
  ["small", L("小", "Nhỏ")],
  ["medium", L("中", "Vừa")],
  ["large", L("大", "Lớn")],
];
function displayInspector({ display: d, step, parent }, tab, issues) {
  const out = [];
  const own = issues.filter((x) => x.display === d.id);
  if (own.length)
    out.push(
      callout(
        "warning",
        "alert",
        h(
          "ul",
          { class: "small" },
          own.map((x) => h("li", {}, x.text)),
        ),
      ),
    );
  if (tab === "style") {
    out.push(section("スタイル / Kiểu dáng", "palette", ...appearanceEditor(d)));
    return out;
  }
  if (tab === "logic") {
    out.push(
      section(
        "表示ルール",
        "eye",
        ruleEditor({
          prefix: "表示",
          rule: d.visibleWhen,
          change: (value) => {
            if (value) d.visibleWhen = value;
            else delete d.visibleWhen;
          },
          fields: ruleFields(step.id),
          alwaysLabel: "常に表示",
          action: L("この部品を表示", "hiển thị thành phần này"),
        }),
      ),
    );
    return out;
  }
  // Localized text property; required ones keep an empty string so diagnostics can point at it.
  const text = (prop, label, { multiline, required, hint } = {}) =>
    field(
      label,
      (multiline ? textarea : input)(d[prop]?.ja ?? "", {
        translate: "no",
        maxLength: 1000,
        dataset: { displayProp: prop },
        onInput: (v) => {
          if (v.trim() || required) d[prop] = { ...d[prop], ja: v };
          else Reflect.deleteProperty(d, prop);
          refresh("inspector");
        },
      }),
      hint ? { hint } : {},
    );
  const choose = (label, values, chosen, change, id) =>
    field(
      label,
      select(
        values,
        chosen,
        (v) => {
          change(v);
          commit();
        },
        { id },
      ),
    );
  const basic = [];
  switch (d.type) {
    case "heading":
      basic.push(
        text("text", L("見出し", "Tiêu đề"), { required: true }),
        choose(
          L("大きさ", "Cấp"),
          [
            ["2", L("大見出し", "Lớn")],
            ["3", L("小見出し", "Nhỏ")],
          ],
          String(d.level ?? 2),
          (v) => (d.level = Number(v)),
        ),
      );
      break;
    case "text":
      basic.push(
        text("text", L("本文", "Nội dung"), { multiline: true, required: true }),
        choose(
          L("表示の種類", "Kiểu"),
          [
            ["normal", L("通常", "Thường")],
            ["muted", L("補足（薄い文字）", "Phụ")],
            ["notice", L("お知らせ（強調）", "Nhấn mạnh")],
          ],
          d.tone ?? "normal",
          (v) => (d.tone = v),
        ),
      );
      break;
    case "image":
      basic.push(
        choose(
          L("画像（承認済み）", "Hình (đã duyệt)"),
          Object.keys(APPROVED_IMAGES).map((k) => [k, L(...IMAGE_LABELS[k])]),
          d.asset,
          (v) => (d.asset = v),
          "display-image-asset",
        ),
        text("alt", L("代替テキスト（読み上げ用）", "Văn bản thay thế"), { required: true }),
        choose(L("大きさ", "Kích thước"), SIZE_OPTIONS(), d.size ?? "medium", (v) => (d.size = v)),
        h(
          "p",
          { class: "field-hint" },
          L(
            "画像は承認済みの一覧からのみ選べます。外部 URL やアップロードは使用できません。",
            "Chỉ chọn hình trong danh sách đã duyệt; không dùng URL ngoài hay tải lên.",
          ),
        ),
      );
      break;
    case "spacer":
      basic.push(
        choose(L("高さ", "Chiều cao"), SIZE_OPTIONS(), d.size ?? "medium", (v) => (d.size = v)),
      );
      break;
    case "fieldValue": {
      const fields = ruleFields(step.id).filter(
        (f) => !f.ref && (step.kind !== "complete" || f.classification === "public"),
      );
      // Copied steps repeat labels; name the step so the choice stays unambiguous.
      const repeated = (f) => fields.filter((x) => fieldLabel(x) === fieldLabel(f)).length > 1;
      const owner = (f) =>
        S.draft.steps.find((s) => s.content?.some((c) => c.field === "$local:" + f.id));
      basic.push(
        choose(
          L("表示する項目", "Trường hiển thị"),
          [
            ["", L("選択してください", "Chọn")],
            ...fields.map((f) => [
              "$local:" + f.id,
              repeated(f) ? `${fieldLabel(f)}（${stepLabel(owner(f))}）` : fieldLabel(f),
            ]),
          ],
          d.field,
          (v) => (d.field = v),
          "display-binding",
        ),
        text("label", L("見出し（空欄なら項目名）", "Nhãn (trống = tên trường)")),
        choose(
          L("マスク", "Che"),
          [
            ["none", L("なし", "Không")],
            ["partial", L("一部を隠す", "Một phần")],
            ["full", L("すべて隠す", "Toàn bộ")],
          ],
          d.mask ?? "none",
          (v) => (v === "none" ? delete d.mask : (d.mask = v)),
        ),
        step.kind === "complete"
          ? h(
              "p",
              { class: "field-hint" },
              L(
                "完了画面では公開データの項目だけを表示できます。",
                "Màn hình hoàn tất chỉ hiển thị trường công khai.",
              ),
            )
          : null,
      );
      break;
    }
    case "groupSummary":
      basic.push(
        choose(
          L("商品一覧（繰り返し項目）", "Danh sách lặp lại"),
          S.draft.fields
            .filter((f) => f.type === "group")
            .map((g) => ["$local:" + g.id, fieldLabel(g)]),
          d.group,
          (v) => (d.group = v),
          "display-binding",
        ),
        text("title", L("見出し（空欄なら一覧名）", "Tiêu đề (trống = tên danh sách)")),
      );
      break;
    case "summary":
      basic.push(
        text("title", L("見出し（任意）", "Tiêu đề (tùy chọn)")),
        h(
          "p",
          { class: "field-hint" },
          L(
            "表示中のステップの入力内容を、ステップごとに項目名と選択肢名で一覧表示します。秘密情報は常にマスクされます。",
            "Liệt kê câu trả lời theo từng bước với nhãn dễ đọc; thông tin bí mật luôn được che.",
          ),
        ),
      );
      break;
    case "reference":
      basic.push(
        text("label", L("ラベル", "Nhãn")),
        h(
          "p",
          { class: "field-hint" },
          L(
            "送信がサーバーで受け付けられたときだけ、その受付番号を表示します。プレビューでは発行されません。",
            "Chỉ hiển thị mã khi máy chủ chấp nhận lần gửi; bản xem trước không cấp mã.",
          ),
        ),
      );
      break;
    case "button": {
      const actions = [["link", L("承認済みリンクへ移動", "Mở liên kết đã duyệt")]];
      if (step.kind === "complete")
        actions.push(["restart", L("新しいフォームを始める", "Bắt đầu biểu mẫu mới")]);
      basic.push(
        text("label", L("ボタンの文言", "Nhãn nút"), { required: true }),
        choose(
          L("動作", "Hành động"),
          actions,
          d.action,
          (v) => {
            d.action = v;
            if (v === "link") d.link ??= "home";
            else delete d.link;
          },
          "display-button-action",
        ),
        d.action === "link"
          ? choose(
              L("リンク先（承認済み）", "Đích (đã duyệt)"),
              Object.entries(APPROVED_LINKS).map(([k, url]) => [k, url]),
              d.link,
              (v) => (d.link = v),
              "display-button-link",
            )
          : null,
        choose(
          L("見た目", "Kiểu"),
          [
            ["primary", L("メイン", "Chính")],
            ["secondary", L("サブ", "Phụ")],
          ],
          d.variant ?? "primary",
          (v) => (d.variant = v),
        ),
      );
      break;
    }
    case "section":
      basic.push(
        text("title", L("見出し（任意）", "Tiêu đề (tùy chọn)")),
        h(
          "ol",
          { class: "outline", "aria-label": L("セクション内の部品", "Thành phần trong khu vực") },
          d.children.map((child) =>
            h(
              "li",
              { class: "ol-item" },
              h(
                "button",
                {
                  type: "button",
                  class: "ol-item-btn",
                  translate: "no",
                  onclick: () => select_("display:" + child.id, { step: step.id }),
                },
                h(
                  "span",
                  { class: "ol-type", "aria-hidden": "true" },
                  icon(DISPLAY_TYPES[child.type]?.icon),
                ),
                h("span", { class: "ol-name" }, displayText(child)),
              ),
              h(
                "span",
                { class: "ol-tools", translate: "no" },
                btn("", () => moveBy("display:" + child.id, -1), {
                  variant: "ghost",
                  size: "sm",
                  iconName: "up",
                  aria: L("上へ移動", "Lên"),
                }),
                btn("", () => moveBy("display:" + child.id, 1), {
                  variant: "ghost",
                  size: "sm",
                  iconName: "down",
                  aria: L("下へ移動", "Xuống"),
                }),
                btn("", () => deleteDisplay(child.id), {
                  variant: "ghost",
                  size: "sm",
                  iconName: "trash",
                  aria: L("削除", "Xóa"),
                }),
              ),
            ),
          ),
        ),
        field(
          L("部品を追加", "Thêm thành phần"),
          select(
            [
              ["", L("選択してください", "Chọn")],
              ...Object.keys(DISPLAY_TYPES)
                .filter((type) => type !== "section")
                .map((type) => [type, displayTypeLabel(type)]),
            ],
            "",
            (v) => v && addDisplay(v, { stepId: step.id, parent: d }),
            { id: "section-add" },
          ),
        ),
      );
      break;
  }
  out.push(section("", null, ...basic));
  out.push(
    section(
      "情報",
      "info",
      h(
        "dl",
        { class: "kv" },
        h("dt", {}, L("種類", "Loại")),
        h("dd", {}, displayTypeLabel(d.type)),
        h("dt", {}, "ID"),
        h("dd", { class: "mono", translate: "no" }, d.id),
        parent ? h("dt", {}, L("セクション", "Khu vực")) : null,
        parent ? h("dd", {}, displayText(parent)) : null,
      ),
      canEdit()
        ? btn(L("この部品を削除", "Xóa thành phần"), () => deleteDisplay(d.id), {
            variant: "danger",
            size: "sm",
            iconName: "trash",
          })
        : null,
    ),
  );
  return out;
}
function blockInspector({ instance }, tab) {
  const out = [];
  const pin = S.draft.dependencies?.blocks?.[instance.block];
  const entry = S.catalog.blocks.find((b) => b.pin === pin);
  if (tab === "basic") {
    const pinSelect = select(
      S.catalog.blocks.map((b) => [
        b.pin,
        b.pin + " · " + b.state,
        {
          noTranslate: true,
          disabled: ["vulnerable", "unknown"].includes(b.state) && b.pin !== pin,
        },
      ]),
      pin,
      async (v) => {
        const next = S.catalog.blocks.find((b) => b.pin === v);
        if (!next || ["vulnerable", "unknown"].includes(next.state)) return emit("render");
        const ok = await confirmDialog({
          title: "固定リビジョンを変更しますか？",
          body:
            "固定リビジョンを " +
            pin +
            " → " +
            v +
            " に変更します。Data Contract と参照への影響を確認してください。他のフォームは変更されません。",
          confirm: "変更する",
        });
        if (!ok) return emit("render");
        S.draft.dependencies.blocks[instance.block] = v;
        commit();
      },
      { id: "block-pin" },
    );
    out.push(
      section(
        "",
        null,
        field(
          "ブロック別名",
          input(instance.alias, {
            translate: "no",
            cls: "mono",
            onInput: (v) => {
              instance.alias = v;
              refresh("inspector");
            },
          }),
          { hint: "条件で参照するときの名前です。" },
        ),
        field("固定リビジョン", pinSelect, {
          hint: "ブロックの更新は自動では反映されません。リビジョンを選んで固定します。",
        }),
      ),
    );
    const inputs = Object.entries(entry?.block.inputs ?? {});
    if (inputs.length)
      out.push(
        section(
          "ブロックの設定",
          "settings",
          ...inputs.map(([k, spec]) =>
            spec.type === "boolean"
              ? toggle(k, instance.inputs?.[k] ?? spec.default, (v) => {
                  instance.inputs = { ...instance.inputs, [k]: v };
                  commit();
                })
              : field(
                  k,
                  input(instance.inputs?.[k] ?? spec.default ?? "", {
                    translate: "no",
                    onCommit: (v) => {
                      instance.inputs = { ...instance.inputs, [k]: v };
                      commit();
                    },
                  }),
                ),
          ),
        ),
      );
    out.push(
      section(
        "含まれるフィールド",
        "layers",
        h(
          "ul",
          { class: "item-list", translate: "no" },
          (entry?.block.fields ?? []).map((f) =>
            h(
              "li",
              { class: "item" },
              h(
                "div",
                { class: "item-head" },
                h("span", { class: "ol-type", "aria-hidden": "true" }, icon(typeIcon(f.type))),
                h("span", { class: "grow" }, f.label?.ja ?? f.key),
                h(
                  "span",
                  { class: "chip" },
                  f.required ? L("必須", "Bắt buộc") : L("任意", "Tùy chọn"),
                ),
              ),
            ),
          ),
        ),
        h("p", { class: "small muted" }, "共通ブロックの中身はこの画面では編集できません。"),
      ),
    );
  }
  if (tab === "advanced") {
    out.push(
      section(
        "情報",
        "info",
        h(
          "dl",
          { class: "kv" },
          h("dt", {}, "固定リビジョン"),
          h("dd", { class: "mono", translate: "no" }, pin ?? "—"),
          h("dt", {}, "状態"),
          h("dd", { translate: "no" }, entry?.state ?? "unknown"),
          h("dt", {}, "公開項目"),
          h(
            "dd",
            { class: "mono", translate: "no" },
            (entry?.block.exports ?? [])
              .map((x) => x.id + " (" + x.classification + ")")
              .join(", ") || "—",
          ),
          h("dt", {}, "ID"),
          h("dd", { class: "mono", translate: "no" }, instance.id),
        ),
      ),
    );
    if (canEdit())
      out.push(
        section(
          "",
          null,
          btn("ブロックを削除", () => deleteBlock(instance.id), {
            variant: "danger",
            size: "sm",
            iconName: "trash",
          }),
        ),
      );
  }
  return out;
}
function themeCards() {
  const approved = (S.catalog.themes ?? []).filter((t) => t.site === S.draft.siteId);
  const chosen = currentTheme()?.id;
  return h(
    "div",
    { class: "choice-grid", role: "radiogroup", "aria-label": "テーマ" },
    approved.map((t) => {
      const radio = h("input", { type: "radio", name: "theme", value: t.id });
      radio.checked = t.id === chosen;
      radio.addEventListener("change", () => {
        if (!radio.checked) return;
        S.draft.themeRef = t.id;
        commit();
      });
      const swatch = css(
        h("span", { class: "theme-swatch", "aria-hidden": "true" }, h("i"), h("i"), h("b")),
        {
          "--sw-bg": t.background,
          "--sw-fg": t.foreground,
          "--sw-accent": t.accent,
        },
      );
      return h(
        "label",
        { class: "choice-card" },
        radio,
        swatch,
        h(
          "span",
          { class: "choice-text" },
          h("b", { translate: "no" }, t.label),
          h("small", {}, t.id.includes("contrast") ? "高コントラスト（読みやすさ重視）" : "標準"),
        ),
        h("span", { class: "check", "aria-hidden": "true" }, icon("check")),
      );
    }),
  );
}
const MOTION = [
  ["none", "なし", "動きを使いません（最も軽量）"],
  ["subtle", "控えめ", "フェードと小さな移動で変化を伝えます"],
  ["guided", "ガイド付き", "ステップ間をスライドで案内します"],
];
function motionPanel() {
  const preset = S.draft.motion?.preset.id ?? "none";
  const speed = S.draft.motion?.speed ?? "standard";
  const cards = h(
    "div",
    { class: "choice-grid", role: "radiogroup", "aria-label": "モーション" },
    MOTION.map(([id, label, text]) => {
      const radio = h("input", { type: "radio", name: "motion", value: id });
      radio.checked = id === preset;
      radio.addEventListener("change", () => {
        if (!radio.checked) return;
        if (id === "none") delete S.draft.motion;
        else
          S.draft.motion = {
            ...S.draft.motion,
            preset: { id, package: "@platform/motion-presets", version: "1.0.0" },
          };
        commit();
      });
      const demo = css(
        h(
          "span",
          { class: "motion-demo", dataset: { preset: id }, "aria-hidden": "true" },
          h("i"),
          h("i"),
        ),
        { "--speed": { slow: "1.6", standard: "1", fast: "0.6" }[speed] },
      );
      return h(
        "label",
        { class: "choice-card" },
        radio,
        demo,
        h("span", { class: "choice-text" }, h("b", {}, label), h("small", {}, text)),
        h("span", { class: "check", "aria-hidden": "true" }, icon("check")),
      );
    }),
  );
  const out = [section("プリセット", "wind", cards)];
  if (preset !== "none")
    out.push(
      section(
        "速さ",
        "clock",
        segmented(
          "speed",
          "速さ",
          [
            ["slow", "ゆっくり"],
            ["standard", "標準"],
            ["fast", "速い"],
          ],
          speed,
          (value) => {
            S.draft.motion.speed = value;
            commit();
          },
          { full: true },
        ),
      ),
      section(
        "動きを使う場面",
        "sparkles",
        ...Object.entries({
          stepTransition: "ステップ切替",
          conditionalReveal: "条件表示",
          validationFeedback: "検証フィードバック",
          submitFeedback: "送信フィードバック",
        }).map(([key, label]) =>
          toggle(label, S.draft.motion.categories?.[key] !== "off", (value) => {
            S.draft.motion.categories = {
              ...S.draft.motion.categories,
              [key]: value ? "on" : "off",
            };
            commit();
          }),
        ),
      ),
    );
  out.push(
    callout(
      "info",
      "info",
      "OS の「視差効果を減らす」設定がオンのお客様には動きを表示しません。「なし」の場合、公開フォームにモーション用のプログラムは含まれません。",
    ),
    h(
      "div",
      { class: "row" },
      btn("プレビューで確認", () => emit("open-preview"), { size: "sm", iconName: "eye" }),
    ),
  );
  return out;
}
function formInspector(_s, tab) {
  const out = [];
  const textField = (key, label, opts = {}) =>
    field(
      label,
      (opts.multiline ? textarea : input)(S.draft.texts?.[key]?.ja ?? "", {
        translate: "no",
        maxLength: 2000,
        placeholder: opts.placeholder ?? catalogText(key),
        onInput: (v) => {
          setText(key, "ja", v);
          refresh("inspector");
        },
      }),
      { hint: opts.hint },
    );
  if (tab === "basic") {
    const fieldCount = S.draft.fields.length;
    if (fieldCount < 2 && canEdit())
      out.push(
        h(
          "div",
          { class: "guide" },
          h("h3", {}, "はじめに"),
          h(
            "ol",
            {},
            h("li", {}, "左の「追加」から質問の種類を選んで追加します"),
            h("li", {}, "キャンバスの項目をクリックして、右側で内容を編集します"),
            h("li", {}, "「プレビュー」でお客様の画面を確認します"),
            h("li", {}, "「レビュー依頼」で承認を依頼し、公開します"),
          ),
          h(
            "div",
            { class: "row" },
            btn(
              "フィールドを追加",
              () => {
                ed.leftTab = "add";
                renderLeft();
                $("palette").querySelector(".palette-item")?.focus();
              },
              { size: "sm", variant: "primary", iconName: "plus" },
            ),
          ),
        ),
      );
    else
      out.push(
        h(
          "p",
          { class: "small muted insp-hint" },
          "キャンバスの項目を選択すると、その項目の設定がここに表示されます。",
        ),
      );
    out.push(
      section(
        "お客様に表示する文言",
        "file",
        textField("formTitle", "フォームタイトル", {
          placeholder: $("form-title").value,
          hint: "空欄の場合は管理用のフォーム名を表示します。",
        }),
        textField("formDescription", "フォーム説明", { multiline: true, placeholder: "" }),
      ),
      section(
        "ボタン",
        "chevR",
        h(
          "div",
          { class: "grid-2" },
          textField("next", "ボタン: 次へ"),
          textField("back", "ボタン: 戻る"),
        ),
        textField("submit", "ボタン: 送信"),
      ),
    );
  }
  if (tab === "style")
    out.push(
      section("テーマ", "palette", themeCards()),
      section("レイアウト / Bố cục", "grid", ...appearanceEditor(S.draft)),
    );
  if (tab === "motion") out.push(...motionPanel());
  if (tab === "logic") out.push(section("名前付き条件", "branch", namedConditions(!canEdit())));
  if (tab === "basic")
    out.push(
      section(
        "一時保存 / Lưu tạm",
        "file",
        toggle(
          "公開値だけをブラウザに30分保存 / Lưu giá trị công khai 30 phút",
          !!S.draft.customerDraft,
          (v) => {
            if (v) S.draft.customerDraft = { ttlMinutes: 30 };
            else delete S.draft.customerDraft;
            commit();
          },
        ),
      ),
    );
  if (tab === "advanced")
    out.push(
      section(
        "フォーム情報",
        "info",
        h(
          "dl",
          { class: "kv" },
          h("dt", {}, "フォーム ID"),
          h("dd", { class: "mono", translate: "no" }, S.draft.formId),
          h("dt", {}, "サイト"),
          h("dd", { class: "mono", translate: "no" }, S.draft.siteId),
          h("dt", {}, "保存版"),
          h("dd", { translate: "no" }, "v" + S.version),
        ),
      ),
      section(
        "送信後の処理",
        "send",
        h(
          "p",
          { class: "small" },
          "送信後の処理: 合成 mock log のみ（ローカル、実システム連携なし）",
        ),
      ),
    );
  return out;
}
// ---------- Keyboard shortcuts in build mode ----------
export function buildShortcut(e) {
  if (!S.draft || S.mode !== "build" || !canEdit()) return false;
  const target = e.target;
  const typing = target.closest?.("input, textarea, select, [contenteditable]");
  const sel = S.selected;
  if (!sel || sel.startsWith("step:")) return false;
  const onItem = target.closest?.(".cv-hit, .ol-item-btn");
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "d" && !typing) {
    e.preventDefault();
    if (!sel.startsWith("block:")) duplicateField(sel);
    return true;
  }
  if (onItem && (e.key === "Delete" || e.key === "Backspace")) {
    e.preventDefault();
    if (sel.startsWith("block:")) void deleteBlock(sel.slice(6));
    else void deleteField(sel);
    return true;
  }
  if (e.key === "Escape" && !typing && !document.querySelector("dialog[open]")) {
    select_(null);
    return true;
  }
  return false;
}
