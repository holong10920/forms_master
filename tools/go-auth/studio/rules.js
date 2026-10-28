// Sentence-style rule editor (visibility, required, branches, named conditions).
// It only edits the existing expression DSL; evaluation stays in the engine/runtime.
import { h, add, icon, select, input, btn, L, confirmDialog, callout, userText } from "./ui.js";
import {
  S,
  ruleRef,
  ruleFields,
  allRuleFields,
  notice,
  fieldLabel,
  stepLabel,
  newId,
  dirty,
  emit,
} from "./state.js";

const ATOMIC = [
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
];
const OPERATOR_LABELS = {
  eq: "が次と等しい",
  neq: "が次と異なる",
  lt: "が次より小さい",
  lte: "が次以下",
  gt: "が次より大きい",
  gte: "が次以上",
  isEmpty: "が未回答",
  isNotEmpty: "が回答済み",
  in: "が次のいずれか",
  notIn: "が次のいずれでもない",
  includes: "で次を選択している",
  includesAny: "で次のいずれかを選択している",
};
const LIST_OPS = ["in", "notIn", "includesAny"];

export const isAtom = (r) => !!r?.args?.[0]?.ref && ATOMIC.includes(r.op);
export const isSupported = (r) =>
  !r || !!r.cond || isAtom(r) || (["and", "or"].includes(r.op) && r.args.every(isAtom));

export function operatorsFor(field) {
  if (field?.type === "choice.checkboxes")
    return ["includes", "includesAny", "isEmpty", "isNotEmpty"];
  return [
    "eq",
    "neq",
    "isEmpty",
    "isNotEmpty",
    ...(field?.type === "number" ? ["lt", "lte", "gt", "gte"] : []),
    ...(field?.options ? ["in", "notIn"] : []),
  ];
}
const defaultConst = (f) =>
  f?.options?.[0]?.value ?? (f?.type === "number" ? 0 : f?.type === "boolean" ? false : "");
export const newAtom = (f) => ({
  op: f.type === "choice.checkboxes" ? "includes" : "eq",
  args: [{ ref: ruleRef(f) }, { const: defaultConst(f) }],
});

// Changes made by buttons (not by a form control "change" event) must mark the draft dirty themselves.
export function commit() {
  dirty();
  emit("render");
}

// ---------- Natural-language summaries (built per locale; user content is never machine-translated) ----------
function describeAtom(a, fields) {
  const ref = a.args[0].ref;
  const f =
    fields.find((x) => ruleRef(x) === ref) ?? allRuleFields().find((x) => ruleRef(x) === ref);
  const name = "「" + (f ? fieldLabel(f) : ref) + "」";
  const one = (x) => {
    const o = f?.options?.find((o) => o.value === x);
    if (o) return "「" + (o.label?.ja ?? o.value) + "」";
    if (typeof x === "boolean") return x ? L("「はい」", "「Có」") : L("「いいえ」", "「Không」");
    return "「" + x + "」";
  };
  const v = a.args[1]?.const;
  const list = (Array.isArray(v) ? v : [v]).map(one).join(L("・", ", "));
  const ja = {
    eq: `${name}が${one(v)}`,
    neq: `${name}が${one(v)}以外`,
    lt: `${name}が ${v} 未満`,
    lte: `${name}が ${v} 以下`,
    gt: `${name}が ${v} より大きい`,
    gte: `${name}が ${v} 以上`,
    isEmpty: `${name}が未回答`,
    isNotEmpty: `${name}が回答済み`,
    in: `${name}が${list}のいずれか`,
    notIn: `${name}が${list}のいずれでもない`,
    includes: `${name}で${one(v)}を選択している`,
    includesAny: `${name}で${list}のいずれかを選択している`,
  };
  const vi = {
    eq: `${name} là ${one(v)}`,
    neq: `${name} khác ${one(v)}`,
    lt: `${name} nhỏ hơn ${v}`,
    lte: `${name} nhỏ hơn hoặc bằng ${v}`,
    gt: `${name} lớn hơn ${v}`,
    gte: `${name} lớn hơn hoặc bằng ${v}`,
    isEmpty: `${name} chưa được trả lời`,
    isNotEmpty: `${name} đã được trả lời`,
    in: `${name} là một trong ${list}`,
    notIn: `${name} không thuộc ${list}`,
    includes: `${name} có chọn ${one(v)}`,
    includesAny: `${name} có chọn một trong ${list}`,
  };
  return L(ja[a.op], vi[a.op]);
}
export function describeRule(rule, fields = allRuleFields()) {
  if (!rule) return "";
  if (rule.cond)
    return (
      L("保存済みの条件「", "điều kiện đã lưu 「") +
      (S.draft.conditions?.[rule.cond]?.label?.ja ?? rule.cond) +
      "」"
    );
  if (isAtom(rule)) return describeAtom(rule, fields);
  if (isSupported(rule))
    return rule.args
      .map((a) => describeAtom(a, fields))
      .join(rule.op === "and" ? L(" かつ ", " và ") : L(" または ", " hoặc "));
  return L("詳細な式", "biểu thức nâng cao");
}
export const sentence = (rule, action, fields) =>
  rule
    ? L("", "Khi ") + describeRule(rule, fields) + L(" のとき", "") + (action ? " → " + action : "")
    : "";

