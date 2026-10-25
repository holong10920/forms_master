import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import {
  brotliDecompressSync,
  gunzipSync,
  brotliCompressSync,
  gzipSync,
  constants,
} from "node:zlib";
import { afterEach, expect, test } from "vitest";
import { measureBytes, measureDir } from "../src/sizes.ts";

const scratch: string[] = [];
afterEach(() => {
  for (const path of scratch.splice(0)) rmSync(path, { recursive: true, force: true });
});
function fixture(): string {
  const dir = mkdtempSync(join(tmpdir(), "fb-sizes-"));
  scratch.push(dir);
  mkdirSync(join(dir, "a"));
  writeFileSync(join(dir, "b.js"), "a".repeat(1000));
  writeFileSync(join(dir, "a/c.css"), "");
  symlinkSync(join(dir, "b.js"), join(dir, "link.js"));
  symlinkSync(dir, join(dir, "loop"));
  return dir;
}
test("sizes are deterministic, sorted, with symlinks listed but never followed", () => {
  const dir = fixture();
  const report = measureDir(dir);
  expect(report).toEqual(measureDir(dir));
  expect(report.files.map((f) => f.path)).toEqual(["a/c.css", "b.js"]);
  expect(report.files.map((f) => f.raw)).toEqual([0, 1000]);
  expect(report.files.every((f) => f.gzip > 0 && f.brotli > 0)).toBe(true);
  expect(report.skippedSymlinks).toEqual(["link.js", "loop"]);
  expect(report.totals.raw).toBe(1000);
  expect(report.totals.gzip).toBe(report.files.reduce((n, f) => n + f.gzip, 0));
});
test("compression settings measure actual round-trippable bytes", () => {
  const data = Buffer.from("synthetic fixture ".repeat(100));
  const gzip = gzipSync(data, { level: 9 });
  const brotli = brotliCompressSync(data, {
    params: {
      [constants.BROTLI_PARAM_QUALITY]: 11,
      [constants.BROTLI_PARAM_SIZE_HINT]: data.length,
    },
  });
  expect(measureBytes(data)).toEqual({
    raw: data.length,
    gzip: gzip.length,
    brotli: brotli.length,
  });
  expect(gunzipSync(gzip)).toEqual(data);
  expect(brotliDecompressSync(brotli)).toEqual(data);
});
test("CLI writes versioned report and metadata", () => {
  const dir = fixture();
  const out = join(dir, "../", `${dir.split("/").at(-1) ?? "report"}.json`);
  scratch.push(out);
  execFileSync(process.execPath, [
    resolve(import.meta.dirname, "../src/cli.ts"),
    "sizes",
    dir,
    "--out",
    out,
  ]);
  const report: unknown = JSON.parse(readFileSync(out, "utf8"));
  expect(report).toMatchObject({
    tool: "fb-perf-sizes",
    settings: { gzipLevel: 9, brotliQuality: 11 },
    totals: { raw: 1000 },
  });
});
