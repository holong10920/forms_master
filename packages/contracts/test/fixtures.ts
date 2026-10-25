import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export const contractsDir = resolve(import.meta.dirname, "../../../contracts");

export function readFixture(relativePath: string): unknown {
  return JSON.parse(readFileSync(resolve(contractsDir, "fixtures", relativePath), "utf8"));
}
