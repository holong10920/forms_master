import { describe, expect, test } from "vitest";
import { lintSchemaFile, lintSchemaObject } from "../scripts/lint-schemas.ts";
import { contractsDir } from "./fixtures.ts";

const root = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://schemas.forms-poc.invalid/demo/v1.schema.json",
};

describe("schema keyword allowlist", () => {
  test("rejects pattern", () => {
    const issues = lintSchemaObject(
      { ...root, type: "object", properties: { a: { type: "string", pattern: "^x$" } } },
      "demo/v1.schema.json",
    );
    expect(issues).toEqual([
      { file: "demo/v1.schema.json", pointer: "/properties/a", keyword: "pattern" },
    ]);
  });

  test("rejects format", () => {
    const issues = lintSchemaObject(
      { ...root, type: "string", format: "email" },
      "demo/v1.schema.json",
    );
    expect(issues.map((i) => i.keyword)).toEqual(["format"]);
  });

  test("property named pattern is not a keyword", () => {
    const issues = lintSchemaObject(
      { ...root, type: "object", properties: { pattern: { type: "string" } } },
      "demo/v1.schema.json",
    );
    expect(issues).toEqual([]);
  });

  test("checks nested oneOf, items, $defs and additionalProperties schemas", () => {
    const issues = lintSchemaObject(
      {
        ...root,
        $defs: { d: { type: "string", pattern: "a" } },
        type: "array",
        items: { oneOf: [{ const: 1 }, { type: "string", format: "date" }] },
        additionalProperties: { type: "string", unevaluatedProperties: false },
      },
      "demo/v1.schema.json",
    );
    expect(issues.map((i) => `${i.pointer} ${i.keyword}`).sort()).toEqual([
      "/$defs/d pattern",
      "/additionalProperties unevaluatedProperties",
      "/items/oneOf/1 format",
    ]);
  });

  test("root $schema must be draft 2020-12 and $id must match the file path", () => {
    const issues = lintSchemaObject(
      {
        $schema: "http://json-schema.org/draft-07/schema#",
        $id: "https://x.invalid/other/v2.schema.json",
      },
      "demo/v1.schema.json",
    );
    expect(issues.map((i) => i.keyword).sort()).toEqual(["$id", "$schema"]);
  });

  test("rejects empty enum and __proto__ property names (Ajv divergences)", () => {
    const issues = lintSchemaObject(
      JSON.parse(
        JSON.stringify(root).slice(0, -1) +
          ',"type":"object","properties":{"__proto__":{"type":"number"},"e":{"enum":[]}},"required":["__proto__"]}',
      ),
      "demo/v1.schema.json",
    );
    expect(issues.map((i) => `${i.pointer} ${i.keyword}`).sort()).toEqual([
      "/properties/__proto__ <reserved-name>",
      "/properties/e <invalid-enum>",
      "/required <reserved-name>",
    ]);
  });

  test("rejects __proto__ keys anywhere, including const values", () => {
    const schema = JSON.parse(
      JSON.stringify(root).slice(0, -1) +
        ',"type":"object","properties":{"opt":{"const":{"__proto__":1}}}}',
    ) as unknown;
    expect(lintSchemaObject(schema, "demo/v1.schema.json")).toEqual([
      {
        file: "demo/v1.schema.json",
        pointer: "/properties/opt/const/__proto__",
        keyword: "<reserved-name>",
      },
    ]);
  });

  test("boolean subschemas are allowed only for additionalProperties", () => {
    const issues = lintSchemaObject(
      {
        ...root,
        type: "object",
        properties: { x: false },
        items: true,
        additionalProperties: false,
      },
      "demo/v1.schema.json",
    );
    expect(issues.map((i) => `${i.pointer} ${i.keyword}`).sort()).toEqual([
      "/items <boolean-schema>",
      "/properties/x <boolean-schema>",
    ]);
    expect(lintSchemaObject(true, "demo/v1.schema.json").map((i) => i.keyword)).toContain(
      "<boolean-schema>",
    );
  });

  test("rejects malformed keyword values and remote $ref", () => {
    const issues = lintSchemaObject(
      {
        ...root,
        properties: [1],
        oneOf: { a: { pattern: "x" } },
        required: "x",
        $defs: 5,
        $ref: "https://example.invalid/other.json",
        type: "text",
        minLength: -1,
      },
      "demo/v1.schema.json",
    );
    expect(issues.map((i) => i.keyword).sort()).toEqual([
      "<invalid-$defs>",
      "<invalid-$ref>",
      "<invalid-minLength>",
      "<invalid-oneOf>",
      "<invalid-properties>",
      "<invalid-required>",
      "<invalid-type>",
    ]);
  });

  test("canonical payload-ref schema is clean", () => {
    expect(lintSchemaFile(contractsDir, "payload-ref/v1.schema.json")).toEqual([]);
  });
});

test("only fixed host token patterns are permitted in their exact schema locations", () => {
  const schema = {
    ...root,
    $id: "https://schemas.forms-poc.invalid/form-definition/v1.schema.json",
    type: "object",
    $defs: {
      Appearance: {
        type: "object",
        properties: { color: { type: "string", pattern: "^#[a-fA-F0-9]{6}$" } },
      },
    },
  };
  expect(lintSchemaObject(schema, "form-definition/v1.schema.json")).toEqual([]);
  expect(
    lintSchemaObject(schema, "untrusted/v1.schema.json").some((i) => i.keyword === "pattern"),
  ).toBe(true);
  schema.$defs.Appearance.properties.color.pattern = ".*";
  expect(
    lintSchemaObject(schema, "form-definition/v1.schema.json").some((i) => i.keyword === "pattern"),
  ).toBe(true);
});
