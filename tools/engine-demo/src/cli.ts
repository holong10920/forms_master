import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  createSession,
  dispatch,
  loadDefinition,
  payloadPreview,
  snapshot,
  type State,
} from "@fb/form-engine";
const [flag, scenario] = process.argv.slice(2);
if (flag !== "--scenario" || scenario !== "pc-branch")
  throw new Error("usage: --scenario pc-branch");
const fixture: unknown = JSON.parse(
  readFileSync(resolve(import.meta.dirname, "../../../contracts/fixtures/engine/pc.json"), "utf8"),
);
const ir = loadDefinition(fixture);
let state = createSession(ir);
const trace: {
  action: string;
  step: string;
  errors: readonly unknown[];
  payload: ReturnType<typeof payloadPreview>;
}[] = [];
function record(action: string) {
  trace.push({
    action,
    step: state.current,
    errors: state.errors,
    payload: payloadPreview(ir, state),
  });
}
function commit(field: string, value: string) {
  state = dispatch(ir, state, { type: "commit", field, value }).state;
  record(`commit ${field}`);
}
function move(type: "next" | "back") {
  state = dispatch(ir, state, {
    type,
    fromStep: state.current,
    stateVersion: state.stateVersion,
  }).state;
  record(type);
}
function memory(s: State) {
  return {
    packingKitPreserved: s.values.fld_kit === "yes",
    secretCleared: !("fld_token" in s.values),
  };
}
record("start");
move("next");
commit("fld_method", "takuhai");
move("next");
commit("fld_kit", "yes");
commit("fld_token", "synthetic-ephemeral");
move("next");
move("back");
move("back");
commit("fld_method", "store");
move("next");
commit("fld_store", "fictional-store");
move("next");
const storePreview = payloadPreview(ir, state);
move("back");
move("back");
commit("fld_method", "takuhai");
move("next");
console.log(
  JSON.stringify(
    {
      scenario,
      trace,
      storePreview,
      roundTrip: memory(state),
      path: snapshot(ir, state).path,
      preview: payloadPreview(ir, state),
    },
    null,
    2,
  ),
);
