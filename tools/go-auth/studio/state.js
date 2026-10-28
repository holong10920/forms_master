import { classes } from "./recipes.js";
// Shared Admin state, API access, persistence (autosave + optimistic locking) and form helpers.
import { $, h, icon, toast, L } from "./ui.js";
export const S = {
  session: null,
  schema: null,
  catalog: { blocks: [], themes: [], texts: {} },
  forms: [],
  formsState: "idle",
  draft: null,
  version: 0,
  currentStep: null,
  // fieldId | "block:<instanceId>" | "step:<stepId>" | null (form settings)
  selected: null,
  pendingPreview: null,
  previewState: "idle",
  sessionExpired: false,
  history: null,
  mode: "build",
};
// ---------- Event bus ----------
const listeners = new Map();
export function on(event, fn) {
  listeners.set(event, [...(listeners.get(event) ?? []), fn]);
}
export function emit(event, ...args) {
  for (const fn of listeners.get(event) ?? []) fn(...args);
}
export const notice = (message, opts) => toast(message, opts);
export const clone = (value) => JSON.parse(JSON.stringify(value));
export const newId = (prefix, length = 32) =>
  prefix + crypto.randomUUID().replaceAll("-", "").slice(0, length);
// ---------- Session / roles ----------
export const site = () => $("site").value;
export const scope = () => ({ site: site(), form: S.draft?.formId });
export const roles = (siteId = site()) =>
  S.session?.sites.find((s) => s.id === siteId)?.roles ?? [];
