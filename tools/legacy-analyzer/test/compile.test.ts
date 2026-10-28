import { test, expect } from "vitest";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { compileRelease } from "../../compiler/src/release.ts";
import { compile } from "../../compiler/src/build.ts";
import { gakkiApplyDraft } from "../../go-auth/templates/gakki-apply.ts";
import { pcApplyDraft } from "../../go-auth/templates/pc-apply.ts";
test("extended forms keep pinned host-only chunks, initial budgets and escaped document titles", async () => {
  const dir = mkdtempSync(join(tmpdir(), "fm-extended-"));
  try {
    const d = pcApplyDraft();
    d.texts ??= {};
    d.texts.formTitle = { ja: "<img src=x onerror=unsafe> & synthetic" };
    const c = await compile(d, dir);
    const html = readFileSync(join(c.directory, "index.html"), "utf8");
    expect(html).toContain("&lt;img src=x onerror=unsafe&gt; &amp; synthetic");
    expect(html).not.toContain("<img src=x");
    const pin = JSON.parse(
      /<script type="application\/json" id="release">([^]*?)<\/script>/u.exec(html)?.[1] ?? "{}",
    ) as { groups: { enhancements: string[]; motion: string[]; store: string[] } };
    expect(pin.groups.enhancements.length).toBeGreaterThan(0);
    expect(pin.groups.motion).toEqual([]);
    expect(pin.groups.store).toEqual([]);
    expect(
      c.chunks.flatMap((x) => x.modules).some((m) => /motion|react|store-selector/iu.test(m.id)),
    ).toBe(false);
    const entry = c.chunks.find((x) => x.modules.some((m) => m.id === "gen:entry.ts"));
    if (!entry) throw Error("entry");
    const initial = new Set<string>();
    const visit = (f: string) => {
      if (initial.has(f)) return;
      initial.add(f);
      for (const p of c.chunks.find((c) => c.file === f)?.staticImports ?? []) visit(p);
    };
    visit(entry.file);
    const size = (paths: string[]) =>
      paths.reduce(
        (n, p) => n + gzipSync(readFileSync(join(c.directory, p)), { level: 9 }).length,
        0,
      );
    expect(size([...initial])).toBeLessThanOrEqual(12 * 1024);
    expect(
      size([
        ...initial,
        "index.html",
        ...c.manifest.inventory.filter((x) => x.path.endsWith(".css")).map((x) => x.path),
      ]),
    ).toBeLessThanOrEqual(16 * 1024);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}, 30000);

test("instrument draft compiles under the existing isolated customer budgets", async () => {
  const dir = mkdtempSync(join(tmpdir(), "fm-instruments-"));
  try {
    const result = await compileRelease(gakkiApplyDraft(), dir);
    expect(result.chunks.length).toBeGreaterThan(0);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}, 30000);
