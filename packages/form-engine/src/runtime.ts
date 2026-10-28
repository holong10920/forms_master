declare const __FB_RESETS__: boolean;
import type { EngineIRV1, EngineNode, EngineField } from "@fb/contracts";
import { contentId, fieldOrder } from "./dependencies.ts";
import { evaluate } from "./expression.ts";
import {
  clearGroupCells,
  effectiveGroup,
  groupIssues,
  isGroup,
  normalizeGroup,
  projectGroup,
} from "./groups.ts";
import { fieldIssues, assertAvailable } from "./validators.ts";
import {
  EngineError,
  field,
  normalize,
  type Cell,
  type Effect,
  type NativeEvent,
  type SessionPorts,
  type Issue,
  type Result,
  type Snapshot,
  type State,
  type Value,
  type Values,
} from "./model.ts";
export type Payload = Record<string, Cell | Record<string, Cell>[] | Record<string, Cell>>;
function readNode(value: unknown, node: EngineNode): Value | undefined {
  return node.type === "group" ? normalizeGroup(value, node) : normalize(value, node);
}
export function snapshot(ir: EngineIRV1, state: State, submit = false): Snapshot {
  const path: string[] = [],
    active = new Set<string>(),
    effective: Record<string, Value> = {},
    errors: Issue[] = [];
  const order = fieldOrder(ir);
  let id: string | undefined = ir.steps[0].id,
    pastCurrent = false;
  while (id) {
    if (path.includes(id) || path.length >= ir.steps.length) throw new EngineError("E-GRAPH-CYCLE");
    const step = ir.steps.find((s) => s.id === id);
    if (!step) throw new EngineError("E-REF-DANGLING");
    const read = (key: string) => (active.has(key) ? effective[key] : undefined);
    const skipped = step.skipWhen && evaluate(step.skipWhen, read, ir.conditions) === true;
    if (!skipped) {
      path.push(id);
      if (step.kind !== "complete" && (submit || !pastCurrent)) {
        const members = new Set((step.content ?? []).map(contentId));
        for (const f of order.filter((f) => members.has(f.id))) {
          if (f.visibleWhen && evaluate(f.visibleWhen, read, ir.conditions) !== true) continue;
          active.add(f.id);
          try {
            if (f.type === "group") {
              const result = effectiveGroup(
                f,
                normalizeGroup(state.values[f.id], f),
                read,
                ir.conditions,
              );
              effective[f.id] = result.value;
              for (const address of result.active) active.add(address);
              errors.push(...result.errors);
            } else {
              const value = f.formula
                ? evaluate(f.formula, read, ir.conditions)
                : state.values[f.id];
              const v = normalize(value, f);
              assertAvailable(f, v, read, ir.conditions);
              if (v !== undefined) effective[f.id] = v;
            }
          } catch (error) {
            if (!(error instanceof EngineError)) throw error;
            errors.push({ code: error.code, path: f.id });
          }
        }
      }
      if (step.id === state.current) pastCurrent = true;
    }
    if (step.kind === "complete") break;
    const t = (step.transitions ?? []).find(
      (t) => "default" in t || evaluate(t.when, read, ir.conditions) === true,
    );
    if (!t) throw new EngineError("E-GRAPH-NO-DEFAULT");
    id = "default" in t ? t.default : t.to;
  }
  return { path, active, effective, errors };
}
export function validation(ir: EngineIRV1, state: State, wholePath = false): Issue[] {
  const view = snapshot(ir, state, wholePath);
  const out = [...view.errors];
  const members = new Set(
    (ir.steps.find((s) => s.id === state.current)?.content ?? []).map(contentId),
  );
  for (const f of ir.nodes) {
    if (!view.active.has(f.id) || (!wholePath && !members.has(f.id))) continue;
    const v = view.effective[f.id];
    if (f.type === "group") {
      if (isGroup(v))
        out.push(...groupIssues(f, v, view.active, (id) => view.effective[id], ir.conditions));
      continue;
    }
    if (isGroup(v)) throw new EngineError("E-TYPE");
    const required =
      !!f.required ||
      !!f.validators?.some((v) => v.use === "required") ||
      !!(
        f.requiredWhen &&
        evaluate(f.requiredWhen, (id) => view.effective[id], ir.conditions) === true
      );
    out.push(...fieldIssues(f, v, required));
  }
  return out;
}
export function payloadPreview(ir: EngineIRV1, state: State): Payload {
  const view = snapshot(ir, state);
  const out: Payload = {};
  for (const f of ir.nodes) {
    const v = view.effective[f.id];
    if (!view.active.has(f.id) || f.submit === "displayOnly" || v === undefined) continue;
    if (f.type === "group") {
      if (isGroup(v) && v.order.length) out[f.key] = projectGroup(f, v);
    } else if (!isGroup(v)) {
      if (f.outputPath) {
        const [root, key] = f.outputPath;
        if (!Object.hasOwn(out, root)) out[root] = {};
        (out[root] as Record<string, Cell>)[key] = v;
      } else out[f.key] = v;
    }
  }
  return out;
}
/** Groups retain only public, persist-allowed child cells; the group classification never permits personal cells. */
export function draftValues(ir: EngineIRV1, state: State): Values {
  const view = snapshot(ir, state),
    out: Record<string, Value> = {};
  for (const f of ir.nodes) {
    const v = view.effective[f.id];
    if (
      !view.active.has(f.id) ||
      (f.type !== "group" && f.classification !== "public") ||
      f.persist !== "allowed" ||
      f.submit === "displayOnly" ||
      v === undefined
    )
      continue;
    if (f.type === "group") {
      if (!isGroup(v)) continue;
      out[f.id] = {
        order: [...v.order],
        items: Object.fromEntries(
          v.order.map((id) => [
            id,
            Object.fromEntries(
              f.fields
                .filter(
                  (child) =>
                    child.classification === "public" &&
                    child.persist === "allowed" &&
                    child.submit !== "displayOnly" &&
                    !child.formula &&
                    v.items[id]?.[child.id] !== undefined,
                )
                .map((child) => [child.id, v.items[id]?.[child.id] as Cell]),
            ),
          ]),
        ),
      };
    } else if (!f.formula) out[f.id] = v;
  }
  return out;
}
export function createSession(
  ir: EngineIRV1,
  values: Values = {},
  ports: SessionPorts = {},
): State {
  const clean: Record<string, Value> = {};
  for (const [id, v] of Object.entries(values)) {
    const f = field(ir, id);
    if (f.type !== "group" && f.formula) continue;
    const value = readNode(v, f);
    if (value !== undefined) clean[id] = value;
  }
  const state: State = {
    current: ir.steps[0].id,
    stateVersion: 0,
    values: clean,
    touched: [],
    attempted: [],
    errors: [],
    status: "editing",
    retiredItems: {},
    ports: structuredClone(ports),
    readyCapabilities: [...(ports.readyCapabilities ?? [])],
  };
  const current = snapshot(ir, state).path[0] ?? state.current;
  if (ports.capabilities?.[current]?.some((id) => !state.readyCapabilities?.includes(id)))
    throw new EngineError("E-CAPABILITY-BOOTSTRAP", current);
  return { ...state, current, visited: [current] };
}
function owner(ir: EngineIRV1, id: string): string | undefined {
  return ir.steps.find((s) => (s.content ?? []).some((c) => contentId(c) === id))?.id;
}
function reconcile(ir: EngineIRV1, old: State, next: State): State {
  let state = next;
  const before = snapshot(ir, old);
  for (let i = 0; i <= ir.nodes.length + 1; i++) {
    // Walk dependencies in order so a parent reset also clears its descendants.
    const resetValues: Record<string, Value> = { ...state.values };
    if (typeof __FB_RESETS__ === "undefined" || __FB_RESETS__)
      for (const f of fieldOrder(ir)) {
        if (
          !(f as EngineField).resetOnChange?.some(
            (id) => JSON.stringify(old.values[id]) !== JSON.stringify(resetValues[id]),
          )
        )
          continue;
        Reflect.deleteProperty(resetValues, f.id);
      }
    state = { ...state, values: resetValues };
    const after = snapshot(ir, state);
    let values = clearGroupCells(ir, state.values, before.active, after.active);
    let changed = false;
    for (const f of ir.nodes)
      if (
        f.clearOnDeactivate &&
        before.active.has(f.id) &&
        !after.active.has(f.id) &&
        Object.hasOwn(values, f.id)
      ) {
        const previous = values[f.id];
        if (f.type === "group" && isGroup(previous))
          state = {
            ...state,
            retiredItems: {
              ...state.retiredItems,
              [f.id]: [...new Set([...(state.retiredItems?.[f.id] ?? []), ...previous.order])],
            },
          };
        values = Object.fromEntries(Object.entries(values).filter(([id]) => id !== f.id));
        changed = true;
      }
    if (!after.path.includes(state.current)) {
      let j = 0;
      while (j < after.path.length && before.path[j] === after.path[j]) j++;
      state = { ...state, current: after.path[Math.max(0, j - 1)] ?? state.current, values };
      continue;
    }
    if (!changed) return { ...state, values };
    state = { ...state, values };
  }
  throw new EngineError("E-EVALUATION-LIMIT");
}
export function reduce(ir: EngineIRV1, state: State, event: NativeEvent): Result {
  const noChange = { state, effects: [] };
  if (event.type === "submitResult") {
    if (
      state.status !== "pending" ||
      !state.request ||
      state.request.kind !== "submit" ||
      event.id !== state.request.id ||
      event.fingerprint !== state.request.fingerprint
    )
      return noChange;
    const rest = { ...state };
    delete rest.request;
    const end = snapshot(ir, state, true).path.at(-1) ?? state.current;
    const rejection = event.rejected
      ? event.issues?.filter((e) => snapshot(ir, state, true).active.has(e.path))
      : undefined;
    const returnStep = rejection?.[0] ? owner(ir, rejection[0].path) : undefined;
    return {
      state: {
        ...rest,
        current: event.ok ? end : (returnStep ?? state.current),
        stateVersion: state.stateVersion + 1,
        status: event.ok ? "complete" : "editing",
        retryPending: !event.ok && !event.rejected,
        ...(event.rejected && state.ports?.idempotencyKey
          ? {
              ports: {
                ...state.ports,
                idempotencyKey: `${state.ports.idempotencyKey}:rejected:${String(state.stateVersion + 1)}`,
              },
            }
          : {}),
        errors: event.ok
          ? []
          : rejection?.length
            ? rejection
            : [{ code: "E-VALIDATION-UNAVAILABLE", path: "" }],
      },
      effects: [],
    };
  }
  if (state.status === "complete") return noChange;
  if (
    "fromStep" in event &&
    (event.fromStep !== state.current || event.stateVersion !== state.stateVersion)
  )
    return noChange;
  if (state.status === "pending" && event.type === "next") return noChange;
  const effects: Effect[] = [];
  const { request, ...rest } = state;
  if (request) effects.push({ type: "cancel", id: request.id, fingerprint: request.fingerprint });
  let next: State = {
    ...rest,
    stateVersion: state.stateVersion + 1,
    status: "editing",
    errors: [],
  };
  if (event.type === "commit") {
    const f = field(ir, event.field);
    if (f.type !== "group" && f.formula) throw new EngineError("E-READONLY", f.id);
    if (owner(ir, f.id) !== state.current || !snapshot(ir, state).active.has(f.id))
      throw new EngineError("E-INACTIVE-EDIT", f.id);
    let values = { ...state.values };
    const value = readNode(event.value, f);
    if (value === undefined)
      values = Object.fromEntries(Object.entries(values).filter(([id]) => id !== f.id));
    else values[f.id] = value;
    let retiredItems = state.retiredItems ?? {};
    if (f.type === "group" && isGroup(value)) {
      const old = state.values[f.id];
      const previous = isGroup(old) ? old.order : [];
      const retired = retiredItems[f.id] ?? [];
      if (value.order.some((id) => retired.includes(id)))
        throw new EngineError("E-ITEM-ID-REUSE", f.id);
      retiredItems = {
        ...retiredItems,
        [f.id]: [...new Set([...retired, ...previous.filter((id) => !value.order.includes(id))])],
      };
    }
    next = { ...next, values, retiredItems, touched: [...new Set([...state.touched, f.id])] };
  } else if (event.type === "blur") {
    field(ir, event.field);
    if (!snapshot(ir, state).active.has(event.field)) return noChange;
    next = { ...next, touched: [...new Set([...state.touched, event.field])] };
  } else if (event.type === "back") {
    const p = snapshot(ir, state).path;
    next = { ...next, current: p[Math.max(0, p.indexOf(state.current) - 1)] ?? state.current };
  } else if (event.type === "jumpTo") {
    const p = snapshot(ir, state, true).path;
    let destination = event.to;
    if (ir.steps.find((s) => s.id === destination)?.kind === "complete")
      destination = p.at(-2) ?? state.current;
    if (!p.includes(destination))
      destination =
        p.find(
          (id) =>
            ir.steps.find((s) => s.id === id)?.kind !== "complete" &&
            validation(ir, { ...state, current: id }).length > 0,
        ) ??
        p.at(-2) ??
        state.current;
    let first = destination;
    for (const step of p.slice(0, p.indexOf(destination)))
      if (validation(ir, { ...state, current: step }).length) {
        first = step;
        break;
      }
    next = { ...next, current: first };
  } else {
    const errors = validation(ir, state),
      step = ir.steps.find((s) => s.id === state.current);
    if (errors.length)
      next = { ...next, errors, attempted: [...new Set([...state.attempted, state.current])] };
    else if (step?.kind === "review") {
      const allErrors = validation(ir, state, true);
      if (allErrors.length) next = { ...next, errors: allErrors };
      else {
        if (!state.ports?.idempotencyKey) throw new EngineError("E-SESSION-KEY-REQUIRED");
        const fingerprint = `${state.current}:${String(state.stateVersion)}`,
          id = `submit:${String(next.stateVersion)}`;
        next = {
          ...next,
          status: "pending",
          request: { id, stateVersion: next.stateVersion, fingerprint, kind: "submit" },
        };
        effects.push({
          type: "submit",
          id,
          fingerprint,
          idempotencyKey: state.ports.idempotencyKey,
        });
      }
    } else {
      const p = snapshot(ir, state).path;
      next = { ...next, current: p[p.indexOf(state.current) + 1] ?? state.current };
      if (ir.steps.find((s) => s.id === next.current)?.kind === "complete")
        throw new EngineError("E-COMPLETE-GUARD");
    }
  }
  return { state: reconcile(ir, state, next), effects };
}
export function visibleErrors(ir: EngineIRV1, state: State): Issue[] {
  const issues = validation(ir, state).filter(
    (e) => state.touched.includes(e.path) || state.attempted.includes(state.current),
  );
  return [...new Map([...issues, ...state.errors].map((e) => [`${e.code}:${e.path}`, e])).values()];
}
export function transitionNotices(ir: EngineIRV1, previous: State, next: State) {
  const before = snapshot(ir, previous),
    after = snapshot(ir, next);
  return {
    stepChanged:
      previous.current === next.current ? undefined : { from: previous.current, to: next.current },
    nodeActivity: [...new Set([...before.active, ...after.active])]
      .filter((id) => before.active.has(id) !== after.active.has(id))
      .map((id) => ({ id, active: after.active.has(id) })),
    submitStatus: next.status,
    validationShown: visibleErrors(ir, next).filter(
      (e) => !visibleErrors(ir, previous).some((p) => p.code === e.code && p.path === e.path),
    ),
  };
}
