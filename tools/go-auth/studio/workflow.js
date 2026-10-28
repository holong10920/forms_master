// Flow overview, isolated preview, review request and publish/rollback pages.
import {
  $,
  h,
  add,
  fill,
  icon,
  btn,
  segmented,
  confirmDialog,
  callout,
  emptyState,
  L,
} from "./ui.js";
import {
  S,
  emit,
  on,
  notice,
  api,
  scope,
  can,
  canEdit,
  ensureSaved,
  isDirty,
  save,
  showOk,
  loadHistory,
  previewFrame,
  humanDiagnostic,
  fieldLabel,
  stepLabel,
  stepById,
  typeLabel,
  lint,
  newId,
  errorText,
} from "./state.js";
import { describeRule } from "./rules.js";
import { editorState } from "./editor.js";

// Set by admin.js: opens a draft returned by the server (clone) in the editor.
export const hooks = { adopt: async () => {} };

const PREVIEW_ORIGIN = "http://127.0.0.1:4185";
const CUSTOMER_ORIGIN = "http://127.0.0.1:4183";
const releaseUrl = (id) => `${CUSTOMER_ORIGIN}/r/${id}/index.html`;
const when = (seconds) =>
  seconds
    ? new Date(seconds * 1000).toLocaleString(document.documentElement.lang, {
        dateStyle: "short",
        timeStyle: "short",
      })
    : "";

// ---------- Flow overview (read-only map; editing happens in build mode) ----------
export function renderFlow() {
  const box = $("flow-overview");
  if (!S.draft) return fill(box);
  const issues = lint().filter((x) => x.step && !x.field);
  const list = h("ol", { class: "flow" });
  let n = 0;
  S.draft.steps.forEach((step, i) => {
    if (i) add(list, h("li", { class: "flow-link", "aria-hidden": "true" }));
    const isForm = step.kind === "form";
    if (isForm) n++;
    const edges = (step.transitions ?? []).map((t, index) => {
      const target = stepById(t.to ?? t.default);
      const label = target ? stepLabel(target) : L("未設定", "Chưa đặt");
      return h(
        "li",
        { class: "flow-edge" },
        icon(t.when ? "branch" : "chevR"),
        h(
          "span",
          { translate: "no" },
          t.when
            ? L(`優先 ${index + 1}: `, `Ưu tiên ${index + 1}: `) +
                describeRule(t.when) +
                " → " +
                label
            : (step.transitions.length > 1
                ? L("それ以外 → ", "Trường hợp khác → ")
                : L("次へ → ", "Tiếp → ")) + label,
        ),
      );
    });
    if (step.skipWhen)
      edges.unshift(
        h(
          "li",
          { class: "flow-edge" },
          icon("chevR"),
          h("span", { translate: "no" }, L("スキップ: ", "Bỏ qua: ") + describeRule(step.skipWhen)),
        ),
      );
    const own = issues.filter((x) => x.step === step.id);
    add(
      list,
      h(
        "li",
        { class: "flow-node", dataset: { stepId: step.id, kind: step.kind } },
        h(
          "div",
          { class: "flow-node-head" },
          h(
            "span",
            { class: "ol-num", "aria-hidden": "true" },
            isForm ? String(n) : icon(step.kind === "review" ? "review" : "flag"),
          ),
          h("h3", { translate: "no" }, stepLabel(step)),
          h(
            "span",
            { class: "chip" },
            isForm
              ? L(`${step.content?.length ?? 0} 項目`, `${step.content?.length ?? 0} mục`)
              : step.kind === "review"
                ? "確認画面"
                : "完了画面",
          ),
          h("span", { class: "spacer" }),
          isForm
            ? btn(
                "編集",
                () => {
                  S.currentStep = step.id;
                  S.selected = "step:" + step.id;
                  editorState.inspTab.step = step.transitions?.length > 1 ? "branches" : "basic";
                  emit("mode", "build");
                },
                {
                  size: "sm",
                  variant: "ghost",
                  iconName: "pencil",
                  aria: L("「", "Sửa 「") + stepLabel(step) + L("」を編集", "」"),
                },
              )
            : null,
        ),
        edges.length ? h("ul", { class: "flow-edges" }, edges) : null,
        ...own.map((x) => callout("warning", "alert", x.text)),
      ),
    );
  });
  fill(box, list);
}