export const can = (role) => roles().includes(role);
export const canEdit = () => can("editor");
// ---------- Human-readable errors ----------
const FAULTS = {
  UNAUTHORIZED: "セッションの有効期限が切れました。再ログインしてください。",
  FORBIDDEN: "この操作を行う権限がありません。",
  CSRF: "セキュリティトークンが無効です。ページを再読み込みしてください。",
  VERSION_CONFLICT: "他の場所で更新されています。最新版と比較してください。",
  NOT_FOUND: "対象が見つかりません。",
  DEFINITION_INVALID: "フォームに修正が必要な箇所があります。",
  DEFINITION_TOO_LARGE: "フォームが大きすぎます。",
  FORM_TITLE: "フォーム名を 1〜200 文字で入力してください。",
  FORM_SCOPE: "対象のサイトまたはフォームが一致しません。",
  RELEASE_SCOPE: "対象のサイトまたはフォームが一致しません。",
  OPERATION_SCOPE: "対象のサイトまたはフォームが一致しません。",
  PREVIEW_SESSION_SCOPE: "対象のサイトまたはフォームが一致しません。",
  REVIEW_STALE: "レビュー後に変更があったため、再確認が必要です。",
  REVIEW_RECHECK_REQUIRED: "公開前に再チェックが必要です。",
  PLATFORM_CHANGED: "プラットフォームが更新されたため、再チェックが必要です。",
  POINTER_CHANGED: "公開状態が変わりました。最新の状態を確認してください。",
  DEPLOYMENT_CHANGED: "公開状態が変わりました。最新の状態を確認してください。",
  OPERATION_FENCED: "別の公開処理が進行中です。完了を待ってから再実行してください。",
  PREVIEW_SESSION_EXPIRED: "プレビューの有効期限が切れました。開き直してください。",
  PREVIEW_ONLY: "この操作はプレビューでのみ利用できます。",
  DATA_CONTRACT_ACK_REQUIRED: "Data Contract の変更確認が必要です。",
  CLASSIFICATION_DOWNGRADE_FORBIDDEN: "データ分類は下げられません。",
  BREAKING_FIELD_REPLACEMENT_REQUIRED:
    "互換性のない変更です。既存のフィールドを変更せず、新しいフィールドとして追加してください。",
  KEY_COLLISION: "データキーが重複しています。",
  PUBLISHED_FORM_DELETE_FORBIDDEN: "公開済みのフォームは削除できません。",
  ROLLBACK_TARGET_INELIGIBLE: "この版には戻せません。",
  BUILD_FAILED: "公開用ビルドに失敗しました。",
  BLOCK_STATE: "共通ブロックが利用できない状態です。",
  CAPABILITY_NOT_INGESTED: "プラグインの準備ができていません。",
  ADAPTER_REQUIRED: "プラグインの準備ができていません。",
  ADAPTER_NOT_DEPLOYED: "プラグインの準備ができていません。",
  ADAPTER_INVENTORY: "プラグインの準備ができていません。",
  NETWORK: "サーバーに接続できません。ローカル環境が起動しているか確認してください。",
};
const DIAGNOSTICS = {
  "E-TYPE-OPERATOR": "条件の比較方法がフィールドの種類と合っていません",
  "E-TYPE": "値の種類が正しくありません",
  "E-REF-DANGLING": "参照先（フィールドまたは条件）が見つかりません",
  "E-REF-SCOPE": "このステップから参照できないフィールドが使われています",
  "E-FORWARD-REF": "後ろのステップのフィールドは参照できません",
  "E-REF-UNSUPPORTED": "この参照方法には対応していません",
  "E-NUM-RANGE": "数値が許容範囲外です（整数を入力してください）",
  "E-ARITY": "条件の値が不足しています",
  "E-ITEM-ID": "ID の形式が正しくありません",
  "E-ITEM-ID-REUSE": "削除済みの ID は再利用できません",
  "E-DEPENDENCY-CYCLE": "条件または計算が循環しています",
  "E-DEFINITION-CYCLE": "条件または計算が循環しています",
  "E-ID-COLLISION": "ID またはデータキーが重複しています",
  "E-CLASS-BELOW-MIN": "データ分類が必要な水準より低く設定されています",
  "E-GRAPH-NO-DEFAULT": "「次のステップ」が未設定のステップがあります",
  "E-GRAPH-CYCLE": "ステップの移動がループしています",
  "E-GRAPH-UNREACHABLE": "到達できないステップがあります",
  "E-DEFINITION-LIMIT": "フォームの上限（項目数など）を超えています",
  "E-DEFINITION-SCHEMA": "フォーム定義の形式が正しくありません",
  "E-OPTION": "選択肢の設定が正しくありません（値の重複など）",
  "E-ENTRY": "最初のステップの設定が正しくありません",
  "E-DISPLAY-ONLY-DATA": "表示専用の項目は送信データに含められません",
  "E-CAPABILITY-UNDECLARED": "プラグインの利用宣言がありません",
  "E-BLOCK-UNRESOLVED": "共通ブロックが見つかりません",
  "E-BLOCK-PRIVATE-REF": "共通ブロックの非公開項目は参照できません",
  "E-BLOCK-PIN": "共通ブロックの固定リビジョンが正しくありません",
  "E-BLOCK-INPUT": "共通ブロックの入力設定が正しくありません",
  "E-BLOCK-IDENTITY": "共通ブロックの識別情報が一致しません",
  "E-BLOCK-VULNERABLE": "脆弱性のある共通ブロックは使用できません",
  "E-THEME-NOT-APPROVED": "承認されていないテーマです",
  "E-STEP": "ステップの設定が正しくありません",
  "E-SKIP": "スキップ条件が正しくありません（分岐のないステップのみ、前のステップの項目を参照）",
  "E-FORMULA": "計算式が正しくありません",
  "E-ORPHAN-FIELD": "どのステップにも配置されていないフィールドがあります",
  "E-LOCALE": "言語設定が正しくありません",
  "E-COMPLETE-GUARD": "完了ステップの設定が正しくありません",
  "E-DISPLAY-SCOPE":
    "この表示部品はこの画面では使えません（受付番号・最初からやり直すボタンは完了画面のみ）",
  "E-DISPLAY-LINK": "ボタンのリンク先は承認済みの一覧から選んでください",
  "E-DISPLAY-PII": "個人情報を含む項目は完了画面に表示できません（秘密情報は常にマスクが必要）",
  "E-AUTO-SUBMIT": "確認画面の省略は確認画面でのみ設定できます",
  "E-MOTION-NONE-CONFIG": "モーション「なし」では詳細設定を指定できません",
  "E-PLUGIN-UNAVAILABLE": "プラグインが利用できません",
  "E-PLUGIN-NOT-READY": "プラグインの準備ができていません",
};
// Turns "E-CODE at <id>" into a sentence plus the place it refers to (step/field/condition name).
export function humanDiagnostic(raw) {
  const text = String(raw);
  const m = /^(E-[A-Z0-9-]+)(?: at (.*))?$/s.exec(text.trim());
  if (!m) return { code: "", message: text, where: "" };
  return {
    code: m[1],
    message: DIAGNOSTICS[m[1]] ?? "定義を確認してください",
    where: whereOf(m[2]),
  };
}
function whereOf(path) {
  if (!path || !S.draft) return path ?? "";
  const id = path.replace("$local:", "");
  const step = S.draft.steps.find((s) => s.id === id);
  if (step) return L("ステップ「", "Bước 「") + stepLabel(step) + "」";
  const f = S.draft.fields.find((x) => x.id === id || x.key === id);
  if (f) return L("フィールド「", "Trường 「") + fieldLabel(f) + "」";
  const d = displayById(id)?.display;
  if (d) return L("表示部品「", "Thành phần 「") + displayText(d) + "」";
  const c = S.draft.conditions?.[id];
  if (c) return L("条件「", "Điều kiện 「") + (c.label?.ja ?? id) + "」";
  return path;
}
export const faultText = (code) => FAULTS[code] ?? "操作を完了できませんでした。";
export function clearError() {
  $("diagnostics").replaceChildren();
  $("diagnostics").className = classes("alert-bar", $("diagnostics").id);
}
export function showError(code, diagnostics = []) {
  const bar = $("diagnostics");
  bar.className = classes("alert-bar", bar.id);
  const items = diagnostics.map((d) => {
    const x = humanDiagnostic(typeof d === "string" ? d : (d.code ?? JSON.stringify(d)));
    return h(
      "li",
      {},
      x.message,
      x.where ? h("span", { translate: "no" }, " · " + x.where) : null,
      x.code ? h("span", { class: "alert-code", translate: "no" }, " " + x.code) : null,
    );
  });
  bar.replaceChildren(
    icon("alert"),
    h(
      "div",
      { class: "alert-text" },
      h("b", {}, faultText(code)),
      " ",
      h("span", { class: "alert-code", translate: "no" }, code),
      items.length ? h("ul", { class: "small" }, items) : null,
    ),
    h(
      "button",
      {
        type: "button",
        class: "btn btn-ghost btn-sm btn-icon",
        "aria-label": "閉じる",
        onclick: clearError,
      },
      icon("x"),
    ),
  );
}
export function showOk(message) {
  const bar = $("diagnostics");
  bar.className = classes("alert-bar ok", bar.id);
  bar.replaceChildren(
    icon("check"),
    h("div", { class: "alert-text" }, message),
    h(
      "button",
      {
        type: "button",
        class: "btn btn-ghost btn-sm btn-icon",
        "aria-label": "閉じる",
        onclick: clearError,
      },
      icon("x"),
    ),
  );
}
// Message for a thrown Error whose message is a server code.
export const errorText = (e) => (FAULTS[e?.message] ? faultText(e.message) : (e?.message ?? ""));
export async function api(op, body = {}) {
  let r, value;
  try {
    r = await fetch("/api/" + op, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": S.session?.csrf ?? "" },
      body: JSON.stringify(body),
    });
    value = await r.json();
  } catch {
    showError("NETWORK");
    throw Error("NETWORK");
  }
  if (!r.ok) {
    if (r.status === 401) {
      S.sessionExpired = true;
      emit("session-expired");
    }
    showError(value.code, value.diagnostics ?? []);
    throw Error(value.code);
  }
  clearError();
  return value;
}
let formsRequest = 0,
  formsSite;
