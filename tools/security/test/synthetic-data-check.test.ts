import { mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, test } from "vitest";
import { checkSyntheticData } from "../src/synthetic-data-check.ts";
const dirs: string[] = [];
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});
function fixture(content: string): string {
  const d = mkdtempSync(join(tmpdir(), "fb-synthetic-"));
  dirs.push(d);
  writeFileSync(join(d, "data.txt"), content);
  return d;
}
test("accepts reserved synthetic domains", () => {
  expect(
    checkSyntheticData(
      fixture(
        "taro@example.com\nhanako@shop.invalid\na@example.jp\nb@example.org\nc@shop.test\nd@shop.example\nTARO@EXAMPLE.COM",
      ),
    ),
  ).toEqual([]);
});
test("rejects non-synthetic domain at exact line without returning the value", () => {
  const d = fixture("taro@example.com\nsomeone@gmail.com\n");
  expect(checkSyntheticData(d)).toEqual([
    { file: join(d, "data.txt"), line: 2, rule: "email-domain" },
  ]);
});
test("rejects suffix impersonation", () => {
  expect(checkSyntheticData(fixture("a@example.com.evil\na@notexample.com"))).toHaveLength(2);
});
test("fails closed for binary files and symlinks", () => {
  const d = fixture("\0");
  expect(() => checkSyntheticData(d)).toThrow("binary");
  writeFileSync(join(d, "data.txt"), "synthetic");
  symlinkSync(d, join(d, "loop"));
  expect(() => checkSyntheticData(d)).toThrow("symlink");
});
