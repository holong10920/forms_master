import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { expect, test } from "vitest";
test("CLI branch demo is runnable and redacts ephemeral fields", () => {
  const out = execFileSync(
    process.execPath,
    [resolve(import.meta.dirname, "../src/cli.ts"), "--scenario", "pc-branch"],
    { encoding: "utf8" },
  );
  const result: unknown = JSON.parse(out);
  expect(result).toMatchObject({
    storePreview: { purchaseMethod: "store", store: "fictional-store" },
    roundTrip: { packingKitPreserved: true, secretCleared: true },
    preview: { purchaseMethod: "takuhai", packingKit: "yes" },
  });
  expect(out).not.toContain("synthetic-ephemeral");
});
test("CLI draft demo reopens SQLite in a second process and excludes secret values", () => {
  const out = execFileSync(
    process.execPath,
    [resolve(import.meta.dirname, "../src/cli.ts"), "--scenario", "restore"],
    { encoding: "utf8", timeout: 30000 },
  );
  expect(JSON.parse(out) as unknown).toMatchObject({
    scenario: "restore",
    status: "restored",
    step: "stp_takuhai",
    preview: { purchaseMethod: "takuhai", packingKit: "yes" },
    secretAbsent: true,
  });
  expect(out).not.toContain("synthetic-ephemeral");
});
