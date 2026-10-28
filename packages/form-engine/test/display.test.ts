import { expect, test } from "vitest";
import {
  createSession,
  displayVisible,
  loadDefinition,
  payloadPreview,
  stepItems,
} from "../src/index.ts";

const text = (id: string, label: string) => ({
  id,
  key: id.replace("fld_", ""),
  type: "text",
  classification: "personal",
  label: { ja: label },
});
export function twoFieldDefinition(): Record<string, unknown> & {
  steps: Record<string, unknown>[];
  fields: unknown[];
} {
  return {
    schemaVersion: "1.0.0",
    kind: "form",
    formId: "frm_display_synthetic",
    siteId: "site_demo",
    // Definition order (fields[]) deliberately differs from the step's canvas order.
    fields: [text("fld_first", "先に作成"), text("fld_second", "後で作成")],
    steps: [
      {
        id: "stp_input",
        kind: "form",
        content: [{ field: "$local:fld_second" }, { field: "$local:fld_first" }],
        transitions: [{ default: "stp_review" }],
      },
      { id: "stp_review", kind: "review", transitions: [{ default: "stp_done" }] },
      { id: "stp_done", kind: "complete" },
    ],
  };
}

test("step items follow the canvas order of step.content, not the fields[] order", () => {
  const ir = loadDefinition(twoFieldDefinition());
  const state = createSession(ir);
  const step = ir.steps[0];
  expect(
    stepItems(ir, step, state).map((i) => (i.kind === "field" ? i.node.id : i.item.id)),
  ).toEqual(["fld_second", "fld_first"]);
});

type Def = Record<string, unknown> & { steps: Record<string, unknown>[]; fields: unknown[] };
function withContent(
  stepIndex: number,
  content: unknown[],
  extra: Record<string, unknown> = {},
): Def {
  const d = twoFieldDefinition();
  const step = at(d.steps, stepIndex);
  step.content = [...((step.content as unknown[] | undefined) ?? []), ...content];
  Object.assign(step, extra);
  return d;
}
const at = <T>(list: readonly T[], i: number): T => {
  const v = list[i];
  if (v === undefined) throw Error("fixture");
  return v;
};
const heading = (id: string, ja: string) => ({ display: { id, type: "heading", text: { ja } } });
const code = (d: unknown) => {
  try {
    loadDefinition(d);
    return "OK";
  } catch (e) {
    return (e as { code?: string }).code;
  }
};

test("display items interleave with fields in canvas order and honour visibleWhen", () => {
  const d = twoFieldDefinition();
  at(d.steps, 0).content = [
    heading("dsp_title", "見出し"),
    { field: "$local:fld_second" },
    {
      display: {
        id: "dsp_hint",
        type: "text",
        text: { ja: "入力済み" },
        visibleWhen: { op: "isNotEmpty", args: [{ ref: "$local:fld_second" }] },
      },
    },
    { field: "$local:fld_first" },
  ];
  const ir = loadDefinition(d);
  const step = ir.steps[0];
  const fresh = createSession(ir);
  expect(
    stepItems(ir, step, fresh).map((i) => (i.kind === "field" ? i.node.id : i.item.id)),
  ).toEqual(["dsp_title", "fld_second", "dsp_hint", "fld_first"]);
  const hint = stepItems(ir, step, fresh).find(
    (i) => i.kind === "display" && i.item.id === "dsp_hint",
  );
  if (hint?.kind !== "display") throw Error("fixture");
  expect(displayVisible(ir, fresh, hint.item)).toBe(false);
  expect(displayVisible(ir, { ...fresh, values: { fld_second: "値" } }, hint.item)).toBe(true);
});

test("review and complete steps accept display-only content", () => {
  const d = withContent(1, [heading("dsp_review", "確認")]);
  at(d.steps, 2).content = [
    heading("dsp_done", "完了"),
    { display: { id: "dsp_ref", type: "reference" } },
    {
      display: {
        id: "dsp_cta",
        type: "button",
        label: { ja: "トップへ" },
        action: "link",
        link: "home",
      },
    },
  ];
  expect(code(d)).toBe("OK");
});

test.each([
  ["input field on review", withContent(1, [{ field: "$local:fld_first" }]), "E-DISPLAY-SCOPE"],
  [
    "reference outside completion",
    withContent(0, [{ display: { id: "dsp_r", type: "reference" } }]),
    "E-DISPLAY-SCOPE",
  ],
  [
    "duplicate display id",
    withContent(0, [heading("dsp_x", "a"), heading("dsp_x", "b")]),
    "E-ID-COLLISION",
  ],
  ["malformed display id", withContent(0, [heading("x", "a")]), "E-ID-COLLISION"],
  [
    "dangling binding",
    withContent(1, [{ display: { id: "dsp_v", type: "fieldValue", field: "$local:fld_none" } }]),
    "E-REF-DANGLING",
  ],
  [
    "group summary bound to a scalar",
    withContent(1, [{ display: { id: "dsp_g", type: "groupSummary", group: "$local:fld_first" } }]),
    "E-TYPE-OPERATOR",
  ],
  [
    "link CTA without approved link",
    withContent(1, [
      { display: { id: "dsp_b", type: "button", label: { ja: "x" }, action: "link" } },
    ]),
    "E-DISPLAY-LINK",
  ],
  ["autoSubmit on a form step", withContent(0, [], { autoSubmit: true }), "E-AUTO-SUBMIT"],
  [
    "binding to a later step's field",
    (() => {
      const d = twoFieldDefinition();
      d.steps = [
        {
          id: "stp_a",
          kind: "form",
          content: [
            { display: { id: "dsp_v", type: "fieldValue", field: "$local:fld_first" } },
            { field: "$local:fld_second" },
          ],
          transitions: [{ default: "stp_b" }],
        },
        {
          id: "stp_b",
          kind: "form",
          content: [{ field: "$local:fld_first" }],
          transitions: [{ default: "stp_review" }],
        },
        ...d.steps.slice(1),
      ];
      return d;
    })(),
    "E-FORWARD-REF",
  ],
])("rejects %s", (_name, d, expected) => {
  expect(code(d)).toBe(expected);
});

test("completion never binds personal data, and secret values must be masked on review", () => {
  const done = twoFieldDefinition();
  at(done.steps, 2).content = [
    { display: { id: "dsp_v", type: "fieldValue", field: "$local:fld_first", mask: "partial" } },
  ];
  expect(code(done)).toBe("E-DISPLAY-PII");
  const secret = withContent(1, [
    { display: { id: "dsp_s", type: "fieldValue", field: "$local:fld_pw" } },
  ]);
  secret.fields.push({
    id: "fld_pw",
    key: "pw",
    type: "text",
    classification: "secret",
    clearOnDeactivate: true,
    label: { ja: "暗証" },
  });
  (at(secret.steps, 0).content as unknown[]).push({ field: "$local:fld_pw" });
  expect(code(secret)).toBe("E-DISPLAY-PII");
  at(at(secret.steps, 1).content as { display: Record<string, unknown> }[], 0).display.mask =
    "full";
  expect(code(secret)).toBe("OK");
});

test("display items never enter validation or the submit payload", () => {
  const d = withContent(0, [heading("dsp_t", "見出し")]);
  const ir = loadDefinition(d);
  const s = createSession(ir, {}, { idempotencyKey: "k" });
  expect(
    Object.keys(payloadPreview(ir, { ...s, values: { fld_first: "a", fld_second: "b" } })).sort(),
  ).toEqual(["first", "second"]);
});
