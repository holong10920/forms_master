// Form Studio shell: sign-in (Mock IdP, OIDC + PKCE), header, form list, modes and global wiring.
import {
  $,
  h,
  fill,
  icon,
  btn,
  setErrorSink,
  togglePopover,
  closePopover,
  confirmDialog,
  emptyState,
  L,
} from "./ui.js";
import {
  S,
  on,
  notice,
  api,
  site,
  scope,
  roles,
  can,
  canEdit,
  errorText,
  refreshForms,
  loadHistory,
  resetPreview,
  isDirty,
  persistence,
  setSaveState,
  resetPersistence,
  restorePersistence,
  markRecovered,
  dirty,
  autosaveChanged,
  cancelAutosave,
  compareConflict,
  save,
  newId,
} from "./state.js";
import { renderBuild, buildShortcut, editorState } from "./editor.js";
import {
  hooks,
  renderFlow,
  renderTranslations,
  renderPreviewMode,
  openPreview,
  renderPublish,
  openReviewDialog,
  validate,
} from "./workflow.js";

setErrorSink((e) => notice(errorText(e)));

const ACCOUNTS = [
  ["synthetic-editor", "編集者", "フォームの作成・編集とレビュー依頼"],
  ["synthetic-reviewer", "レビュー担当", "レビュー内容の承認・差し戻し"],
  ["synthetic-publisher", "公開担当", "承認済みの版の公開・ロールバック"],
  ["synthetic-viewer", "閲覧者", "閲覧のみ（変更不可）"],
  ["synthetic-other", "他サイトの編集者", "別サイトのみ編集可能（サイト分離の確認用）"],
  ["synthetic-security", "セキュリティ担当", "配備ポリシーの確認"],
];
const ROLE_LABELS = {
  editor: "編集者",
  reviewer: "レビュー担当",
  publisher: "公開担当",
  viewer: "閲覧者",
  security: "セキュリティ担当",
};
const SITE_NAMES = {
  site_sports_synthetic: "Sports サイト（合成）",
  site_pc_synthetic: "PC サイト（合成）",
  site_other_synthetic: "別サイト（合成）",
};
const MODES = [
  ["build", "作成", "pencil"],
  ["flow", "フロー", "flow"],
  ["translate", "翻訳", "globe"],
  ["preview", "プレビュー", "eye"],
  ["publish", "公開", "rocket"],
];
const RECOVERY_KEY = "fb.admin.recovery";
const roleText = (siteId) =>
  roles(siteId)
    .map((r) => ROLE_LABELS[r] ?? r)
    .join("・") || "—";
const initial = (user) => (user.replace(/^synthetic-/, "")[0] ?? "?").toUpperCase();

// ---------- Static icons ----------
fill($("brand-mark"), icon("brand"));
fill($("search-icon"), icon("search"));
fill($("new-form-icon"), icon("file"));
fill($("more-btn"), icon("more"));
$("new-form").prepend(icon("plus"));
fill($("preview"), icon("eye"), h("span", { class: "btn-label" }, "プレビュー"));

// ---------- Session ----------
async function loadSession() {
  const r = await fetch("/api/session");
  S.session = r.ok ? await r.json() : null;
  if (S.session) {
    [S.schema, S.catalog] = await Promise.all([
      fetch("/api/schema").then((x) => x.json()),
      fetch("/api/catalog").then((x) => x.json()),
    ]);
    const chosen = $("site").value;
    fill($("site"), ...S.session.sites.map((s) => new Option(SITE_NAMES[s.id] ?? s.id, s.id)));
    if (S.session.sites.some((s) => s.id === chosen)) $("site").value = chosen;
  }
  S.sessionExpired = false;
  $("session-banner").hidden = true;
  renderShell();
}

