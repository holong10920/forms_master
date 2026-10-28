import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { expect, test } from "vitest";
const version = spawnSync("gitleaks", ["version"], { encoding: "utf8" });
const available = version.status === 0 && version.stdout.trim() === "8.30.1";
const wrapper = resolve(import.meta.dirname, "../gitleaks.sh");
test.skipIf(!available)(
  "Gitleaks detects a generated synthetic AWS credential and accepts clean input (requires CLI 8.30.1)",
  () => {
    const dir = mkdtempSync(join(tmpdir(), "fb-secret-neg-"));
    try {
      writeFileSync(join(dir, "fixture.txt"), "synthetic clean fixture\n");
      expect(spawnSync("sh", [wrapper, dir]).status).toBe(0);
      // Repeating one character falls below the AWS detector's entropy threshold.
      // Keep the fake ID deterministic so detection cannot depend on a random generic-key match.
      const id =
        "AKIA" + Array.from({ length: 16 }, (_, i) => String.fromCharCode(66 + i)).join("");
      const secret = randomBytes(30).toString("base64");
      writeFileSync(
        join(dir, "fixture.txt"),
        `aws_access_key_id = ${id}\naws_secret_access_key = ${secret}\n`,
      );
      // Redacted wrapper output is never printed by this test.
      expect(spawnSync("sh", [wrapper, dir]).status).toBe(1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  },
);
test("missing or incompatible CLI fails the wrapper gate", () => {
  if (available) return;
  expect(spawnSync("sh", [wrapper], { encoding: "utf8" }).status).not.toBe(0);
});
