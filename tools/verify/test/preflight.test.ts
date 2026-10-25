import { expect, test } from "vitest";
import { assertToolchain } from "../src/preflight.ts";
test("preflight enforces exact project toolchain", () => {
  expect(() => {
    assertToolchain("24.22.1", "12.15.0");
  }).not.toThrow();
  expect(() => {
    assertToolchain("22.23.1", "12.15.0");
  }).toThrow("Node 24.22.1");
  expect(() => {
    assertToolchain("24.22.1", "12.14.0");
  }).toThrow("pnpm 12.15.0");
});
