import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  createSession,
  EngineError,
  loadDefinition,
  payloadPreview,
  snapshot,
  validation,
  type Values,
} from "@fb/form-engine";
import type { EngineIRV1 } from "@fb/contracts";
export interface Case {
  name: string;
  definition: string;
  current?: string;
  values: Values;
  expected?: unknown;
}
const root = resolve(import.meta.dirname, "../../..");
export function fixtureIR(name: string): EngineIRV1 {
  if (!["pc", "calculated", "groups", "canonical"].includes(name))
    throw new Error("unknown trusted fixture");
  const value: unknown = JSON.parse(
    readFileSync(join(root, `contracts/fixtures/engine/${name}.json`), "utf8"),
  );
  return loadDefinition(value);
}
export function evaluateCase(ir: EngineIRV1, c: Case): unknown {
  try {
    const initial = createSession(ir, c.values);
    const state = { ...initial, current: c.current ?? initial.current };
    const v = snapshot(ir, state);
    return {
      path: v.path,
      active: [...v.active].sort(),
      errors: validation(ir, state, true),
      payload: payloadPreview(ir, state),
    };
  } catch (error) {
    if (!(error instanceof EngineError)) throw error;
    return { error: { code: error.code, path: error.path } };
  }
}
export function pythonCases(ir: EngineIRV1, cases: Case[]): unknown[] {
  const dir = mkdtempSync(join(tmpdir(), "fb-engine-parity-"));
  try {
    const file = join(dir, "ir.json");
    writeFileSync(file, JSON.stringify(ir));
    const output = execFileSync(
      "uv",
      [
        "run",
        "--locked",
        "--offline",
        "python",
        join(root, "tools/engine-demo/adapter.py"),
        "--ir",
        file,
      ],
      {
        cwd: root,
        input: JSON.stringify(cases),
        encoding: "utf8",
        maxBuffer: 8 * 1024 * 1024,
        timeout: 30_000,
      },
    );
    return JSON.parse(output) as unknown[];
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
export function goldenCases(): Case[] {
  return (
    JSON.parse(readFileSync(join(root, "contracts/fixtures/engine/golden.json"), "utf8")) as {
      cases: Case[];
    }
  ).cases;
}
export function seededCases(): Case[] {
  let seed = 20261025;
  const next = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed;
  };
  return Array.from({ length: 200 }, (_, i) => ({
    name: `seed-20261025-${String(i)}`,
    definition: "calculated",
    current: "stp_review",
    values: {
      fld_a: (next() % 1000) - 500,
      fld_b: (next() % 1000) - 500,
      fld_flag: next() % 2 === 0,
      ...(i % 3 === 0 ? { fld_label: ["\u{20bb7}", "\ufa30", "\ufeffx\ufeff"][i % 3] ?? "x" } : {}),
      ...(i % 5 === 0 ? { fld_choices: ["a", "b"] } : {}),
    },
  }));
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const cases = [...goldenCases(), ...seededCases()];
  let count = 0;
  for (const name of ["pc", "calculated", "groups", "canonical"]) {
    const selected = cases.filter((c) => c.definition === name);
    const ir = fixtureIR(name);
    const ts = selected.map((c) => evaluateCase(ir, c));
    const py = pythonCases(ir, selected);
    // Object key order is not part of semantic parity.
    const stable = (v: unknown): unknown =>
      Array.isArray(v)
        ? v.map(stable)
        : v !== null && typeof v === "object"
          ? Object.fromEntries(
              Object.entries(v)
                .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
                .map(([k, x]) => [k, stable(x)]),
            )
          : v;
    if (JSON.stringify(stable(ts)) !== JSON.stringify(stable(py)))
      throw new Error(`semantic parity failed (${name})`);
    count += selected.length;
  }
  console.log(
    JSON.stringify({
      parity: "PASS",
      cases: count,
      seed: 20261025,
      node: process.version,
      icu: process.versions.icu,
      unicode: process.versions.unicode,
      python: JSON.parse(
        execFileSync(
          "uv",
          [
            "run",
            "--locked",
            "--offline",
            "python",
            "-c",
            'import json,sys,unicodedata; print(json.dumps({"version": sys.version.split()[0], "unicode": unicodedata.unidata_version}))',
          ],
          { cwd: root, encoding: "utf8", timeout: 30000 },
        ),
      ) as unknown,
    }),
  );
}
