import { Ajv2020, type ErrorObject, type ValidateFunction } from "ajv/dist/2020.js";
import { schemas, type SchemaId } from "./generated/schemas.ts";

export type { SchemaId };

export interface SchemaError {
  instancePath: string;
  keyword: string;
}

export interface SchemaResult {
  valid: boolean;
  errors: SchemaError[];
}

/** Draft 2020-12; `format` is annotation only; only own properties count (inherited names such as
 * `toString` are not "present"). Equivalent settings: fb_contracts.schema.build_validator. */
export function createAjv(): Ajv2020 {
  return new Ajv2020({
    strict: true,
    allErrors: true,
    validateFormats: false,
    ownProperties: true,
  });
}

const ajv = createAjv();
const validators = new Map<SchemaId, ValidateFunction>();

function validatorFor(id: SchemaId): ValidateFunction {
  let validate = validators.get(id);
  if (validate === undefined) {
    validate = ajv.compile(schemas[id]);
    validators.set(id, validate);
  }
  return validate;
}

const isAtOrBelow = (path: string, ancestor: string): boolean =>
  path === ancestor || path.startsWith(`${ancestor}/`);

const compareCodeUnits = (a: string, b: string): number => (a === b ? 0 : a < b ? -1 : 1);

/** Normalization contract shared with fb_contracts.schema.normalize_errors. Input: (instancePath,
 * keyword) of every error the validator reports. Drop every error at or below the instance path of
 * a `oneOf` error, except `oneOf` errors that have no `oneOf` error strictly above them; then
 * de-duplicate and sort by UTF-16 code units of (instancePath, keyword). Validators report
 * different detail inside failing `oneOf` branches (notably through `$ref`), so that detail is not
 * part of the contract. */
export function normalizeErrors(errors: readonly SchemaError[]): SchemaError[] {
  const oneOfPaths = errors.filter((e) => e.keyword === "oneOf").map((e) => e.instancePath);
  const kept = errors.filter((e) => {
    const covering = oneOfPaths.filter((p) => isAtOrBelow(e.instancePath, p));
    if (covering.length === 0) return true;
    return e.keyword === "oneOf" && covering.every((p) => p === e.instancePath);
  });
  const unique = new Map(kept.map((e) => [`${e.instancePath}\u0000${e.keyword}`, e]));
  return [...unique.values()]
    .map((e) => ({ instancePath: e.instancePath, keyword: e.keyword }))
    .sort(
      (a, b) =>
        compareCodeUnits(a.instancePath, b.instancePath) || compareCodeUnits(a.keyword, b.keyword),
    );
}

export function normalizeAjvErrors(
  errors: readonly ErrorObject[] | null | undefined,
): SchemaError[] {
  return normalizeErrors(
    (errors ?? []).map((e) => ({ instancePath: e.instancePath, keyword: e.keyword })),
  );
}

export function validateWith(validate: ValidateFunction, instance: unknown): SchemaResult {
  const valid = validate(instance);
  return { valid, errors: valid ? [] : normalizeAjvErrors(validate.errors) };
}

export function validateSchema(id: SchemaId, instance: unknown): SchemaResult {
  return validateWith(validatorFor(id), instance);
}
