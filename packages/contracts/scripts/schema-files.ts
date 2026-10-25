import { readdirSync } from "node:fs";
import { resolve } from "node:path";

export const contractsDir = resolve(import.meta.dirname, "../../../contracts");
export const schemasDir = resolve(contractsDir, "schemas");

const SCHEMA_FILE = /^([a-z0-9-]+)\/v([1-9][0-9]*)\.schema\.json$/;

export interface SchemaFile {
  /** Path relative to contracts/schemas, e.g. "payload-ref/v1.schema.json". */
  relPath: string;
  /** Schema id used by validators, e.g. "payload-ref/v1". */
  id: string;
  name: string;
  version: number;
}

export function parseSchemaPath(relPath: string): SchemaFile | undefined {
  const match = SCHEMA_FILE.exec(relPath);
  if (match?.[1] === undefined || match[2] === undefined) return undefined;
  return { relPath, id: `${match[1]}/v${match[2]}`, name: match[1], version: Number(match[2]) };
}

/** Every *.schema.json under contracts/schemas, sorted by path. Throws on misplaced files. */
export function listSchemaFiles(): SchemaFile[] {
  const files = readdirSync(schemasDir, { recursive: true, encoding: "utf8" })
    .filter((p) => p.endsWith(".schema.json"))
    .map((p) => p.split("\\").join("/"))
    .sort();
  return files.map((relPath) => {
    const parsed = parseSchemaPath(relPath);
    if (parsed === undefined)
      throw new Error(`schema file not at <name>/v<N>.schema.json: ${relPath}`);
    return parsed;
  });
}
