import type { EngineExpression, EngineGroup, EngineField, EngineIRV1 } from "@fb/contracts";
import { evaluate, type Read } from "./expression.ts";
import {
  compareIds,
  EngineError,
  normalize,
  type Cell,
  type GroupValue,
  type Issue,
  type Value,
  type Values,
} from "./model.ts";
import { fieldIssues, assertAvailable } from "./validators.ts";
export function isGroup(value: Value | undefined): value is GroupValue {
  return value !== undefined && typeof value === "object" && !Array.isArray(value);
}
export function normalizeGroup(value: unknown, g: EngineGroup): GroupValue {
  if (value === undefined) return { order: [], items: {} };
  if (value === null) throw new EngineError("E-PAYLOAD-NULL", g.id);
  if (typeof value !== "object" || Array.isArray(value)) throw new EngineError("E-TYPE", g.id);
  const raw = value as Record<string, unknown>;
  if (
    Object.keys(raw).sort().join(",") !== "items,order" ||
    !Array.isArray(raw.order) ||
    raw.items === null ||
    typeof raw.items !== "object" ||
    Array.isArray(raw.items)
  )
    throw new EngineError("E-TYPE", g.id);
  const order = raw.order as unknown[];
  const items = raw.items as Record<string, unknown>;
  if (
    order.length > (g.maxItems ?? 100) ||
    order.some((id) => typeof id !== "string" || !/^itm_[a-zA-Z0-9_]+$/.test(id)) ||
    new Set(order).size !== order.length ||
    Object.keys(items).length !== order.length
  )
    throw new EngineError("E-ITEM-ID", g.id);
  const out: GroupValue = { order: [], items: {} };
  for (const candidate of order) {
    const id = candidate as string;
    if (!Object.hasOwn(items, id)) throw new EngineError("E-ITEM-ID", g.id);
    const row = items[id];
    if (row === null || typeof row !== "object" || Array.isArray(row))
      throw new EngineError("E-TYPE", `${g.id}[${id}]`);
    const cells: Record<string, Cell> = {};
    for (const [key, v] of Object.entries(row)) {
      const f = g.fields.find((f) => f.id === key);
      if (!f) throw new EngineError("UNKNOWN_FIELD", `${g.id}[${id}]/${key}`);
      if (f.formula) continue;
      const n = normalize(v, f);
      if (n !== undefined) cells[key] = n;
    }
    out.order.push(id);
    out.items[id] = cells;
  }
  return out;
}
function itemRefs(e: EngineExpression): string[] {
  if ("item" in e) return [e.item];
  return "args" in e ? e.args.flatMap(itemRefs) : [];
}
export function itemOrder(g: EngineGroup): EngineField[] {
  const done = new Set<string>(),
    pending = new Set<string>(),
    out: EngineField[] = [];
  function visit(id: string) {
    if (done.has(id)) return;
    if (pending.has(id)) throw new EngineError("E-DEPENDENCY-CYCLE", id);
    const f = g.fields.find((f) => f.id === id);
    if (!f) throw new EngineError("E-REF-DANGLING", id);
    pending.add(id);
    for (const e of [
      f.visibleWhen,
      f.requiredWhen,
      f.formula,
      ...(f.options ?? []).map((o) => o.availableWhen),
    ])
      if (e) for (const dep of itemRefs(e).sort(compareIds)) visit(dep);
    pending.delete(id);
    done.add(id);
    out.push(f);
  }
  for (const f of [...g.fields].sort((a, b) => compareIds(a.id, b.id))) visit(f.id);
  return out;
}
export function effectiveGroup(
  g: EngineGroup,
  raw: GroupValue,
  read: Read,
  conditions: EngineIRV1["conditions"],
) {
  const value: GroupValue = { order: [...raw.order], items: {} };
  const active: string[] = [];
  const errors: Issue[] = [];
  for (const id of raw.order) {
    const row: Record<string, Cell> = {};
    const itemRead: Read = (name) => (name.startsWith("$item:") ? row[name.slice(6)] : read(name));
    for (const f of itemOrder(g)) {
      if (f.visibleWhen && evaluate(f.visibleWhen, itemRead, conditions) !== true) continue;
      const address = `${g.id}[${id}]/${f.id}`;
      active.push(address);
      try {
        const cell = f.formula ? evaluate(f.formula, itemRead, conditions) : raw.items[id]?.[f.id];
        if (isGroup(cell)) throw new EngineError("E-TYPE-OPERATOR");
        const normalized = normalize(cell, f);
        assertAvailable(f, normalized, itemRead, conditions);
        if (normalized !== undefined) row[f.id] = normalized;
      } catch (e) {
        if (!(e instanceof EngineError)) throw e;
        errors.push({ code: e.code, path: address });
      }
    }
    value.items[id] = row;
  }
  return { value, active, errors };
}
export function groupIssues(
  g: EngineGroup,
  value: GroupValue,
  active: Set<string>,
  read: Read,
  conditions: EngineIRV1["conditions"],
): Issue[] {
  const errors: Issue[] = [];
  if (value.order.length < (g.minItems ?? 0)) errors.push({ code: "minItems", path: g.id });
  if (value.order.length > (g.maxItems ?? 100)) errors.push({ code: "maxItems", path: g.id });
  for (const id of value.order) {
    const row = value.items[id] ?? {};
    const itemRead: Read = (name) => (name.startsWith("$item:") ? row[name.slice(6)] : read(name));
    for (const f of g.fields) {
      const address = `${g.id}[${id}]/${f.id}`;
      if (!active.has(address)) continue;
      const required =
        !!f.required ||
        !!f.validators?.some((v) => v.use === "required") ||
        !!(f.requiredWhen && evaluate(f.requiredWhen, itemRead, conditions) === true);
      errors.push(...fieldIssues(f, row[f.id], required).map((e) => ({ ...e, path: address })));
    }
  }
  return errors;
}
export function projectGroup(g: EngineGroup, value: GroupValue): Record<string, Cell>[] {
  return value.order.map((id) => ({
    itemId: id,
    ...Object.fromEntries(
      g.fields
        .filter((f) => f.submit !== "displayOnly" && value.items[id]?.[f.id] !== undefined)
        .map((f) => [f.key, value.items[id]?.[f.id] as Cell]),
    ),
  }));
}
export function clearGroupCells(
  ir: EngineIRV1,
  values: Values,
  before: Set<string>,
  after: Set<string>,
): Record<string, Value> {
  const out = { ...values };
  for (const g of ir.nodes.filter((n) => n.type === "group")) {
    const raw = out[g.id];
    if (!isGroup(raw)) continue;
    const copy = structuredClone(raw);
    let changed = false;
    for (const id of raw.order)
      for (const f of g.fields) {
        const address = `${g.id}[${id}]/${f.id}`;
        if (
          f.clearOnDeactivate &&
          before.has(address) &&
          !after.has(address) &&
          Object.hasOwn(copy.items[id] ?? {}, f.id)
        ) {
          copy.items[id] = Object.fromEntries(
            Object.entries(copy.items[id] ?? {}).filter(([key]) => key !== f.id),
          );
          changed = true;
        }
      }
    if (changed) out[g.id] = copy;
  }
  return out;
}
export function addItem(value: GroupValue, id: string, cells: Record<string, Cell>): GroupValue {
  if (!/^itm_[a-zA-Z0-9_]+$/.test(id) || value.order.includes(id))
    throw new EngineError("E-ITEM-ID");
  return { order: [...value.order, id], items: { ...value.items, [id]: structuredClone(cells) } };
}
export function removeItem(value: GroupValue, id: string): GroupValue {
  return {
    order: value.order.filter((v) => v !== id),
    items: Object.fromEntries(Object.entries(value.items).filter(([key]) => key !== id)),
  };
}
export function moveItems(value: GroupValue, order: string[]): GroupValue {
  if (
    order.length !== value.order.length ||
    new Set(order).size !== order.length ||
    order.some((id) => !value.order.includes(id))
  )
    throw new EngineError("E-ITEM-ID");
  return { order: [...order], items: structuredClone(value.items) };
}
