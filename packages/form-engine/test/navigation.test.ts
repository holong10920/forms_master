import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "vitest";
import {
  createSession,
  dispatch,
  loadDefinition,
  snapshot,
  visibleErrors,
  transitionNotices,
  type State,
  type SessionPorts,
  type Event,
} from "../src/index.ts";
function setup(ports: SessionPorts = {}) {
  const ir = loadDefinition(
    JSON.parse(
      readFileSync(
        resolve(import.meta.dirname, "../../../contracts/fixtures/engine/pc.json"),
        "utf8",
      ),
    ) as unknown,
  );
  let state = createSession(ir, {}, { idempotencyKey: "synthetic-stable-session", ...ports });
  return {
    ir,
    get state() {
      return state;
    },
    send(event: Event) {
      const result = dispatch(ir, state, event);
      state = result.state;
      return result;
    },
    move(type: "next" | "back") {
      return this.send({ type, fromStep: state.current, stateVersion: state.stateVersion });
    },
    reply(ok = true, unavailable = false) {
      const req = state.request;
      if (!req || req.kind === "submit") throw new Error("request");
      return this.send({
        type: "asyncResult",
        kind: req.kind,
        id: req.id,
        fingerprint: req.fingerprint,
        ok,
        unavailable,
      });
    },
  };
}
test("C1/C2/C3/C8/C10 validation intent correlates, edit cancels and stale responses cannot navigate", () => {
  const e = setup({ authoritative: { stp_method: ["synthetic-validator"] } });
  e.send({ type: "commit", field: "fld_method", value: "store" });
  const first = e.move("next");
  const req = first.state.request;
  if (!req || req.kind !== "validation") throw new Error("request");
  expect(e.state.current).toBe("stp_method");
  expect(e.move("next").effects).toEqual([]);
  expect(e.send({ type: "commit", field: "fld_method", value: "takuhai" }).effects[0]?.type).toBe(
    "cancel",
  );
  expect(
    e.send({
      type: "asyncResult",
      kind: "validation",
      id: req.id,
      fingerprint: req.fingerprint,
      ok: true,
    }).effects,
  ).toEqual([]);
  expect(e.state.current).toBe("stp_method");
  e.move("next");
  e.reply();
  expect(e.state.current).toBe("stp_takuhai");
});
test.each([false, true])("authoritative invalid/unavailable cannot advance (%s)", (unavailable) => {
  const e = setup({ authoritative: { stp_method: ["synthetic-validator"] } });
  e.send({ type: "commit", field: "fld_method", value: "store" });
  e.move("next");
  e.reply(false, unavailable);
  expect(e.state.current).toBe("stp_method");
  expect(e.state.errors[0]?.code).toBe(
    unavailable ? "E-VALIDATION-UNAVAILABLE" : "E-VALIDATION-REJECTED",
  );
});
test("C11 lazy loading gates Next and jump, failure preserves data, input cancels intent", () => {
  const e = setup({ capabilities: { stp_store: ["synthetic-store-view"] } });
  e.send({ type: "commit", field: "fld_method", value: "store" });
  e.move("next");
  expect(e.state.request?.kind).toBe("capability");
  expect(e.state.current).toBe("stp_method");
  e.reply(false);
  expect(e.state.values.fld_method).toBe("store");
  e.send({
    type: "jumpTo",
    to: "stp_store",
    fromStep: e.state.current,
    stateVersion: e.state.stateVersion,
  });
  e.send({ type: "input", field: "fld_method" });
  expect(e.state.request).toBeUndefined();
  e.move("next");
  e.reply();
  expect(e.state.current).toBe("stp_store");
});
test("Back uses valid visited steps, branch switches discard forward history", () => {
  const e = setup();
  e.send({ type: "commit", field: "fld_method", value: "store" });
  e.move("next");
  e.send({ type: "commit", field: "fld_store", value: "fictional" });
  e.move("next");
  e.move("back");
  e.move("back");
  e.send({ type: "commit", field: "fld_method", value: "takuhai" });
  expect(e.state.visited).not.toContain("stp_store");
  e.send({ type: "commit", field: "fld_method", value: "store" });
  e.send({
    type: "jumpTo",
    to: "stp_review",
    fromStep: e.state.current,
    stateVersion: e.state.stateVersion,
  });
  e.move("back");
  expect(e.state.current).toBe("stp_method");
});
test("IME waits until compositionEnd and blocks Next, touched errors remain deterministic", () => {
  const e = setup();
  e.send({ type: "commit", field: "fld_method", value: "store" });
  e.move("next");
  e.send({ type: "compositionStart", field: "fld_store" });
  e.send({ type: "commit", field: "fld_store", value: "unfinished" });
  e.move("next");
  expect(e.state.values.fld_store).toBeUndefined();
  expect(e.state.current).toBe("stp_store");
  e.send({ type: "compositionEnd", field: "fld_store", value: " fictional " });
  expect(e.state.values.fld_store).toBe("fictional");
  e.move("next");
  expect(e.state.current).toBe("stp_review");
});
test("C9 submit locks all mutations, duplicate ignored, retry preserves key, result correlation controls completion", () => {
  const e = setup();
  e.send({ type: "commit", field: "fld_method", value: "store" });
  e.move("next");
  e.send({ type: "commit", field: "fld_store", value: "fictional" });
  e.move("next");
  const first = e.move("next");
  const req = e.state.request;
  if (!req) throw new Error("request");
  const locked = e.state;
  e.move("back");
  e.send({ type: "commit", field: "fld_method", value: "takuhai" });
  e.move("next");
  expect(e.state).toBe(locked);
  e.send({ type: "submitResult", id: req.id, fingerprint: req.fingerprint, ok: false });
  const failed = e.state;
  e.move("back");
  expect(e.state).toBe(failed);
  const retry = e.move("next");
  expect(retry.effects[0]?.idempotencyKey).toBe(first.effects[0]?.idempotencyKey);
  const again = retry.state.request;
  if (!again) throw new Error("request");
  e.send({ type: "submitResult", id: req.id, fingerprint: req.fingerprint, ok: true });
  expect(e.state.status).toBe("pending");
  e.send({ type: "submitResult", id: again.id, fingerprint: again.fingerprint, ok: true });
  expect(e.state.status).toBe("complete");
});
test("branch edit recalculates the path without cached forward edges", () => {
  const e = setup();
  e.send({ type: "commit", field: "fld_method", value: "store" });
  e.move("next");
  // Simulate a trusted recomputation event already serialized by the adapter; no lookup merge policy.
  const state: State = { ...e.state, current: "stp_method" };
  const result = dispatch(e.ir, state, { type: "commit", field: "fld_method", value: "takuhai" });
  expect(snapshot(e.ir, result.state).path).not.toContain("stp_store");
  expect(result.state.current).toBe("stp_method");
});
test("deep links to complete resolve to review after validation, off-path links use firstIncomplete", () => {
  const e = setup();
  e.send({ type: "commit", field: "fld_method", value: "store" });
  e.move("next");
  e.send({
    type: "jumpTo",
    to: "stp_takuhai",
    fromStep: e.state.current,
    stateVersion: e.state.stateVersion,
  });
  expect(e.state.current).toBe("stp_store");
  e.send({ type: "commit", field: "fld_store", value: "fictional" });
  e.send({
    type: "jumpTo",
    to: "stp_done",
    fromStep: e.state.current,
    stateVersion: e.state.stateVersion,
  });
  expect(e.state.current).toBe("stp_review");
  expect(e.state.status).toBe("editing");
});

test("validation notices show attempted and async errors without field values", () => {
  const e = setup();
  const before = e.state;
  expect(visibleErrors(e.ir, before)).toEqual([]);
  e.move("next");
  expect(transitionNotices(e.ir, before, e.state).validationShown).toEqual([
    { code: "required", path: "fld_method" },
  ]);
  const a = setup({ authoritative: { stp_method: ["synthetic-validator"] } });
  a.send({ type: "commit", field: "fld_method", value: "store" });
  a.move("next");
  a.reply(false, true);
  expect(visibleErrors(a.ir, a.state)).toContainEqual({
    code: "E-VALIDATION-UNAVAILABLE",
    path: "stp_method",
  });
});
