import { expect, test } from "vitest";
import {
  createAjv,
  validateSchema,
  validateWith,
  type SchemaError,
  type SchemaId,
} from "../src/schema.ts";
import { listSchemaFiles } from "../scripts/schema-files.ts";
import { readFixture } from "./fixtures.ts";

const { cases } = readFixture("schema-normalization/cases.json") as {
  cases: { name: string; schema: object; instance: unknown; expected: SchemaError[] }[];
};

test("normalization fixture count", () => {
  expect(cases.length).toBe(7);
});

test.each(cases)("$name", ({ schema, instance, expected }) => {
  const result = validateWith(createAjv().compile(schema), instance);
  expect(result).toEqual({ valid: expected.length === 0, errors: expected });
});

test.each(listSchemaFiles().map((f) => f.id))(
  "canonical schema %s compiles under strict Ajv",
  (id) => {
    expect(() => validateSchema(id as SchemaId, null)).not.toThrow();
  },
);