async function login(user) {
  closePopover();
  if (isDirty()) {
    // Only an expired session may carry unsaved edits across the IdP round trip, and only back to
    // the same account; everything else must be saved first.
    if (!S.sessionExpired || user !== S.session?.user)
      return notice("アカウント切替の前に保存してください");
    try {
      window.sessionStorage.setItem(
        RECOVERY_KEY,
        JSON.stringify({
          user: S.session.user,
          draft: S.draft,
          version: S.version,
          title: $("form-title").value,
          currentStep: S.currentStep,
          selected: S.selected,
          baseDocument: persistence.baseDocument,
          editSeq: persistence.editSeq,
          savedSeq: persistence.savedSeq,
        }),
      );
    } catch {
      return notice("未保存の変更を安全に保持できません。再ログインを停止しました。");
    }
    markRecovered();
  }
  cancelAutosave();
  notice("ログイン中");
  resetPreview();
  const target = S.draft
    ? "/?site=" + encodeURIComponent(S.draft.siteId) + "&form=" + encodeURIComponent(S.draft.formId)
    : "/";
  const response = await api("login", { user, target });
  window.location.assign(response.authorizeUrl);
}

async function logout() {
  closePopover();
  if (isDirty()) return notice("ログアウトの前に保存してください");
  cancelAutosave();
  await api("logout");
  S.session = null;
  try {
    window.sessionStorage.removeItem(RECOVERY_KEY);
  } catch {
    // Nothing stored.
  }
  resetPreview();
  closeDraft();
  await loadSession();
}

function accountButton(user, role, description, menu) {
  return h(
    "button",
    {
      type: "button",
      class: menu ? "menu-item account-item" : "account-card",
      role: menu ? "menuitem" : undefined,
      dataset: { account: user },
      "aria-current": S.session?.user === user ? "true" : undefined,
      onclick: () => void login(user).catch((e) => notice(errorText(e))),
    },
    h("span", { class: "avatar", translate: "no", "aria-hidden": "true" }, initial(user)),
    h(
      "span",
      { class: "account-text" },
      h("b", { translate: "no" }, user),
      h("small", {}, h("span", {}, role), menu ? null : [" · ", h("span", {}, description)]),
    ),
    S.session?.user === user ? icon("check", "chevron") : menu ? null : icon("chevR", "chevron"),
  );
}

function renderSignin() {
  fill($("account-list"), ...ACCOUNTS.map(([u, role, d]) => accountButton(u, role, d)));
}

function buildUserMenu(pop) {
  fill(
    pop,
    h(
      "div",
      { class: "menu-block" },
      h("b", { translate: "no" }, S.session.user),
      h(
        "div",
        { class: "small muted" },
        L("このサイトでの役割: ", "Vai trò ở trang này: "),
        roleText(site()),
      ),
    ),
    h("div", { class: "menu-sep" }),
    h("div", { class: "menu-label small muted" }, "アカウントを切り替え"),
    ...ACCOUNTS.map(([u, role, d]) => accountButton(u, role, d, true)),
    h("div", { class: "menu-sep" }),
    h(
      "button",
      {
        type: "button",
        class: "menu-item",
        role: "menuitem",
        id: "logout",
        onclick: () => void logout().catch((e) => notice(errorText(e))),
      },
      icon("logout"),
      "ログアウト",
    ),
  );
}

// ---------- Header ----------
function formStatus() {
  const history = S.history;
  const latest = history?.reviews[0];
  if (latest?.state === "OPEN") return ["chip-info", "レビュー中"];
  if (latest?.state === "APPROVED") return ["chip-success", "承認済み"];
  if (history?.active?.candidateId) return ["chip-success", "公開中"];
  return ["", "下書き"];
}

function primaryAction() {
  const reviews = S.history?.reviews ?? [];
  if (canEdit()) return ["レビュー依頼", "send", openReviewDialog];
  if (can("reviewer") && reviews.some((r) => r.state === "OPEN"))
    return ["レビューする", "review", () => setMode("publish")];
  if (can("publisher") && reviews.some((r) => r.state === "APPROVED"))
    return ["公開へ進む", "rocket", () => setMode("publish")];
  return null;
}

