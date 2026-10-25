import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { ESLint } from "eslint";
import { expect, test } from "vitest";

const repoRoot = resolve(import.meta.dirname, "../../..");

test("ESLint rejects eval and new Function", async () => {
  const eslint = new ESLint({ cwd: repoRoot, ignore: false });
  const [result] = await eslint.lintFiles([
    join(repoRoot, "tools/lint-fixtures/fixtures/eval-usage.ts"),
  ]);
  const ruleIds = new Set(result?.messages.map((m) => m.ruleId));
  expect(ruleIds).toContain("no-eval");
  expect(ruleIds).toContain("no-new-func");
});

test("tsc enforces noUncheckedIndexedAccess", () => {
  const dir = mkdtempSync(join(tmpdir(), "fb-tsc-neg-"));
  writeFileSync(
    join(dir, "tsconfig.json"),
    JSON.stringify({
      extends: join(repoRoot, "tsconfig.base.json"),
      compilerOptions: { types: [] },
      include: ["*.ts"],
    }),
  );
  writeFileSync(join(dir, "neg.ts"), "const xs: number[] = [];\nexport const n: number = xs[0];\n");
  const tsc = join(repoRoot, "node_modules/.bin/tsc");
  let output = "";
  let failed = false;
  try {
    execFileSync(tsc, ["-p", dir], { encoding: "utf8" });
  } catch (error) {
    failed = true;
    output = String((error as { stdout?: unknown }).stdout);
  }
  expect(failed).toBe(true);
  expect(output).toContain("TS2322");
});
