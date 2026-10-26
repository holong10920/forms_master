import { execFileSync } from "node:child_process";
import { createHash, generateKeyPairSync, randomBytes } from "node:crypto";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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
  expect(scanDirectory(dir, true).unresolved).toBe(0);
  const key = "AK" + "IA" + randomBytes(8).toString("hex").toUpperCase();
  const credential = randomBytes(30).toString("base64");
  const { privateKey } = generateKeyPairSync("ed25519", {
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
    publicKeyEncoding: { type: "spki", format: "pem" },
  });
  writeFileSync(
    join(dir, "fixture.txt"),
    `aws_access_key_id = ${key}\npassword = "${credential}"\n${privateKey}`,
  );
  const report = scanDirectory(dir, true);
  expect(report.detectors).toBe(27);
  const types = report.findings.map((f) => f.type);
  expect(types).toContain("AWS Access Key");
  expect(types).toContain("Secret Keyword");
  expect(types).toContain("Private Key");
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

test("only recomputed fixture hashes are classified, tampered values remain findings", () => {
  const dir = scratch();
  const target = join(dir, "contracts/fixtures/digest");
  mkdirSync(target, { recursive: true });
  const file = join(target, "sha256-hex.json");
  cpSync(resolve(import.meta.dirname, "../../../contracts/fixtures/digest/sha256-hex.json"), file);
  const clean = scanDirectory(dir, true);
  expect(clean.findings.some((f) => f.classification === "recomputed-fixture-digest")).toBe(true);
  expect(clean.unresolved).toBe(0);
  const data = JSON.parse(readFileSync(file, "utf8")) as { jcsDigests: { sha256: string }[] };
  const first = data.jcsDigests[0];
  if (!first) throw new Error("missing fixture");
  first.sha256 = randomBytes(32).toString("hex");
  writeFileSync(file, JSON.stringify(data, null, 2));
  expect(scanDirectory(dir, true).unresolved).toBeGreaterThan(0);
}, 30_000);

test("block registry findings require recomputing the pinned fixture bytes", () => {
  const dir = scratch();
  const source = resolve(import.meta.dirname, "../../../contracts/fixtures/blocks");
  const target = join(dir, "contracts/fixtures/blocks");
  mkdirSync(target, { recursive: true });
  cpSync(source, target, { recursive: true });
  const clean = scanDirectory(dir, true);
  expect(clean.unresolved).toBe(0);
  expect(
    clean.findings.filter((f) => f.classification === "recomputed-fixture-digest"),
  ).toHaveLength(2);
  const pin = join(target, "blk_customer_info@r1.json");
  writeFileSync(pin, readFileSync(pin, "utf8") + "\n");
  expect(scanDirectory(dir, true).unresolved).toBe(1);
}, 30_000);

test("public RFC PKCE vectors are classified exactly; a synthetic credential in the same file remains unresolved", () => {
  const dir = scratch(),
    path = join(dir, "tools/local_p0/test");
  mkdirSync(path, { recursive: true });
  const source = readFileSync(
    resolve(import.meta.dirname, "../../local_p0/test/oidc.test.ts"),
    "utf8",
  );
  writeFileSync(join(path, "oidc.test.ts"), source);
  const clean = scanDirectory(dir, true);
  expect(clean.findings.filter((f) => f.classification === "public-rfc7636-vector")).toHaveLength(
    2,
  );
  expect(clean.unresolved).toBe(0);
  writeFileSync(
    join(path, "oidc.test.ts"),
    source + '\npassword = "' + randomBytes(30).toString("base64") + '"\n',
  );
  expect(scanDirectory(dir, true).unresolved).toBeGreaterThan(0);
}, 30000);
