const $ = (id) => document.getElementById(id);
const node = (tag, text) => {
  const e = document.createElement(tag);
  if (text !== undefined) e.textContent = text;
  return e;
};
let sessionExpired = false;
let catalog = { blocks: [] };
let session,
  schema,
  draft,
  version = 0,
  currentStep,
  selected,
  pendingPreview;
function previewFrame() {
  let frame = $("preview-frame");
  if (!frame) {
    frame = node("iframe");
    frame.id = "preview-frame";
    frame.title = "Interactive isolated preview";
    frame.setAttribute("sandbox", "allow-scripts allow-same-origin");
    frame.src = "about:blank";
    $("preview-container").append(frame);
  }
  return frame;
}
let previewPolling = false;
window.setInterval(async () => {
  if (!pendingPreview || previewPolling || !session) return;
  const current = pendingPreview.previewSessionId;
  previewPolling = true;
  try {
    const response = await fetch("/api/preview.status", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": session.csrf },
      body: JSON.stringify({ previewSessionId: current }),
    });
    const status = await response.json();
    if (pendingPreview?.previewSessionId === current && (!response.ok || !status.active)) {
      pendingPreview = null;
      $("preview-container").replaceChildren();
      notice(
        "プレビューを停止しました：この版は利用できません。更新を確認してからプレビューを開き直してください。",
      );
    }
  } catch {
    if (pendingPreview?.previewSessionId === current) {
      pendingPreview = null;
      $("preview-container").replaceChildren();
      notice("プレビューを停止しました：状態を確認できません。");
    }
  } finally {
    previewPolling = false;
  }
}, 10000);
let saveTimer,
  saving,
  editSeq = 0,
  savedSeq = 0,
  epoch = 0,
  blocked = false,
  baseDocument;
