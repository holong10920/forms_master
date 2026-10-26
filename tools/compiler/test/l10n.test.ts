import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { expect, test } from "vitest";
import type { EngineIRV1 } from "@fb/contracts";
import { EngineError, loadDefinition } from "@fb/form-engine";
import { compile, root } from "../src/build.ts";
import { localize, systemTexts } from "../src/l10n.ts";
type Definition = {
  locale: { default: string; supported: string[] };
  texts?: Record<string, { ja?: string; vi?: string }>;
  fields: {
    id: string;
    label?: { ja: string; vi?: string };
    help?: { ja?: string; vi?: string };
  }[];
};
const sports = () =>
  JSON.parse(
    readFileSync(join(root, "contracts/fixtures/engine/sports.json"), "utf8"),
  ) as Definition;
function bilingual(): Definition {
  const d = sports();
  d.locale.supported = ["ja", "vi"];
  d.texts = {
    formTitle: { ja: "スポーツ用品の買取", vi: "Thu mua dụng cụ thể thao" },
    next: { ja: "次の画面へ" },
  };
  const method = d.fields.find((f) => f.id === "fld_method");
  if (!method) throw new Error("fixture");
  method.label = { ja: "買取方法を選択してください", vi: "Vui lòng chọn phương thức thu mua" };
  method.help = { ja: "出張買取のみ対応しています" };
  return d;
}
const pinnedIR = (result: Awaited<ReturnType<typeof compile>>) => {
  const path = result.manifest.inventory.find((f) => f.path.includes("form-ir."))?.path;
  if (!path) throw new Error("ir");
  return JSON.parse(readFileSync(join(result.directory, path), "utf8")) as EngineIRV1;
};
test("localize resolves overrides first, falls back to built-in text, and keeps only supported locales", () => {
  const ja = loadDefinition(sports());
  localize(ja);
  expect(ja.locale).toBeUndefined();
  expect(ja.texts?.next).toEqual({ ja: "次へ" });
  const ir = loadDefinition(bilingual());
  localize(ir);
  expect(ir.locale).toEqual({ default: "ja", supported: ["ja", "vi"] });
  expect(ir.texts?.next).toEqual({ ja: "次の画面へ", vi: systemTexts.next.vi });
  expect(ir.texts?.required).toEqual(systemTexts.required);
  expect(ir.texts?.formTitle).toEqual({ ja: "スポーツ用品の買取", vi: "Thu mua dụng cụ thể thao" });
  const empty = loadDefinition({ ...bilingual(), texts: { back: { ja: "", vi: "" } } });
  localize(empty);
  expect(empty.texts?.back).toEqual(systemTexts.back);
  for (const entry of Object.values(systemTexts)) expect(entry.vi).toBeTruthy();
});
test("locale contract: default must be supported and only ja/vi are accepted", () => {
  expect(() =>
    loadDefinition({ ...sports(), locale: { default: "ja", supported: ["vi"] } }),
  ).toThrow(new EngineError("E-LOCALE"));
  expect(() =>
    loadDefinition({ ...sports(), locale: { default: "ja", supported: ["ja", "en"] } }),
  ).toThrow(new EngineError("E-DEFINITION-SCHEMA"));
  expect(() => loadDefinition({ ...sports(), texts: { unknownKey: { ja: "x" } } })).toThrow(
    new EngineError("E-DEFINITION-SCHEMA"),
  );
});
test("bilingual Sports build pins translations in the IR, stays deterministic and Motion-free", async () => {
  const a = mkdtempSync(join(tmpdir(), "fb-l10n-a-")),
    b = mkdtempSync(join(tmpdir(), "fb-l10n-b-"));
  try {
    const first = await compile(bilingual(), a),
      second = await compile(bilingual(), b),
      jaOnly = await compile(sports(), a);
    expect(second.candidateId).toBe(first.candidateId);
    expect(jaOnly.candidateId).not.toBe(first.candidateId);
    const ir = pinnedIR(first);
    expect(ir.locale?.supported).toEqual(["ja", "vi"]);
    expect(ir.nodes.find((n) => n.id === "fld_method")?.label).toEqual({
      ja: "買取方法を選択してください",
      vi: "Vui lòng chọn phương thức thu mua",
    });
    expect(ir.texts?.completeTitle?.vi).toBe(systemTexts.completeTitle.vi);
    expect(pinnedIR(jaOnly).texts?.next).toEqual({ ja: "次へ" });
    expect(
      first.chunks
        .flatMap((c) => c.modules)
        .some((m) => /motion|store-selector|i18n|intl/iu.test(m.id)),
    ).toBe(false);
    expect(first.chunks.every((c) => c.dynamicImports.length === 0)).toBe(true);
  } finally {
    rmSync(a, { recursive: true, force: true });
    rmSync(b, { recursive: true, force: true });
  }
}, 60000);