// ---------- Isolated preview (separate origin; Admin only hands over a session id) ----------
// Reviewers/publishers without editor rights preview the snapshot under review.
function reviewForPreview() {
  const reviews = S.history?.reviews ?? [];
  return (reviews.find((r) => r.state === "OPEN") ?? reviews.find((r) => r.state === "APPROVED"))
    ?.id;
}
export async function openPreview(reviewId) {
  if (!S.draft) return;
  let id = reviewId;
  if (!id && !canEdit()) {
    if (!S.history) await loadHistory();
    id = reviewForPreview();
    if (!id) {
      emit("mode", "preview");
      return notice("プレビューできるレビューがありません");
    }
  }
  if (!id) await ensureSaved();
  S.previewState = "preparing";
  S.previewFor = id ?? null;
  emit("mode", "preview");
  emit("preview");
  try {
    S.pendingPreview = await api("preview", id ? { ...scope(), id } : scope());
  } catch (e) {
    S.previewState = "error";
    emit("preview");
    throw e;
  }
  previewFrame().src = PREVIEW_ORIGIN + "/";
  notice("隔離プレビューを準備中");
  emit("preview");
}
window.addEventListener("message", (e) => {
  if (e.origin !== PREVIEW_ORIGIN || e.source !== $("preview-frame")?.contentWindow) return;
  if (e.data?.type === "preview.hello" && S.pendingPreview)
    e.source.postMessage(
      {
        type: "session.start",
        previewSessionId: S.pendingPreview.previewSessionId,
        locale: document.documentElement.lang.startsWith("vi") ? "vi" : "ja",
      },
      e.origin,
    );
  if (e.data?.type === "preview.ready") {
    S.previewState = "ready";
    notice("プレビュー準備完了");
    emit("preview");
  }
});
// Revoked/blocked candidates stop the preview; it is never recreated automatically.
let previewPolling = false;
function stopPreview(message) {
  S.pendingPreview = null;
  S.previewState = "stopped";
  fill($("preview-container"));
  notice(message);
  emit("preview");
}
window.setInterval(async () => {
  if (!S.pendingPreview || previewPolling || !S.session) return;
  const current = S.pendingPreview.previewSessionId;
  previewPolling = true;
  try {
    const response = await fetch("/api/preview.status", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": S.session.csrf },
      body: JSON.stringify({ previewSessionId: current }),
    });
    const status = await response.json();
    if (S.pendingPreview?.previewSessionId === current && (!response.ok || !status.active))
      stopPreview(
        "プレビューを停止しました：この版は利用できません。更新を確認してからプレビューを開き直してください。",
      );
  } catch {
    if (S.pendingPreview?.previewSessionId === current)
      stopPreview("プレビューを停止しました：状態を確認できません。");
  } finally {
    previewPolling = false;
  }
}, 10000);

