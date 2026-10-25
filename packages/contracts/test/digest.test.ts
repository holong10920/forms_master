import { expect, test } from "vitest";
import { isSha256Hex, jcsSha256Hex, sha256Hex } from "../src/digest.ts";
import { readFixture } from "./fixtures.ts";

const fixture = readFixture("digest/sha256-hex.json") as {
  jcsDigests: { input: string; sha256: string }[];
  rawDigests: { utf8: string; sha256: string }[];
  isSha256Hex: { s: string; ok: boolean }[];
};

test.each(fixture.rawDigests)("sha256Hex($utf8)", async ({ utf8, sha256 }) => {
  expect(await sha256Hex(new TextEncoder().encode(utf8))).toBe(sha256);
});

test.each(fixture.isSha256Hex)("isSha256Hex case %#", ({ s, ok }) => {
  expect(isSha256Hex(s)).toBe(ok);
});

test.each(fixture.jcsDigests)("jcsSha256Hex($input)", async ({ input, sha256 }) => {
  expect(await jcsSha256Hex(JSON.parse(input))).toBe(sha256);
});
