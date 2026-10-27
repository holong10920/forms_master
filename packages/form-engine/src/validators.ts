declare const __FB_FORMATS__: boolean;
import { validFormat } from "./formats.ts";
import type { EngineField, EngineIRV1 } from "@fb/contracts";
import { evaluate, type Read } from "./expression.ts";
import { EngineError } from "./model.ts";
import type { Cell, Issue } from "./model.ts";
export function assertAvailable(
  f: EngineField,
  value: Cell | undefined,
  read: Read,
  conditions: EngineIRV1["conditions"],
): void {
  if (value === undefined) return;
  const selected = Array.isArray(value) ? value : [value];
  if (
    f.options?.some(
      (o) =>
        selected.includes(o.value) &&
        o.availableWhen &&
        evaluate(o.availableWhen, read, conditions) !== true,
    )
  )
    throw new EngineError("E-OPTION-UNAVAILABLE", f.id);
}
export function fieldIssues(f: EngineField, v: Cell | undefined, required: boolean): Issue[] {
  if (required && v === undefined) return [{ code: "required", path: f.id }];
  if (v === undefined) return [];
  const errors: Issue[] = [];
  for (const validator of f.validators ?? []) {
    const limit = validator.params?.value ?? 0;
    let ok = true;
    switch (validator.use) {
      case "formatEmail":
      case "formatPhoneJP":
      case "formatPostalJP":
      case "formatKatakana":
      case "formatDate":
        ok =
          typeof __FB_FORMATS__ === "undefined" || __FB_FORMATS__
            ? validFormat(validator.use, v)
            : false;
        break;
      case "required":
        break;
      case "mustBeTrue":
        ok = v === true;
        break;
      case "minLength":
        ok = typeof v === "string" && Array.from(v).length >= limit;
        break;
      case "maxLength":
        ok = typeof v === "string" && Array.from(v).length <= limit;
        break;
      case "min":
        ok = typeof v === "number" && v >= limit;
        break;
      case "max":
        ok = typeof v === "number" && v <= limit;
        break;
      case "minItems":
        ok = Array.isArray(v) && v.length >= limit;
        break;
      case "maxItems":
        ok = Array.isArray(v) && v.length <= limit;
        break;
      case "exclusiveOption":
        ok =
          !Array.isArray(v) ||
          v.length <= 1 ||
          !f.options?.some((o) => o.exclusive && v.includes(o.value));
        break;
    }
    if (!ok) errors.push({ code: validator.use, path: f.id });
  }
  return errors;
}
