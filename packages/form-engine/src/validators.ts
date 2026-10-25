import type { EngineField } from "@fb/contracts";
import type { Cell, Issue } from "./model.ts";
export function fieldIssues(f: EngineField, v: Cell | undefined, required: boolean): Issue[] {
  if (required && v === undefined) return [{ code: "required", path: f.id }];
  if (v === undefined) return [];
  const errors: Issue[] = [];
  for (const validator of f.validators ?? []) {
    const limit = validator.params?.value ?? 0;
    let ok = true;
    switch (validator.use) {
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
