import { cpSync, mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { cruise, type ICruiseResult, type IConfiguration } from "dependency-cruiser";
import { afterEach, expect, test } from "vitest";

const require = createRequire(import.meta.url);
// CJS config is shared by the CLI and these tests.
const config = require("../../../.dependency-cruiser.cjs") as IConfiguration;
const dirs: string[] = [];
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});
async function inspect(kind: string) {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), "fb-boundaries-")));
  dirs.push(dir);
  cpSync(resolve(import.meta.dirname, "../fixtures", kind), dir, { recursive: true });
  if (kind === "control") {
    mkdirSync(join(dir, "node_modules/@fixture"), { recursive: true });
    symlinkSync(join(dir, "packages/other"), join(dir, "node_modules/@fixture/other"));
  }
  const result = await cruise(["packages"], {
    ...config.options,
    baseDir: dir,
    ruleSet: { forbidden: config.forbidden ?? [] },
    validate: true,
    outputType: "json",
  });
  return typeof result.output === "string"
    ? (JSON.parse(result.output) as ICruiseResult)
    : result.output;
}
test("negative fixtures violate exactly the five named boundary rules", async () => {
  const report = await inspect("violations");
  expect([...new Set(report.summary.violations.map((v) => v.rule.name))].sort()).toEqual([
    "browser-safe-no-node",
    "no-circular",
    "no-relative-cross-package",
    "packages-not-import-tools",
    "src-no-test-fixture-script",
  ]);
  expect(report.modules.flatMap((m) => m.dependencies).filter((d) => d.couldNotResolve)).toEqual(
    [],
  );
});
test("control allows same-package imports and named cross-package imports", async () => {
  const report = await inspect("control");
  expect(report.summary.violations).toEqual([]);
  expect(report.modules.flatMap((m) => m.dependencies).filter((d) => d.couldNotResolve)).toEqual(
    [],
  );
});
