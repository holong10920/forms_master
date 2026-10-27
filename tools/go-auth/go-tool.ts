// Fixed local Go tools used by compiler/tests; no interpreter or shell payload execution.
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  statSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
const root = resolve(import.meta.dirname, "../..");
const prepared = new Set<string>();
function latest(path: string): number {
  if (statSync(path).isFile()) return statSync(path).mtimeMs;
  return Math.max(
    0,
    ...readdirSync(path, { withFileTypes: true })
      .filter((e) => e.isDirectory() || e.name.endsWith(".go"))
      .map((e) => latest(join(path, e.name))),
  );
}
export function goTool(name: "engine-oracle" | "artifact-check"): string {
  if (!["engine-oracle", "artifact-check"].includes(name)) throw Error("E-GO-TOOL");
  const module = join(root, "tools/go-auth"),
    output = join(root, "var/go-auth", name);
  if (!prepared.has(name)) {
    const source = Math.max(
      latest(join(module, "internal")),
      latest(join(module, "cmd")),
      latest(join(module, "go.mod")),
      latest(join(module, "go.sum")),
    );
    if (!existsSync(output) || statSync(output).mtimeMs < source) {
      const work = mkdtempSync(join(tmpdir(), "fm-go-tool-"));
      try {
        const binary = join(work, name);
        execFileSync(join(module, "go-local.sh"), ["build", "-o", binary, "./cmd/" + name], {
          cwd: module,
          stdio: "pipe",
          timeout: 120000,
        });
        mkdirSync(join(root, "var/go-auth"), { recursive: true });
        renameSync(binary, output);
      } finally {
        rmSync(work, { recursive: true, force: true });
      }
    }
    prepared.add(name);
  }
  return output;
}

export function goSubmission(ir: unknown, payload: unknown): unknown {
  const work = mkdtempSync(join(tmpdir(), "fm-go-submission-"));
  try {
    const path = join(work, "ir.json");
    writeFileSync(path, JSON.stringify(ir));
    return JSON.parse(
      execFileSync(goTool("engine-oracle"), ["--ir", path, "--submission"], {
        input: JSON.stringify(payload),
        encoding: "utf8",
        timeout: 30000,
      }),
    );
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}
