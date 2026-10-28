import { snapshot, type State } from "@fb/form-engine";
import type { EngineIRV1 } from "@fb/contracts";
type Label = { ja?: string; vi?: string } | undefined;
export interface JourneyStage {
  id: string;
  label: Label;
  status: "current" | "completed" | "inactive";
}
/** Presentation of the actual staged group lifecycle. No routing or validation is performed here. */
export function journey(
  ir: EngineIRV1,
  state: State,
  editing: Readonly<Record<string, boolean>> = {},
): JourneyStage[] {
  const stages: { id: string; label: Label }[] = [];
  let current = "";
  const path = snapshot(ir, state).path;
  const hasCart = ir.nodes.some(
    (node) =>
      node.type === "group" &&
      ir.steps.some((step) => {
        const first = step.content?.[0];
        return (
          !!first &&
          step.content?.length === 1 &&
          "group" in first &&
          first.group === "$local:" + node.id
        );
      }),
  );
  for (const id of path) {
    const step = ir.steps.find((s) => s.id === id);
    if (!step || step.kind === "complete" || (hasCart && step.kind === "review")) continue;
    const only = step.content?.length === 1 ? step.content[0] : undefined;
    const group =
      only && "group" in only
        ? ir.nodes.find((node) => "$local:" + node.id === only.group)
        : undefined;
    if (group?.type === "group") {
      const entry = id + ":entry",
        list = id + ":list";
      stages.push(
        { id: entry, label: group.label ?? step.title },
        { id: list, label: group.listTitle ?? { ja: "商品確認" } },
      );
      if (state.current === id) {
        const value = state.values[group.id];
        const count =
          value && typeof value === "object" && !Array.isArray(value) ? value.order.length : 0;
        current = editing[group.id] || !count ? entry : list;
      }
    } else {
      stages.push({ id, label: step.title });
      if (state.current === id) current = id;
    }
  }
  // The final server review belongs to the last input stage. Completion marks every stage done.
  if (!current && state.status !== "complete") current = stages.at(-1)?.id ?? "";
  const index =
    state.status === "complete" ? stages.length : stages.findIndex((s) => s.id === current);
  return stages.map((stage, i) => ({
    ...stage,
    status: i === index ? "current" : i < index ? "completed" : "inactive",
  }));
}
