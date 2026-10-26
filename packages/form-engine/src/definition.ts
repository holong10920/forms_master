import {
  validateSchema,
  type EngineIRV1,
  type FormDefinitionV1,
  type EngineExpression,
  type EngineNode,
  type EngineField,
  type EngineGroup,
} from "@fb/contracts";
import { EngineError, fieldId, compareIds } from "./model.ts";
import { itemOrder } from "./groups.ts";
function budget(value: unknown, depth = 0, seen = new Set<object>(), count = { n: 0 }): void {
  if (++count.n > 20000 || depth > 48) throw new EngineError("E-DEFINITION-LIMIT");
  if (typeof value === "number" && !Number.isSafeInteger(value))
    throw new EngineError("E-NUM-RANGE");
  if (value !== null && typeof value === "object") {
    if (seen.has(value)) throw new EngineError("E-DEFINITION-CYCLE");
    seen.add(value);
    if (Object.keys(value).length > 2000) throw new EngineError("E-DEFINITION-LIMIT");
    for (const v of Object.values(value)) budget(v, depth + 1, seen, count);
    seen.delete(value);
  }
}
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
type Kind =
  "number" | "string" | "boolean" | "array" | "number[]" | "string[]" | "boolean[]" | "group";
const array = (k: Kind) => k === "array" || k.endsWith("[]");
function infer(e: EngineExpression, ir: EngineIRV1, group?: EngineGroup, formula = false): Kind {
  const fail = (): never => {
    throw new EngineError("E-TYPE-OPERATOR");
  };
  if ("const" in e) {
    if (!Array.isArray(e.const)) return typeof e.const as Kind;
    if (!e.const.length) return "array";
    const type = typeof e.const[0];
    if (e.const.some((v) => typeof v !== type)) return fail();
    return `${type}[]` as Kind;
  }
  if ("cond" in e) {
    const c = Object.hasOwn(ir.conditions, e.cond) ? ir.conditions[e.cond] : undefined;
    if (!c) throw new EngineError("E-REF-DANGLING", e.cond);
    const kind = infer(c.when, ir, group);
    if (kind !== "boolean") return fail();
    return kind;
  }
  if ("ref" in e || "item" in e) {
    const f =
      "ref" in e
        ? ir.nodes.find((n) => n.id === fieldId(e.ref))
        : group?.fields.find((n) => n.id === e.item);
    if (!f) throw new EngineError("item" in e ? "E-REF-SCOPE" : "E-REF-DANGLING");
    if (f.type === "group") return "group";
    return f.formula
      ? infer(f.formula, ir, group, true)
      : f.type === "number"
        ? "number"
        : f.type === "boolean"
          ? "boolean"
          : f.type === "choice.checkboxes"
            ? "string[]"
            : "string";
  }
  if (!formula && ["add", "subtract", "multiply", "min", "max", "concat", "choose"].includes(e.op))
    return fail();
  const source = e.args[0];
  if (
    ["count", "sum", "any", "all"].includes(e.op) &&
    source &&
    infer(source, ir, group, formula) === "group"
  ) {
    const g = "ref" in source ? ir.nodes.find((n) => n.id === fieldId(source.ref)) : undefined;
    if (g?.type !== "group") return fail();
    const predicate = e.args[1];
    if (!predicate) {
      if (e.op !== "count" || e.args.length !== 1) return fail();
      return "number";
    }
    if (
      e.args.length !== 2 ||
      infer(predicate, ir, g, formula) !== (e.op === "sum" ? "number" : "boolean")
    )
      return fail();
    return e.op === "any" || e.op === "all" ? "boolean" : "number";
  }
  const a = e.args.map((x) => infer(x, ir, group, formula)),
    n = a.length,
    same = (k: Kind) => a.every((v) => v === k);
  switch (e.op) {
    case "and":
    case "or":
      if (n < 1 || !same("boolean")) return fail();
      return "boolean";
    case "not":
      if (n !== 1 || !same("boolean")) return fail();
      return "boolean";
    case "isEmpty":
    case "isNotEmpty":
      if (n !== 1) return fail();
      return "boolean";
    case "eq":
    case "neq":
      if (n !== 2 || a[0] !== a[1] || !a[0] || array(a[0]) || a[0] === "group") return fail();
      return "boolean";
    case "lt":
    case "lte":
    case "gt":
    case "gte":
      if (n !== 2 || !same("number")) return fail();
      return "boolean";
    case "in":
    case "notIn":
      if (n !== 2 || !a[0] || !a[1] || !array(a[1]) || (a[1] !== "array" && a[1] !== `${a[0]}[]`))
        return fail();
      return "boolean";
    case "includes":
      if (n !== 2 || !a[0] || !array(a[0]) || (a[0] !== "array" && a[0] !== `${a[1] ?? ""}[]`))
        return fail();
      return "boolean";
    case "includesAny":
      if (
        n !== 2 ||
        !a[0] ||
        !a[1] ||
        !array(a[0]) ||
        !array(a[1]) ||
        (a[0] !== "array" && a[1] !== "array" && a[0] !== a[1])
      )
        return fail();
      return "boolean";
    case "any":
    case "all":
      if (n !== 1 || (a[0] !== "boolean[]" && a[0] !== "array")) return fail();
      return "boolean";
    case "count":
      if (n !== 1 || !a[0] || !array(a[0])) return fail();
      return "number";
    case "sum":
      if (n !== 1 || (a[0] !== "number[]" && a[0] !== "array")) return fail();
      return "number";
    case "concat":
      if (n < 1 || !same("string")) return fail();
      return "string";
    case "choose":
      if (n !== 3 || a[0] !== "boolean" || a[1] !== a[2]) return fail();
      return a[1] ?? fail();
    default:
      if (n < 1 || !same("number") || (e.op === "subtract" && n !== 2)) return fail();
      return "number";
  }
}
export function contentId(c: { field: string } | { group: string }): string {
  return fieldId("field" in c ? c.field : c.group);
}
export function assertIR(ir: EngineIRV1): void {
  const ids = new Set<string>(),
    keys = new Set<string>(),
    rank = { public: 0, personal: 1, secret: 2 };
  function checkField(f: EngineNode, item = false) {
    if (
      !(f.type === "group" ? /^grp_[a-zA-Z0-9_]+$/ : /^fld_[a-zA-Z0-9_]+$/).test(f.id) ||
      (!item && (ids.has(f.id) || keys.has(f.key))) ||
      !/^[a-zA-Z][a-zA-Z0-9_]*$/.test(f.key) ||
      ["constructor", "prototype", ...(item ? ["itemId"] : [])].includes(f.key)
    )
      throw new EngineError("E-ID-COLLISION", f.id);
    if (!item) {
      ids.add(f.id);
      keys.add(f.key);
    }
    if (f.type === "plugin:storeSel" && ir.capabilities.storeSel?.capability !== "storeSelector")
      throw new EngineError("E-CAPABILITY-UNDECLARED", f.id);
    if (f.classification === "secret" && !f.clearOnDeactivate)
      throw new EngineError("E-SECRET-CLEAR", f.id);
    if (
      ["text", "textarea", "email", "tel", "postal", "katakana"].includes(f.type) &&
      f.classification === "public"
    )
      throw new EngineError("E-CLASS-BELOW-MIN", f.id);
    if (f.type !== "group" && (f.type === "calculated") !== (f.formula !== undefined))
      throw new EngineError("E-FORMULA", f.id);
  }
  const outputRoots = new Map<string, "object" | "leaf">(),
    outputPaths = new Set<string>();
  for (const f of ir.nodes) {
    if (f.type !== "group" && f.outputPath) {
      if (
        f.outputPath.some(
          (p) =>
            !/^[a-zA-Z][a-zA-Z0-9_]*$/u.test(p) ||
            ["constructor", "prototype", "__proto__"].includes(p),
        ) ||
        !/^inst_[a-zA-Z0-9_]+:fld_[a-zA-Z0-9_]+$/u.test(f.sourceIdentity ?? "")
      )
        throw new EngineError("E-OUTPUT-PATH", f.id);
      const [root, key] = f.outputPath,
        path = root + "." + key;
      if (outputRoots.get(root) === "leaf" || outputPaths.has(path))
        throw new EngineError("E-OUTPUT-COLLISION", f.id);
      outputRoots.set(root, "object");
      outputPaths.add(path);
    } else {
      if (outputRoots.has(f.key)) throw new EngineError("E-OUTPUT-COLLISION", f.id);
      outputRoots.set(f.key, "leaf");
    }
  }
  for (const f of ir.nodes) {
    checkField(f);
    if (f.type === "group") {
      if (
        new Set(f.fields.map((c) => c.id)).size !== f.fields.length ||
        new Set(f.fields.map((c) => c.key)).size !== f.fields.length
      )
        throw new EngineError("E-ID-COLLISION", f.id);
      for (const child of f.fields) {
        checkField(child, true);
        if (rank[f.classification] < rank[child.classification])
          throw new EngineError("E-CLASS-BELOW-MIN", f.id);
      }
      itemOrder(f);
    }
  }
  if (!Object.keys(ir.conditions).every((id) => /^cnd_[a-zA-Z0-9_]+$/.test(id)))
    throw new EngineError("E-ID-COLLISION");
  fieldOrder(ir);
  for (const c of Object.values(ir.conditions)) {
    references(c.when, ir.conditions);
    if (infer(c.when, ir) !== "boolean") throw new EngineError("E-TYPE-OPERATOR");
  }
  function checkExpression(f: EngineField, group?: EngineGroup) {
    for (const e of [
      f.visibleWhen,
      f.requiredWhen,
      ...(f.options ?? []).map((o) => o.availableWhen),
    ])
      if (e && infer(e, ir, group) !== "boolean") throw new EngineError("E-TYPE-OPERATOR", f.id);
    if (f.formula) {
      const kind = infer(f.formula, ir, group, true);
      if (array(kind) || kind === "group") throw new EngineError("E-TYPE-OPERATOR", f.id);
      for (const id of references(f.formula, ir.conditions)) {
        const dep = ir.nodes.find((n) => n.id === id);
        if (dep && rank[f.classification] < rank[dep.classification])
          throw new EngineError("E-CLASS-BELOW-MIN", f.id);
      }
      function checkItemTaint(e: EngineExpression): void {
        if ("item" in e) {
          const source = group?.fields.find((n) => n.id === e.item);
          if (source && rank[f.classification] < rank[source.classification])
            throw new EngineError("E-CLASS-BELOW-MIN", f.id);
        }
        if ("op" in e) for (const arg of e.args) checkItemTaint(arg);
      }
      checkItemTaint(f.formula);
    }
  }
  for (const f of ir.nodes) {
    if (f.type === "group") {
      if (f.visibleWhen && infer(f.visibleWhen, ir) !== "boolean")
        throw new EngineError("E-TYPE-OPERATOR", f.id);
      for (const child of f.fields) checkExpression(child, f);
    } else checkExpression(f);
  }
  const steps = new Map(ir.steps.map((s) => [s.id, s]));
  if (steps.size !== ir.steps.length || !ir.steps.every((s) => /^stp_[a-zA-Z0-9_]+$/.test(s.id)))
    throw new EngineError("E-ID-COLLISION");
  const owner = new Map<string, string>();
  for (const s of ir.steps) {
    for (const c of s.content ?? []) {
      const id = contentId(c),
        node = ir.nodes.find((n) => n.id === id);
      if (!node) throw new EngineError("E-REF-DANGLING", id);
      if ("group" in c !== (node.type === "group")) throw new EngineError("E-TYPE-OPERATOR", id);
      if (owner.has(id)) throw new EngineError("E-ID-COLLISION", id);
      owner.set(id, s.id);
    }
    const ts = s.transitions ?? [];
    if (
      s.kind === "complete"
        ? ts.length > 0 || (s.content?.length ?? 0) > 0
        : ts.filter((t) => "default" in t).length !== 1 || !("default" in (ts.at(-1) ?? {}))
    )
      throw new EngineError("E-GRAPH-NO-DEFAULT", s.id);
    if (
      s.skipWhen &&
      (ts.length !== 1 ||
        references(s.skipWhen, ir.conditions).some((id) => owner.get(id) === s.id) ||
        infer(s.skipWhen, ir) !== "boolean")
    )
      throw new EngineError("E-SKIP", s.id);
    for (const t of ts) {
      const target = steps.get("to" in t ? t.to : t.default);
      if (!target) throw new EngineError("E-REF-DANGLING", s.id);
      if ((target.kind === "complete") !== (s.kind === "review"))
        throw new EngineError("E-COMPLETE-GUARD", s.id);
      if ("when" in t && infer(t.when, ir) !== "boolean")
        throw new EngineError("E-TYPE-OPERATOR", s.id);
    }
  }
  if (owner.size !== ids.size) throw new EngineError("E-ORPHAN-FIELD");
  const pending = new Set<string>(),
    done = new Set<string>();
  function walk(id: string) {
    if (pending.has(id)) throw new EngineError("E-GRAPH-CYCLE", id);
    if (done.has(id)) return;
    pending.add(id);
    for (const t of steps.get(id)?.transitions ?? []) walk("to" in t ? t.to : t.default);
    pending.delete(id);
    done.add(id);
  }
  for (const s of ir.steps) walk(s.id);
  const reachable = (from: string, to: string, seen = new Set<string>()): boolean => {
    if (from === to) return true;
    if (seen.has(from)) return false;
    seen.add(from);
    return (steps.get(from)?.transitions ?? []).some((t) =>
      reachable("to" in t ? t.to : t.default, to, seen),
    );
  };
  for (const s of ir.steps) {
    if (!reachable(ir.steps[0].id, s.id)) throw new EngineError("E-GRAPH-UNREACHABLE", s.id);
    const expressions = [
      ...(s.transitions ?? []).flatMap((t) => ("when" in t ? [t.when] : [])),
      ...(s.skipWhen ? [s.skipWhen] : []),
      ...ir.nodes.filter((f) => owner.get(f.id) === s.id).flatMap(fieldExpressions),
    ];
    for (const e of expressions)
      for (const id of references(e, ir.conditions)) {
        const target = owner.get(id);
        if (target && target !== s.id && reachable(s.id, target))
          throw new EngineError("E-FORWARD-REF", id);
      }
  }
}
export function loadDefinition(value: unknown): EngineIRV1 {
  budget(value);
  if (!validateSchema("form-definition/v1", value).valid)
    throw new EngineError("E-DEFINITION-SCHEMA");
  const d = value as FormDefinitionV1;
  if (d.blockInstances?.length) throw new EngineError("E-BLOCK-UNRESOLVED");
  if (d.locale && !d.locale.supported.includes(d.locale.default)) throw new EngineError("E-LOCALE");
  // Only multi-locale forms carry locale data; ja-only IR stays byte-identical (T-04 fallback).
  const multiLocale = d.locale?.supported.includes("vi") === true;
  const lowerStep = (s: FormDefinitionV1["steps"][number]): EngineIRV1["steps"][number] => {
    const { content, ...rest } = s;
    return content
      ? {
          ...rest,
          content: content.map((c) => {
            if ("block" in c) throw new EngineError("E-BLOCK-UNRESOLVED");
            return c;
          }),
        }
      : rest;
  };
  const ir: EngineIRV1 = {
    irFormat: 1,
    engineIrRange: ">=1.0.0 <2.0.0",
    form: { schemaVersion: d.schemaVersion, formId: d.formId, siteId: d.siteId },
    nodes: d.fields,
    steps: [lowerStep(d.steps[0]), ...d.steps.slice(1).map(lowerStep)],
    conditions: d.conditions ?? {},
    capabilities: Object.fromEntries(
      Object.entries(d.dependencies?.capabilities ?? {}).map(([alias, ref]) => [
        alias,
        { plugin: ref.plugin, version: ref.version, capability: ref.capability },
      ]),
    ),
    effects: [],
    ...(multiLocale ? { locale: { default: "ja", supported: ["ja", "vi"] } } : {}),
    ...(d.texts ? { texts: d.texts } : {}),
  };
  assertIR(ir);
  return structuredClone(ir);
}
export function loadIR(value: unknown): EngineIRV1 {
  budget(value);
  if (!validateSchema("engine-ir/v1", value).valid) throw new EngineError("E-IR-SCHEMA");
  const ir = value as EngineIRV1;
  assertIR(ir);
  return structuredClone(ir);
}
