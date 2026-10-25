import type { EngineField, EngineIRV1, EngineNode } from "@fb/contracts";
export type Scalar = string | number | boolean;
export type Cell = Scalar | Scalar[];
export interface GroupValue {
  order: string[];
  items: Record<string, Record<string, Cell>>;
}
export type Value = Cell | GroupValue;
export type Values = Readonly<Record<string, Value>>;
export interface Issue {
  code: string;
  path: string;
}
export class EngineError extends Error {
  readonly code: string;
  readonly path: string;
  constructor(code: string, path = "") {
    super(`${code}${path ? ` at ${path}` : ""}`);
    this.code = code;
    this.path = path;
    this.name = "EngineError";
  }
}
export interface State {
  readonly retiredItems?: Readonly<Record<string, readonly string[]>>;
  readonly current: string;
  readonly stateVersion: number;
  readonly values: Values;
  readonly touched: readonly string[];
  readonly attempted: readonly string[];
  readonly errors: readonly Issue[];
  readonly status: "editing" | "pending" | "complete";
  readonly request?: {
    id: string;
    stateVersion: number;
    fingerprint: string;
    kind: "submit" | "validation" | "capability";
    target?: string;
  };
}
export type Event =
  | { type: "commit"; field: string; value: unknown }
  | { type: "next" | "back"; fromStep: string; stateVersion: number }
  | { type: "jumpTo"; to: string; fromStep: string; stateVersion: number }
  | { type: "submitResult"; id: string; fingerprint: string; ok: boolean }
  | { type: "blur"; field: string };
export interface Effect {
  type: "submit" | "cancel";
  id: string;
  fingerprint: string;
}
export interface Snapshot {
  path: string[];
  active: Set<string>;
  effective: Record<string, Value>;
  errors: Issue[];
}
export interface Result {
  state: State;
  effects: Effect[];
}
export function fieldId(ref: string): string {
  if (!ref.startsWith("$local:")) throw new EngineError("E-REF-UNSUPPORTED");
  return ref.slice(7);
}
export function field(ir: EngineIRV1, id: string): EngineNode {
  const found = ir.nodes.find((f) => f.id === id);
  if (!found) throw new EngineError("E-REF-DANGLING", id);
  return found;
}
export const compareIds = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);
export function normalize(value: unknown, f: EngineField): Cell | undefined {
  if (value === null) throw new EngineError("E-PAYLOAD-NULL", f.id);
  if (value === undefined) return undefined;
  if (typeof value === "string") value = value.trim();
  if (value === "" || (Array.isArray(value) && value.length === 0)) return undefined;
  const ok =
    f.type === "number"
      ? typeof value === "number" && Number.isSafeInteger(value)
      : f.type === "boolean"
        ? typeof value === "boolean"
        : f.type === "choice.checkboxes"
          ? Array.isArray(value) &&
            value.every((v: unknown) => typeof v === "string") &&
            new Set(value).size === value.length
          : f.type === "calculated"
            ? typeof value === "string" ||
              typeof value === "boolean" ||
              (typeof value === "number" && Number.isSafeInteger(value))
            : typeof value === "string";
  if (!ok)
    throw new EngineError(
      f.type === "number" && typeof value === "number" && Number.isInteger(value)
        ? "E-NUM-RANGE"
        : "E-TYPE",
      f.id,
    );
  if (
    f.options &&
    (Array.isArray(value) ? value : [value]).some((v) => !f.options?.some((o) => o.value === v))
  )
    throw new EngineError("E-OPTION", f.id);
  return Array.isArray(value) ? [...(value as Scalar[])] : (value as Scalar);
}