function renderModes() {
  const nav = $("modes");
  const hadFocus = nav.contains(document.activeElement);
  fill(
    nav,
    ...MODES.map(([key, label, iconName]) =>
      h(
        "button",
        {
          type: "button",
          class: "mode-tab",
          role: "tab",
          id: "mode-tab-" + key,
          "aria-selected": String(S.mode === key),
          "aria-controls": "mode-" + key,
          tabIndex: S.mode === key ? 0 : -1,
          title: label,
          dataset: { mode: key },
          onclick: () => selectMode(key),
        },
        icon(iconName),
        h("span", { class: "mode-label" }, label),
      ),
    ),
  );
  if (hadFocus) nav.querySelector('[aria-selected="true"]')?.focus();
}
$("modes").addEventListener("keydown", (e) => {
  const tabs = [...$("modes").querySelectorAll('[role="tab"]')];
  const i = tabs.indexOf(document.activeElement);
  if (i < 0 || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
  e.preventDefault();
  const n =
    e.key === "Home"
      ? 0
      : e.key === "End"
        ? tabs.length - 1
        : (i + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
  selectMode(tabs[n].dataset.mode);
});

function renderHeader() {
  const signedIn = !!S.session;
  const open = signedIn && !!S.draft;
  $("crumbs").hidden = !signedIn;
  $("title-sep").hidden = !open;
  $("form-title").hidden = !open;
  $("form-title").readOnly = !canEdit();
  $("modes").hidden = !open;
  $("preview").hidden = !open;
  $("more-btn").hidden = !open;
  $("identity-btn").hidden = !signedIn;
  $("readonly-badge").hidden = !open || canEdit();
  $("validate").hidden = !canEdit();
  $("delete").hidden = !canEdit();
  const status = $("status-chip");
  status.hidden = !open;
  if (open) {
    const [cls, text] = formStatus();
    status.className = "chip chip-dot " + cls;
    status.textContent = text;
    status.title = text;
    renderModes();
  }
  if (signedIn) {
    $("avatar").textContent = initial(S.session.user);
    $("identity").textContent = S.session.user;
    $("identity-role").textContent = roleText(site());
  }
  const cta = $("primary-cta");
  const action = open ? primaryAction() : null;
  cta.hidden = !action;
  if (action) {
    const [label, iconName, fn] = action;
    fill(cta, icon(iconName), h("span", { class: "btn-label" }, label));
    cta.onclick = () => {
      if (cta.disabled) return;
      cta.disabled = true;
      Promise.resolve()
        .then(fn)
        .catch((e) => notice(errorText(e)))
        .finally(() => (cta.disabled = false));
    };
  }
  setSaveState();
}

// ---------- Home (form list) ----------
let search = "";
const untitled = (f) => !f.title || f.title === f.formId;
function renderHome() {
  const list = $("forms");
  // Separate text nodes so the i18n layer can translate each part.
  fill(
    $("home-sub"),
    h("span", {}, SITE_NAMES[site()] ?? site()),
    " · ",
    h("span", {}, "あなたの役割:"),
    " ",
    h("span", {}, roleText(site())),
  );
  $("new-form").hidden = !canEdit();
  list.setAttribute("aria-busy", String(S.formsState === "loading"));
  if (S.formsState === "loading" && !S.forms.length)
    return fill(
      list,
      ...[1, 2, 3].map(() => h("li", { class: "skeleton", "aria-hidden": "true" })),
    );
  if (S.formsState === "error")
    return fill(
      list,
      h(
        "li",
        { class: "form-grid-empty" },
        emptyState(
          "alert",
          "フォーム一覧を読み込めませんでした",
          "通信状態を確認して再試行してください。",
          btn("再試行", () => refreshForms(), { iconName: "refresh" }),
        ),
      ),
    );
  const term = search.trim().toLowerCase();
  const forms = S.forms.filter(
    (f) =>
      !term ||
      (untitled(f) ? "無題のフォーム" : f.title).toLowerCase().includes(term) ||
      f.formId.includes(term),
  );
  if (!forms.length)
    return fill(
      list,
      h(
        "li",
        { class: "form-grid-empty" },
        term
          ? emptyState(
              "search",
              "該当するフォームがありません",
              "別のキーワードで検索してください。",
            )
          : emptyState(
              "file",
              "まだフォームがありません",
              canEdit()
                ? "「新規フォーム」から最初のフォームを作成しましょう。"
                : "編集者がフォームを作成すると、ここに表示されます。",
              ...(canEdit()
                ? [
                    btn("新規フォームを作成", openNewFormDialog, {
                      variant: "primary",
                      iconName: "plus",
                    }),
                  ]
                : []),
            ),
      ),
    );
  fill(
    list,
    ...(canEdit() && !term
      ? [
          h(
            "li",
            {},
            h(
              "button",
              { type: "button", class: "new-card", onclick: openNewFormDialog },
              h("span", { class: "plus", "aria-hidden": "true" }, icon("plus")),
              "空のフォームから作成",
            ),
          ),
        ]
      : []),
    ...forms.map((f) =>
      h(
        "li",
        {},
        h(
          "button",
          {
            type: "button",
            class: "form-card",
            dataset: { formId: f.formId },
            onclick: () => void openForm(f.formId).catch((e) => notice(errorText(e))),
          },
          h(
            "span",
            { class: "form-thumb", "aria-hidden": "true" },
            h("span"),
            h("span"),
            h("span"),
          ),
          untitled(f)
            ? h("h3", { class: "muted" }, "無題のフォーム")
            : h("h3", { translate: "no" }, f.title),
          untitled(f) ? h("span", { class: "mono small muted", translate: "no" }, f.formId) : null,
          h(
            "span",
            { class: "form-card-meta" },
            h("span", { class: "chip" }, L("保存版 ", "Bản lưu ") + "v" + f.version),
            h("span", { class: "spacer" }),
            icon("chevR"),
          ),
        ),
      ),
    ),
  );
}
$("form-search").addEventListener("input", () => {
  search = $("form-search").value;
  renderHome();
});

// ---------- Shell / modes ----------
function renderShell() {
  const signedIn = !!S.session;
  $("signin").hidden = signedIn;
  $("studio").hidden = !signedIn;
  if (!signedIn) renderSignin();
  else {
    $("home").hidden = !!S.draft;
    $("editor").hidden = !S.draft;
    if (S.draft) {
      for (const [key] of MODES) $("mode-" + key).hidden = key !== S.mode;
      renderMode();
    } else renderHome();
  }
  renderHeader();
}

function renderMode() {
  if (!S.draft) return;
  if (S.mode === "build") renderBuild();
  else if (S.mode === "flow") renderFlow();
  else if (S.mode === "translate") renderTranslations();
  else if (S.mode === "preview") renderPreviewMode();
  else if (S.mode === "publish") renderPublish();
}

function setMode(mode) {
  if (!S.draft) return;
  closePopover();
  S.mode = mode;
  for (const [key] of MODES) $("mode-" + key).hidden = key !== mode;
  renderHeader();
  renderMode();
  if (mode === "publish") void loadHistory().catch((e) => notice(errorText(e)));
}
// The Preview tab starts a preview on first use; a stopped (revoked) preview is never restarted
// automatically.
function selectMode(mode) {
  if (mode === "preview" && !S.pendingPreview && S.previewState === "idle")
    return void openPreview().catch((e) => notice(errorText(e)));
  setMode(mode);
}

function syncUrl() {
  const url = S.draft
    ? "/?site=" + encodeURIComponent(site()) + "&form=" + encodeURIComponent(S.draft.formId)
    : "/";
  if (window.location.pathname + window.location.search !== url)
    window.history.replaceState(null, "", url);
}

// Puts a server copy of a draft ({definition, version, title}) into the editor.
async function adoptDraft(data) {
  S.draft = data.definition;
  S.version = data.version;
  // The server falls back to the form ID when no name was given; show a human name instead.
  $("form-title").value = untitled({ title: data.title, formId: S.draft.formId })
    ? "無題のフォーム"
    : data.title;
  resetPersistence();
  S.currentStep = S.draft.steps[0].id;
  S.selected = null;
  S.history = null;
  S.mode = "build";
  editorState.inspTab = {};
  resetPreview();
  syncUrl();
  renderShell();
  await loadHistory();
}
hooks.adopt = async (data) => {
  await adoptDraft(data);
  await refreshForms();
};

async function openForm(formId) {
  notice("読み込み中", { quiet: true });
  const data = await api("get", { site: site(), form: formId });
  await adoptDraft(data);
  notice("保存済みドラフトを読み込みました");
}

function closeDraft() {
  S.draft = null;
  S.version = 0;
  S.history = null;
  S.selected = null;
  S.mode = "build";
  resetPersistence();
  resetPreview();
  syncUrl();
}

async function goHome() {
  closePopover();
  if (isDirty()) await save();
  closeDraft();
  renderShell();
  await refreshForms();
}

// ---------- New form ----------
function openNewFormDialog() {
  if (isDirty()) return notice("新規作成の前に保存してください");
  $("new-name").value = "";
  $("new-form-dialog").showModal();
  $("new-name").focus();
}
async function createForm() {
  if (isDirty()) return notice("新規作成の前に保存してください");
  const id = newId("frm_");
  const title = $("new-name").value.trim() || "無題のフォーム";
  S.draft = {
    schemaVersion: "1.0.0",
    kind: "form",
    formId: id,
    siteId: site(),
    locale: { default: "ja", supported: ["ja"] },
    fields: [],
    conditions: {},
    steps: [
      { id: "stp_details", kind: "form", content: [], transitions: [{ default: "stp_review" }] },
      { id: "stp_review", kind: "review", transitions: [{ default: "stp_complete" }] },
      { id: "stp_complete", kind: "complete" },
    ],
  };
  S.version = 0;
  $("form-title").value = title;
  resetPersistence();
  S.currentStep = "stp_details";
  S.selected = null;
  S.history = null;
  S.mode = "build";
  editorState.inspTab = {};
  try {
    await save();
  } catch (e) {
    closeDraft();
    renderShell();
    throw e;
  }
  $("new-form-dialog").close();
  syncUrl();
  renderShell();
  notice(`フォーム作成: ${title}`);
  await loadHistory();
}
$("new-form").addEventListener("click", openNewFormDialog);
$("new-form-cancel").addEventListener("click", () => $("new-form-dialog").close());
$("new-form-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const create = $("create");
  if (create.disabled) return;
  create.disabled = true;
  createForm()
    .catch((err) => notice(errorText(err)))
    .finally(() => (create.disabled = false));
});

// ---------- Header wiring ----------
$("home-link").addEventListener("click", () => {
  if (!S.session) return;
  void goHome().catch((e) => notice(errorText(e)));
});
$("site").addEventListener("change", () => {
  if (S.draft && isDirty()) {
    $("site").value = S.draft.siteId;
    return notice("サイト切替の前に保存してください");
  }
  closeDraft();
  renderShell();
  void refreshForms().catch((e) => notice(errorText(e)));
});
$("form-title").addEventListener("keydown", (e) => {
  if (e.key === "Enter") $("form-title").blur();
});
$("preview").addEventListener("click", () => void openPreview().catch((e) => notice(errorText(e))));
$("save-state").addEventListener("click", () =>
  togglePopover($("save-state"), $("save-menu"), () => setSaveState()),
);
$("more-btn").addEventListener("click", () => togglePopover($("more-btn"), $("more-menu")));
$("identity-btn").addEventListener("click", () =>
  togglePopover($("identity-btn"), $("user-menu"), buildUserMenu),
);
$("autosave").addEventListener("change", autosaveChanged);
$("save").addEventListener("click", () => {
  closePopover();
  save()
    .then(() => notice("保存しました"))
    .catch((e) => notice(errorText(e)));
});
async function reloadLatest() {
  closePopover();
  if (!S.draft) return;
  if (
    isDirty() &&
    !(await confirmDialog({
      title: "未保存の変更を破棄して最新版を読み込みますか？",
      body: "この画面の未保存の変更は失われます。",
      confirm: "破棄して読み込む",
      tone: "danger",
    }))
  )
    return;
  await openForm(S.draft.formId);
}
$("load").addEventListener("click", () => void reloadLatest().catch((e) => notice(errorText(e))));
$("conflict-reload").addEventListener(
  "click",
  () => void reloadLatest().catch((e) => notice(errorText(e))),
);
$("compare").addEventListener(
  "click",
  () => void compareConflict().catch((e) => notice(errorText(e))),
);
$("validate").addEventListener("click", () => {
  closePopover();
  void validate().catch((e) => notice(errorText(e)));
});
$("delete").addEventListener("click", async () => {
  closePopover();
  const ok = await confirmDialog({
    title: "未公開ドラフトを削除しますか？",
    body: "保存済みのドラフトを削除します。公開済みのフォームは削除できません。",
    confirm: "削除する",
    tone: "danger",
    iconName: "trash",
  });
  if (!ok) return;
  try {
    await api("delete", { ...scope(), expected: S.version });
    closeDraft();
    renderShell();
    await refreshForms();
    notice("ドラフト削除");
  } catch (e) {
    notice(errorText(e));
  }
});
const SHORTCUTS = [
  ["⌘S / Ctrl+S", "保存"],
  ["Alt+↑ / Alt+↓", "選択中のフィールドを移動"],
  ["⌘D / Ctrl+D", "選択中のフィールドを複製"],
  ["Delete", "選択中のフィールドを削除"],
  ["F2", "名前を変更"],
  ["Esc", "選択を解除"],
  ["← / →", "タブを切り替え"],
];
$("shortcuts").addEventListener("click", () => {
  closePopover();
  void confirmDialog({
    title: "キーボード操作",
    body: "マウスを使わずにすべての編集操作ができます。",
    confirm: "閉じる",
    iconName: "keyboard",
    content: h(
      "dl",
      { class: "kv shortcuts" },
      ...SHORTCUTS.flatMap(([keys, text]) => [
        h("dt", {}, h("kbd", { translate: "no" }, keys)),
        h("dd", {}, text),
      ]),
    ),
  });
});
$("relogin").addEventListener(
  "click",
  () => void login(S.session?.user ?? ACCOUNTS[0][0]).catch((e) => notice(errorText(e))),
);
$("admin-locale").addEventListener("change", () => renderShell());

// ---------- Global ----------
on("render", () => renderMode());
on("mode", (mode) => setMode(mode));
on("open-preview", () => void openPreview().catch((e) => notice(errorText(e))));
on("preview", () => {
  if (S.mode === "preview" && S.draft) renderPreviewMode();
});
on("header", () => renderHeader());
on("saved", () => renderHeader());
on("forms", () => {
  if (S.session && !S.draft) renderHome();
});
on("session-expired", () => {
  $("session-banner").hidden = false;
});

// Field edits made through native controls mark the draft dirty; view-only controls opt out.
document.addEventListener("change", (e) => {
  if (!(e.target instanceof window.Element) || e.target.closest("[data-ui]")) return;
  if (e.target.closest("#mode-build, #mode-translate, #form-title")) dirty();
});
document.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
    e.preventDefault();
    if (S.draft && canEdit())
      save()
        .then(() => notice("保存しました"))
        .catch((err) => notice(errorText(err)));
    return;
  }
  if (S.draft && S.mode === "build" && !document.querySelector("dialog[open]")) buildShortcut(e);
});
window.addEventListener("beforeunload", (e) => {
  if (isDirty()) {
    e.preventDefault();
    e.returnValue = "";
  }
});