function resetPersistence() {
  window.clearTimeout(saveTimer);
  epoch++;
  editSeq = 0;
  savedSeq = 0;
  blocked = false;
  baseDocument = draft ? JSON.parse(JSON.stringify(draft)) : null;
  machineDrafts.clear();
  $("conflict").hidden = true;
}
function dirty() {
  if (!draft) return;
  editSeq++;
  notice("未保存の変更があります");
  window.clearTimeout(saveTimer);
  if ($("autosave").checked && !blocked)
    saveTimer = window.setTimeout(
      () => void save().catch((e) => notice("保存できませんでした: " + e.message)),
      1500,
    );
}
window.addEventListener("beforeunload", (e) => {
  if (editSeq !== savedSeq) {
    e.preventDefault();
    e.returnValue = "";
  }
});
document.addEventListener("change", (e) => {
  if (e.target.closest("#inspector,#canvas,#branches,#named-conditions,#form-title,#translations"))
    dirty();
});
$("autosave").onchange = () => {
  window.clearTimeout(saveTimer);
  if ($("autosave").checked && editSeq !== savedSeq) dirty();
};
function changeSummary(before, after) {
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
async function compareConflict() {
  const current = await api("get", scope());
  $("conflict-details").textContent = JSON.stringify(
    {
      baseVersion: version,
      currentVersion: current.version,
      serverChanges: changeSummary(baseDocument, current.definition),
      localChanges: changeSummary(baseDocument, draft),
      guidance:
        "最新版を読み込んだあと、この一覧を見ながら変更をもう一度行ってください。自動マージは行いません。",
    },
    null,
    2,
  );
  $("conflict").hidden = false;
}
$("compare").onclick = () => void compareConflict().catch((e) => notice(e.message));
const scope = () => ({ site: $("site").value, form: draft?.formId });
const notice = (s) => {
  $("notice").textContent = s;
};
async function api(op, b = {}) {
  const r = await fetch("/api/" + op, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-CSRF-Token": session?.csrf ?? "" },
    body: JSON.stringify(b),
  });
  const value = await r.json();
  if (!r.ok) {
    if (r.status === 401) sessionExpired = true;
    $("diagnostics").textContent =
      value.code + (value.diagnostics ? " · " + value.diagnostics.join(", ") : "");
    throw Error(value.code);
  }
  $("diagnostics").textContent = "";
  return value;
}
function button(text, fn) {
  const b = node("button", text);
  b.type = "button";
  b.addEventListener("click", () => {
    b.disabled = true;
    Promise.resolve()
      .then(fn)
      .catch((e) => {
        $("diagnostics").textContent = e.message;
      })
      .finally(() => {
        b.disabled = false;
      });
  });
  return b;
}
function options(select, values, chosen) {
  select.replaceChildren();
  for (const [value, label] of values) {
    const o = new Option(label, value);
    select.append(o);
  }
  if (chosen !== undefined) select.value = chosen;
}
async function refreshForms(chosen) {
  const data = await api("list", { site: $("site").value });
  options(
    $("forms"),
    data.forms.map((f) => [f.formId, `${f.title ?? f.formId} · v${f.version}`]),
    chosen,
  );
}
async function loadSession() {
  const r = await fetch("/api/session");
  if (!r.ok) {
    $("studio").hidden = true;
    return;
  }
  session = await r.json();
  $("account").value = session.user;
  $("identity").textContent = session.user;
  $("studio").hidden = false;
  options(
    $("site"),
    session.sites.map((s) => [s.id, `${s.id} (${s.roles.join(",")})`]),
  );
  schema = await (await fetch("/api/schema")).json();
  catalog = await (await fetch("/api/catalog")).json();
  options(
    $("block-pin"),
    catalog.blocks.map((b) => [b.pin, b.pin + " · " + b.state]),
  );
  const types = schema.$defs.Field.properties.type.enum;
  options(
    $("palette"),
    types.map((t) => [t, t]),
  );
  await refreshForms();
}
$("login").onclick = async () => {
  if (editSeq !== savedSeq) {
    if (!sessionExpired || $("account").value !== session?.user) {
      notice("アカウント切替の前に保存してください");
      return;
    }
    try {
      window.sessionStorage.setItem(
        "fb.admin.recovery",
        JSON.stringify({
          user: session.user,
          draft,
          version,
          title: $("form-title").value,
          currentStep,
          selected,
          baseDocument,
          editSeq,
          savedSeq,
        }),
      );
    } catch {
      notice("未保存の変更を安全に保持できません。再ログインを停止しました。");
      return;
    }
    savedSeq = editSeq;
  }
  window.clearTimeout(saveTimer);
  notice("ログイン中");
  previewFrame().src = "about:blank";
  pendingPreview = null;
  try {
    const target = draft
      ? "/?site=" + encodeURIComponent(draft.siteId) + "&form=" + encodeURIComponent(draft.formId)
      : "/";
    const response = await api("login", { user: $("account").value, target });
    window.location.assign(response.authorizeUrl);
  } catch (e) {
    notice(e.message);
  }
};
$("logout").onclick = async () => {
  if (editSeq !== savedSeq) {
    notice("ログアウトの前に保存してください");
    return;
  }
  window.clearTimeout(saveTimer);
  await api("logout");
  session = null;
  window.sessionStorage.removeItem("fb.admin.recovery");
  previewFrame().src = "about:blank";
  pendingPreview = null;
  await loadSession();
};
$("site").onchange = () => {
  if (editSeq !== savedSeq) {
    $("site").value = draft.siteId;
    notice("サイト切替の前に保存してください");
    return;
  }
  draft = null;
  resetPersistence();
  $("canvas").replaceChildren();
  void refreshForms().catch((e) => notice(e.message));
};
$("load").onclick = async () => {
  if (editSeq !== savedSeq && !window.confirm("未保存の変更を破棄して最新版を読み込みますか？"))
    return;
  notice("読み込み中");
  try {
    const data = await api("get", { site: $("site").value, form: $("forms").value });
    draft = data.definition;
    version = data.version;
    $("form-title").value = data.title ?? draft.formId;
    resetPersistence();
    currentStep = draft.steps[0].id;
    selected = null;
    render();
    await history();
    notice("保存済みドラフトを読み込みました");
  } catch (e) {
    notice(e.message);
  }
};
$("create").onclick = async () => {
  if (editSeq !== savedSeq) {
    notice("新規作成の前に保存してください");
    return;
  }
  try {
    const id = "frm_" + crypto.randomUUID().replaceAll("-", "");
    draft = {
      schemaVersion: "1.0.0",
      kind: "form",
      formId: id,
      siteId: $("site").value,
      locale: { default: "ja", supported: ["ja"] },
      fields: [],
      conditions: {},
      steps: [
        { id: "stp_details", kind: "form", content: [], transitions: [{ default: "stp_review" }] },
        { id: "stp_review", kind: "review", transitions: [{ default: "stp_complete" }] },
        { id: "stp_complete", kind: "complete" },
      ],
    };
    version = 0;
    $("form-title").value = $("new-name").value.trim() || id;
    resetPersistence();
    currentStep = "stp_details";
    selected = null;
    await save();
    render();
    notice(`フォーム作成: ${$("new-name").value || id} · ${id}`);
  } catch (e) {
    notice(e.message);
  }
};
async function save() {
  window.clearTimeout(saveTimer);
  if (saving) {
    while (saving) await saving;
    if (editSeq === savedSeq) return;
  }
  if (!draft) throw Error("フォームを開いてください");
  if (blocked) throw Error("VERSION_CONFLICT: 最新版と比較してください");
  const seq = editSeq,
    generation = epoch,
    definition = JSON.parse(JSON.stringify(draft)),
    target = { ...scope() },
    title = $("form-title").value,
    expected = version;
  notice("保存中…");
  const task = (async () => {
    try {
      const result = await api("save", { ...target, expected, definition, title });
      if (generation !== epoch) return;
      version = result.version;
      savedSeq = seq;
      baseDocument = definition;
      pendingPreview = null;
      previewFrame().src = "about:blank";
      await refreshForms(draft.formId);
      $("version").textContent = `保存版 v${version}`;
      notice(editSeq === savedSeq ? "保存しました" : "未保存の変更があります");
    } catch (e) {
      if (generation === epoch && e.message === "VERSION_CONFLICT") {
        blocked = true;
        await compareConflict();
        notice("競合: 未保存の変更はこの画面に残っています");
      }
      throw e;
    }
  })();
  saving = task;
  try {
    await task;
  } finally {
    if (saving === task) saving = undefined;
  }
  if (generation === epoch && editSeq !== savedSeq && $("autosave").checked && !blocked)
    saveTimer = window.setTimeout(
      () => void save().catch((e) => notice("保存できませんでした: " + e.message)),
      1500,
    );
}
$("save").onclick = () => save().catch((e) => notice(e.message));
$("delete").onclick = async () => {
  try {
    await api("delete", { ...scope(), expected: version });
    draft = null;
    $("canvas").replaceChildren();
    await refreshForms();
    notice("ドラフト削除");
  } catch (e) {
    notice(e.message);
  }
};
$("validate").onclick = async () => {
  try {
    await save();
    await api("validate", scope());
    $("diagnostics").textContent = "診断: 問題なし";
  } catch (e) {
    notice(e.message);
  }
};
$("preview").onclick = async () => {
  try {
    await save();
    pendingPreview = await api("preview", scope());
    $("diagnostics").textContent = (pendingPreview.diagnostics ?? [])
      .map((d) => d.code + " · " + (d.step ?? ""))
      .join("\n");
    previewFrame().src = "http://127.0.0.1:4175/";
    notice("隔離プレビューを準備中");
  } catch (e) {
    notice(e.message);
  }
};
window.addEventListener("message", (e) => {
  if (e.origin !== "http://127.0.0.1:4175" || e.source !== $("preview-frame")?.contentWindow)
    return;
  if (e.data?.type === "preview.hello" && pendingPreview)
    e.source.postMessage(
      {
        type: "session.start",
        previewSessionId: pendingPreview.previewSessionId,
        locale: document.documentElement.lang.startsWith("vi") ? "vi" : "ja",
      },
      e.origin,
    );
  if (e.data?.type === "preview.ready") notice("プレビュー準備完了");
});
$("review").onclick = async () => {
  try {
    await save();
    const contract = await api("contract", scope());
    $("contract-diff").textContent = JSON.stringify(contract, null, 2);
    if (contract.ackRequired && !$("contract-ack").checked) {
      $("contract").open = true;
      return notice("Data Contract の変更を確認してからレビュー依頼してください");
    }
    const r = await api("review", {
      ...scope(),
      version,
      dataContractAck: $("contract-ack").checked,
    });
    notice(`レビュー依頼: ${r.id}`);
    await history();
  } catch (e) {
    notice(e.message);
  }
};
function scalarControl(parent, label, type, value, onchange) {
  const l = node("label", label),
    input = node(type === "textarea" ? "textarea" : "input");
  if (type !== "textarea") input.type = type;
  if (type === "checkbox") input.checked = !!value;
  else input.value = value ?? "";
  input.addEventListener("change", () =>
    onchange(type === "checkbox" ? input.checked : input.value),
  );
  l.append(input);
  parent.append(l);
  return input;
}
function selectControl(parent, label, values, value, onchange) {
  const l = node("label", label),
    s = node("select");
  options(s, values, value);
  s.onchange = () => onchange(s.value);
  l.append(s);
  parent.append(l);
  return s;
}
function update() {
  render();
  dirty();
}
$("add-field").onclick = () => {
  if (!draft) return;
  const step = draft.steps.find((s) => s.id === currentStep);
  if (step?.kind !== "form") return notice("入力ステップを選択してください");
  const suffix = crypto.randomUUID().replaceAll("-", "").slice(0, 12),
    type = $("palette").value;
  const f = {
    id: "fld_" + suffix,
    key: "field_" + suffix,
    type,
    label: { ja: "新しいフィールド" },
    classification: ["text", "textarea", "email", "tel", "postal", "katakana"].includes(type)
      ? "personal"
      : "public",
    persist: "allowed",
    required: false,
  };
  if (type.startsWith("choice."))
    f.options = [
      { value: "yes", label: { ja: "はい" } },
      { value: "no", label: { ja: "いいえ" } },
    ];
  if (type === "calculated") {
    f.formula = { const: 0 };
    f.submit = "displayOnly";
  }
  if (type === "plugin:storeSel") {
    draft.dependencies = {
      ...draft.dependencies,
      capabilities: {
        ...draft.dependencies?.capabilities,
        storeSel: {
          plugin: "@platform/store-selector",
          version: "1.0.0",
          capability: "storeSelector",
          kind: "fieldType",
        },
      },
    };
  }
  draft.fields.push(f);
  step.content.push({ field: "$local:" + f.id });
  selected = f.id;
  update();
};
$("add-step").onclick = () => {
  if (!draft) return;
  const inputSteps = draft.steps.filter((s) => s.kind === "form"),
    prior = inputSteps.at(-1),
    id = "stp_" + crypto.randomUUID().replaceAll("-", "").slice(0, 10);
  const reviewId = draft.steps.find((s) => s.kind === "review").id;
  const next = prior.transitions.find((t) => t.default)?.default ?? reviewId;
  prior.transitions = prior.transitions.map((t) => (t.default ? { default: id } : t));
  draft.steps.splice(
    draft.steps.findIndex((s) => s.kind === "review"),
    0,
    { id, kind: "form", content: [], transitions: [{ default: next }] },
  );
  currentStep = id;
  selected = null;
  update();
};
$("insert-block").onclick = () => {
  if (!draft) return;
  const step = draft.steps.find((s) => s.id === currentStep);
  if (step?.kind !== "form") return notice("入力ステップを選択してください");
  const entry = catalog.blocks.find((b) => b.pin === $("block-pin").value);
  if (!entry || ["vulnerable", "unknown"].includes(entry.state))
    return notice("ブロックが利用できません");
  const suffix = crypto.randomUUID().replaceAll("-", ""),
    id = "inst_" + suffix,
    dep = "block_" + suffix;
  const used = new Set((draft.blockInstances ?? []).map((i) => i.alias));
  let alias = "customer";
  for (let n = 2; used.has(alias); n++) alias = "customer" + n;
  draft.dependencies = {
    ...draft.dependencies,
    blocks: { ...draft.dependencies?.blocks, [dep]: entry.pin },
  };
  draft.blockInstances = [...(draft.blockInstances ?? []), { id, alias, block: dep, inputs: {} }];
  step.content.push({ block: id });
  selected = "block:" + id;
  update();
};
function blockInspector(box, instance) {
  const pin = draft.dependencies?.blocks?.[instance.block],
    entry = catalog.blocks.find((b) => b.pin === pin);
  box.append(node("p", "共通ブロック: " + pin));
  scalarControl(box, "ブロック別名", "text", instance.alias, (v) => {
    instance.alias = v;
    update();
  });
  selectControl(
    box,
    "固定リビジョン",
    catalog.blocks.map((b) => [b.pin, b.pin + " · " + b.state]),
    pin,
    (v) => {
      const next = catalog.blocks.find((b) => b.pin === v);
      if (!next || ["vulnerable", "unknown"].includes(next.state)) return update();
      if (
        !window.confirm(
          "固定リビジョンを " +
            pin +
            " → " +
            v +
            " に変更します。Data Contract と参照への影響を確認してください。他のフォームは変更されません。",
        )
      )
        return update();
      draft.dependencies.blocks[instance.block] = v;
      update();
    },
  );
  for (const [k, spec] of Object.entries(entry?.block.inputs ?? {}))
    scalarControl(
      box,
      k,
      spec.type === "boolean" ? "checkbox" : "text",
      instance.inputs?.[k] ?? spec.default,
      (v) => {
        instance.inputs = { ...instance.inputs, [k]: v };
      },
    );
  for (const f of entry?.block.fields ?? [])
    box.append(node("p", `${f.label?.ja ?? f.key} · ${f.type} · ${f.required ? "必須" : "任意"}`));
  box.append(
    button("ブロックを削除", () => {
      const refs = JSON.stringify(draft).split(instance.id + ":@").length - 1;
      if (refs && !window.confirm(`参照 ${refs} 件が残ります。削除後は診断で修正が必要です。`))
        return;
      draft.blockInstances = draft.blockInstances.filter((i) => i.id !== instance.id);
      for (const s of draft.steps)
        if (s.content) s.content = s.content.filter((c) => c.block !== instance.id);
      draft.dependencies.blocks = Object.fromEntries(
        Object.entries(draft.dependencies.blocks).filter(([k]) => k !== instance.block),
      );
      selected = null;
      update();
    }),
  );
}
function render(keepTranslations = false) {
  if (!draft) return;
  $("version").textContent = `保存版 v${version}`;
  $("steps").replaceChildren();
  for (const s of draft.steps)
    $("steps").append(
      button(`${s.kind} · ${s.id}`, () => {
        currentStep = s.id;
        selected = null;
        render();
      }),
    );
  $("canvas").replaceChildren();
  const step = draft.steps.find((s) => s.id === currentStep);
  const heading = node("h3", step.title?.ja ?? step.id);
  heading.translate = false;
  $("canvas").append(heading);
  scalarControl($("canvas"), "ステップ名", "text", step.title?.ja ?? step.id, (v) => {
    step.title = { ...step.title, ja: v };
  });
  for (const c of step.content ?? []) {
    if (c.block) {
      const instance = draft.blockInstances?.find((i) => i.id === c.block);
      if (instance)
        $("canvas").append(
          button(
            "共通ブロック · " + instance.alias + " · " + draft.dependencies.blocks[instance.block],
            () => {
              selected = "block:" + instance.id;
              render();
            },
          ),
        );
      continue;
    }
    if (!c.field) continue;
    const f = draft.fields.find((f) => "$local:" + f.id === c.field);
    const b = button(`${f.label?.ja ?? f.key}${f.required ? " *" : ""} · ${f.type}`, () => {
      selected = f.id;
      render();
    });
    b.setAttribute("aria-pressed", String(selected === f.id));
    $("canvas").append(b);
  }
  inspector();
  branches();
  namedConditions();
  settings();
  flowOverview();
  if (!keepTranslations) translations();
}
function inspector() {
  const box = $("inspector");
  box.replaceChildren();
  box.onsubmit = (e) => e.preventDefault();
  if (selected?.startsWith("block:")) {
    const instance = draft.blockInstances?.find((i) => i.id === selected.slice(6));
    if (instance) blockInspector(box, instance);
    return;
  }
  const f = draft.fields.find((f) => f.id === selected);
  if (!f) {
    box.append(node("p", "Canvas でフィールドを選択"));
    return;
  }
  const props = schema.$defs.Field.properties;
  for (const k of ["required", "clearOnDeactivate"])
    if (props[k])
      scalarControl(box, k, "checkbox", f[k], (v) => {
        f[k] = v;
        update();
      });
  scalarControl(box, "表示名", "text", f.label?.ja, (v) => {
    f.label = { ...f.label, ja: v };
    update();
  });
  scalarControl(box, "データキー", "text", f.key, (v) => {
    f.key = v;
    update();
  });
  selectControl(
    box,
    "ステップ",
    draft.steps.filter((s) => s.kind === "form").map((s) => [s.id, s.id]),
    currentStep,
    (v) => {
      for (const s of draft.steps)
        if (s.content) s.content = s.content.filter((c) => c.field !== "$local:" + f.id);
      draft.steps.find((s) => s.id === v).content.push({ field: "$local:" + f.id });
      currentStep = v;
      update();
    },
  );
  selectControl(
    box,
    "データ分類",
    props.classification.enum
      .filter(
        (v) =>
          props.classification.enum.indexOf(v) >=
          props.classification.enum.indexOf(f.classification),
      )
      .map((v) => [v, v]),
    f.classification,
    (v) => {
      f.classification = v;
      update();
    },
  );
  for (const use of ["minLength", "maxLength", "min", "max", "minItems", "maxItems"]) {
    const old = f.validators?.find((v) => v.use === use);
    scalarControl(box, use, "number", old?.params?.value ?? "", (v) => {
      f.validators = (f.validators ?? []).filter((x) => x.use !== use);
      if (v !== "") f.validators.push({ use, params: { value: Number(v) } });
    });
  }
  if (f.type === "plugin:storeSel") {
    for (const [key, spec] of Object.entries(props.config.properties))
      scalarControl(
        box,
        key,
        spec.type === "boolean" ? "checkbox" : "text",
        f.config?.[key],
        (v) => {
          f.config = { ...f.config, [key]: v };
        },
      );
  }
  if (f.options)
    scalarControl(
      box,
      "選択肢 (値|表示名、1行1件)",
      "textarea",
      f.options.map((o) => o.value + "|" + (o.label?.ja ?? o.value)).join("\n"),
      (v) => {
        const prior = new Map(f.options.map((o) => [o.value, o.label]));
        f.options = v
          .split("\n")
          .filter(Boolean)
          .map((row) => {
            const [value, label] = row.split("|");
            return { value, label: { ...prior.get(value), ja: label || value } };
          });
        update();
      },
    );
  const other = draft.fields.filter((x) => x.id !== f.id && x.type !== "group");
  ruleEditor(
    box,
    "表示",
    f.visibleWhen,
    (value) => {
      if (value) f.visibleWhen = value;
      else delete f.visibleWhen;
      update();
    },
    ruleFields(currentStep, f.id),
  );
  ruleEditor(
    box,
    "必須",
    f.requiredWhen,
    (value) => {
      if (value) f.requiredWhen = value;
      else delete f.requiredWhen;
      update();
    },
    ruleFields(currentStep, f.id),
  );
  if (f.type === "calculated") {
    selectControl(
      box,
      "計算演算子",
      ["add", "subtract", "multiply", "concat"].map((x) => [x, x]),
      f.formula?.op ?? "add",
      (v) => {
        f.formula = { op: v, args: [{ const: 0 }, { const: 0 }] };
        update();
      },
    );
    for (let i = 0; i < 2; i++)
      selectControl(
        box,
        "依存フィールド " + (i + 1),
        [
          ["", "定数 0"],
          ...other
            .filter((x) => x.type === "number" || f.formula?.op === "concat")
            .map((x) => [x.id, x.key]),
        ],
        f.formula?.args?.[i]?.ref?.replace("$local:", "") ?? "",
        (v) => {
          f.formula.args[i] = v ? { ref: "$local:" + v } : { const: 0 };
          update();
        },
      );
  }
  box.append(
    button("フィールド削除", () => {
      draft.fields = draft.fields.filter((x) => x.id !== f.id);
      for (const s of draft.steps)
        if (s.content) s.content = s.content.filter((c) => c.field !== "$local:" + f.id);
      if (
        !draft.fields.some((x) => x.type === "plugin:storeSel") &&
        draft.dependencies?.capabilities
      )
        delete draft.dependencies.capabilities.storeSel;
      selected = null;
      update();
    }),
  );
}
function settings() {
  const box = $("settings");
  box.replaceChildren();
  const approved = (catalog.themes ?? []).filter((t) => t.site === draft.siteId);
  selectControl(
    box,
    "テーマ",
    approved.map((t) => [t.id, t.label]),
    draft.themeRef ?? approved[0]?.id,
    (pin) => {
      draft.themeRef = pin;
      update();
    },
  );
  const theme = approved.find((t) => t.id === (draft.themeRef ?? approved[0]?.id));
  if (theme)
    for (const [key, value] of Object.entries({
      accent: theme.accent,
      background: theme.background,
      foreground: theme.foreground,
    }))
      $("canvas").style.setProperty("--form-" + key, value);
  const preset = draft.motion?.preset.id ?? "none";
  selectControl(
    box,
    "モーション",
    [
      ["none", "なし"],
      ["subtle", "控えめ"],
      ["guided", "ガイド付き"],
    ],
    preset,
    (id) => {
      if (id === "none") delete draft.motion;
      else draft.motion = { preset: { id, package: "@platform/motion-presets", version: "1.0.0" } };
      update();
    },
  );
  if (preset !== "none") {
    selectControl(
      box,
      "速さ",
      [
        ["slow", "ゆっくり"],
        ["standard", "標準"],
        ["fast", "速い"],
      ],
      draft.motion.speed ?? "standard",
      (value) => {
        draft.motion.speed = value;
        update();
      },
    );
    for (const [key, label] of Object.entries({
      stepTransition: "ステップ切替",
      conditionalReveal: "条件表示",
      validationFeedback: "検証フィードバック",
      submitFeedback: "送信フィードバック",
    }))
      scalarControl(box, label, "checkbox", draft.motion.categories?.[key] !== "off", (value) => {
        draft.motion.categories = { ...draft.motion.categories, [key]: value ? "on" : "off" };
        update();
      });
  }
  box.append(
    node(
      "p",
      "モーションの On/Off はプリセットで切替し、隔離プレビューで確認できます。OS の動きを減らす設定を尊重します。",
    ),
  );
  box.append(node("p", "送信後の処理: 合成 mock log のみ（ローカル、実システム連携なし）"));
}
const machineDrafts = new Set();
let onlyMissing = false;
const textLabels = {
  formTitle: "フォームタイトル",
  formDescription: "フォーム説明",
  next: "ボタン: 次へ",
  back: "ボタン: 戻る",
  submit: "ボタン: 送信",
  selectPrompt: "選択プロンプト",
  reviewTitle: "確認画面タイトル",
  payloadTitle: "送信プレビュー見出し",
  errorSummary: "エラー概要",
  completeTitle: "完了タイトル",
  completeBody: "完了メッセージ",
  syntheticNotice: "合成データ表示",
  invalidNumber: "メッセージ: 数値",
  required: "メッセージ: 必須",
  mustBeTrue: "メッセージ: 同意",
  minLength: "メッセージ: 最小文字数",
  maxLength: "メッセージ: 最大文字数",
  min: "メッセージ: 最小値",
  max: "メッセージ: 最大値",
  minItems: "メッセージ: 最小選択数",
  maxItems: "メッセージ: 最大選択数",
  exclusiveOption: "メッセージ: 排他選択肢",
};
const textLike = ["text", "textarea", "number", "email", "tel", "postal", "katakana"];
// One row per customer-facing text. `need`: "ja" = Japanese always required, "any" = Japanese
// required once either language is set, "" = optional override (empty falls back to Japanese or
// the built-in message). IDs, keys and option values are never edited here.
function localizedRow(id, kind, context, read, write, need, defaults) {
  return {
    id,
    kind,
    context,
    defaults,
    get: (l) => read()?.[l] ?? "",
    set(l, value) {
      const next = Object.fromEntries(
        Object.entries({ ...read(), [l]: value }).filter(([, text]) => text),
      );
      if ((need === "ja" || (need === "any" && next.vi)) && !next.ja) return false;
      write(Object.keys(next).length ? next : undefined);
      return true;
    },
  };
}
function translationRows() {
  const text = (key) =>
    localizedRow(
      "text:" + key,
      textLabels[key],
      "",
      () => draft.texts?.[key],
      (value) => {
        const texts = Object.fromEntries(
          Object.entries({ ...draft.texts, [key]: value }).filter(([, entry]) => entry),
        );
        if (Object.keys(texts).length) draft.texts = texts;
        else delete draft.texts;
      },
      "",
      catalog.texts?.[key],
    );
  const rows = [text("formTitle"), text("formDescription")];
  for (const s of draft.steps.filter((s) => s.kind === "form"))
    rows.push(
      localizedRow(
        "step:" + s.id,
        "ステップ名",
        s.id,
        () => s.title,
        (value) => {
          if (value) s.title = value;
          else delete s.title;
        },
        "any",
      ),
    );
  for (const f of draft.fields) {
    if (f.type === "group") continue;
    rows.push(
      localizedRow(
        `field:${f.id}:label`,
        "表示名",
        f.key,
        () => f.label,
        (value) => (f.label = value),
        "ja",
      ),
    );
    if (textLike.includes(f.type))
      rows.push(
        localizedRow(
          `field:${f.id}:placeholder`,
          "プレースホルダー",
          f.key,
          () => f.placeholder,
          (value) => {
            if (value) f.placeholder = value;
            else delete f.placeholder;
          },
          "",
        ),
      );
    if (f.type !== "plugin:storeSel")
      rows.push(
        localizedRow(
          `field:${f.id}:help`,
          "ヘルプ",
          f.key,
          () => f.help,
          (value) => {
            if (value) f.help = value;
            else delete f.help;
          },
          "",
        ),
      );
    for (const o of f.options ?? [])
      rows.push(
        localizedRow(
          `option:${f.id}:${o.value}`,
          "選択肢",
          `${f.key} = ${o.value}`,
          () => o.label,
          (value) => (o.label = value),
          "ja",
        ),
      );
  }
  for (const key of Object.keys(textLabels).slice(2)) rows.push(text(key));
  return rows;
}
function translationState(row) {
  const ja = row.get("ja"),
    vi = row.get("vi");
  if (machineDrafts.has(row.id + ":ja") || machineDrafts.has(row.id + ":vi"))
    return ["machine", "自動翻訳（要確認）"];
  if (vi) return ["done", "翻訳済み"];
  if (row.defaults?.vi && !ja) return ["default", "既定の文言"];
  if (!ja) return ["empty", "未設定"];
  return ["missing", "未翻訳（日本語で表示）"];
}
function translationCount(rows) {
  const states = rows.map((r) => translationState(r)[0]).filter((s) => s !== "empty");
  const counted = states.filter((s) => s !== "default");
  return `翻訳済み ${counted.filter((s) => s !== "missing").length} / ${counted.length}`;
}
async function autoTranslate(source, target) {
  const pending = translationRows().filter((r) => r.get(source) && !r.get(target));
  if (!pending.length) return notice("翻訳対象の空欄がありません");
  let result;
  try {
    result = await api("translate", {
      source,
      target,
      texts: pending.map((r) => ({ id: r.id, text: r.get(source) })),
    });
  } catch (e) {
    return notice(
      e.message === "TRANSLATION_PROVIDER_UNAVAILABLE"
        ? "自動翻訳は利用できません：承認済みの翻訳プロバイダーが設定されていません。手動で入力してください。"
        : e.message,
    );
  }
  // Drafts land only in cells that are still empty, so text typed meanwhile is never overwritten.
  const rows = new Map(translationRows().map((r) => [r.id, r]));
  let added = 0;
  for (const item of result.drafts ?? []) {
    const row = rows.get(item.id);
    if (!row || row.get(target) || typeof item.text !== "string" || !item.text.trim()) continue;
    if (row.set(target, item.text)) {
      machineDrafts.add(item.id + ":" + target);
      added++;
    }
  }
  if (added) update();
  notice(`自動翻訳の下書き ${added} 件を追加しました（要確認）`);
}
function translations() {
  const box = $("translations");
  box.replaceChildren();
  const enabled = draft.locale?.supported?.includes("vi") ?? false;
  scalarControl(box, "ベトナム語 (vi-VN) を有効化", "checkbox", enabled, (on) => {
    draft.locale = { default: "ja", supported: on ? ["ja", "vi"] : ["ja"] };
  });
  if (!enabled)
    box.append(node("p", "ベトナム語が無効のため、公開フォームには日本語のみ含まれます。"));
  box.append(
    node(
      "p",
      "ID・データキー・選択肢の値・ルールは言語に依存しません。空欄は日本語（または既定の文言）で表示されます。",
    ),
  );
  const rows = translationRows(),
    count = node("p", translationCount(rows)),
    filter = button("未翻訳のみ表示", () => {
      onlyMissing = !onlyMissing;
      translations();
      $("translations").querySelector("[aria-pressed]")?.focus();
    });
  filter.setAttribute("aria-pressed", String(onlyMissing));
  count.setAttribute("role", "status");
  box.append(
    count,
    filter,
    button("自動翻訳 ja→vi（下書き）", () => autoTranslate("ja", "vi")),
    button("自動翻訳 vi→ja（下書き）", () => autoTranslate("vi", "ja")),
    node(
      "p",
      "自動翻訳は承認済みの翻訳プロバイダーがある場合のみ動作します。結果は空欄にだけ下書きとして入り、手入力の翻訳は上書きしません。",
    ),
  );
  const table = node("table"),
    head = node("tr");
  for (const [id, label] of [
    ["", "項目"],
    ["tr-head-ja", "日本語"],
    ["tr-head-vi", "Tiếng Việt"],
    ["", "状態"],
  ]) {
    const th = node("th", label);
    if (id) th.id = id;
    head.append(th);
  }
  table.append(head);
  rows.forEach((row, i) => {
    if (onlyMissing && translationState(row)[0] !== "missing") return;
    const tr = node("tr"),
      label = node("td"),
      state = node("td");
    label.id = "tr-row-" + i;
    label.append(node("span", row.kind));
    if (row.context) {
      const context = node("code", " · " + row.context);
      context.translate = false;
      label.append(context);
    }
    const paint = () => {
      const [kind, text] = translationState(row);
      state.dataset.state = kind;
      state.textContent = text;
    };
    tr.append(label);
    for (const l of ["ja", "vi"]) {
      const cell = node("td"),
        input = node("input");
      input.value = row.get(l);
      input.lang = l === "vi" ? "vi-VN" : "ja-JP";
      input.translate = false;
      input.maxLength = 2000;
      input.placeholder = row.defaults?.[l] ?? (l === "vi" ? row.get("ja") : "");
      input.dataset.row = row.id;
      input.dataset.lang = l;
      input.setAttribute("aria-labelledby", `${label.id} tr-head-${l}`);
      input.addEventListener("input", () => {
        const ok = row.set(l, input.value.trim() ? input.value : "");
        input.setCustomValidity(ok ? "" : "日本語が必要です");
        machineDrafts.delete(row.id + ":" + l);
        paint();
        if (!ok) {
          state.dataset.state = "error";
          state.textContent = "日本語が必要です";
        }
        count.textContent = translationCount(rows);
      });
      // Refresh the canvas/inspector without rebuilding this table, so focus stays put.
      input.addEventListener("change", () => render(true));
      cell.append(input);
      tr.append(cell);
    }
    paint();
    tr.append(state);
    table.append(tr);
  });
  box.append(table);
}
function flowOverview() {
  const box = $("flow-overview");
  box.replaceChildren();
  const list = node("ol");
  box.append(list);
  for (const step of draft.steps) {
    const row = node("li", (step.title?.ja ?? step.id) + " · " + step.kind);
    list.append(row);
    for (const [i, t] of (step.transitions ?? []).entries())
      row.append(
        node(
          "p",
          (t.when
            ? "優先 " +
              (i + 1) +
              (t.when.cond
                ? " · " + (draft.conditions?.[t.when.cond]?.label.ja ?? "参照なし")
                : " · 条件あり")
            : "それ以外") +
            " → " +
            (draft.steps.find((s) => s.id === (t.to ?? t.default))?.title?.ja ?? t.to ?? t.default),
        ),
      );
  }
}
function ruleRef(field) {
  return field.ref ?? "$local:" + field.id;
}
function ruleFields(stepId, exclude) {
  const end = stepId ? draft.steps.findIndex((s) => s.id === stepId) : draft.steps.length - 1;
  const content = draft.steps.slice(0, end + 1).flatMap((s) => s.content ?? []);
  const refs = new Set(content.filter((c) => c.field).map((c) => c.field));
  const fields = draft.fields.filter(
    (f) => f.id !== exclude && refs.has("$local:" + f.id) && f.type !== "group",
  );
  for (const c of content.filter((c) => c.block)) {
    const instance = draft.blockInstances?.find((i) => i.id === c.block);
    const entry = catalog.blocks.find(
      (b) => b.pin === draft.dependencies?.blocks?.[instance?.block],
    );
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
function ruleEditor(box, prefix, rule, change, fields, named = true) {
  const group = node("fieldset"),
    heading = node("legend", prefix + "条件");
  group.append(heading);
  box.append(group);
  const atom = () => ({
    op: fields[0].type === "choice.checkboxes" ? "includes" : "eq",
    args: [
      { ref: ruleRef(fields[0]) },
      {
        const:
          fields[0].options?.[0]?.value ??
          (fields[0].type === "number" ? 0 : fields[0].type === "boolean" ? false : ""),
      },
    ],
  });
  const isAtom = (r) =>
    r?.args?.[0]?.ref &&
    [
      "eq",
      "neq",
      "lt",
      "lte",
      "gt",
      "gte",
      "isEmpty",
      "isNotEmpty",
      "includes",
      "includesAny",
      "in",
      "notIn",
    ].includes(r.op);
  const supported =
    !rule ||
    rule.cond ||
    isAtom(rule) ||
    (["and", "or"].includes(rule.op) && rule.args.every(isAtom));
  if (!supported) {
    group.append(node("p", "既存の式は保持されます。この画面では編集できません。"));
    group.append(
      button(prefix + "条件を置換", () => {
        if (fields.length) change(atom());
      }),
    );
    return;
  }
  const modes = [
    ["", "条件なし"],
    ["single", "単一条件"],
    ["and", "すべて満たす"],
    ["or", "いずれかを満たす"],
  ];
  if (named)
    modes.push(
      ...Object.entries(draft.conditions ?? {}).map(([id, c]) => [id, "名前付き: " + c.label.ja]),
    );
  selectControl(
    group,
    prefix + "条件の組み合わせ",
    modes,
    rule?.cond ?? (rule?.op === "and" || rule?.op === "or" ? rule.op : rule ? "single" : ""),
    (mode) => {
      if (!mode) return change(undefined);
      if (mode.startsWith("cnd_")) return change({ cond: mode });
      if (!fields.length) return notice("参照可能なフィールドがありません");
      const prior = isAtom(rule) ? rule : (rule?.args?.find(isAtom) ?? atom());
      change(mode === "single" ? prior : { op: mode, args: [prior] });
    },
  );
  if (!rule || rule.cond) return;
  const compound = ["and", "or"].includes(rule.op),
    atoms = compound ? rule.args : [rule];
  const replace = (i, value) => {
    const next = atoms.map((a) => ({ ...a, args: a.args.map((arg) => ({ ...arg })) }));
    next[i] = value;
    change(compound ? { op: rule.op, args: next } : value);
  };
  atoms.forEach((item, i) => {
    const row = node("div");
    group.append(row);
    const ref = item.args[0].ref,
      field = fields.find((f) => ruleRef(f) === ref);
    selectControl(
      row,
      prefix === "分岐" ? "条件" : prefix + "条件フィールド",
      [
        ...(field ? [] : [[ref, "参照を確認: " + ref]]),
        ...fields.map((f) => [ruleRef(f), f.label?.ja ?? f.key]),
      ],
      ref,
      (value) => {
        const selectedField = fields.find((f) => ruleRef(f) === value);
        replace(i, {
          op: selectedField?.type === "choice.checkboxes" ? "includes" : "eq",
          args: [
            { ref: value },
            {
              const:
                selectedField?.options?.[0]?.value ??
                (selectedField?.type === "number"
                  ? 0
                  : selectedField?.type === "boolean"
                    ? false
                    : ""),
            },
          ],
        });
      },
    );
    const operators =
      field?.type === "choice.checkboxes"
        ? ["includes", "includesAny", "isEmpty", "isNotEmpty"]
        : [
            "eq",
            "neq",
            "isEmpty",
            "isNotEmpty",
            ...(field?.type === "number" ? ["lt", "lte", "gt", "gte"] : []),
            ...(field?.options ? ["in", "notIn"] : []),
          ];
    selectControl(
      row,
      prefix + "演算子",
      operators.map((v) => [v, v]),
      item.op,
      (op) =>
        replace(i, {
          op,
          args: op.startsWith("is")
            ? [{ ref }]
            : [
                { ref },
                {
                  const: ["in", "notIn", "includesAny"].includes(op)
                    ? Array.isArray(item.args[1]?.const)
                      ? item.args[1].const
                      : [item.args[1]?.const ?? field?.options?.[0]?.value ?? ""]
                    : Array.isArray(item.args[1]?.const)
                      ? (item.args[1].const[0] ?? "")
                      : (item.args[1]?.const ?? ""),
                },
              ],
        }),
    );
    if (!item.op.startsWith("is")) {
      const label = prefix === "分岐" ? "等しい値" : prefix + "条件: 等しい値";
      const commit = (value) => replace(i, { op: item.op, args: [{ ref }, { const: value }] });
      if (field?.options && ["in", "notIn", "includesAny"].includes(item.op)) {
        const wrapper = node("label", label),
          input = node("select");
        input.multiple = true;
        options(
          input,
          field.options.map((o) => [o.value, o.label?.ja ?? o.value]),
        );
        for (const option of input.options)
          option.selected = (item.args[1]?.const ?? []).includes(option.value);
        input.onchange = () => commit(Array.from(input.selectedOptions).map((o) => o.value));
        wrapper.append(input);
        row.append(wrapper);
      } else if (field?.options)
        selectControl(
          row,
          label,
          field.options.map((o) => [o.value, o.label?.ja ?? o.value]),
          item.args[1]?.const,
          commit,
        );
      else if (field?.type === "boolean")
        selectControl(
          row,
          label,
          [
            ["false", "false"],
            ["true", "true"],
          ],
          String(item.args[1]?.const ?? false),
          (v) => commit(v === "true"),
        );
      else
        scalarControl(
          row,
          label,
          field?.type === "number" ? "number" : "text",
          item.args[1]?.const,
          (v) => {
            if (field?.type === "number" && !Number.isSafeInteger(Number(v)))
              return notice("整数を入力してください");
            commit(field?.type === "number" ? Number(v) : v);
          },
        );
    }
    if (compound && atoms.length > 1)
      row.append(
        button(prefix + "条件行を削除 " + (i + 1), () =>
          change({ op: rule.op, args: atoms.filter((_, n) => n !== i) }),
        ),
      );
  });
  if (compound)
    group.append(
      button(prefix + "条件を追加", () => {
        if (fields.length) change({ op: rule.op, args: [...atoms, atom()] });
      }),
    );
  group.append(
    node(
      "p",
      "未回答・非表示のときは、この条件は成立しません（次の分岐へ進みます）。経路によって参照が inactive になる場合があります。",
    ),
  );
}
function namedConditions() {
  const box = $("named-conditions");
  box.replaceChildren();
  for (const [id, c] of Object.entries(draft.conditions ?? {})) {
    const group = node("fieldset");
    group.append(node("legend", id));
    box.append(group);
    scalarControl(group, "名前付き条件名", "text", c.label.ja, (value) => {
      c.label.ja = value;
      update();
    });
    const used =
      JSON.stringify({ ...draft, conditions: {} }).split('"cond":"' + id + '"').length - 1;
    group.append(node("p", "使用箇所 " + used + "件"));
    ruleEditor(
      group,
      "名前付き",
      c.when,
      (value) => {
        if (value) c.when = value;
        update();
      },
      ruleFields(),
      false,
    );
    group.append(
      button("名前付き条件を削除", () => {
        if (used && !window.confirm("使用箇所 " + used + "件に参照が残ります。削除しますか？"))
          return;
        draft.conditions = Object.fromEntries(
          Object.entries(draft.conditions).filter(([key]) => key !== id),
        );
        update();
      }),
    );
  }
  box.append(
    button("名前付き条件を追加", () => {
      const fields = ruleFields();
      if (!fields.length) return notice("フィールドを追加してください");
      const id = "cnd_" + crypto.randomUUID().replaceAll("-", "");
      draft.conditions = {
        ...draft.conditions,
        [id]: {
          label: { ja: "新しい条件" },
          when: {
            op: "eq",
            args: [{ ref: ruleRef(fields[0]) }, { const: fields[0].options?.[0]?.value ?? "" }],
          },
        },
      };
      update();
    }),
  );
}
function branches() {
  const box = $("branches");
  box.replaceChildren();
  const s = draft.steps.find((s) => s.id === currentStep);
  if (s.kind !== "form") return;
  const fields = draft.fields.filter((f) => f.options);
  for (let i = 0; i < s.transitions.length; i++) {
    const t = s.transitions[i],
      row = node("div");
    row.className = "row";
    if (t.when) {
      row.append(node("p", "優先順位 " + (i + 1) + " · 上の分岐が優先されます"));
      ruleEditor(
        row,
        "分岐",
        t.when,
        (value) => {
          if (value) t.when = value;
          update();
        },
        ruleFields(currentStep),
      );
    } else row.append(node("span", "それ以外"));
    selectControl(
      row,
      "次のステップ",
      [
        ["", "未設定"],
        ...draft.steps
          .slice(draft.steps.indexOf(s) + 1)
          .filter((x) => x.kind !== "complete")
          .map((x) => [x.id, x.id]),
      ],
      t.to ?? t.default,
      (v) => {
        if (t.when) t.to = v;
        else t.default = v;
      },
    );
    if (t.when)
      row.append(
        button("条件削除", () => {
          s.transitions.splice(i, 1);
          update();
        }),
      );
    box.append(row);
  }
  box.append(
    button("条件分岐を追加", () => {
      if (!fields.length) return notice("選択フィールドを追加してください");
      s.transitions.unshift({
        when: {
          op: "eq",
          args: [{ ref: "$local:" + fields[0].id }, { const: fields[0].options[0].value }],
        },
        to: draft.steps.find((s) => s.kind === "review").id,
      });
      update();
    }),
  );
}
async function history() {
  if (!draft) return;
  const data = await api("history", scope()),
    box = $("history");
  box.replaceChildren();
  for (const r of data.reviews) {
    const row = node("div");
    row.className = "row";
    row.append(node("span", `${r.id} · ${r.state} · ${r.author}`));
    row.append(
      button("スナップショット / Data Contract", async () => {
        const snapshot = await api("review.get", { id: r.id });
        const details = node("details");
        details.open = true;
        details.append(node("summary", snapshot.id + " · v" + snapshot.version));
        for (const f of snapshot.definition.fields)
          details.append(
            node(
              "p",
              `${f.label?.ja ?? f.key} · ${f.key} · ${f.type} · ${f.classification} · ${f.submit ?? "include"}`,
            ),
          );
        row.append(details);
      }),
    );
    row.append(
      button("承認対象をプレビュー", async () => {
        pendingPreview = await api("preview", { ...scope(), id: r.id });
        previewFrame().src = "http://127.0.0.1:4175/";
      }),
    );
    if (r.state === "OPEN")
      row.append(
        button("承認 (Data Contract 確認)", async () => {
          await api("approve", { id: r.id, dataContractAck: true });
          await history();
        }),
      );
    if (r.state === "OPEN")
      row.append(
        button("差し戻し", async () => {
          await api("reject", { id: r.id });
          await history();
        }),
      );
    if (r.state === "STALE") {
      row.append(node("span", "要再確認: " + r.staleReason));
      if (r.staleReason !== "pointer")
        row.append(
          button("再チェック", async () => {
            await api("recheck", { id: r.id });
            await history();
          }),
        );
    }
    if (r.state === "APPROVED")
      row.append(
        button("ローカル公開", async () => {
          const result = await api("publish", { id: r.id });
          notice("公開: " + result.candidateId);
          await history();
        }),
      );
    box.append(row);
  }
  for (const op of data.operations ?? []) {
    const row = node("div");
    row.className = "row";
    row.append(node("span", `${op.id} · ${op.state}${op.error ? " · " + op.error : ""}`));
    if (["BUILDING", "VERIFYING", "ACTIVATING"].includes(op.state))
      row.append(
        button("公開をキャンセル", async () => {
          await api("publication.cancel", { operation: op.id });
          await history();
        }),
      );
    box.append(row);
  }
  for (const r of data.releases) {
    const row = node("div");
    row.className = "row";
    const a = node("a", r.id + (data.active.candidateId === r.id ? " · 現在公開中" : ""));
    a.href = `http://127.0.0.1:4173/r/${r.id}/index.html`;
    a.target = "_blank";
    a.rel = "noopener";
    row.append(a);
    row.append(
      button("この版から複製", async () => {
        if (editSeq !== savedSeq) await save();
        const form = "frm_" + crypto.randomUUID().replaceAll("-", "");
        const result = await api("clone", {
          site: $("site").value,
          form,
          release: r.id,
          title: $("form-title").value + " (コピー)",
        });
        draft = result.definition;
        version = result.version;
        resetPersistence();
        $("form-title").value = result.title;
        currentStep = draft.steps[0].id;
        selected = null;
        pendingPreview = null;
        previewFrame().src = "about:blank";
        await refreshForms(form);
        render();
        await history();
        notice("公開スナップショットから複製しました");
      }),
    );
    if (data.active.candidateId !== r.id)
      row.append(
        button("この版へロールバック", async () => {
          await api("rollback", { ...scope(), release: r.id, expected: data.active.version });
          notice("ロールバック完了");
          await history();
        }),
      );
    box.append(row);
  }
  const audit = node("details");
  audit.append(node("summary", "監査ログ"));
  audit.append(
    node("pre", data.audit.map((x) => `${x.actor} · ${x.action} · ${x.target}`).join("\n")),
  );
  box.append(audit);
}
void (async () => {
  await loadSession();
  const q = new window.URLSearchParams(window.location.search),
    site = q.get("site"),
    form = q.get("form");
  if (session && site && form && session.sites.some((s) => s.id === site)) {
    $("site").value = site;
    await refreshForms(form);
    const result = await api("get", { site, form });
    draft = result.definition;
    version = result.version;
    $("form-title").value = result.title;
    currentStep = draft.steps[0].id;
    selected = null;
    resetPersistence();
    render();
    await history();
  }
  const recoveryRaw = window.sessionStorage.getItem("fb.admin.recovery");
  if (session && q.get("login") === "complete" && recoveryRaw) {
    const recovery = JSON.parse(recoveryRaw);
    if (
      recovery.user === session.user &&
      session.sites.some((s) => s.id === recovery.draft.siteId)
    ) {
      draft = recovery.draft;
      version = recovery.version;
      currentStep = recovery.currentStep;
      selected = recovery.selected;
      $("site").value = draft.siteId;
      $("form-title").value = recovery.title;
      resetPersistence();
      baseDocument = recovery.baseDocument;
      editSeq = recovery.editSeq;
      savedSeq = recovery.savedSeq;
      await refreshForms(draft.formId);
      render();
      await history();
    }
    window.sessionStorage.removeItem("fb.admin.recovery");
  }
  if (q.get("login") === "complete") {
    window.history.replaceState(null, "", "/");
    notice("ログイン完了");
  }
})().catch((e) => notice(e.message));