function summary(text) {
  return text
    ? h("div", { class: "rule-summary", translate: "no" }, icon("sparkles"), h("span", {}, text))
    : null;
}

// ---------- Value controls ----------
function valueControl(field, item, label, commitValue) {
  const value = item.args[1]?.const;
  if (field?.options && LIST_OPS.includes(item.op)) {
    const chosen = new Set(Array.isArray(value) ? value : [value]);
    const group = h("div", { class: "check-list", role: "group", "aria-label": label });
    for (const o of field.options) {
      const box = h("input", { type: "checkbox", value: o.value });
      box.checked = chosen.has(o.value);
      box.addEventListener("change", () =>
        commitValue([...group.querySelectorAll("input:checked")].map((x) => x.value)),
      );
      add(group, h("label", { class: "check-item" }, box, userText(o.label?.ja ?? o.value)));
    }
    return group;
  }
  if (field?.options)
    return select(
      field.options.map((o) => [o.value, o.label?.ja ?? o.value, { noTranslate: true }]),
      Array.isArray(value) ? value[0] : value,
      (v) => commitValue(v),
      { "aria-label": label },
    );
  if (field?.type === "boolean")
    return select(
      [
        ["true", "はい"],
        ["false", "いいえ"],
      ],
      String(value ?? false),
      (v) => commitValue(v === "true"),
      { "aria-label": label },
    );
  const number = field?.type === "number";
  return input(value, {
    type: number ? "number" : "text",
    "aria-label": label,
    inputMode: number ? "numeric" : undefined,
    step: number ? "1" : undefined,
    onCommit: (v, el) => {
      if (number && (v === "" || !Number.isSafeInteger(Number(v)))) {
        el.setAttribute("aria-invalid", "true");
        return notice("整数を入力してください");
      }
      commitValue(number ? Number(v) : v);
    },
  });
}