// ---------- Boot ----------
async function restoreRecovery() {
  let raw;
  try {
    raw = window.sessionStorage.getItem(RECOVERY_KEY);
    window.sessionStorage.removeItem(RECOVERY_KEY);
  } catch {
    return;
  }
  if (!raw) return;
  const recovery = JSON.parse(raw);
  if (
    recovery.user !== S.session.user ||
    !S.session.sites.some((s) => s.id === recovery.draft.siteId)
  )
    return;
  S.draft = recovery.draft;
  S.version = recovery.version;
  S.currentStep = recovery.currentStep;
  S.selected = recovery.selected;
  S.history = null;
  S.mode = "build";
  $("site").value = S.draft.siteId;
  $("form-title").value = recovery.title;
  resetPersistence();
  restorePersistence(recovery);
  syncUrl();
  renderShell();
  await refreshForms();
  await loadHistory();
}

void (async () => {
  await loadSession();
  if (!S.session) return;
  const q = new window.URLSearchParams(window.location.search);
  const siteId = q.get("site"),
    formId = q.get("form");
  if (siteId && S.session.sites.some((s) => s.id === siteId)) $("site").value = siteId;
  renderShell();
  await refreshForms();
  if (siteId && formId && site() === siteId)
    await api("get", { site: siteId, form: formId })
      .then(adoptDraft)
      .catch((e) => notice(errorText(e)));
  if (q.get("login") === "complete") {
    await restoreRecovery();
    notice("ログイン完了");
  }
  syncUrl();
})().catch((e) => notice(errorText(e)));
