import { snapshot, type GroupValue, type State, type Value } from "@fb/form-engine";
import type { EngineField, EngineIRV1 } from "@fb/contracts";
type Label = { ja?: string; vi?: string } | undefined;
type Text = (t: Label, fallback: string) => string;
export type Mask = "none" | "partial" | "full";
export interface SummaryRow {
  fieldId: string;
  label: string;
  value: string;
}
export interface SummaryGroup {
  groupId: string;
  label: string;
  items: SummaryRow[][];
}
export interface SummarySection {
  stepId: string;
  title: string;
  rows: SummaryRow[];
  groups: SummaryGroup[];
}

/** Display-only masking. Never applied to the submit payload. */
export function maskText(value: string, mask: Mask): string {
  if (mask === "none") return value;
  if (mask === "full" || value.length <= 2) return "＊".repeat(mask === "full" ? 4 : value.length);
  return "＊".repeat(value.length - 2) + value.slice(-2);
}

/** Human-readable answer: option labels instead of raw values, はい/いいえ for booleans. */
export function fieldText(
  field: EngineField,
  value: Value | undefined,
  text: Text,
  mask: Mask = "none",
  texts: EngineIRV1["texts"] = {},
): string {
  const empty = value === undefined || value === "" || (Array.isArray(value) && !value.length);
  if (empty) return text(texts.emptyValue, "未入力");
  const option = (v: unknown) => {
    const o = field.options?.find((o) => o.value === v);
    return o ? text(o.label, String(v)) : String(v);
  };
  const readable =
    typeof value === "boolean"
      ? value
        ? text(texts.yes, "はい")
        : text(texts.no, "いいえ")
      : Array.isArray(value)
        ? value.map(option).join("、")
        : typeof value === "object"
          ? ""
          : option(value);
  return maskText(readable, field.classification === "secret" && mask === "none" ? "full" : mask);
}

/** Rows of a repeatable group (products), one array per item in item order. */
export function groupItems(
  group: Extract<EngineIRV1["nodes"][number], { type: "group" }>,
  value: GroupValue | undefined,
  text: Text,
  texts: EngineIRV1["texts"] = {},
): SummaryRow[][] {
  const fields = group.summaryFields
    ? group.summaryFields.flatMap((id) => group.fields.filter((f) => f.id === id))
    : group.fields;
  return (value?.order ?? []).map((id) => {
    const row = value?.items[id] ?? {};
    return fields
      .filter((f) => row[f.id] !== undefined && row[f.id] !== "")
      .map((f) => ({
        fieldId: f.id,
        label: text(f.label, f.key),
        value: fieldText(f, row[f.id], text, "none", texts),
      }));
  });
}

/** Default confirmation: answers of each visited input step, in canvas order. */
export function answerSummary(ir: EngineIRV1, state: State, text: Text): SummarySection[] {
  const view = snapshot(ir, state);
  const out: SummarySection[] = [];
  for (const id of view.path) {
    const step = ir.steps.find((s) => s.id === id);
    if (step?.kind !== "form") continue;
    const section: SummarySection = {
      stepId: id,
      title: text(step.title, ""),
      rows: [],
      groups: [],
    };
    for (const c of step.content ?? []) {
      if ("display" in c) continue;
      const node = ir.nodes.find((n) => `$local:${n.id}` === ("field" in c ? c.field : c.group));
      if (!node || !view.active.has(node.id)) continue;
      if (node.type === "group")
        section.groups.push({
          groupId: node.id,
          label: text(node.listTitle ?? node.label, node.key),
          items: groupItems(
            node,
            view.effective[node.id] as GroupValue | undefined,
            text,
            ir.texts,
          ),
        });
      else
        section.rows.push({
          fieldId: node.id,
          label: text(node.label, node.key),
          value: fieldText(node, view.effective[node.id], text, "none", ir.texts),
        });
    }
    if (section.rows.length || section.groups.length) out.push(section);
  }
  return out;
}
