import { expect, test } from "vitest";
import { stepCounter } from "../src/journey.ts";

test("short journeys keep the step circles", () => {
  expect(stepCounter(2, 0, false)).toBeUndefined();
  expect(stepCounter(5, 4, false)).toBeUndefined();
  expect(stepCounter(4, 1, true)).toBeUndefined();
});

test("long journeys collapse to a current/total counter", () => {
  expect(stepCounter(11, 2, false)).toEqual({ text: "3 / 11", percent: 27 });
  expect(stepCounter(5, 0, true)).toEqual({ text: "1 / 5", percent: 20 });
});

test("completion (no current step) shows the journey as finished", () => {
  expect(stepCounter(10, -1, false)).toEqual({ text: "10 / 10", percent: 100 });
});
