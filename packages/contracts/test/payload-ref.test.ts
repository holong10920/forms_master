import { expect, test } from "vitest";
import type { PayloadRefV1 } from "../src/generated/payload-ref.v1.ts";
import { checkPayloadRef } from "../src/payload-ref.ts";
import { readFixture } from "./fixtures.ts";

const { cases } = readFixture("semantic/payload-ref.json") as {
  cases: { name: string; ref: PayloadRefV1; errors: { code: string; path: string }[] }[];
};

test("semantic fixture count", () => {
  expect(cases.length).toBe(6);
});

test.each(cases)("$name", ({ ref, errors }) => {
  expect(checkPayloadRef(ref)).toEqual(errors);
});
