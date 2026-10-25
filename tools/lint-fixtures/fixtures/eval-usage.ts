// Negative fixture: must be rejected by the repo ESLint config (no-eval, no-new-func).
export const a: unknown = eval("1");
export const f: unknown = new Function("return 1");
