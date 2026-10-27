import { execFileSync } from "node:child_process";
import { createHash, generateKeyPairSync, randomBytes } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, expect, test } from "vitest";
import { exportSnapshot, scanDirectory } from "../src/scan.ts";
const dirs: string[] = [];
function scratch() {
  const dir = mkdtempSync(join(tmpdir(), "fb-secret-fixture-"));
  dirs.push(dir);
  return dir;
}
afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});
test("pinned scanner accepts clean input and detects generated synthetic credentials/private key offline", () => {
  const dir = scratch();
  writeFileSync(join(dir, "fixture.txt"), "synthetic clean content\n");
  expect(scanDirectory(dir).unresolved).toBe(0);
  const key =
    "AK" +
    "IA" +
    Array.from(randomBytes(16), (n) => "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"[n % 32]).join("");
  const credential = randomBytes(30).toString("base64");
  const { privateKey } = generateKeyPairSync("ed25519", {
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
    publicKeyEncoding: { type: "spki", format: "pem" },
  });
  writeFileSync(
    join(dir, "fixture.txt"),
    `aws_access_key_id = ${key}\npassword = "${credential}"\n${privateKey}`,
  );
  const report = scanDirectory(dir);
  expect(report.scanner).toBe("gitleaks==8.30.1");
  const types = report.findings.map((f) => f.type);
  expect(types).toContain("aws-access-token");
  expect(types).toContain("generic-api-key");
  expect(types).toContain("private-key");
  expect(report.unresolved).toBeGreaterThanOrEqual(3);
  expect(JSON.stringify(report)).not.toContain(key);
  expect(JSON.stringify(report)).not.toContain(credential);
}, 30_000);
test("index export remains distinct from working-tree content without Git mutations", () => {
  const repo = resolve(import.meta.dirname, "../../..");
  const working = scratch();
  const index = scratch();
  const a = exportSnapshot(repo, ["package.json"], false, working);
  const b = exportSnapshot(repo, ["package.json"], true, index);
  const indexBytes = execFileSync("git", ["show", ":package.json"], { cwd: repo });
  expect(b["package.json"]).toBe(createHash("sha256").update(indexBytes).digest("hex"));
  expect(a["package.json"]).toBe(
    createHash("sha256")
      .update(readFileSync(join(repo, "package.json")))
      .digest("hex"),
  );
});
test("snapshot rejects path traversal", () => {
  const dir = scratch();
  mkdirSync(join(dir, "out"));
  expect(() => exportSnapshot(dir, ["../outside"], false, join(dir, "out"))).toThrow("unsafe");
});

test("fixed RFC vectors do not hide credentials in the same file", () => {
  const dir = scratch();
  const file = join(dir, "fixture.ts");
  const source = 'const publicPkce = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";\n';
  writeFileSync(file, source);
  expect(scanDirectory(dir).unresolved).toBe(0);
  writeFileSync(file, source + 'const api_key = "' + randomBytes(30).toString("base64") + '";\n');
  expect(scanDirectory(dir).unresolved).toBeGreaterThan(0);
});
