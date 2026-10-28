import type { EngineIRV1, EngineNode, EngineExpression } from "@fb/contracts";
import { EngineError, fieldId, compareIds } from "./model.ts";
/** Dependency graph helpers shared by definition validation and the runtime reducer. */
export function references(
  e: EngineExpression,
  conditions: EngineIRV1["conditions"],
  pending = new Set<string>(),
): string[] {
  if ("ref" in e) return [fieldId(e.ref)];
  if ("const" in e || "item" in e) return [];
  if ("cond" in e) {
    if (pending.has(e.cond)) throw new EngineError("E-DEPENDENCY-CYCLE", e.cond);
    const c = Object.hasOwn(conditions, e.cond) ? conditions[e.cond] : undefined;
    if (!c) throw new EngineError("E-REF-DANGLING", e.cond);
    return references(c.when, conditions, new Set([...pending, e.cond]));
  }
  return e.args.flatMap((a) => references(a, conditions, pending));
}
export function fieldExpressions(f: EngineNode): EngineExpression[] {
  return f.type === "group"
    ? [...(f.visibleWhen ? [f.visibleWhen] : []), ...f.fields.flatMap(fieldExpressions)]
    : [
        f.visibleWhen,
        f.requiredWhen,
        f.formula,
        ...(f.resetOnChange ?? []).map((id) => ({ ref: "$local:" + id })),
        ...(f.options ?? []).map((o) => o.availableWhen),
      ].filter((e) => e !== undefined);
}
export function fieldOrder(ir: EngineIRV1): EngineNode[] {
  const done = new Set<string>(),
    pending = new Set<string>(),
    out: EngineNode[] = [];
  function visit(id: string) {
    if (done.has(id)) return;
    if (pending.has(id)) throw new EngineError("E-DEPENDENCY-CYCLE", id);
    if (pending.size > 200) throw new EngineError("E-DEFINITION-LIMIT");
    const f = ir.nodes.find((n) => n.id === id);
    if (!f) throw new EngineError("E-REF-DANGLING", id);
    pending.add(id);
    for (const dep of fieldExpressions(f)
      .flatMap((e) => references(e, ir.conditions))
      .sort(compareIds))
      visit(dep);
    pending.delete(id);
    done.add(id);
    out.push(f);
  }
  for (const f of [...ir.nodes].sort((a, b) => compareIds(a.id, b.id))) visit(f.id);
  return out;
}
export function contentId(c: { field: string } | { group: string }): string {
  return fieldId("field" in c ? c.field : c.group);
}
