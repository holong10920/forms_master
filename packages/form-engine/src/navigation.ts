import type { EngineIRV1 } from "@fb/contracts";
import {
  EngineError,
  type State,
  type Event,
  type NavigationEvent,
  type Result,
  type Effect,
} from "./model.ts";
import { reduce, snapshot, validation } from "./runtime.ts";

function clearPending(state: State): State {
  const next = { ...state, status: "editing" as const };
  delete next.request;
  return next;
}
function wait(
  state: State,
  intent: NavigationEvent,
  kind: "validation" | "capability",
  groups: readonly string[],
  validated: boolean,
): Result {
  const stateVersion = state.stateVersion + 1;
  const id = `${kind}:${String(stateVersion)}`;
  const fingerprint = `${id}:${state.current}`;
  return {
    state: {
      ...state,
      stateVersion,
      status: "pending",
      errors: [],
      request: { id, fingerprint, stateVersion, kind, groups: [...groups], intent, validated },
    },
    effects: [{ type: kind, id, fingerprint, groups: [...groups] }],
  };
}
function run(ir: EngineIRV1, state: State, event: Event, validated = false): Result {
  const same = { state, effects: [] };
  if (event.type === "asyncResult") {
    const req = state.request;
    if (
      !req ||
      req.kind !== event.kind ||
      req.id !== event.id ||
      req.fingerprint !== event.fingerprint ||
      req.stateVersion !== state.stateVersion ||
      !req.intent
    )
      return same;
    const next = clearPending(state);
    if (!event.ok)
      return {
        state: {
          ...next,
          stateVersion: state.stateVersion + 1,
          errors: [
            {
              code:
                event.kind === "validation"
                  ? event.unavailable
                    ? "E-VALIDATION-UNAVAILABLE"
                    : "E-VALIDATION-REJECTED"
                  : "E-CAPABILITY-UNAVAILABLE",
              path: state.current,
            },
          ],
        },
        effects: [],
      };
    const ready =
      event.kind === "capability"
        ? {
            ...next,
            readyCapabilities: [
              ...new Set([...(next.readyCapabilities ?? []), ...(req.groups ?? [])]),
            ],
          }
        : next;
    return run(
      ir,
      ready,
      { ...req.intent, fromStep: ready.current, stateVersion: ready.stateVersion },
      event.kind === "validation" || !!req.validated,
    );
  }
  if (state.status === "complete") return same;
  if (state.retryPending && event.type !== "next" && event.type !== "submitResult") return same;
  // Submit locks input and navigation until the correlated outcome arrives.
  if (state.request?.kind === "submit" && event.type !== "submitResult") return same;
  if (event.type === "submitResult") return reduce(ir, state, event);
  if (
    "fromStep" in event &&
    (event.fromStep !== state.current || event.stateVersion !== state.stateVersion)
  )
    return same;
  if (event.type === "compositionStart" || event.type === "input") {
    if (!snapshot(ir, state).active.has(event.field))
      throw new EngineError("E-INACTIVE-EDIT", event.field);
    const effects: Effect[] = state.request
      ? [{ type: "cancel", id: state.request.id, fingerprint: state.request.fingerprint }]
      : [];
    return {
      state: {
        ...clearPending(state),
        stateVersion: state.stateVersion + 1,
        ...(event.type === "compositionStart"
          ? { composing: [...new Set([...(state.composing ?? []), event.field])] }
          : {}),
      },
      effects,
    };
  }
  if (event.type === "compositionEnd") {
    const next = {
      ...state,
      composing: (state.composing ?? []).filter((id) => id !== event.field),
    };
    return run(ir, next, { type: "commit", field: event.field, value: event.value });
  }
  if (event.type === "commit" && state.composing?.includes(event.field)) return same;
  if (event.type === "next" && (state.request || state.composing?.length)) return same;
  if (
    event.type === "next" &&
    !validated &&
    validation(ir, state, ir.steps.find((s) => s.id === state.current)?.kind === "review")
      .length === 0
  ) {
    const step = ir.steps.find((s) => s.id === state.current);
    const steps = step?.kind === "review" ? snapshot(ir, state, true).path : [state.current];
    const groups = [...new Set(steps.flatMap((id) => state.ports?.authoritative?.[id] ?? []))];
    if (groups.length) return wait(state, event, "validation", groups, false);
  }
  let result = reduce(ir, state, event);
  if (event.type === "back") {
    const path = snapshot(ir, state).path;
    const previous = path
      .slice(0, path.indexOf(state.current))
      .reverse()
      .find((id) => state.visited?.includes(id));
    result = { ...result, state: { ...result.state, current: previous ?? state.current } };
  }
  if (result.state.current !== state.current) {
    const target = result.state.current;
    const steps =
      ir.steps.find((s) => s.id === target)?.kind === "review"
        ? snapshot(ir, result.state).path.filter(
            (id) => id !== snapshot(ir, result.state).path.at(-1),
          )
        : [target];
    const groups = [
      ...new Set(steps.flatMap((id) => state.ports?.capabilities?.[id] ?? [])),
    ].filter((id) => !state.readyCapabilities?.includes(id));
    if (groups.length && "fromStep" in event) {
      const waiting = wait(clearPending(state), event, "capability", groups, validated);
      return {
        ...waiting,
        effects: [...result.effects.filter((e) => e.type === "cancel"), ...waiting.effects],
      };
    }
    return {
      ...result,
      state: {
        ...result.state,
        visited: [...new Set([...(state.visited ?? [state.current]), target])].filter((id) =>
          snapshot(ir, result.state).path.includes(id),
        ),
      },
    };
  }
  return result;
}
export function dispatch(ir: EngineIRV1, state: State, event: Event): Result {
  const result = run(ir, state, event);
  if (result.state === state) return result;
  const path = snapshot(ir, result.state).path;
  return {
    ...result,
    state: {
      ...result.state,
      visited: (result.state.visited ?? [result.state.current]).filter((id) => path.includes(id)),
    },
  };
}
