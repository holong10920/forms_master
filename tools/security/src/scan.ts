import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join, resolve, relative } from "node:path";

export const SCANNER = "gitleaks==8.30.1";
export interface Finding {
  file: string;
  line: number;
  type: string;
  classification:
    "unreviewed" | "recomputed-fixture-digest" | "fixed-scan-command" | "public-rfc7636-vector";
}
export interface ScanReport {
  scanner: string;
  detectors: null;
  files: number;
  findings: Finding[];
  unresolved: number;
}
const hash = (algorithm: string, value: string | Buffer): string =>
  createHash(algorithm).update(value).digest("hex");

export function relevant(path: string): boolean {
  return (
    !path.startsWith("docs/") &&
    !path.startsWith("contracts/vendor/") &&
    !["pnpm-lock.yaml", "uv.lock", "CLAUDE.md"].includes(path)
  );
}
function safePath(path: string): void {
  if (isAbsolute(path) || path.split("/").some((p) => !p || p === "." || p === ".."))
    throw new Error("unsafe source path");
}
function paths(root: string, args: string[]): string[] {
  return [
    ...new Set(
      execFileSync("git", args, { cwd: root, encoding: "utf8" }).split("\0").filter(Boolean),
    ),
  ].sort();
}
export function sourcePaths(root: string): {
  index: string[];
  working: string[];
  staged: string[];
} {
  const index = paths(root, ["ls-files", "--cached", "-z"]).filter(relevant);
  const untracked = paths(root, ["ls-files", "--others", "--exclude-standard", "-z"]).filter(
    (p) => relevant(p) && !p.startsWith("spikes/"),
  );
  const staged = paths(root, ["diff", "--cached", "--name-only", "--diff-filter=ACMR", "-z"]);
  return {
    index: [...new Set([...index, ...staged])].sort(),
    working: [...new Set([...index, ...untracked])].sort(),
    staged,
  };
}
export function exportSnapshot(
  root: string,
  selected: string[],
  index: boolean,
  target: string,
): Record<string, string> {
  const manifest: Record<string, string> = {};
  for (const path of selected) {
    safePath(path);
    let data: Buffer;
    if (index)
      data = execFileSync("git", ["show", `:${path}`], { cwd: root, maxBuffer: 32 * 1024 * 1024 });
    else {
      let missing = false;
      const parts = path.split("/");
      for (let i = 1; i <= parts.length; i++) {
        try {
          if (lstatSync(join(root, ...parts.slice(0, i))).isSymbolicLink())
            throw new Error("source symlink refused");
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code === "ENOENT") {
            missing = true;
            break;
          }
          throw error;
        }
      }
      if (missing) continue; // Deleted working files are still covered by the index snapshot.
      data = readFileSync(join(root, path));
    }
    const dest = join(target, path);
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, data);
    manifest[path] = hash("sha256", data);
  }
  return manifest;
}
export function scanDirectory(root: string): ScanReport {
  const project = resolve(import.meta.dirname, "../../..");
  const bundled = join(project, ".tools/bin/gitleaks");
  const bin = process.env.FB_GITLEAKS_BIN ?? (existsSync(bundled) ? bundled : "gitleaks");
  const version = spawnSync(bin, ["version"], { encoding: "utf8" });
  if (version.status !== 0 || version.stdout.trim() !== "8.30.1")
    throw Error("Gitleaks 8.30.1 required; security gate BLOCKED");
  // Findings stay in memory; only path/line/rule are returned, never Match/Secret.
  const scan = spawnSync(
    bin,
    [
      "dir",
      root,
      "--config",
      join(project, ".gitleaks.toml"),
      "--no-banner",
      "--log-level",
      "fatal",
      "--report-format",
      "json",
      "--report-path",
      "-",
    ],
    { encoding: "utf8", maxBuffer: 16 * 1024 * 1024, timeout: 120000 },
  );
  if (scan.status !== 0 && scan.status !== 1)
    throw Error("Gitleaks could not execute; security gate BLOCKED");
  const raw = JSON.parse(scan.stdout || "[]") as {
    File: string;
    StartLine: number;
    RuleID: string;
    Secret: string;
  }[];
  const findings: Finding[] = raw.map((f) => {
    const file = isAbsolute(f.File) ? relative(root, f.File) : f.File;
    safePath(file);
    return { file, line: f.StartLine, type: f.RuleID, classification: "unreviewed" };
  });
  return { scanner: SCANNER, detectors: null, files: 0, findings, unresolved: findings.length };
}
export function scanRepository(root: string) {
  const selected = sourcePaths(root);
  const temp = mkdtempSync(join(tmpdir(), "fb-secret-snapshot-"));
  try {
    const working = join(temp, "working");
    const index = join(temp, "index");
    mkdirSync(working);
    mkdirSync(index);
    const workingManifest = exportSnapshot(root, selected.working, false, working);
    const indexManifest = exportSnapshot(root, selected.index, true, index);
    const workingReport = scanDirectory(working);
    workingReport.files = Object.keys(workingManifest).length;
    const indexReport = scanDirectory(index);
    indexReport.files = Object.keys(indexManifest).length;
    return {
      working: workingReport,
      index: indexReport,
      stagedFiles: selected.staged.length,
      stagedCovered: selected.staged.every((p) => p in indexManifest),
      manifests: { working: workingManifest, index: indexManifest },
      exclusions: [
        "docs (governance/evidence, not source)",
        "contracts/vendor (third party)",
        "lockfiles",
        "CLAUDE.md",
        "untracked spikes and Git-ignored files",
      ],
    };
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
}
