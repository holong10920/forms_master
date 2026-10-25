import { expect, test } from "vitest";
import { CONTRACTS_PACKAGE } from "../src/index.ts";

test("package identity", () => {
  expect(CONTRACTS_PACKAGE).toBe("@fb/contracts");
});
