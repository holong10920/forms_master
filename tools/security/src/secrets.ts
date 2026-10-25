import { resolve } from "node:path";
import { scanRepository } from "./scan.ts";
const report = scanRepository(resolve(import.meta.dirname, "../../.."));
// Manifests contain only paths and hashes; no detector output values are exposed.
console.log(JSON.stringify(report, null, 2));
if (!report.stagedCovered || report.working.unresolved || report.index.unresolved)
  process.exitCode = 1;
