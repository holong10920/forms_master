// Deliberately bounded: no source, databases, releases, screenshots or installed runtime tools.
import { existsSync, lstatSync, readdirSync, readFileSync, rmSync, rmdirSync } from "node:fs";
import { join, resolve } from "node:path";
const root = resolve(import.meta.dirname, "../../..");
const apply = process.argv.slice(2).includes("--apply");
if (process.argv.slice(2).some((arg) => arg !== "--apply"))
  throw new Error("usage: clean:local [--apply]");
const entries = [
  ".venv",
  ".tools/uv-cache",
  ".tools/uv-tools",
  ".import_linter_cache",
  ".mypy_cache",
  ".pytest_cache",
  ".ruff_cache",
  ".playwright-cli",
  ".pnpm-store",
  "spikes/compiler-feasibility/gen",
  "spikes/compiler-feasibility/out",
  "spikes/compiler-feasibility/node_modules",
  "spikes/compiler-feasibility/test-results",
];
const modules = join(root, "node_modules/.modules.yaml");
const metadata = existsSync(modules) ? readFileSync(modules, "utf8") : "";
// The obsolete root store is different from the installed node_modules/.pnpm-store.
// Refuse deletion when an installation still identifies the root store as its active store.
const oldStore = join(root, ".pnpm-store");
const storeInUse = metadata.includes('"' + oldStore + "/") || metadata.includes(": " + oldStore);
const report: { path: string; action: string }[] = [];
for (const entry of entries) {
  const path = join(root, entry);
  if (!existsSync(path)) continue;
  if (lstatSync(path).isSymbolicLink())
    throw new Error("Refusing symlink cleanup target: " + entry);
  if (entry === ".pnpm-store" && storeInUse) {
    report.push({ path: entry, action: "kept: active pnpm store" });
    continue;
  }
  if (apply) rmSync(path, { recursive: true });
  report.push({ path: entry, action: apply ? "removed" : "would remove" });
}
if (apply) {
  for (const entry of ["spikes/compiler-feasibility", "spikes"]) {
    const path = join(root, entry);
    if (existsSync(path) && !lstatSync(path).isSymbolicLink() && !readdirSync(path).length)
      rmdirSync(path);
  }
}
console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", entries: report }, null, 2));
