import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { validateSchema } from "../src/schema.ts";
import { contractsDir, readFixture } from "./fixtures.ts";

interface SchemaFixture {
  description: string;
  instance: unknown;
  expected: { valid: boolean; errors: { instancePath: string; keyword: string }[] };
}

const fixtureDir = resolve(contractsDir, "fixtures/schema/payload-ref/v1");
const files = ["valid", "invalid"].flatMap((kind) =>
  readdirSync(resolve(fixtureDir, kind))
    .filter((f) => f.endsWith(".json"))
    .map((f) => `schema/payload-ref/v1/${kind}/${f}`),
);

describe("payload-ref/v1 schema fixtures", () => {
  test("fixture count", () => {
    expect(files.length).toBe(9);
  });

  for (const file of files) {
    test(file, () => {
      const fixture = readFixture(file) as SchemaFixture;
      expect(validateSchema("payload-ref/v1", fixture.instance)).toEqual(fixture.expected);
    });
  }
});
