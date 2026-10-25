import { expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  loadDefinition,
  restoreDraft,
  parseNumberInput,
  canonical,
  EngineError,
  type DraftSnapshot,
} from "../src/index.ts";
const ir = loadDefinition(
  JSON.parse(
    readFileSync(
      resolve(import.meta.dirname, "../../../contracts/fixtures/engine/pc.json"),
      "utf8",
    ),
  ) as unknown,
);
const draft: DraftSnapshot = {
  releaseId: "synthetic-r",
  revision: "synthetic-rev",
  expiresAt: 100,
  current: "stp_review",
  values: {
    fld_method: "takuhai",
    fld_kit: "yes",
    fld_token: "synthetic-sensitive",
    fld_store: "private",
  },
};
const expected = { releaseId: "synthetic-r", revision: "synthetic-rev", now: 99 };
test("restore applies pin/TTL, excludes inactive/secret/personal and recomputes firstIncomplete", () => {
  const state = restoreDraft(ir, draft, expected);
  expect(state.current).toBe("stp_review");
  expect(state.values).toEqual({ fld_method: "takuhai", fld_kit: "yes" });
  expect(() => restoreDraft(ir, draft, { ...expected, releaseId: "other" })).toThrow(
    "E-DRAFT-RELEASE-MISMATCH",
  );
  expect(() => restoreDraft(ir, draft, { ...expected, now: 100 })).toThrow("E-DRAFT-EXPIRED");
  expect(
    restoreDraft(ir, { ...draft, values: { fld_method: "store", fld_store: "private" } }, expected)
      .current,
  ).toBe("stp_store");
});
test("restore lazy capability guards rerun target routing; bootstrap cannot expose unloaded first step", () => {
  const state = restoreDraft(ir, draft, expected, {
    capabilities: { stp_review: ["synthetic-summary"] },
  });
  expect(state.current).toBe("stp_method");
  expect(state.request?.kind).toBe("capability");
  expect(() =>
    restoreDraft(ir, draft, expected, { capabilities: { stp_method: ["synthetic-first"] } }),
  ).toThrow("E-CAPABILITY-BOOTSTRAP");
});
test("number parsing is an explicit adapter operation, typed evaluator remains strict", () => {
  expect(parseNumberInput(" \uff11\uff0c\uff12\uff10\uff10 ")).toBe(1200);
  expect(() => parseNumberInput("1e3")).toThrow("E-TYPE");
  expect(() => parseNumberInput("9007199254740992")).toThrow("E-NUM-RANGE");
  expect(parseNumberInput(" ")).toBeUndefined();
});
test("canonicalization idempotent and free text preserves compatibility and combining codepoints", () => {
  for (const [kind, value] of [
    ["text", "\ufa30"],
    ["text", "e\u0301"],
    ["katakana", "\uff76\uff9e"],
    ["tel", "\uff10\uff19\uff10-1234-5678"],
    ["choice.radio", " a "],
  ]) {
    if (kind === undefined || value === undefined) throw new EngineError("fixture");
    const result = canonical(value, kind);
    expect(canonical(result, kind)).toBe(result);
    if (kind === "text" || kind === "choice.radio") expect(result).toBe(value);
  }
});
test("privacy floor rejects public free text and prevents personal calculated input from being downgraded", () => {
  const definition = JSON.parse(
    readFileSync(
      resolve(import.meta.dirname, "../../../contracts/fixtures/engine/pc.json"),
      "utf8",
    ),
  ) as { fields: { id: string; classification: string }[] };
  const store = definition.fields.find((f) => f.id === "fld_store");
  if (!store) throw new Error("fixture");
  store.classification = "public";
  expect(() => loadDefinition(definition)).toThrow("E-CLASS-BELOW-MIN");
  const calculated = JSON.parse(
    readFileSync(
      resolve(import.meta.dirname, "../../../contracts/fixtures/engine/calculated.json"),
      "utf8",
    ),
  ) as { fields: { id: string; classification: string }[] };
  const echo = calculated.fields.find((f) => f.id === "fld_echo");
  if (!echo) throw new Error("fixture");
  echo.classification = "public";
  expect(() => loadDefinition(calculated)).toThrow("E-CLASS-BELOW-MIN");
});