const PREVIEW_STATES = {
  idle: ["chip", "未作成"],
  preparing: ["chip chip-info", "準備中…"],
  ready: ["chip chip-success", "準備完了"],
  stopped: ["chip chip-warning", "停止中"],
  error: ["chip chip-danger", "エラー"],
};
let previewDevice = "desktop";
export function renderPreviewMode() {
  const device = $("preview-device");
  device.dataset.device = previewDevice;
  fill(
    $("preview-bar"),
    h(
      "div",
      { dataset: { ui: "true" } },
      segmented(
        "preview-device",
        "表示サイズ",
        [
          ["desktop", "PC", "monitor"],
          ["mobile", "スマホ", "phone"],
        ],
        previewDevice,
        (value) => {
          previewDevice = value;
          device.dataset.device = value;
        },
      ),
    ),
    h("span", { class: "spacer" }),
    btn(
      S.pendingPreview ? "プレビューを更新" : "プレビューを開始",
      () => openPreview(S.previewFor ?? undefined),
      {
        size: "sm",
        iconName: "refresh",
      },
    ),
  );
  // The frame stays in the DOM (the message bridge and revocation rely on it); guidance covers it
  // until a preview session exists.
  const live = !!S.pendingPreview;
  $("preview-container").hidden = !live;
  $("preview-empty").hidden = live;
  if (!live)
    fill(
      $("preview-empty"),
      S.previewState === "preparing"
        ? emptyState(
            "loader",
            "プレビューを準備中…",
            "保存済みの版から隔離プレビューを作成しています。",
          )
        : S.previewState === "stopped"
          ? emptyState(
              "alert",
              "プレビューを停止しました",
              "「プレビューを開始」で新しいプレビューを作成できます。",
            )
          : emptyState(
              "eye",
              "プレビューはまだありません",
              "「プレビューを開始」を押すと、お客様と同じ画面を別オリジンで確認できます。",
            ),
    );
  const [chipClass, chipText] = PREVIEW_STATES[S.previewState] ?? PREVIEW_STATES.idle;
  const diagnostics = S.pendingPreview?.diagnostics ?? [];
  const issues = lint();
  fill(
    $("preview-side"),
    h(
      "section",
      { class: "insp-section" },
      h("h3", {}, icon("eye"), "プレビューの状態"),
      h(
        "div",
        { class: "row" },
        h("span", { class: chipClass, role: "status" }, chipText),
        h(
          "span",
          { class: "small muted", translate: "no" },
          S.previewFor ? S.previewFor : "v" + S.version,
        ),
      ),
      h(
        "p",
        { class: "small muted" },
        S.previewFor
          ? "レビュー対象のスナップショットを表示しています。"
          : "保存済みの版を表示します。編集後は保存してから「プレビューを更新」を押してください。",
      ),
    ),
    diagnostics.length
      ? h(
          "section",
          { class: "insp-section" },
          h(
            "h3",
            {},
            icon("alert"),
            L(
              `一部プレビュー（未設定 ${diagnostics.length} 件）`,
              `Xem trước một phần (${diagnostics.length} mục chưa đặt)`,
            ),
          ),
          h(
            "ul",
            { class: "diag-list" },
            diagnostics.map((d) => {
              const x = humanDiagnostic(d.code);
              const step = stepById(d.step);
              return h(
                "li",
                { class: "diag" },
                icon("alert"),
                h(
                  "div",
                  {},
                  h("div", {}, x.message),
                  h(
                    "div",
                    { class: "small muted", translate: "no" },
                    d.code + (step ? " · " + stepLabel(step) : d.step ? " · " + d.step : ""),
                  ),
                ),
              );
            }),
          ),
          h(
            "p",
            { class: "small muted" },
            "未設定の経路の先には進めません。プレビューでは送信できません。",
          ),
        )
      : null,
    issues.length
      ? h(
          "section",
          { class: "insp-section" },
          h("h3", {}, icon("info"), "確認事項"),
          h(
            "ul",
            { class: "diag-list" },
            issues
              .slice(0, 8)
              .map((x) =>
                h("li", { class: "diag" }, icon("info"), h("span", { translate: "no" }, x.text)),
              ),
          ),
        )
      : null,
    h(
      "section",
      { class: "insp-section" },
      h("h3", {}, icon("shield"), "隔離"),
      h(
        "p",
        { class: "small muted" },
        "プレビューは別オリジン（127.0.0.1:4185）で動作し、管理画面の Cookie やスクリプトとは分離されています。プラグインのプログラムは管理画面では実行されません。",
      ),
    ),
  );
}

