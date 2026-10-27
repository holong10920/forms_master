import { expect, test } from "vitest";
import { evaluateCase, fixtureIR, goldenCases, goCases, seededCases } from "../src/parity.ts";
for (const name of [
  "pc",
  "calculated",
  "groups",
  "canonical",
  "sports",
  "pc-reference",
  "formats",
  "pc-apply-reference",
]) {
  test(`golden and seeded parity ${name}`, () => {
    const cases = [...goldenCases(), ...seededCases()].filter((c) => c.definition === name);
    const ir = fixtureIR(name);
    const ts = cases.map((c) => evaluateCase(ir, c));
    for (const [i, c] of cases.entries())
      if (c.expected !== null && typeof c.expected === "object")
        expect(ts[i], c.name).toMatchObject(c.expected);
    expect(goCases(ir, cases)).toEqual(ts);
  }, 30_000);
}
