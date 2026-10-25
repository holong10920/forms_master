import { writeFileSync } from "node:fs";
import { measureDir } from "./sizes.ts";

const [command, dir, flag, out, ...rest] = process.argv.slice(2);
if (command !== "sizes" || !dir || flag !== "--out" || !out || rest.length) {
  throw new Error("usage: sizes <dir> --out <file>");
}
const report = {
  tool: "fb-perf-sizes",
  toolVersion: "0.1.0",
  node: process.version,
  zlib: process.versions.zlib,
  brotli: process.versions.brotli,
  settings: { gzipLevel: 9, brotliQuality: 11 },
  measuredAt: new Date().toISOString(),
  ...measureDir(dir),
};
writeFileSync(out, `${JSON.stringify(report, null, 2)}\n`);
