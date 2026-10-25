import { resolve } from "node:path";
import { ESLint } from "eslint";
import { expect, test } from "vitest";
test("engine lint rejects clock and randomness globals", async () => {
  const eslint = new ESLint({ cwd: resolve(import.meta.dirname, "../../..") });
  const results = await eslint.lintText(
    "export const time = Date.now(); export const value = Math.random();",
    { filePath: resolve(import.meta.dirname, "../src/index.ts") },
  );
  const rules = results.flatMap((r) => r.messages.map((m) => m.ruleId));
  expect(rules).toContain("no-restricted-globals");
  expect(rules).toContain("no-restricted-properties");
});
