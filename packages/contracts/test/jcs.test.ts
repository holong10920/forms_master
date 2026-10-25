import { describe, expect, test } from "vitest";
import { canonicalJson, canonicalJsonBytes, JcsError } from "../src/jcs.ts";
import { sha256Hex } from "../src/digest.ts";
import { readFixture } from "./fixtures.ts";

interface JcsCase {
  name: string;
  input: string;
  canonical?: string;
  sha256?: string;
  error?: string;
}

const { cases } = readFixture("jcs/cases.json") as { cases: JcsCase[] };

describe("JCS parity fixtures", () => {
  test("fixture file has cases", () => {
    expect(cases.length).toBe(16);
  });

  for (const c of cases) {
    test(c.name, async () => {
      const value: unknown = JSON.parse(c.input);
      if (c.error !== undefined) {
        expect(() => canonicalJson(value)).toThrow(JcsError);
        try {
          canonicalJson(value);
        } catch (error) {
          expect((error as JcsError).code).toBe(c.error);
        }
        return;
      }
      const bytes = canonicalJsonBytes(value);
      expect(canonicalJson(value)).toBe(c.canonical);
      expect(bytes).toEqual(new TextEncoder().encode(c.canonical));
      expect(await sha256Hex(bytes)).toBe(c.sha256);
    });
  }
});

describe("JCS rejects non-JSON values", () => {
  test.each([
    ["undefined", undefined],
    ["function", () => 1],
    ["bigint", 1n],
    ["NaN", Number.NaN],
    ["Infinity", Number.POSITIVE_INFINITY],
    ["Date", new Date(0)],
    ["Map", new Map()],
    ["nested undefined", { a: undefined }],
    // eslint-disable-next-line no-sparse-arrays -- sparse array is the case under test
    ["sparse array", [, 1]],
    ["array with own toJSON", Object.assign([1], { toJSON: () => 2 ** 60 })],
    ["object with toJSON function", { toJSON: () => 1 }],
    [
      "array with non-enumerable toJSON",
      Object.defineProperty([1], "toJSON", { value: () => 2 ** 60, enumerable: false }),
    ],
    [
      "object with non-enumerable toJSON",
      Object.defineProperty({ a: 1 }, "toJSON", { value: () => 2 ** 60, enumerable: false }),
    ],
    [
      "array subclass with toJSON",
      new (class extends Array<number> {
        toJSON(): number {
          return 2 ** 60;
        }
      })(),
    ],
    ["object with symbol key", { a: 1, [Symbol("s")]: 2 }],
  ])("%s", (_name, value) => {
    expect(() => canonicalJson(value)).toThrow(JcsError);
  });
});
