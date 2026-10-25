import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { listSchemaFiles, schemasDir } from "./schema-files.ts";

/** Keyword allowlist of spec #1 section 7.7. `pattern` and `format` are rejected (S0 is stricter
 * than the spec for `format`). */
const KEYWORDS = new Set([
  "type",
  "properties",
  "required",
  "additionalProperties",
  "items",
  "enum",
  "const",
  "minItems",
  "maxItems",
  "minLength",
  "maxLength",
  "minimum",
  "maximum",
  "$ref",
  "$defs",
  "oneOf",
]);
const ANNOTATIONS = new Set(["title", "description", "$comment"]);
const ROOT_ONLY = new Set(["$schema", "$id"]);
const DRAFT_2020_12 = "https://json-schema.org/draft/2020-12/schema";

export interface LintIssue {
  file: string;
  pointer: string;
  keyword: string;
}

const escapePointer = (segment: string): string =>
  segment.replaceAll("~", "~0").replaceAll("/", "~1");

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function visit(
  node: unknown,
  pointer: string,
  file: string,
  issues: LintIssue[],
  allowBoolean: boolean,
): void {
  if (typeof node === "boolean") {
    // Boolean subschemas report different keywords/paths in Ajv and python-jsonschema (CP2 review
    // M1b); only `additionalProperties: <boolean>` is allowed.
    if (!allowBoolean) issues.push({ file, pointer, keyword: "<boolean-schema>" });
    return;
  }
  if (!isRecord(node)) {
    issues.push({ file, pointer, keyword: "<not-a-schema>" });
    return;
  }
  for (const [keyword, value] of Object.entries(node)) {
    const allowed =
      KEYWORDS.has(keyword) ||
      ANNOTATIONS.has(keyword) ||
      (pointer === "" && ROOT_ONLY.has(keyword));
    if (!allowed) {
      issues.push({ file, pointer, keyword });
      continue;
    }
    if (!hasValidShape(keyword, value)) {
      issues.push({ file, pointer, keyword: `<invalid-${keyword}>` });
      continue;
    }
    if (keyword === "required" && Array.isArray(value) && value.includes("__proto__")) {
      issues.push({ file, pointer: `${pointer}/required`, keyword: "<reserved-name>" });
    }
    if ((keyword === "properties" || keyword === "$defs") && isRecord(value)) {
      for (const [name, sub] of Object.entries(value)) {
        visit(sub, `${pointer}/${keyword}/${escapePointer(name)}`, file, issues, false);
      }
    } else if (keyword === "items" || keyword === "additionalProperties") {
      visit(value, `${pointer}/${keyword}`, file, issues, keyword === "additionalProperties");
    } else if (keyword === "oneOf" && Array.isArray(value)) {
      value.forEach((sub, index) => {
        visit(sub, `${pointer}/oneOf/${String(index)}`, file, issues, false);
      });
    }
  }
}

const TYPES = new Set(["null", "boolean", "object", "array", "number", "string", "integer"]);
const isNonNegativeInteger = (v: unknown): boolean => Number.isInteger(v) && (v as number) >= 0;

function hasValidShape(keyword: string, value: unknown): boolean {
  switch (keyword) {
    case "properties":
    case "$defs":
      return isRecord(value);
    case "required":
      return Array.isArray(value) && value.every((v) => typeof v === "string");
    case "enum":
      // Ajv 8 cannot compile an empty enum (KNOWN_DIVERGENCES.json).
      return Array.isArray(value) && value.length > 0;
    case "oneOf":
      return Array.isArray(value) && value.length > 0;
    case "type":
      return (
        (typeof value === "string" && TYPES.has(value)) ||
        (Array.isArray(value) && value.length > 0 && value.every((t) => TYPES.has(t as string)))
      );
    case "$ref":
      // Local references only: no remote retrieval on either runtime (CP2 review MINOR-1).
      return typeof value === "string" && value.startsWith("#");
    case "minItems":
    case "maxItems":
    case "minLength":
    case "maxLength":
      return isNonNegativeInteger(value);
    case "minimum":
    case "maximum":
      return typeof value === "number" && Number.isFinite(value);
    case "title":
    case "description":
    case "$comment":
    case "$schema":
    case "$id":
      return typeof value === "string";
    default:
      return true;
  }
}

/** Reports every object key "__proto__" anywhere in the document (including const/enum values):
 * Ajv mis-handles it and JS object literals turn it into a prototype (CP2 review M3). */
function findReservedKeys(node: unknown, pointer: string, file: string, issues: LintIssue[]): void {
  if (Array.isArray(node)) {
    node.forEach((item, index) => {
      findReservedKeys(item, `${pointer}/${String(index)}`, file, issues);
    });
  } else if (isRecord(node)) {
    for (const [key, value] of Object.entries(node)) {
      const child = `${pointer}/${escapePointer(key)}`;
      if (key === "__proto__") issues.push({ file, pointer: child, keyword: "<reserved-name>" });
      findReservedKeys(value, child, file, issues);
    }
  }
}

/** Lints one schema object. `relPath` is relative to contracts/schemas. */
export function lintSchemaObject(schema: unknown, relPath: string): LintIssue[] {
  const issues: LintIssue[] = [];
  visit(schema, "", relPath, issues, false);
  findReservedKeys(schema, "", relPath, issues);
  if (isRecord(schema)) {
    if (schema.$schema !== DRAFT_2020_12)
      issues.push({ file: relPath, pointer: "", keyword: "$schema" });
    const id = schema.$id;
    const expectedSuffix = `/${relPath}`;
    if (typeof id !== "string" || !id.endsWith(expectedSuffix)) {
      issues.push({ file: relPath, pointer: "", keyword: "$id" });
    }
  }
  return issues;
}

export function lintSchemaFile(contractsDir: string, relPath: string): LintIssue[] {
  const schema: unknown = JSON.parse(
    readFileSync(resolve(contractsDir, "schemas", relPath), "utf8"),
  );
  return lintSchemaObject(schema, relPath);
}

if (import.meta.main) {
  const issues = listSchemaFiles().flatMap((f) =>
    lintSchemaObject(JSON.parse(readFileSync(resolve(schemasDir, f.relPath), "utf8")), f.relPath),
  );
  for (const issue of issues) {
    console.error(
      `${issue.file}#${issue.pointer}: keyword not allowed or invalid: ${issue.keyword}`,
    );
  }
  if (issues.length > 0) process.exit(1);
  console.log(`schemas:lint OK (${String(listSchemaFiles().length)} schema files)`);
}