// ---------- Rule editor ----------
// prefix: accessible-name prefix ("表示", "必須", "分岐", "名前付き", "スキップ").
// change(value): store the new expression (undefined = no condition). The caller re-renders via commit().
export function ruleEditor({
  prefix,
  rule,
  change,
  fields,
  named = true,
  allowAlways = true,
  action = "",
  alwaysLabel = "常に（条件なし）",
}) {
  const set = (value) => {
    change(value);
    commit();
  };
  const group = h(
    "fieldset",
    { class: "rule", dataset: { rule: prefix } },
    h("legend", { class: "sr-only" }, prefix + "条件"),
  );
  if (!isSupported(rule)) {
    add(
      group,
      callout("warning", "info", "既存の式は保持されます。この画面では編集できません。"),
      summary(sentence(rule, action, fields)),
      btn(
        prefix + "条件を置換",
        () => {
          if (!fields.length) return notice("参照可能なフィールドがありません");
          set(newAtom(fields[0]));
        },
        { size: "sm", iconName: "refresh" },
      ),
    );
    return group;
  }
  const compound = !!rule && ["and", "or"].includes(rule.op);
  const modes = [
    ...(allowAlways ? [["", alwaysLabel]] : []),
    ["single", "次の条件を満たすとき"],
    ["and", "すべての条件を満たすとき（AND）"],
    ["or", "いずれかの条件を満たすとき（OR）"],
  ];
  if (named)
    for (const [id, c] of Object.entries(S.draft.conditions ?? {}))
      modes.push([
        id,
        L("保存済みの条件：", "Điều kiện đã lưu: ") + (c.label?.ja ?? id),
        { noTranslate: true },
      ]);
  const current = rule?.cond ?? (compound ? rule.op : rule ? "single" : "");
  if (!modes.some(([v]) => v === current))
    modes.push([
      current,
      L("参照を確認: ", "Kiểm tra tham chiếu: ") + current,
      { noTranslate: true },
    ]);
  add(
    group,
    h(
      "div",
      { class: "rule-sentence" },
      h("span", { "aria-hidden": "true" }, "条件"),
      select(
        modes,
        current,
        (mode) => {
          if (!mode) return set(undefined);
          if (S.draft.conditions?.[mode]) return set({ cond: mode });
          if (!fields.length) {
            notice("参照可能なフィールドがありません");
            return emit("render");
          }
          const prior = isAtom(rule) ? rule : (rule?.args?.find(isAtom) ?? newAtom(fields[0]));
          set(mode === "single" ? prior : { op: mode, args: compound ? rule.args : [prior] });
        },
        { "aria-label": prefix + "条件の組み合わせ" },
      ),
    ),
  );
  if (!rule || rule.cond) {
    add(group, summary(sentence(rule, action, fields)));
    return group;
  }
  const atoms = compound ? rule.args : [rule];
  const store = (next) => {
    if (next.length === 1) return set(next[0]);
    set({ op: compound ? rule.op : "and", args: next });
  };
  const replace = (i, value) => {
    const next = atoms.map((a) => ({ ...a, args: a.args.map((arg) => ({ ...arg })) }));
    next[i] = value;
    store(next);
  };
  atoms.forEach((item, i) => {
    const ref = item.args[0].ref;
    const field = fields.find((f) => ruleRef(f) === ref);
    const valueLabel = prefix === "分岐" ? "等しい値" : prefix + "条件: 等しい値";
    const head = h(
      "div",
      { class: "rule-atom-head" },
      i > 0 ? h("span", { class: "rule-join" }, rule.op === "or" ? "または" : "かつ") : null,
      h("span", {}, "条件 " + (i + 1)),
      h("span", { class: "spacer" }),
      atoms.length > 1
        ? btn("", () => store(atoms.filter((_, n) => n !== i)), {
            variant: "ghost",
            size: "sm",
            iconName: "x",
            aria: prefix + "条件行を削除 " + (i + 1),
            title: "条件を削除",
          })
        : null,
    );
    const fieldSelect = select(
      [
        ...(field
          ? []
          : [[ref, L("参照を確認: ", "Kiểm tra tham chiếu: ") + ref, { noTranslate: true }]]),
        ...fields.map((f) => [ruleRef(f), fieldLabel(f), { noTranslate: true }]),
      ],
      ref,
      (value) => {
        const next = fields.find((f) => ruleRef(f) === value);
        replace(i, next ? newAtom(next) : { op: "eq", args: [{ ref: value }, { const: "" }] });
      },
      { "aria-label": prefix === "分岐" ? "条件" : prefix + "条件フィールド" },
    );
    const opSelect = select(
      operatorsFor(field).map((op) => [op, OPERATOR_LABELS[op]]),
      item.op,
      (op) => {
        const prior = item.args[1]?.const;
        replace(i, {
          op,
          args: op.startsWith("is")
            ? [{ ref }]
            : [
                { ref },
                {
                  const: LIST_OPS.includes(op)
                    ? Array.isArray(prior)
                      ? prior
                      : [prior ?? field?.options?.[0]?.value ?? ""]
                    : Array.isArray(prior)
                      ? (prior[0] ?? "")
                      : (prior ?? defaultConst(field)),
                },
              ],
        });
      },
      { "aria-label": prefix + "演算子" },
    );
    const row = h("div", { class: "rule-sentence" }, fieldSelect, opSelect);
    if (!item.op.startsWith("is"))
      add(
        row,
        valueControl(field, item, valueLabel, (value) =>
          replace(i, { op: item.op, args: [{ ref }, { const: value }] }),
        ),
      );
    add(group, h("div", { class: "rule-atom" }, head, row));
  });
  add(
    group,
    h(
      "div",
      { class: "row" },
      btn(
        prefix + "条件を追加",
        () => {
          if (!fields.length) return notice("参照可能なフィールドがありません");
          store([...atoms, newAtom(fields[0])]);
        },
        { size: "sm", variant: "ghost", iconName: "plus" },
      ),
    ),
    summary(sentence(rule, action, fields)),
  );
  return group;
}

