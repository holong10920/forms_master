import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { gzipSync } from "node:zlib";
import { test, expect } from "vitest";
import { compile, root, audit, type Candidate } from "../src/build.ts";
const fixture = (name: string): unknown =>
  JSON.parse(readFileSync(join(root, `contracts/fixtures/engine/${name}.json`), "utf8"));
const modules = (c: Candidate) => c.chunks.flatMap((ch) => ch.modules.map((m) => m.id));
test("actual PC/Sports emitted graphs isolate plugin/Motion and preserve pinned deterministic variants", async () => {
  const dir = mkdtempSync(join(tmpdir(), "fb-isolation-"));
  try {
    const none = await compile(fixture("sports"), dir),
      sports = await compile(fixture("sports-subtle"), dir),
      pc = await compile(fixture("pc-plugin"), dir),
      again = await compile(fixture("pc-plugin"), dir);
    expect(pc.candidateId).toBe(again.candidateId);
    expect(new Set([none.candidateId, sports.candidateId, pc.candidateId]).size).toBe(3);
    expect(modules(none).some((m) => /motion|store-selector|react/iu.test(m))).toBe(false);
    expect(modules(sports).some((m) => /store-selector/iu.test(m))).toBe(false);
    expect(modules(sports).some((m) => /motion-adapter/iu.test(m))).toBe(true);
    expect(modules(pc).some((m) => /store-selector/iu.test(m))).toBe(true);
    for (const c of [sports, pc])
      expect(modules(c).some((m) => /\/server\/|fixtures|\.py$/u.test(m))).toBe(false);
    const reactVersions = new Set(
      modules(pc)
        .map((m) => /^pkg:react@([^/]+)/u.exec(m)?.[1])
        .filter(Boolean),
    );
    expect([...reactVersions]).toEqual(["19.3.1"]);
    const raw = pc.manifest.inventory
      .filter((f) => f.path.endsWith(".js"))
      .map((f) => readFileSync(join(pc.directory, f.path), "utf8"))
      .join("\n");
    expect(raw).not.toContain("ST-1001");
    expect(raw).not.toContain("query_store_list");
    const entry = pc.chunks.find((c) => c.modules.some((m) => m.id === "gen:entry.ts"));
    expect(entry?.modules.some((m) => /store-selector|motion-adapter/iu.test(m.id))).toBe(false);
    const source = JSON.parse(
      readFileSync(join(dir, "private", pc.candidateId, "capability-lock.json"), "utf8"),
    ) as { bindings: { key: { facet: string; version: string }; sourceDigest: string }[] };
    expect(source.bindings).toHaveLength(3);
    expect(
      source.bindings.every(
        (b) => b.key.version === "1.0.0" && b.sourceDigest.startsWith("sha256:"),
      ),
    ).toBe(true);
    const js = none.manifest.inventory.find((a) => a.path.endsWith(".js"));
    if (!js) throw new Error("JS");
    expect(
      gzipSync(readFileSync(join(none.directory, js.path)), { level: 9 }).length,
    ).toBeLessThanOrEqual(12 * 1024);
    const total = [
      "index.html",
      ...none.manifest.inventory.filter((a) => /\.(js|css)$/u.test(a.path)).map((a) => a.path),
    ].reduce((n, p) => n + gzipSync(readFileSync(join(none.directory, p)), { level: 9 }).length, 0);
    expect(total).toBeLessThanOrEqual(16 * 1024);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}, 30000);
test("server facet and unpinned plugin version are negative controls", async () => {
  expect(() => {
    audit(
      [
        {
          file: "assets/x.js",
          modules: [{ id: "rel:store/server/adapter.py", bytes: 1 }],
          staticImports: [],
          dynamicImports: [],
        },
      ],
      new Map(),
      { plugin: true, motion: true },
    );
  }).toThrow("E-ARTIFACT-FORBIDDEN-FACET");
  const d = fixture("pc-plugin") as {
    dependencies: { capabilities: { storeSel: { version: string } } };
  };
  d.dependencies.capabilities.storeSel.version = "9.0.0";
  await expect(compile(d, "/tmp/unused-negative-candidate")).rejects.toThrow("E-DEFINITION-SCHEMA");
});
