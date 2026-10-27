import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  symlinkSync,
  linkSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test, expect } from "vitest";
import { inspectSource, candidate } from "../src/analyze.ts";
test("AST parses literals and reports dynamic props without executing source", () => {
  const source = `throw Error('must never execute'); const x=<><InputBox name="email" type="email"/><SelectBox name="model" options={dangerous()}/><GroupRadioBox name="pickup" options={[{label:'来店',value:'shop'}]}/></>`;
  const records = inspectSource("example.tsx", source);
  expect(records).toHaveLength(3);
  expect(records[1]?.dynamic).toEqual(["options"]);
  const result = candidate(records);
  expect(result.definition.fields).toHaveLength(2);
  expect(result.reviewRequired).toBe(true);
  expect(result.publishable).toBe(false);
  expect(result.diagnostics.some((d) => d.includes("dynamic options"))).toBe(true);
});
test("unsupported nested names cannot silently become a flat field", () => {
  expect(
    candidate(inspectSource("x.tsx", '<InputBox name="items.0.name"/>')).definition.fields,
  ).toEqual([]);
});
test("CSS and route inventories use parsers and preserve source locations", async () => {
  const { styleInventory, routeInventory } = await import("../src/analyze.ts");
  expect(
    styleInventory("x.css", ".form {display: grid; gap: 12px; background: url(unsafe)}"),
  ).toMatchObject([
    { property: "display", value: "grid" },
    { property: "gap", value: "12px" },
    { property: "background", value: "MANUAL_ASSET_MAPPING" },
  ]);
  expect(
    routeInventory("routes.ts", `const map={'pc.example.invalid':()=>import('./pc')}`),
  ).toEqual([{ file: "routes.ts", line: 1, route: "pc.example.invalid", module: "./pc" }]);
});
test("source output, symlinks and hardlinks cannot overwrite read-only input", async () => {
  const { writeResult } = await import("../src/analyze.ts");
  const root = mkdtempSync(join(tmpdir(), "fm-source-guard-"));
  try {
    const source = join(root, "source");
    mkdirSync(source);
    const input = join(source, "input.ts");
    writeFileSync(input, "preserved");
    expect(() => {
      writeResult(join(source, "out.json"), {}, source);
    }).toThrow("outside");
    symlinkSync(input, join(root, "alias.json"));
    expect(() => {
      writeResult(join(root, "alias.json"), {}, source);
    }).toThrow();
    linkSync(input, join(root, "hardlink.json"));
    expect(() => {
      writeResult(join(root, "hardlink.json"), {}, source);
    }).toThrow("regular");
    expect(readFileSync(input, "utf8")).toBe("preserved");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
test("sensitive and upload controls are diagnostics, never generated fields", () => {
  const records = inspectSource(
    "sensitive.tsx",
    '<><input name="api_key" type="password" value="do-not-copy"/><input name="image" type="file"/></>',
  );
  expect(JSON.stringify(records)).not.toContain("do-not-copy");
  expect(candidate(records).definition.fields).toEqual([]);
});
test("custom JSX remains visible in inventory and manual mapping diagnostics", () => {
  const records = inspectSource("custom.tsx", "<UnknownWidget categories={items} />");
  expect(records[0]?.component).toBe("UnknownWidget");
  expect(records[0]?.propNames).toContain("categories");
  expect(
    candidate(records).diagnostics.some(
      (d) => d.includes("UnknownWidget") && d.includes("manual mapping"),
    ),
  ).toBe(true);
});
test("literal native control types map without flattening dates or numbers to text", () => {
  const r = candidate(
    inspectSource(
      "native.tsx",
      '<><input name="quantity" type="number"/><textarea name="memo"/><input name="when" type="date"/><input name="consent" type="checkbox"/></>',
    ),
  );
  expect(r.definition.fields.map((f) => f.type)).toEqual(["number", "textarea", "date", "boolean"]);
});
