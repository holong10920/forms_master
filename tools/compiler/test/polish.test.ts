import { expect, test } from "vitest";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { compileRelease } from "../src/release.ts";
import { compile, root } from "../src/build.ts";
import { multiProductDraft } from "../../go-auth/templates/multi-product.ts";
test("optional polish stays inside the existing budget and is excluded from unconfigured Sports", async () => {
  const out = mkdtempSync(join(tmpdir(), "fb-polish-"));
  try {
    const draft = multiProductDraft();
    draft.appearance = {
      ...draft.appearance,
      headerVariant: "fullWidth",
      progressStyle: "compact",
      controlStyle: "outlined",
    };
    const group = draft.fields[0];
    if (!group || group.type !== "group") throw Error("fixture");
    group.listTitle = { ja: "商品確認" };
    group.summaryFields = ["fld_title", "fld_category"];
    const polished = await compileRelease(draft, out); // Existing 12 KiB JS / 16 KiB total guards must pass unchanged.
    const css = polished.manifest.inventory
      .filter((f) => f.path.endsWith(".css"))
      .map((f) => readFileSync(join(polished.directory, f.path), "utf8"))
      .join("");
    expect(css).toContain(".layout-wide");
    expect(css).toContain(".progress-compact");
    const sports = await compile(
      JSON.parse(readFileSync(join(root, "contracts/fixtures/engine/sports.json"), "utf8")),
      out,
    );
    const oldCSS = sports.manifest.inventory
      .filter((f) => f.path.endsWith(".css"))
      .map((f) => readFileSync(join(sports.directory, f.path), "utf8"))
      .join("");
    expect(oldCSS).not.toContain(".layout-wide");
    expect(
      sports.chunks.flatMap((c) => c.modules).some((m) => /motion|store-selector/iu.test(m.id)),
    ).toBe(false);
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});
