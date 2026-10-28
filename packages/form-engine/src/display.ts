// Display-only helpers live apart from the runtime so core bundles never ship them.
import type { EngineDisplay, EngineDisplayLeaf, EngineIRV1 } from "@fb/contracts";
import type { State } from "./model.ts";
import { fieldId } from "./model.ts";
import { evaluate } from "./expression.ts";
import { snapshot } from "./runtime.ts";

type Content = NonNullable<EngineIRV1["steps"][number]["content"]>[number];

/** A display component is shown when its rule holds and its bound field/group is active. */
export function displayVisible(
  ir: EngineIRV1,
  state: State,
  d: EngineDisplay | EngineDisplayLeaf,
): boolean {
  const view = snapshot(ir, state);
  const read = (key: string) => (view.active.has(key) ? view.effective[key] : undefined);
  if (d.visibleWhen && evaluate(d.visibleWhen, read, ir.conditions) !== true) return false;
  const bound = d.type === "section" ? undefined : displayBinding(d);
  return bound === undefined || view.active.has(fieldId(bound));
}
/** Every display component of a step, section children included. */
export function displayItems(step: { content?: readonly Content[] }): EngineDisplayLeaf[] {
  return (step.content ?? []).flatMap((c) =>
    !("display" in c)
      ? []
      : c.display.type === "section"
        ? [c.display as unknown as EngineDisplayLeaf, ...c.display.children]
        : [c.display],
  );
}
export function displayBinding(d: EngineDisplayLeaf): string | undefined {
  return d.type === "fieldValue" ? d.field : d.type === "groupSummary" ? d.group : undefined;
}
