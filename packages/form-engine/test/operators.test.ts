import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "vitest";
import type { EngineExpression } from "@fb/contracts";
import { evaluate, type Values } from "../src/index.ts";
const fixture = JSON.parse(
  readFileSync(
    resolve(import.meta.dirname, "../../../contracts/fixtures/engine/operators.json"),
    "utf8",
  ),
) as {
  cases: { name: string; expression: EngineExpression; expected: unknown; values?: Values }[];
};
for (const c of fixture.cases)
  test(`operator ${c.name}`, () => {
    expect(evaluate(c.expression, (id) => c.values?.[id], {})).toEqual(c.expected);
  });