// ---------- Review request ----------
let contract = null;
function contractSummary(c) {
  const byId = new Map(S.draft.fields.map((f) => [f.id, f]));
  const name = (identity, row) => {
    const f = byId.get(identity);
    return f ? fieldLabel(f) : (row?.path ?? identity);
  };
  const changes = (c.changes ?? []).map((x) => {
    const what = !x.before ? "追加" : !x.after ? "削除" : "変更";
    return h(
      "li",
      {},
      h("span", { translate: "no" }, name(x.identity, x.after ?? x.before)),
      " — ",
      what,
      h(
        "span",
        { class: "small muted", translate: "no" },
        " (" + (x.after ?? x.before)?.path + ")",
      ),
    );
  });
  const classes = {
    public: L("公開", "Công khai"),
    personal: L("個人情報", "Cá nhân"),
    secret: L("機密", "Bí mật"),
  };
  return [
    h(
      "p",
      {},
      L(
        `保存済みの版 v${S.version} をスナップショットとして固定します。`,
        `Cố định bản đã lưu v${S.version} làm ảnh chụp.`,
      ),
    ),
    changes.length
      ? callout(
          "warning",
          "alert",
          h(
            "b",
            {},
            L(
              `送信データの構造が変わります（${changes.length} 件）`,
              `Cấu trúc dữ liệu gửi sẽ thay đổi (${changes.length} mục)`,
            ),
          ),
          h("ul", { class: "small" }, changes),
        )
      : callout("success", "check", "送信データの構造に変更はありません。"),
    h(
      "details",
      {},
      h(
        "summary",
        {},
        L(
          `送信されるデータ（${c.fields.length} 項目）`,
          `Dữ liệu được gửi (${c.fields.length} mục)`,
        ),
      ),
      h(
        "table",
        { class: "data-table" },
        h(
          "thead",
          {},
          h(
            "tr",
            {},
            h("th", {}, "項目"),
            h("th", {}, "データキー"),
            h("th", {}, "種類"),
            h("th", {}, "分類"),
            h("th", {}, "必須"),
          ),
        ),
        h(
          "tbody",
          {},
          c.fields.map((f) =>
            h(
              "tr",
              {},
              h("td", { translate: "no" }, name(f.identity, f)),
              h("td", { class: "mono", translate: "no" }, f.path),
              h("td", { translate: "no" }, typeLabel(f.type)),
              h("td", {}, classes[f.classification] ?? f.classification ?? "—"),
              h("td", {}, f.required ? "必須" : "—"),
            ),
          ),
        ),
      ),
    ),
  ];
}
export async function openReviewDialog() {
  if (!S.draft || !canEdit()) return;
  await ensureSaved();
  contract = await api("contract", scope());
  $("contract-diff").textContent = JSON.stringify(contract, null, 2);
  $("contract").hidden = false;
  $("contract").open = false;
  $("contract-ack").checked = false;
  $("contract-ack-row").hidden = !contract.ackRequired;
  const issues = lint();
  fill(
    $("review-body"),
    ...contractSummary(contract),
    issues.length
      ? callout(
          "info",
          "info",
          h("b", {}, L(`確認事項 ${issues.length} 件`, `${issues.length} mục cần kiểm tra`)),
          h(
            "ul",
            { class: "small", translate: "no" },
            issues.slice(0, 5).map((x) => h("li", {}, x.text)),
          ),
        )
      : null,
  );
  fill($("review-icon"), icon("send"));
  $("review-dialog").showModal();
}
async function submitReview() {
  if (contract?.ackRequired && !$("contract-ack").checked) {
    $("contract").open = true;
    $("contract-ack").focus();
    return notice("Data Contract の変更を確認してからレビュー依頼してください");
  }
  try {
    const r = await api("review", {
      ...scope(),
      version: S.version,
      dataContractAck: $("contract-ack").checked,
    });
    $("review-dialog").close();
    notice(`レビュー依頼: ${r.id}`);
    await loadHistory();
    emit("mode", "publish");
  } catch (e) {
    if (e.message === "DATA_CONTRACT_ACK_REQUIRED") $("contract").open = true;
    else $("review-dialog").close();
    throw e;
  }
}
$("review").addEventListener("click", () => {
  const button = $("review");
  if (button.disabled) return;
  button.disabled = true;
  submitReview()
    .catch((e) => notice(errorText(e)))
    .finally(() => (button.disabled = false));
});
$("review-cancel").addEventListener("click", () => $("review-dialog").close());

export async function validate() {
  await ensureSaved();
  await api("validate", scope());
  showOk("診断: 問題なし");
}

// ---------- Review / publish / rollback ----------
const REVIEW_STATES = {
  OPEN: ["chip-info", "レビュー中"],
  APPROVED: ["chip-success", "承認済み"],
  REJECTED: ["chip-danger", "差し戻し"],
  STALE: ["chip-warning", "要再確認"],
  PUBLISHING: ["chip-info", "公開処理中"],
  PUBLISHED: ["chip-success", "公開済み"],
  SUPERSEDED: ["", "置き換え済み"],
};
const STALE_REASONS = {
  pointer: "公開中の版が変わりました。新しくレビュー依頼が必要です。",
  platform: "プラットフォームが更新されました。再チェックしてください。",
};
const BUSY = ["PENDING", "BUILDING", "VERIFYING", "ACTIVATING"];

