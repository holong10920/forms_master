import type { EngineIRV1 } from "@fb/contracts";
import { EngineError, type State, type Values, type SessionPorts } from "./model.ts";
import { createSession, draftValues, snapshot, validation } from "./runtime.ts";
import { dispatch } from "./navigation.ts";
export interface DraftSnapshot {
  releaseId: string;
  revision: string;
  expiresAt: number;
  current: string;
  values: Values;
}
export function restoreDraft(
  ir: EngineIRV1,
  draft: DraftSnapshot,
  expected: { releaseId: string; revision: string; now: number },
  ports: SessionPorts = {},
): State {
  if (draft.releaseId !== expected.releaseId || draft.revision !== expected.revision)
    throw new EngineError("E-DRAFT-RELEASE-MISMATCH");
  if (
    !Number.isFinite(draft.expiresAt) ||
    !Number.isFinite(expected.now) ||
    draft.expiresAt <= expected.now
  )
    throw new EngineError("E-DRAFT-EXPIRED");
  const raw = createSession(ir, draft.values, ports);
  const path = snapshot(ir, raw, true).path;
  const requested =
    path.includes(draft.current) &&
    ir.steps.find((s) => s.id === draft.current)?.kind !== "complete"
      ? draft.current
      : (path[0] ?? raw.current);
  const projected = draftValues(ir, { ...raw, current: requested });
  const state = createSession(ir, projected, ports);
  const currentPath = snapshot(ir, state, true).path;
  let target = currentPath.includes(requested) ? requested : state.current;
  for (const step of currentPath.slice(0, currentPath.indexOf(target)))
    if (validation(ir, { ...state, current: step }).length) {
      target = step;
      break;
    }
  return dispatch(ir, state, {
    type: "jumpTo",
    to: target,
    fromStep: state.current,
    stateVersion: state.stateVersion,
  }).state;
}
