import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { lstatSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join } from "node:path";
import { canonicalJson } from "../../../packages/contracts/src/jcs.ts";

export const SCANNER = "detect-secrets==1.5.0";
interface RawFinding {
  type: string;
  line_number: number;
  hashed_secret: string;
}
interface Baseline {
  version: string;
  plugins_used: { name: string }[];
  results?: Record<string, RawFinding[]>;
}
export interface Finding {
  file: string;
  line: number;
  type: string;
  classification: "unreviewed" | "recomputed-fixture-digest" | "fixed-scan-command";
}
export interface ScanReport {
  scanner: string;
  detectors: number;
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
function fixtureDigests(root: string, file: string): Set<string> {
  const computed = new Set<string>();
  if (file === "contracts/fixtures/jcs/cases.json") {
    const fixture = JSON.parse(readFileSync(join(root, file), "utf8")) as {
      cases: { input: string; canonical?: string }[];
    };
    for (const c of fixture.cases)
      if (c.canonical !== undefined) {
        const value = canonicalJson(JSON.parse(c.input));
        if (value !== c.canonical) throw new Error("fixture canonical mismatch");
        computed.add(hash("sha256", value));
      }
  } else if (file === "contracts/fixtures/digest/sha256-hex.json") {
    const fixture = JSON.parse(readFileSync(join(root, file), "utf8")) as {
      rawDigests: { utf8: string }[];
      jcsDigests: { input: string }[];
    };
    for (const c of fixture.rawDigests) computed.add(hash("sha256", c.utf8));
    for (const c of fixture.jcsDigests)
      computed.add(hash("sha256", canonicalJson(JSON.parse(c.input))));
  }
  return computed;
}
export function scanDirectory(root: string, offline = false): ScanReport {
  const env = {
    ...process.env,
    UV_CACHE_DIR: process.env.UV_CACHE_DIR ?? join(process.cwd(), ".tools/uv-cache"),
    UV_TOOL_DIR: process.env.UV_TOOL_DIR ?? join(process.cwd(), ".tools/uv-tools"),
    UV_TOOL_BIN_DIR: process.env.UV_TOOL_BIN_DIR ?? join(process.cwd(), ".tools/uv-bin"),
  };
  const result = spawnSync(
    "uvx",
    [
      ...(offline ? ["--offline"] : []),
      "--from",
      SCANNER,
      "detect-secrets",
      "scan",
      "--no-verify",
      "--all-files",
      ".",
    ],
    { cwd: root, env, encoding: "utf8", maxBuffer: 16 * 1024 * 1024, timeout: 120_000 },
  );
  if (result.status !== 0)
    throw new Error("detect-secrets could not execute; security gate BLOCKED");
  const baseline = JSON.parse(result.stdout) as Baseline;
  if (
    baseline.version !== "1.5.0" ||
    baseline.plugins_used.length !== 27 ||
    new Set(baseline.plugins_used.map((p) => p.name)).size !== 27 ||
    !baseline.results
  )
    throw new Error("unexpected scanner coverage");
  const findings: Finding[] = [];
  for (const [file, matches] of Object.entries(baseline.results)) {
    safePath(file);
    const lines = readFileSync(join(root, file), "utf8").split(/\r?\n/);
    const digests = fixtureDigests(root, file);
    for (const finding of matches) {
      let classification: Finding["classification"] = "unreviewed";
      const line = lines[finding.line_number - 1] ?? "";
      const digest = /^\s*"sha256": "([a-f0-9]{64})",?\s*$/.exec(line)?.[1];
      if (
        finding.type === "Hex High Entropy String" &&
        digest &&
        digests.has(digest) &&
        hash("sha1", digest) === finding.hashed_secret
      )
        classification = "recomputed-fixture-digest";
      const command = "node tools/security/src/secrets.ts";
      if (
        file === "package.json" &&
        finding.type === "Secret Keyword" &&
        line.trim() === `"secrets": "${command}",` &&
        hash("sha1", command) === finding.hashed_secret
      )
        classification = "fixed-scan-command";
      findings.push({ file, line: finding.line_number, type: finding.type, classification });
    }
  }
  return {
    scanner: SCANNER,
    detectors: 27,
    files: 0,
    findings,
    unresolved: findings.filter((f) => f.classification === "unreviewed").length,
  };
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