// ---------- Named conditions (form-level, reusable) ----------
export const conditionUses = (id) =>
  JSON.stringify({ ...S.draft, conditions: {} }).split('"cond":"' + id + '"').length - 1;

export function namedConditions(readOnly) {
  const box = h("div", { id: "named-conditions" });
  const entries = Object.entries(S.draft.conditions ?? {});
  if (!entries.length)
    add(
      box,
      h(
        "p",
        { class: "muted small" },
        "複数の場所で使う条件に名前を付けて保存できます。表示・必須・分岐の条件から選択できます。",
      ),
    );
  for (const [id, c] of entries) {
    const used = conditionUses(id);
    const name = input(c.label?.ja ?? "", {
      "aria-label": "名前付き条件名",
      translate: "no",
      onInput: (v) => {
        c.label = { ...c.label, ja: v };
      },
      onCommit: () => commit(),
    });
    add(
      box,
      h(
        "fieldset",
        { class: "named", dataset: { conditionId: id }, disabled: readOnly },
        h("legend", { translate: "no", class: "mono" }, id),
        h(
          "div",
          { class: "row" },
          h("label", { class: "field-label", for: (name.id = "cond-name-" + id) }, "条件名"),
          h("span", { class: "spacer" }),
          h("span", { class: "chip" }, "使用箇所 " + used + "件"),
        ),
        name,
        ruleEditor({
          prefix: "名前付き",
          rule: c.when,
          change: (value) => {
            if (value) c.when = value;
          },
          fields: ruleFields(),
          named: false,
          allowAlways: false,
        }),
        h(
          "div",
          { class: "row" },
          h("span", { class: "spacer" }),
          btn(
            "名前付き条件を削除",
            async () => {
              if (
                used &&
                !(await confirmDialog({
                  title: "名前付き条件を削除しますか？",
                  body: "使用箇所 " + used + "件に参照が残ります。削除後は診断で修正が必要です。",
                  confirm: "削除",
                  tone: "danger",
                }))
              )
                return;
              S.draft.conditions = Object.fromEntries(
                Object.entries(S.draft.conditions).filter(([key]) => key !== id),
              );
              if (!Object.keys(S.draft.conditions).length) delete S.draft.conditions;
              commit();
            },
            { size: "sm", variant: "danger", iconName: "trash" },
          ),
        ),
      ),
    );
  }
  if (!readOnly)
    add(
      box,
      btn(
        "名前付き条件を追加",
        () => {
          const fields = ruleFields();
          if (!fields.length) return notice("フィールドを追加してください");
          const id = newId("cnd_");
          S.draft.conditions = {
            ...S.draft.conditions,
            [id]: { label: { ja: "新しい条件" }, when: newAtom(fields[0]) },
          };
          commit();
        },
        { iconName: "plus", variant: "", size: "sm" },
      ),
    );
  return box;
}

// ---------- Step branches (first match wins, then "otherwise") ----------
const targetOptions = (step) => [
  ["", "未設定"],
  ...S.draft.steps
    .slice(S.draft.steps.indexOf(step) + 1)
    .filter((x) => x.kind !== "complete")
    .map((x) => [x.id, stepLabel(x), { noTranslate: true }]),
];