function lifecycle(data) {
  const latest = data.reviews[0];
  const live = !!data.active?.candidateId;
  const reached =
    latest?.state === "PUBLISHED" || (live && !latest)
      ? 4
      : latest?.state === "APPROVED" || latest?.state === "PUBLISHING"
        ? 3
        : latest?.state === "OPEN"
          ? 2
          : 1;
  return h(
    "ol",
    { class: "lifecycle", "aria-label": "公開までの流れ" },
    ["下書き", "レビュー依頼", "承認", "公開"].map((label, i) =>
      h(
        "li",
        {
          dataset: {
            state:
              i + 1 < reached || (i + 1 === 4 && reached === 4)
                ? "done"
                : i + 1 === reached
                  ? "current"
                  : "todo",
          },
          "aria-current": i + 1 === reached ? "step" : undefined,
        },
        label,
      ),
    ),
  );
}

function liveCard(data) {
  const active = data.active?.candidateId;
  if (!active)
    return h(
      "div",
      { class: "card card-pad" },
      h("div", { class: "row" }, icon("rocket"), h("b", {}, "まだ公開されていません")),
      h(
        "p",
        { class: "small muted" },
        "承認済みのスナップショットを公開すると、お客様用の URL がここに表示されます。",
      ),
    );
  const release = data.releases.find((r) => r.id === active);
  return h(
    "div",
    { class: "live-card" },
    h(
      "div",
      { class: "row" },
      h("span", { class: "chip chip-success" }, icon("dot"), "公開中"),
      h("span", { class: "small muted", translate: "no" }, when(release?.at)),
    ),
    h(
      "a",
      {
        href: releaseUrl(active),
        target: "_blank",
        rel: "noopener",
        translate: "no",
        "aria-label": "公開中のフォームを新しいタブで開く",
      },
      releaseUrl(active),
    ),
    h(
      "span",
      { class: "small muted" },
      "お客様はこの URL からフォームに回答します（ローカル合成環境）。",
    ),
  );
}

async function act(fn, message) {
  await fn();
  if (message) notice(message);
  await loadHistory();
}

// Review snapshots the user expanded, by review id: history refreshes re-render the cards and must keep them open.
const openSnapshots = new Map();
function snapshotDetails(id, button) {
  const snapshot = openSnapshots.get(id);
  const classes = {
    public: L("公開", "Công khai"),
    personal: L("個人情報", "Cá nhân"),
    secret: L("機密", "Bí mật"),
  };
  const details = h(
    "details",
    { open: true },
    h("summary", { translate: "no" }, snapshot.id + " · v" + snapshot.version),
    h(
      "table",
      { class: "data-table" },
      h(
        "thead",
        {},
        h(
          "tr",
          {},
          h("th", {}, "表示名"),
          h("th", {}, "データキー"),
          h("th", {}, "種類"),
          h("th", {}, "分類"),
          h("th", {}, "送信"),
        ),
      ),
      h(
        "tbody",
        { translate: "no" },
        snapshot.definition.fields.map((f) =>
          h(
            "tr",
            {},
            h("td", {}, f.label?.ja ?? f.key),
            h("td", { class: "mono" }, f.key),
            h("td", {}, typeLabel(f.type)),
            h("td", {}, classes[f.classification] ?? f.classification),
            h(
              "td",
              {},
              f.submit === "displayOnly" ? L("表示のみ", "Chỉ hiển thị") : L("含める", "Gồm"),
            ),
          ),
        ),
      ),
    ),
  );
  button.setAttribute("aria-expanded", "true");
  details.addEventListener("toggle", () => {
    button.setAttribute("aria-expanded", String(details.open));
    if (details.open) openSnapshots.set(id, snapshot);
    else openSnapshots.delete(id);
  });
  return details;
}

