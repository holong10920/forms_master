import { lstatSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

export interface Finding {
  file: string;
  line: number;
  rule: "email-domain";
}
export function checkSyntheticData(rootDir: string): Finding[] {
  const findings: Finding[] = [];
  function visit(path: string): void {
    const stat = lstatSync(path);
    if (stat.isSymbolicLink())
      throw new Error(`symlink not allowed in synthetic fixtures: ${path}`);
    if (stat.isDirectory()) {
      for (const name of readdirSync(path).sort()) visit(join(path, name));
    } else if (stat.isFile()) {
      const content = readFileSync(path);
      if (content.includes(0)) throw new Error(`binary fixture cannot be checked: ${path}`);
      for (const [index, line] of content.toString("utf8").split(/\r?\n/).entries()) {
        for (const match of line.matchAll(
          /[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@([A-Z0-9.-]+\.[A-Z]{2,})/gi,
        )) {
          const domain = match[1]?.toLowerCase() ?? "";
          if (
            !["example.com", "example.jp", "example.org"].includes(domain) &&
            !/\.(invalid|test|example)$/.test(domain)
          ) {
            findings.push({ file: path, line: index + 1, rule: "email-domain" });
          }
        }
      }
    } else throw new Error(`unsupported fixture entry: ${path}`);
  }
  visit(resolve(rootDir));
  return findings;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const roots = process.argv.slice(2);
  if (!roots.length) throw new Error("usage: synthetic-data-check.ts <dir>...");
  const findings = roots.flatMap(checkSyntheticData);
  // Never print matched values (potential PII).
  console.log(JSON.stringify({ findings }, null, 2));
  if (findings.length) process.exitCode = 1;
}