export function branches(step, readOnly) {
  const box = h("div", { id: "branches" });
  if (step.kind !== "form") return box;
  const conditional = step.transitions.filter((t) => t.when);
  const fields = ruleFields(step.id);
  add(
    box,
    h(
      "p",
      { class: "muted small" },
      "上から順に評価し、最初に一致した分岐へ進みます。どれにも一致しない場合は「それ以外」へ進みます。",
    ),
  );
  step.transitions.forEach((t, i) => {
    if (!t.when) return;
    const n = conditional.indexOf(t) + 1;
    const target = S.draft.steps.find((s) => s.id === t.to);
    const move = (delta) => {
      const j = i + delta;
      if (j < 0 || !step.transitions[j]?.when) return;
      [step.transitions[i], step.transitions[j]] = [step.transitions[j], step.transitions[i]];
      commit();
    };
    add(
      box,
      h(
        "fieldset",
        { class: "branch", dataset: { branch: String(n) }, disabled: readOnly },
        h("legend", { class: "sr-only" }, "分岐 " + n),
        h(
          "div",
          { class: "branch-head" },
          h("span", { class: "chip chip-accent" }, "優先 " + n),
          h("span", {}, "もし"),
          h("span", { class: "spacer" }),
          btn("", () => move(-1), {
            variant: "ghost",
            size: "sm",
            iconName: "up",
            aria: "分岐 " + n + " の優先度を上げる",
          }),
          btn("", () => move(1), {
            variant: "ghost",
            size: "sm",
            iconName: "down",
            aria: "分岐 " + n + " の優先度を下げる",
          }),
          btn(
            "条件削除",
            () => {
              step.transitions.splice(i, 1);
              commit();
            },
            { variant: "ghost", size: "sm", iconName: "trash" },
          ),
        ),
        ruleEditor({
          prefix: "分岐",
          rule: t.when,
          change: (value) => {
            if (value) t.when = value;
          },
          fields,
          allowAlways: false,
          action:
            L("「", "đến 「") +
            (target ? stepLabel(target) : L("未設定", "chưa đặt")) +
            L("」へ進む", "」"),
        }),
        h(
          "div",
          { class: "branch-target" },
          h("span", { "aria-hidden": "true" }, "→ 移動先"),
          select(
            targetOptions(step),
            t.to,
            (v) => {
              t.to = v;
              commit();
            },
            { "aria-label": "分岐 " + n + " の移動先" },
          ),
        ),
      ),
    );
  });
  const fallback = step.transitions.find((t) => !t.when);
  if (fallback) {
    const otherwise = h(
      "div",
      { class: "branch branch-default" },
      h(
        "div",
        { class: "branch-head" },
        h("span", { class: "chip" }, conditional.length ? "それ以外" : "常に"),
      ),
      h(
        "div",
        { class: "branch-target" },
        h("label", { for: "next-step-" + step.id }, "次のステップ"),
        select(
          targetOptions(step),
          fallback.default,
          (v) => {
            fallback.default = v;
            commit();
          },
          { id: "next-step-" + step.id, disabled: readOnly },
        ),
      ),
    );
    if (!fallback.default)
      add(
        otherwise,
        callout("danger", "alert", "移動先が未設定です。プレビューは一部のみ表示されます。"),
      );
    add(box, otherwise);
  }
  if (!readOnly)
    add(
      box,
      btn(
        "条件分岐を追加",
        () => {
          const choice = fields.find((f) => f.options?.length) ?? fields[0];
          if (!choice) return notice("参照できるフィールドを先に追加してください");
          step.transitions.unshift({
            when: newAtom(choice),
            to: S.draft.steps.find((s) => s.kind === "review").id,
          });
          commit();
        },
        { iconName: "branch", size: "sm" },
      ),
    );
  return box;
}

// Skip rule: only for a step whose single transition is the default (engine E-SKIP constraint).
export function skipEditor(step, readOnly) {
  const index = S.draft.steps.indexOf(step);
  const own = new Set((step.content ?? []).filter((c) => c.field).map((c) => c.field));
  const prior = index > 0 ? S.draft.steps[index - 1].id : undefined;
  const fields = prior ? ruleFields(prior).filter((f) => !own.has(ruleRef(f))) : [];
  if (step.kind !== "form" || index === 0)
    return h("p", { class: "muted small" }, "最初のステップはスキップできません。");
  if (step.transitions.length !== 1)
    return h(
      "p",
      { class: "muted small" },
      "条件分岐があるステップにはスキップ条件を設定できません。",
    );
  const box = h("div", {});
  const editor = ruleEditor({
    prefix: "スキップ",
    rule: step.skipWhen,
    change: (value) => {
      if (value) step.skipWhen = value;
      else delete step.skipWhen;
    },
    fields,
    alwaysLabel: "スキップしない",
    action: L("このステップをスキップ", "bỏ qua bước này"),
  });
  editor.disabled = !!readOnly;
  add(box, editor);
  return box;
}

// Number of rule/formula/display references to a field (its placement in a step is not counted).
export const fieldUsage = (id) =>
  JSON.stringify({
    ...S.draft,
    steps: S.draft.steps.map((s) => ({
      ...s,
      content: (s.content ?? []).filter((c) => c.display),
    })),
  }).split('"$local:' + id + '"').length - 1;
