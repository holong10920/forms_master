const $ = (id) => document.getElementById(id);
const node = (tag, text) => {
  const e = document.createElement(tag);
  if (text !== undefined) e.textContent = text;
  return e;
};
let session,
  schema,
  draft,
  version = 0,
  currentStep,
  selected,
  pendingPreview;
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
    Promise.resolve()
      .then(fn)
      .catch((e) => {
        $("diagnostics").textContent = e.message;
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
    data.forms.map((f) => [f.formId, `${f.formId} · v${f.version}`]),
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
  const types = schema.$defs.Field.properties.type.enum;
  options(
    $("palette"),
    types.map((t) => [t, t]),
  );
  await refreshForms();
}
$("login").onclick = async () => {
  notice("ログイン中");
  $("preview-frame").src = "about:blank";
  pendingPreview = null;
  try {
    await api("login", { user: $("account").value });
    await loadSession();
    if (draft && session.sites.some((s) => s.id === draft.siteId)) {
      $("site").value = draft.siteId;
      await refreshForms(draft.formId);
      await history();
    } else {
      draft = null;
      for (const id of ["canvas", "inspector", "branches", "history", "steps"])
        $(id).replaceChildren();
    }
    notice("ログイン完了");
  } catch (e) {
    notice(e.message);
  }
};
$("logout").onclick = async () => {
  await api("logout");
  session = null;
  $("preview-frame").src = "about:blank";
  pendingPreview = null;
  await loadSession();
};
$("site").onchange = () => {
  draft = null;
  $("canvas").replaceChildren();
  void refreshForms().catch((e) => notice(e.message));
};
$("load").onclick = async () => {
  try {
    const data = await api("get", { site: $("site").value, form: $("forms").value });
    draft = data.definition;
    version = data.version;
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
  if (!draft) throw Error("フォームを開いてください");
  const result = await api("save", { ...scope(), expected: version, definition: draft });
  version = result.version;
  pendingPreview = null;
  $("preview-frame").src = "about:blank";
  await refreshForms(draft.formId);
  $("version").textContent = `保存版 v${version}`;
  notice("保存しました");
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
    $("preview-frame").src = "http://127.0.0.1:4175/";
    notice("隔離プレビューを準備中");
  } catch (e) {
    notice(e.message);
  }
};
window.addEventListener("message", (e) => {
  if (e.origin !== "http://127.0.0.1:4175" || e.source !== $("preview-frame").contentWindow) return;
  if (e.data?.type === "preview.hello" && pendingPreview)
    e.source.postMessage(
      { type: "session.start", previewSessionId: pendingPreview.previewSessionId },
      e.origin,
    );
  if (e.data?.type === "preview.ready") notice("プレビュー準備完了");
});
$("review").onclick = async () => {
  try {
    await save();
    const r = await api("review", { ...scope(), version });
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
  notice("未保存の変更があります");
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
      capabilities: {
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
  const next = prior.transitions.find((t) => t.default)?.default ?? "stp_review";
  prior.transitions = prior.transitions.map((t) => (t.default ? { default: id } : t));
  draft.steps.splice(
    draft.steps.findIndex((s) => s.id === "stp_review"),
    0,
    { id, kind: "form", content: [], transitions: [{ default: next }] },
  );
  currentStep = id;
  selected = null;
  update();
};
function render() {
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
  $("canvas").append(node("h3", step.title?.ja ?? step.id));
  scalarControl($("canvas"), "ステップ名", "text", step.title?.ja ?? step.id, (v) => {
    step.title = { ja: v };
  });
  for (const c of step.content ?? []) {
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
}
function inspector() {
  const box = $("inspector");
  box.replaceChildren();
  box.onsubmit = (e) => e.preventDefault();
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
    f.label = { ja: v };
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
    props.classification.enum.map((v) => [v, v]),
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
        f.options = v
          .split("\n")
          .filter(Boolean)
          .map((row) => {
            const [value, label] = row.split("|");
            return { value, label: { ja: label || value } };
          });
        update();
      },
    );
  const other = draft.fields.filter((x) => x.id !== f.id && x.type !== "group");
  const rule = f.visibleWhen;
  selectControl(
    box,
    "表示条件フィールド",
    [["", "常に表示"], ...other.map((x) => [x.id, x.label?.ja ?? x.key])],
    rule?.args?.[0]?.ref?.replace("$local:", "") ?? "",
    (v) => {
      if (!v) delete f.visibleWhen;
      else f.visibleWhen = { op: "eq", args: [{ ref: "$local:" + v }, { const: "" }] };
      update();
    },
  );
  if (rule?.op === "eq")
    scalarControl(box, "表示条件: 等しい値", "text", rule.args[1].const, (v) => {
      f.visibleWhen.args[1] = { const: v };
      update();
    });
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
      if (!draft.fields.some((x) => x.type === "plugin:storeSel")) delete draft.dependencies;
      selected = null;
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
      selectControl(
        row,
        "条件",
        fields.map((f) => [f.id, f.label?.ja ?? f.key]),
        t.when.args[0].ref.replace("$local:", ""),
        (v) => {
          t.when.args[0] = { ref: "$local:" + v };
        },
      );
      scalarControl(row, "等しい値", "text", t.when.args[1].const, (v) => {
        t.when.args[1] = { const: v };
      });
    } else row.append(node("span", "それ以外"));
    selectControl(
      row,
      "次のステップ",
      draft.steps.filter((x) => x.id !== s.id && x.kind !== "complete").map((x) => [x.id, x.id]),
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
        to: "stp_review",
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
        $("preview-frame").src = "http://127.0.0.1:4175/";
      }),
    );
    if (r.state === "OPEN")
      row.append(
        button("承認 (Data Contract 確認)", async () => {
          await api("approve", { id: r.id, dataContractAck: true });
          await history();
        }),
      );
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
  for (const r of data.releases) {
    const row = node("div");
    row.className = "row";
    const a = node("a", r.id + (data.active.candidateId === r.id ? " · 現在公開中" : ""));
    a.href = `http://127.0.0.1:4173/r/${r.id}/index.html`;
    a.target = "_blank";
    a.rel = "noopener";
    row.append(a);
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
void loadSession().catch((e) => notice(e.message));