export async function refreshForms() {
  const request = ++formsRequest,
    siteId = site();
  const current = () => request === formsRequest && site() === siteId;
  // A pending response from a previous site must never replace the current site's list or error.
  if (formsSite !== siteId) S.forms = [];
  formsSite = siteId;
  S.formsState = "loading";
  emit("forms");
  try {
    const data = await api("list", { site: siteId });
    if (!current()) return;
    S.forms = data.forms;
    S.formsState = "idle";
  } catch (e) {
    if (!current()) return;
    S.formsState = "error";
    throw e;
  } finally {
    if (current()) emit("forms");
  }
}
export async function loadHistory() {
  if (!S.draft) return;
  const formId = S.draft.formId;
  const data = await api("history", scope());
  if (S.draft?.formId !== formId) return;
  S.history = data;
  emit("history");
}
// ---------- Preview frame ----------
export function previewFrame() {
  let frame = $("preview-frame");
  if (!frame) {
    frame = h("iframe", {
      id: "preview-frame",
      title: "Interactive isolated preview",
      sandbox: "allow-scripts allow-same-origin",
      src: "about:blank",
    });
    $("preview-container").replaceChildren(frame);
  }
  return frame;
}
export function resetPreview() {
  S.pendingPreview = null;
  S.previewState = "idle";
  const frame = $("preview-frame");
  if (frame) frame.src = "about:blank";
  emit("preview");
}
// ---------- Persistence: autosave + optimistic locking (CAS), no auto-merge ----------
const P = {
  saveTimer: 0,
  saving: undefined,
  editSeq: 0,
  savedSeq: 0,
  epoch: 0,
  blocked: false,
  baseDocument: null,
  failed: false,
  savedAt: null,
};
export const isDirty = () => P.editSeq !== P.savedSeq;
export const persistence = P;
export function setSaveState() {
  const btnEl = $("save-state");
  btnEl.hidden = !S.draft;
  if (!S.draft) return;
  const state = P.blocked
    ? "conflict"
    : P.saving
      ? "saving"
      : P.failed && isDirty()
        ? "error"
        : isDirty()
          ? "dirty"
          : "saved";
  const meta = {
    conflict: ["競合あり", "alert"],
    saving: ["保存中…", "loader"],
    error: ["未保存（保存エラー）", "alert"],
    dirty: [$("autosave").checked ? "未保存の変更" : "未保存（自動保存オフ）", "dot"],
    saved: ["保存済み", "cloudCheck"],
  }[state];
  btnEl.dataset.state = state;
  $("save-label").textContent = meta[0];
  $("save-icon").replaceChildren(icon(meta[1]));
  $("version").textContent = " · v" + S.version;
  btnEl.title = meta[0] + " · v" + S.version;
  const time = P.savedAt
    ? P.savedAt.toLocaleTimeString(document.documentElement.lang, {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";
  $("save-meta").replaceChildren(
    h("span", {}, "最終保存"),
    h("span", { translate: "no" }, ` ${time} · v${S.version}`),
  );
}
export function resetPersistence() {
  window.clearTimeout(P.saveTimer);
  P.epoch++;
  P.editSeq = 0;
  P.savedSeq = 0;
  P.blocked = false;
  P.failed = false;
  P.baseDocument = S.draft ? clone(S.draft) : null;
  $("conflict").hidden = true;
  setSaveState();
}
export function restorePersistence({ baseDocument, editSeq, savedSeq }) {
  P.baseDocument = baseDocument;
  P.editSeq = editSeq;
  P.savedSeq = savedSeq;
  setSaveState();
}
export function markRecovered() {
  // The unsaved draft now lives in sessionStorage for the re-login round trip.
  P.savedSeq = P.editSeq;
}
function scheduleSave() {
  window.clearTimeout(P.saveTimer);
  if ($("autosave").checked && !P.blocked)
    P.saveTimer = window.setTimeout(
      () => void save().catch((e) => notice("保存できませんでした: " + e.message)),
      1500,
    );
}
export function dirty() {
  if (!S.draft || !canEdit()) return;
  P.editSeq++;
  P.failed = false;
  setSaveState();
  scheduleSave();
}
export function autosaveChanged() {
  window.clearTimeout(P.saveTimer);
  if ($("autosave").checked && isDirty()) dirty();
  setSaveState();
}
export function cancelAutosave() {
  window.clearTimeout(P.saveTimer);
}
export function changeSummary(before, after) {
  const result = [];
  for (const key of [
    "fields",
    "steps",
    "conditions",
    "blockInstances",
    "dependencies",
    "motion",
    "texts",
    "locale",
  ]) {
    if (JSON.stringify(before?.[key]) === JSON.stringify(after?.[key])) continue;
    if (["fields", "steps"].includes(key)) {
      const prior = new Map((before?.[key] ?? []).map((x) => [x.id, x]));
      for (const item of after?.[key] ?? []) {
        if (JSON.stringify(prior.get(item.id)) !== JSON.stringify(item))
          result.push((item.label?.ja ?? item.title?.ja ?? item.key ?? item.id) + " を追加・変更");
        prior.delete(item.id);
      }
      for (const item of prior.values())
        result.push((item.label?.ja ?? item.title?.ja ?? item.key ?? item.id) + " を削除");
    } else result.push(key + " を変更");
  }
  return result;
}
export async function compareConflict() {
  const current = await api("get", scope());
  const report = {
    baseVersion: S.version,
    currentVersion: current.version,
    serverChanges: changeSummary(P.baseDocument, current.definition),
    localChanges: changeSummary(P.baseDocument, S.draft),
    guidance:
      "最新版を読み込んだあと、この一覧を見ながら変更をもう一度行ってください。自動マージは行いません。",
  };
  $("conflict-details").textContent = JSON.stringify(report, null, 2);
  const list = (title, items) =>
    h(
      "div",
      {},
      h("b", {}, title),
      h(
        "ul",
        { translate: "no" },
        items.length ? items.map((x) => h("li", {}, x)) : h("li", {}, "—"),
      ),
    );
  $("conflict-summary").replaceChildren(
    list(
      L("他の場所での変更（v", "Thay đổi ở nơi khác (v") + current.version + ")",
      report.serverChanges,
    ),
    list(L("あなたの未保存の変更", "Thay đổi chưa lưu của bạn"), report.localChanges),
  );
  $("conflict").hidden = false;
}
export async function save() {
  window.clearTimeout(P.saveTimer);
  if (P.saving) {
    while (P.saving) await P.saving;
    if (!isDirty()) return;
  }
  if (!S.draft) throw Error("フォームを開いてください");
  if (P.blocked) throw Error("VERSION_CONFLICT: 最新版と比較してください");
  const seq = P.editSeq,
    generation = P.epoch,
    definition = clone(S.draft),
    target = { ...scope() },
    title = $("form-title").value,
    expected = S.version;
  const task = (async () => {
    try {
      const result = await api("save", { ...target, expected, definition, title });
      if (generation !== P.epoch) return;
      S.version = result.version;
      P.savedSeq = seq;
      P.baseDocument = definition;
      P.failed = false;
      P.savedAt = new Date();
      resetPreview();
      await refreshForms();
      notice(isDirty() ? "未保存の変更があります" : "保存しました", { quiet: true });
      emit("saved");
    } catch (e) {
      if (generation === P.epoch) {
        P.failed = true;
        if (e.message === "VERSION_CONFLICT") {
          P.blocked = true;
          await compareConflict();
          notice("競合: 未保存の変更はこの画面に残っています");
        }
      }
      throw e;
    }
  })();
  P.saving = task.catch(() => {});
  setSaveState();
  const marker = P.saving;
  try {
    await task;
  } finally {
    if (P.saving === marker) P.saving = undefined;
    setSaveState();
  }
  if (generation === P.epoch && isDirty() && !P.blocked) scheduleSave();
}
// Save only when there is something new to store (preview/review/validate use the saved version).
export async function ensureSaved() {
  if (P.saving) await P.saving;
  if (isDirty() || S.version === 0) await save();
}
// ---------- Form model helpers ----------
export const TYPES = {
  text: { label: "テキスト（1行）", vi: "Văn bản (1 dòng)", icon: "text", group: "basic" },
  textarea: {
    label: "テキスト（複数行）",
    vi: "Văn bản (nhiều dòng)",
    icon: "lines",
    group: "basic",
  },
  date: { label: "日付", vi: "Ngày", icon: "file", group: "basic" },
  number: { label: "数値", vi: "Số", icon: "hash", group: "basic" },
  boolean: {
    label: "チェックボックス（はい/いいえ）",
    vi: "Hộp kiểm (có/không)",
    icon: "toggle",
    group: "basic",
  },
  "choice.radio": {
    label: "単一選択（ラジオ）",
    vi: "Chọn một (radio)",
    icon: "radio",
    group: "choice",
  },
  "choice.select": {
    label: "プルダウン",
    vi: "Danh sách thả xuống",
    icon: "select",
    group: "choice",
  },
  "choice.checkboxes": { label: "複数選択", vi: "Chọn nhiều", icon: "checks", group: "choice" },
  email: { label: "メールアドレス", vi: "Email", icon: "mail", group: "contact" },
  tel: { label: "電話番号", vi: "Số điện thoại", icon: "phone", group: "contact" },
  postal: { label: "郵便番号", vi: "Mã bưu chính", icon: "postal", group: "contact" },
  katakana: { label: "カタカナ", vi: "Katakana", icon: "kana", group: "contact" },
  calculated: { label: "計算（自動）", vi: "Tính toán (tự động)", icon: "calc", group: "advanced" },
  "plugin:storeSel": {
    label: "店舗選択（プラグイン）",
    vi: "Chọn cửa hàng (plugin)",
    icon: "store",
    group: "advanced",
  },
  group: { label: "繰り返し商品", vi: "Giỏ sản phẩm", icon: "layers", group: "advanced" },
};
// Locale-aware (used inside translate="no" regions and re-rendered on locale change).
export const typeLabel = (t) => (TYPES[t] ? L(TYPES[t].label, TYPES[t].vi) : t);
export const typeIcon = (t) => TYPES[t]?.icon ?? "file";
export const TEXT_LIKE = [
  "text",
  "textarea",
  "number",
  "email",
  "tel",
  "postal",
  "katakana",
  "date",
];
export const STRING_TYPES = ["text", "textarea", "email", "tel", "postal", "katakana", "date"];
export const PERSONAL_TYPES = ["text", "textarea", "email", "tel", "postal", "katakana", "date"];
export const fieldLabel = (f) => f?.label?.ja || f?.key || L("（名称未設定）", "(chưa đặt tên)");
export function stepLabel(step) {
  if (step.title?.ja) return step.title.ja;
  if (step.kind === "review") return L("確認画面", "Màn hình xác nhận");
  if (step.kind === "complete") return L("完了画面", "Màn hình hoàn tất");
  const n = S.draft.steps.filter((s) => s.kind === "form").indexOf(step) + 1;
  return L("ステップ ", "Bước ") + n;
}
export const stepById = (id) => S.draft?.steps.find((s) => s.id === id);
export const currentStep = () => stepById(S.currentStep);
export const fieldById = (id) => S.draft?.fields.find((f) => f.id === id);
export const fieldOfContent = (c) =>
  c.field || c.group
    ? S.draft.fields.find((f) => "$local:" + f.id === (c.field ?? c.group))
    : undefined;
export const stepOfField = (id) =>
  S.draft.steps.find((s) => s.content?.some((c) => (c.field ?? c.group) === "$local:" + id));
export const blockInstance = (id) => S.draft.blockInstances?.find((i) => i.id === id);
export const blockEntryFor = (instance) =>
  S.catalog.blocks.find((b) => b.pin === S.draft.dependencies?.blocks?.[instance?.block]);
export const formSteps = () => S.draft.steps.filter((s) => s.kind === "form");
export const formTitleText = () =>
  S.draft?.texts?.formTitle?.ja ||
  $("form-title").value ||
  L("無題のフォーム", "Biểu mẫu chưa đặt tên");
export function ruleRef(field) {
  return field.ref ?? "$local:" + field.id;
}
// Fields a rule on `stepId` may reference: everything up to and including that step, plus block exports.
export function ruleFields(stepId, exclude) {
  const end = stepId ? S.draft.steps.findIndex((s) => s.id === stepId) : S.draft.steps.length - 1;
  const content = S.draft.steps.slice(0, end + 1).flatMap((s) => s.content ?? []);
  const refs = new Set(content.filter((c) => c.field).map((c) => c.field));
  const fields = S.draft.fields.filter(
    (f) => f.id !== exclude && refs.has("$local:" + f.id) && f.type !== "group",
  );
  for (const c of content.filter((c) => c.block)) {
    const instance = blockInstance(c.block);
    const entry = blockEntryFor(instance);
    for (const exported of entry?.block.exports ?? []) {
      const field = entry.block.fields.find((f) => f.id === exported.field);
      if (field)
        fields.push({
          ...field,
          id: instance.id + ":@" + exported.id,
          ref: instance.id + ":@" + exported.id,
          label: { ja: instance.alias + " · " + (field.label?.ja ?? field.key) },
        });
    }
  }
  return fields;
}
// Every referencable field in the form (used to describe existing rules).
export function allRuleFields() {
  return ruleFields();
}
export const textValue = (key) => S.draft?.texts?.[key];
export function setText(key, lang, value) {
  const current = Object.fromEntries(
    Object.entries({ ...S.draft.texts?.[key], [lang]: value }).filter(([, text]) => text),
  );
  const texts = Object.fromEntries(
    Object.entries({ ...S.draft.texts, [key]: current }).filter(
      ([, entry]) => Object.keys(entry).length,
    ),
  );
  if (Object.keys(texts).length) S.draft.texts = texts;
  else delete S.draft.texts;
}
export const catalogText = (key) => S.catalog.texts?.[key]?.ja ?? "";
// ---------- Display components (typed and declarative: no HTML, script or CSS) ----------
export const DISPLAY_TYPES = {
  heading: { label: "見出し", vi: "Tiêu đề", icon: "heading", group: "display" },
  text: { label: "テキスト", vi: "Đoạn văn", icon: "lines", group: "display" },
  image: { label: "画像", vi: "Hình ảnh", icon: "image", group: "display" },
  fieldValue: { label: "入力値の表示", vi: "Giá trị đã nhập", icon: "eye", group: "display" },
  groupSummary: {
    label: "商品一覧の表示",
    vi: "Danh sách sản phẩm",
    icon: "layers",
    group: "display",
  },
  summary: { label: "入力内容の一覧", vi: "Tóm tắt câu trả lời", icon: "review", group: "display" },
  section: { label: "セクション", vi: "Khu vực", icon: "grid", group: "layout" },
  divider: { label: "区切り線", vi: "Đường kẻ", icon: "divider", group: "layout" },
  spacer: { label: "余白", vi: "Khoảng trống", icon: "spacer", group: "layout" },
  reference: { label: "受付番号", vi: "Mã tiếp nhận", icon: "hash", group: "system" },
  button: { label: "ボタン", vi: "Nút", icon: "external", group: "system" },
};
export const displayTypeLabel = (t) =>
  DISPLAY_TYPES[t] ? L(DISPLAY_TYPES[t].label, DISPLAY_TYPES[t].vi) : t;
export const displayText = (d) =>
  d.text?.ja || d.title?.ja || d.label?.ja || d.alt?.ja || displayTypeLabel(d.type);
export const displayBinding = (d) =>
  d.type === "fieldValue" ? d.field : d.type === "groupSummary" ? d.group : undefined;
// Display items of a step, including one level of section children.
export const displayEntries = (step) =>
  (step.content ?? []).flatMap((c) =>
    c.display ? [c.display, ...(c.display.type === "section" ? c.display.children : [])] : [],
  );
export function displayById(id) {
  for (const step of S.draft?.steps ?? [])
    for (const c of step.content ?? []) {
      if (!c.display) continue;
      if (c.display.id === id) return { display: c.display, step };
      const child = c.display.children?.find((d) => d.id === id);
      if (child) return { display: child, step, parent: c.display };
    }
  return null;
}
// Field ids an expression reads, following named conditions.
function refsOf(e, seen = new Set()) {
  if (!e || typeof e !== "object") return [];
  if (e.ref?.startsWith("$local:")) return [e.ref.slice(7)];
  if (e.cond && !seen.has(e.cond)) {
    seen.add(e.cond);
    return refsOf(S.draft.conditions?.[e.cond]?.when, seen);
  }
  return (e.args ?? []).flatMap((a) => refsOf(a, seen));
}
// Advisory checks shown while editing; the server-side engine remains the only authority.
export function lint() {
  const out = [];
  if (!S.draft) return out;
  const keys = new Map();
  for (const f of S.draft.fields) keys.set(f.key, (keys.get(f.key) ?? 0) + 1);
  for (const step of S.draft.steps) {
    if (step.kind !== "form") continue;
    if (!step.content?.length)
      out.push({ level: "warn", text: "フィールドがありません", step: step.id });
    if (step.transitions?.some((t) => "default" in t && !t.default))
      out.push({ level: "error", text: "「次のステップ」が未設定です", step: step.id });
    for (const c of step.content ?? []) {
      const f = fieldOfContent(c);
      if (!f) continue;
      if (!f.label?.ja)
        out.push({ level: "error", text: "表示名が空です", step: step.id, field: f.id });
      if (f.type.startsWith("choice.") && !f.options?.length)
        out.push({ level: "error", text: "選択肢がありません", step: step.id, field: f.id });
      if (keys.get(f.key) > 1)
        out.push({
          level: "error",
          text: "データキーが重複しています",
          step: step.id,
          field: f.id,
        });
    }
  }
  lintGraph(out);
  lintDisplays(out);
  const known = new Set(allRuleFields().map((f) => ruleRef(f)));
  const json = JSON.stringify(S.draft.steps) + JSON.stringify(S.draft.fields);
  for (const m of json.matchAll(/"ref":"(\$local:[^"]+)"/g))
    if (!known.has(m[1]) && !S.draft.fields.some((f) => "$local:" + f.id === m[1])) {
      out.push({ level: "error", text: "削除されたフィールドを参照するルールがあります" });
      break;
    }
  return out;
}
// Step graph and step-order references, mirroring the engine (E-GRAPH-*, E-FORWARD-REF) with
// messages that name the steps involved and what to change.
const targetOf = (t) => t.to ?? t.default;
function reaches(from, to, seen = new Set()) {
  if (from === to) return true;
  if (seen.has(from)) return false;
  seen.add(from);
  return (stepById(from)?.transitions ?? []).some((t) => reaches(targetOf(t), to, seen));
}
const ownerOf = () =>
  new Map(
    S.draft.steps.flatMap((s) =>
      (s.content ?? []).flatMap((c) =>
        c.field || c.group ? [[(c.field ?? c.group).slice(7), s.id]] : [],
      ),
    ),
  );
function forwardRefs(out, step, owner, expressions, where) {
  for (const id of new Set(expressions.flatMap((e) => refsOf(e)))) {
    const target = owner.get(id);
    if (!target || target === step.id || !reaches(step.id, target)) continue;
    out.push({
      level: "error",
      text: L(
        `${where}が後ろの「${stepLabel(stepById(target))}」の「${fieldLabel(fieldById(id))}」を参照しています。参照先を前のステップへ移すか、条件を変更してください`,
        `${where} tham chiếu 「${fieldLabel(fieldById(id))}」 ở bước sau 「${stepLabel(stepById(target))}」. Hãy chuyển trường lên trước hoặc đổi điều kiện.`,
      ),
      step: step.id,
    });
  }
}
function lintGraph(out) {
  const first = S.draft.steps[0]?.id;
  const owner = ownerOf();
  for (const step of S.draft.steps) {
    for (const t of step.transitions ?? []) {
      const target = stepById(targetOf(t));
      if (!targetOf(t)) continue;
      if (!target)
        out.push({
          level: "error",
          text: L(
            "移動先のステップが見つかりません。「分岐」タブで移動先を選び直してください",
            "Không tìm thấy bước đích. Hãy chọn lại ở tab 分岐.",
          ),
          step: step.id,
        });
      else if (target !== step && reaches(target.id, step.id))
        out.push({
          level: "error",
          text: L(
            `「${stepLabel(step)}」から前の「${stepLabel(target)}」へ戻る移動があり、ループします。移動先を後ろのステップに変更してください`,
            `「${stepLabel(step)}」 chuyển về bước trước 「${stepLabel(target)}」 tạo vòng lặp. Hãy chọn bước phía sau.`,
          ),
          step: step.id,
        });
    }
    if (first && !reaches(first, step.id))
      out.push({
        level: "error",
        text: L(
          `「${stepLabel(step)}」へ到達する経路がありません。前のステップの「次のステップ」を確認してください`,
          `Không có đường tới 「${stepLabel(step)}」. Kiểm tra 「次のステップ」 của bước trước.`,
        ),
        step: step.id,
      });
    const own = S.draft.fields.filter((f) => owner.get(f.id) === step.id);
    forwardRefs(
      out,
      step,
      owner,
      [
        ...(step.transitions ?? []).map((t) => t.when),
        step.skipWhen,
        ...own.flatMap((f) => [f.visibleWhen, f.requiredWhen, f.formula]),
      ],
      L(`「${stepLabel(step)}」の条件`, `Điều kiện của 「${stepLabel(step)}」`),
    );
  }
}
function lintDisplays(out) {
  const owner = ownerOf();
  const ids = new Set();
  for (const step of S.draft.steps)
    for (const d of displayEntries(step)) {
      const issue = (text) => out.push({ level: "error", text, step: step.id, display: d.id });
      if (ids.has(d.id)) issue(L("表示部品の ID が重複しています", "ID thành phần bị trùng"));
      ids.add(d.id);
      if (["heading", "text"].includes(d.type) && !d.text?.ja?.trim())
        issue(L("テキストが空です", "Nội dung trống"));
      if (d.type === "button" && !d.label?.ja?.trim())
        issue(L("ボタンの文言が空です", "Nhãn nút trống"));
      if (
        (d.type === "reference" || (d.type === "button" && d.action === "restart")) &&
        step.kind !== "complete"
      )
        issue(
          L(
            "受付番号と「最初から」ボタンは完了画面にだけ置けます",
            "Mã tiếp nhận và nút làm lại chỉ đặt ở màn hình hoàn tất",
          ),
        );
      const bound = displayBinding(d);
      if (d.type === "fieldValue" || d.type === "groupSummary") {
        const node = bound && fieldById(bound.slice(7));
        if (!node || (node.type === "group") !== (d.type === "groupSummary"))
          issue(
            L(
              "表示する項目を「基本」タブで選んでください（削除された項目を参照しています）",
              "Hãy chọn trường cần hiển thị ở tab 基本 (trường đã bị xóa).",
            ),
          );
        else {
          const classes = [node, ...(node.fields ?? [])].map((f) => f.classification);
          if (step.kind === "complete" && classes.some((c) => c !== "public"))
            issue(
              L(
                "完了画面には個人情報を含む項目を表示できません。確認画面に移すか項目を変更してください",
                "Màn hình hoàn tất không được hiển thị dữ liệu cá nhân.",
              ),
            );
          else if (
            classes.includes("secret") &&
            (d.type !== "fieldValue" || !d.mask || d.mask === "none")
          )
            issue(L("秘密情報はマスク表示が必要です", "Thông tin bí mật phải được che"));
        }
      }
      forwardRefs(
        out,
        step,
        owner,
        [d.visibleWhen, bound && { ref: bound }],
        L(`表示部品「${displayText(d)}」`, `Thành phần 「${displayText(d)}」`),
      );
    }
}
