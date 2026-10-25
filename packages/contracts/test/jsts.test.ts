import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Ajv2020 } from "ajv/dist/2020.js";
import { describe, expect, test } from "vitest";
import { contractsDir } from "./fixtures.ts";

interface SuiteGroup {
  description: string;
  schema: unknown;
  tests: { description: string; data: unknown; valid: boolean }[];
}
interface Skip {
  file: string;
  group: string;
  test: string | null;
  reason: string;
}

const suiteDir = resolve(contractsDir, "vendor/json-schema-test-suite");
const skips = JSON.parse(readFileSync(resolve(suiteDir, "SKIPS.json"), "utf8")) as Skip[];
// Documented Ajv divergences: run as expected failures so a fixed Ajv turns the run red for review.
const divergences = (
  JSON.parse(readFileSync(resolve(suiteDir, "KNOWN_DIVERGENCES.json"), "utf8")) as Skip[]
).filter((d) => (d as Skip & { runtime: string }).runtime === "ts-ajv");
const files = readdirSync(resolve(suiteDir, "tests/draft2020-12")).sort();

const matches = (list: Skip[], file: string, group: string, name: string): boolean =>
  list.some((s) => s.file === file && s.group === group && (s.test === null || s.test === name));

test("subset has 16 keyword files", () => {
  expect(files.length).toBe(16);
});

for (const file of files) {
  const groups = JSON.parse(
    readFileSync(resolve(suiteDir, "tests/draft2020-12", file), "utf8"),
  ) as SuiteGroup[];
  describe(file, () => {
    for (const group of groups) {
      describe(group.description, () => {
        // Same options as src/schema.ts except strict: strict mode only checks schemas at compile
        // time (e.g. strictTypes) and does not change validation results.
        const ajv = new Ajv2020({
          strict: false,
          allErrors: true,
          validateFormats: false,
          ownProperties: true,
        });
        for (const t of group.tests) {
          const run = matches(skips, file, group.description, t.description)
            ? test.skip
            : matches(divergences, file, group.description, t.description)
              ? test.fails
              : test;
          run(t.description, () => {
            const validate = ajv.compile(group.schema as object);
            expect(validate(t.data)).toBe(t.valid);
          });
        }
      });
    }
  });
}