function reviewCard(r) {
  const [chipClass, chipText] = REVIEW_STATES[r.state] ?? ["", r.state];
  const actions = h("div", { class: "item-actions" });
  const card = h(
    "li",
    { class: "item", dataset: { reviewState: r.state, reviewId: r.id } },
    h(
      "div",
      { class: "item-head" },
      h("span", { class: "chip " + chipClass }, chipText),
      h("span", { class: "mono small", translate: "no" }, `${r.id} · ${r.state} · ${r.author}`),
    ),
    r.state === "STALE"
      ? h(
          "p",
          { class: "small" },
          "要再確認: ",
          STALE_REASONS[r.staleReason] ?? h("span", { translate: "no" }, r.staleReason),
        )
      : null,
    actions,
  );
  const contents = btn(
    "内容を確認",
    async () => {
      const existing = card.querySelector("details");
      if (existing) return (existing.open = !existing.open);
      openSnapshots.set(r.id, await api("review.get", { id: r.id }));
      // A history refresh may have replaced this card while the snapshot was loading.
      if (card.isConnected) add(card, snapshotDetails(r.id, contents));
      else if (S.mode === "publish") renderPublish();
    },
    { size: "sm", iconName: "file" },
  );
  if (openSnapshots.has(r.id)) add(card, snapshotDetails(r.id, contents));
  add(
    actions,
    contents,
    ["OPEN", "APPROVED"].includes(r.state)
      ? btn("承認対象をプレビュー", () => openPreview(r.id), { size: "sm", iconName: "eye" })
      : null,
  );
  if (r.state === "OPEN" && can("reviewer"))
    add(
      actions,
      btn(
        "承認 (Data Contract 確認)",
        async () => {
          const ok = await confirmDialog({
            title: "このレビューを承認しますか？",
            body: "承認すると公開担当者が公開できるようになります。送信データの構造（Data Contract）を確認済みとして記録します。",
            confirm: "承認する",
            iconName: "check",
          });
          if (ok)
            await act(() => api("approve", { id: r.id, dataContractAck: true }), "承認しました");
        },
        { size: "sm", variant: "primary", iconName: "check" },
      ),
      btn(
        "差し戻し",
        async () => {
          const ok = await confirmDialog({
            title: "このレビューを差し戻しますか？",
            body: "編集者が修正して再度レビュー依頼できます。",
            confirm: "差し戻す",
            tone: "danger",
          });
          if (ok) await act(() => api("reject", { id: r.id }), "差し戻しました");
        },
        { size: "sm", iconName: "rollback" },
      ),
    );
  // Without the reviewer role the action stays visible but locked; the server still decides (RBAC).
  else if (r.state === "OPEN")
    add(
      actions,
      btn(
        "承認 (Data Contract 確認)",
        () => act(() => api("approve", { id: r.id, dataContractAck: true })),
        {
          size: "sm",
          iconName: "lock",
          title: "承認にはレビュー担当の権限が必要です",
        },
      ),
    );
  if (r.state === "STALE" && r.staleReason !== "pointer")
    add(
      actions,
      btn("再チェック", () => act(() => api("recheck", { id: r.id }), "再チェックしました"), {
        size: "sm",
        iconName: "refresh",
      }),
    );
  if (r.state === "APPROVED" && can("publisher"))
    add(
      actions,
      btn(
        "ローカル公開",
        async () => {
          const ok = await confirmDialog({
            title: "このスナップショットを公開しますか？",
            body: "承認済みの内容をローカル環境に公開します。お客様用 URL にすぐ反映され、あとから以前の版に戻せます。",
            confirm: "公開する",
            iconName: "rocket",
          });
          if (!ok) return;
          notice("公開処理中…", { quiet: true });
          const result = await api("publish", { id: r.id });
          notice("公開: " + result.candidateId);
          await loadHistory();
        },
        { size: "sm", variant: "primary", iconName: "rocket" },
      ),
    );
  return card;
}

function releaseRow(r, data) {
  const isActive = data.active?.candidateId === r.id;
  const actions = h("div", { class: "item-actions" });
  if (canEdit())
    add(
      actions,
      btn(
        "この版から複製",
        async () => {
          if (isDirty()) await save();
          const form = newId("frm_");
          const result = await api("clone", {
            site: scope().site,
            form,
            release: r.id,
            title: $("form-title").value + " (コピー)",
          });
          await hooks.adopt(result);
          notice("公開スナップショットから複製しました");
        },
        { size: "sm", iconName: "copy" },
      ),
    );
  if (!isActive && can("publisher"))
    add(
      actions,
      btn(
        "この版へロールバック",
        async () => {
          const ok = await confirmDialog({
            title: "この版へロールバックしますか？",
            body: L(
              `公開中のフォームを ${r.id} に戻します。お客様にはすぐに反映されます。`,
              `Biểu mẫu đang phát hành sẽ quay về ${r.id}. Khách hàng sẽ thấy ngay.`,
            ),
            confirm: "ロールバックする",
            tone: "danger",
            iconName: "rollback",
          });
          if (ok)
            await act(
              () => api("rollback", { ...scope(), release: r.id, expected: data.active.version }),
              "ロールバック完了",
            );
        },
        { size: "sm", iconName: "rollback" },
      ),
    );
  return h(
    "li",
    { class: "item", dataset: { active: String(isActive) } },
    h(
      "div",
      { class: "item-head" },
      h(
        "a",
        {
          href: releaseUrl(r.id),
          target: "_blank",
          rel: "noopener",
          class: "mono small",
          translate: "no",
        },
        r.id,
      ),
      isActive ? h("span", { class: "chip chip-success" }, "現在公開中") : null,
      h("span", { class: "spacer" }),
      h("span", { class: "small muted", translate: "no" }, when(r.at)),
    ),
    actions.children.length ? actions : null,
  );
}

