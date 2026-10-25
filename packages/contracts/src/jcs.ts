import canonicalize from "canonicalize";

/** RFC 8785 (JCS) canonical JSON. Serialization is delegated to `canonicalize`; this module only
 * enforces the S0 value domain so that TS and Python accept and reject the same inputs. */

const MAX_SAFE_MAGNITUDE = Number.MAX_SAFE_INTEGER; // 2^53 - 1
/** Maximum container nesting (root container = depth 1). Same limit in fb_contracts.jcs. */
export const MAX_DEPTH = 128;

export class JcsError extends Error {
  readonly code = "E-JCS-UNSUPPORTED-VALUE";

  constructor(message: string) {
    super(message);
    this.name = "JcsError";
  }
}

function assertSupported(value: unknown, path: string, depth: number): void {
  if (value === null || typeof value === "boolean") return;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new JcsError(`non-finite number at ${path}`);
    if (Math.abs(value) > MAX_SAFE_MAGNITUDE)
      throw new JcsError(`number outside ±(2^53-1) at ${path}`);
    return;
  }
  if (typeof value === "string") {
    if (!value.isWellFormed()) throw new JcsError(`lone surrogate in string at ${path}`);
    return;
  }
  if (Array.isArray(value)) {
    if (depth >= MAX_DEPTH)
      throw new JcsError(`nesting deeper than ${String(MAX_DEPTH)} at ${path}`);
    // Plain arrays only: no subclass, no holes, no extra own keys (enumerable or not), so that no
    // toJSON can be honoured by canonicalize.
    if (
      Object.getPrototypeOf(value) !== Array.prototype ||
      Object.keys(value).length !== value.length ||
      Reflect.ownKeys(value).length !== value.length + 1 // + "length"
    ) {
      throw new JcsError(`non-plain array at ${path}`);
    }
    for (let index = 0; index < value.length; index += 1) {
      assertSupported(value[index], `${path}/${String(index)}`, depth + 1);
    }
    return;
  }
  if (typeof value === "object") {
    if (depth >= MAX_DEPTH)
      throw new JcsError(`nesting deeper than ${String(MAX_DEPTH)} at ${path}`);
    const proto: unknown = Object.getPrototypeOf(value);
    if (
      (proto !== Object.prototype && proto !== null) ||
      Reflect.ownKeys(value).length !== Object.keys(value).length // non-enumerable or symbol keys
    ) {
      throw new JcsError(`non-plain object at ${path}`);
    }
    for (const [key, item] of Object.entries(value)) {
      if (!key.isWellFormed()) throw new JcsError(`lone surrogate in key at ${path}`);
      assertSupported(item, `${path}/${key}`, depth + 1);
    }
    return;
  }
  throw new JcsError(`unsupported ${typeof value} at ${path}`);
}

export function canonicalJson(value: unknown): string {
  assertSupported(value, "", 0);
  const out = canonicalize(value);
  if (out === undefined) throw new JcsError("value has no JSON representation");
  return out;
}

export function canonicalJsonBytes(value: unknown): Uint8Array<ArrayBuffer> {
  return new TextEncoder().encode(canonicalJson(value));
}
