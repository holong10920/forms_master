import { lstatSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { brotliCompressSync, constants, gzipSync } from "node:zlib";

export interface Sizes {
  raw: number;
  gzip: number;
  brotli: number;
}
export interface SizeReportFile extends Sizes {
  path: string;
}
export interface DirectorySizes {
  files: SizeReportFile[];
  skippedSymlinks: string[];
  totals: Sizes;
}
export function measureBytes(data: Uint8Array): Sizes {
  return {
    raw: data.length,
    gzip: gzipSync(data, { level: 9 }).length,
    brotli: brotliCompressSync(data, {
      params: {
        [constants.BROTLI_PARAM_QUALITY]: 11,
        [constants.BROTLI_PARAM_SIZE_HINT]: data.length,
      },
    }).length,
  };
}
export function measureDir(dir: string): DirectorySizes {
  const root = resolve(dir);
  if (!lstatSync(root).isDirectory()) throw new Error("expected a plain directory");
  const files: SizeReportFile[] = [];
  const skippedSymlinks: string[] = [];
  function walk(relative: string): void {
    for (const entry of readdirSync(join(root, relative), { withFileTypes: true })) {
      const path = relative ? `${relative}/${entry.name}` : entry.name;
      if (entry.isSymbolicLink()) skippedSymlinks.push(path);
      else if (entry.isDirectory()) walk(path);
      else if (entry.isFile())
        files.push({ path, ...measureBytes(readFileSync(join(root, path))) });
      else throw new Error(`unsupported artifact entry: ${path}`);
    }
  }
  walk("");
  files.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  skippedSymlinks.sort();
  const totals = files.reduce<Sizes>(
    (sum, file) => ({
      raw: sum.raw + file.raw,
      gzip: sum.gzip + file.gzip,
      brotli: sum.brotli + file.brotli,
    }),
    { raw: 0, gzip: 0, brotli: 0 },
  );
  return { files, skippedSymlinks, totals };
}
