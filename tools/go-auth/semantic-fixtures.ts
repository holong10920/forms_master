import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { goldenCases, seededCases, fixtureIR, evaluateCase } from "../engine-demo/src/parity.ts";
import { root } from "../compiler/src/build.ts";
const cases = [...goldenCases(), ...seededCases()];
const out = join(root, "var/go-auth/semantic");
mkdirSync(out, { recursive: true });
for (const name of [...new Set(cases.map((c) => c.definition))]) {
  const ir = fixtureIR(name);
  const selected = cases
    .filter((c) => c.definition === name)
    .map((c) => ({ ...c, expected: evaluateCase(ir, c) }));
  writeFileSync(join(out, name + ".json"), JSON.stringify({ ir, cases: selected }));
}
console.log(JSON.stringify({ cases: cases.length, authority: "existing TS fixtures" }));
