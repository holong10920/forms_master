import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export function assertToolchain(node: string, pnpm: string): void {
  if (node !== "24.22.1")
    throw new Error("Node 24.22.1 required; put the Volta shim first in PATH");
  if (pnpm !== "12.15.0") throw new Error("pnpm 12.15.0 required; use project Corepack shim");
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const root = resolve(import.meta.dirname, "../../..");
  const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8")) as {
    packageManager: string;
    volta: { node: string };
  };
  if (
    pkg.packageManager !== "pnpm@12.15.0" ||
    pkg.volta.node !== "24.22.1" ||
    readFileSync(resolve(root, ".node-version"), "utf8").trim() !== "24.22.1"
  )
    throw new Error("toolchain pins drifted");
  const pnpm = execFileSync("pnpm", ["--version"], {
    cwd: root,
    encoding: "utf8",
    timeout: 30_000,
  }).trim();
  assertToolchain(process.versions.node, pnpm);
  console.log(`preflight PASS: Node ${process.versions.node}, pnpm ${pnpm}`);
}
