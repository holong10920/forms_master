import type { EngineExpression } from "@fb/contracts";
import { EngineError, fieldId, type Value } from "./model.ts";
export type Read = (id: string) => Value | undefined;
export function evaluate(
  expr: EngineExpression,
  read: Read,
  conditions: Readonly<Record<string, { when: EngineExpression }>>,
): Value | undefined {
  if ("const" in expr) return expr.const;
  if ("item" in expr) return read(`$item:${expr.item}`);
  if ("ref" in expr) return read(fieldId(expr.ref));
  if ("cond" in expr) {
    const c = Object.hasOwn(conditions, expr.cond) ? conditions[expr.cond] : undefined;
    if (!c) throw new EngineError("E-REF-DANGLING", expr.cond);
    return evaluate(c.when, read, conditions);
  }
  if (expr.op === "choose") {
    const condition = expr.args[0];
    if (!condition) throw new EngineError("E-ARITY");
    const chosen = evaluate(condition, read, conditions);
    if (typeof chosen !== "boolean") throw new EngineError("E-TYPE-OPERATOR");
    const branch = expr.args[chosen ? 1 : 2];
    if (!branch) throw new EngineError("E-ARITY");
    return evaluate(branch, read, conditions);
  }
  if (["any", "all", "count", "sum"].includes(expr.op)) {
    const source = expr.args[0];
    if (!source) throw new EngineError("E-ARITY");
    const group = evaluate(source, read, conditions);
    if (group !== undefined && typeof group === "object" && !Array.isArray(group)) {
      const g = group;
      const predicate = expr.args[1];
      if (!predicate) {
        if (expr.op !== "count") throw new EngineError("E-ARITY");
        return g.order.length;
      }
      const values = g.order.map((id) =>
        evaluate(
          predicate,
          (name) => (name.startsWith("$item:") ? g.items[id]?.[name.slice(6)] : read(name)),
          conditions,
        ),
      );
      if (expr.op === "sum")
        return values.reduce<number>((n, v) => {
          if (v === undefined) return n;
          if (typeof v !== "number" || !Number.isSafeInteger(n + v))
            throw new EngineError("E-NUM-RANGE");
          return n + v;
        }, 0);
      const checks = values.map((v) => {
        if (v === undefined) return false;
        if (typeof v !== "boolean") throw new EngineError("E-TYPE-OPERATOR");
        return v;
      });
      return expr.op === "count"
        ? checks.filter(Boolean).length
        : expr.op === "any"
          ? checks.some(Boolean)
          : checks.every(Boolean);
    }
  }
  const a = expr.args.map((e) => evaluate(e, read, conditions));
  const x = a[0],
    y = a[1];
  const empty = (v: Value | undefined) =>
    v === undefined ||
    v === "" ||
    (Array.isArray(v) && !v.length) ||
    (typeof v === "object" && !Array.isArray(v) && v.order.length === 0);
  const bool = (v: Value | undefined) => {
    if (typeof v !== "boolean") throw new EngineError("E-TYPE-OPERATOR");
    return v;
  };
  const nums = () =>
    a.map((v) => {
      if (typeof v !== "number" || !Number.isSafeInteger(v))
        throw new EngineError("E-TYPE-OPERATOR");
      return v;
    });
  const checked = (n: number) => {
    if (!Number.isSafeInteger(n)) throw new EngineError("E-NUM-RANGE");
    return Object.is(n, -0) ? 0 : n;
  };
  switch (expr.op) {
    case "isEmpty":
      return empty(x);
    case "isNotEmpty":
      return !empty(x);
    case "and":
      return a.map(bool).every(Boolean);
    case "or":
      return a.map(bool).some(Boolean);
    case "not":
      return !bool(x);
    case "eq":
      return !empty(x) && !empty(y) && x === y;
    case "neq":
      return !empty(x) && !empty(y) && x !== y;
    case "in":
      return !empty(x) && Array.isArray(y) && y.includes(x as string | number | boolean);
    case "notIn":
      return !empty(x) && Array.isArray(y) && !y.includes(x as string | number | boolean);
    case "includes":
      return Array.isArray(x) && !empty(y) && x.includes(y as string | number | boolean);
    case "includesAny":
      return Array.isArray(x) && Array.isArray(y) && y.some((v) => x.includes(v));
    case "lt":
    case "lte":
    case "gt":
    case "gte": {
      if (empty(x) || empty(y)) return false;
      const [u, v] = nums();
      if (u === undefined || v === undefined) throw new EngineError("E-ARITY");
      return expr.op === "lt"
        ? u < v
        : expr.op === "lte"
          ? u <= v
          : expr.op === "gt"
            ? u > v
            : u >= v;
    }
    case "count":
      if (!Array.isArray(x) && !empty(x)) throw new EngineError("E-TYPE-OPERATOR");
      return Array.isArray(x) ? x.length : 0;
    case "sum": {
      if (empty(x)) return 0;
      if (!Array.isArray(x)) throw new EngineError("E-TYPE-OPERATOR");
      return x.reduce<number>((n, v) => {
        if (typeof v !== "number") throw new EngineError("E-TYPE-OPERATOR");
        return checked(n + v);
      }, 0);
    }
    case "any":
    case "all": {
      if (empty(x)) return expr.op === "all";
      if (!Array.isArray(x) || !x.every((v) => typeof v === "boolean"))
        throw new EngineError("E-TYPE-OPERATOR");
      return expr.op === "any" ? x.some(Boolean) : x.every(Boolean);
    }
    case "concat":
      if (a.some((v) => v === undefined)) return undefined;
      if (!a.every((v) => typeof v === "string")) throw new EngineError("E-TYPE-OPERATOR");
      return a.join("");
    case "add":
    case "subtract":
    case "multiply":
    case "min":
    case "max": {
      if (a.some((v) => v === undefined)) return undefined;
      const n = nums();
      const first = n[0];
      if (first === undefined) throw new EngineError("E-ARITY");
      if (expr.op === "min") return Math.min(...n);
      if (expr.op === "max") return Math.max(...n);
      return n
        .slice(1)
        .reduce(
          (r, v) => checked(expr.op === "add" ? r + v : expr.op === "subtract" ? r - v : r * v),
          first,
        );
    }
  }
}