export function renderPublish() {
  const summary = $("publish-summary");
  const box = $("history");
  const data = S.history;
  if (!S.draft || !data) {
    fill(summary);
    fill(box, h("div", { class: "skeleton", "aria-busy": "true" }));
    return;
  }
  fill(summary, lifecycle(data), liveCard(data));
  const reviews = h(
    "section",
    { class: "card pub-card", "aria-labelledby": "pub-reviews" },
    h("h3", { id: "pub-reviews" }, icon("review"), "レビュー"),
    data.reviews.length
      ? h("ul", { class: "item-list" }, data.reviews.map(reviewCard))
      : emptyState(
          "send",
          "まだレビュー依頼はありません",
          canEdit()
            ? "フォームが完成したら「レビュー依頼」で承認を依頼します。"
            : "編集者がレビューを依頼すると、ここに表示されます。",
          ...(canEdit()
            ? [btn("レビューを依頼", openReviewDialog, { variant: "primary", iconName: "send" })]
            : []),
        ),
  );
  const busy = (data.operations ?? []).filter((op) => BUSY.includes(op.state) || op.error);
  const operations = busy.length
    ? h(
        "section",
        { class: "card pub-card", "aria-labelledby": "pub-ops" },
        h("h3", { id: "pub-ops" }, icon("loader"), "公開処理"),
        h(
          "ul",
          { class: "item-list" },
          busy
            .slice(0, 5)
            .map((op) =>
              h(
                "li",
                { class: "item" },
                h(
                  "div",
                  { class: "item-head" },
                  h(
                    "span",
                    { class: "mono small", translate: "no" },
                    `${op.id} · ${op.state}${op.error ? " · " + op.error : ""}`,
                  ),
                  h("span", { class: "spacer" }),
                  BUSY.includes(op.state)
                    ? btn(
                        "公開をキャンセル",
                        () => act(() => api("publication.cancel", { operation: op.id })),
                        { size: "sm", iconName: "x" },
                      )
                    : null,
                ),
              ),
            ),
        ),
      )
    : null;
  const releases = h(
    "section",
    { class: "card pub-card", "aria-labelledby": "pub-releases" },
    h("h3", { id: "pub-releases" }, icon("history"), "公開履歴"),
    data.releases.length
      ? h(
          "ul",
          { class: "item-list" },
          data.releases.map((r) => releaseRow(r, data)),
        )
      : h("p", { class: "small muted" }, "公開履歴はまだありません。"),
  );
  const audit = h(
    "details",
    { class: "card card-pad" },
    h("summary", {}, "監査ログ"),
    h(
      "div",
      { class: "audit" },
      h(
        "table",
        { class: "data-table" },
        h(
          "thead",
          {},
          h("tr", {}, h("th", {}, "実行者"), h("th", {}, "操作"), h("th", {}, "対象")),
        ),
        h(
          "tbody",
          { translate: "no" },
          data.audit.map((x) =>
            h(
              "tr",
              {},
              h("td", {}, x.actor),
              h("td", { class: "mono" }, x.action),
              h("td", { class: "mono" }, x.target),
            ),
          ),
        ),
      ),
    ),
  );
  fill(
    box,
    h(
      "div",
      { class: "pub-grid" },
      h("div", { class: "stack" }, reviews, operations),
      h("div", { class: "stack" }, releases),
    ),
    audit,
  );
}
on("history", () => {
  if (S.mode === "publish") renderPublish();
  emit("header");
});
