import { readFileSync, mkdtempSync, rmSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { expect, test } from "vitest";
import { compile, audit, root, type Chunk } from "../src/build.ts";
const definition = () =>
  JSON.parse(readFileSync(join(root, "contracts/fixtures/engine/sports.json"), "utf8")) as unknown;
function files(dir: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory())
      for (const [key, data] of Object.entries(files(join(dir, entry.name))))
        out[`${entry.name}/${key}`] = data;
    else out[entry.name] = readFileSync(join(dir, entry.name)).toString("hex");
  }
  return out;
}
test("two independent clean builds produce identical pinned candidate and complete bytes", async () => {
  const a = mkdtempSync(join(tmpdir(), "fb-build-a-")),
    b = mkdtempSync(join(tmpdir(), "fb-build-b-"));
  try {
    const first = await compile(definition(), a),
      second = await compile(definition(), b);
    expect(first.candidateId).toBe(second.candidateId);
    expect(files(first.directory)).toEqual(files(second.directory));
    expect(
      first.chunks.flatMap((c) => c.modules).some((m) => m.id.includes("@fb/form-engine")),
    ).toBe(true);
    expect(
      first.chunks.flatMap((c) => c.modules).some((m) => /motion|store-selector|ajv/iu.test(m.id)),
    ).toBe(false);
    expect(first.manifest.inventory.some((f) => f.path.endsWith(".css"))).toBe(true);
    expect(first.manifest.inventory.find((f) => f.path.endsWith(".js"))?.size).toBeGreaterThan(
      10000,
    );
    expect(readFileSync(join(first.directory, "index.html"), "utf8")).toContain(first.candidateId);
    expect(first.manifest.builderVerification).toBe("VERIFICATION_PENDING");
    expect((await compile(definition(), a)).candidateId).toBe(first.candidateId);
    writeFileSync(join(first.directory, "unexpected.js"), "untracked artifact");
    await expect(compile(definition(), a)).rejects.toThrow("E-ARTIFACT-UNEXPECTED-FILE");
    rmSync(join(first.directory, "unexpected.js"));
    const asset = first.manifest.inventory[0];
    if (!asset) throw new Error("inventory");
    writeFileSync(join(first.directory, asset.path), "tampered");
    await expect(compile(definition(), a)).rejects.toThrow("E-CANDIDATE-COLLISION");
  } finally {
    rmSync(a, { recursive: true, force: true });
    rmSync(b, { recursive: true, force: true });
  }
}, 30000);
test("changed declared definition changes identity, unsupported profile fails before runtime", async () => {
  const dir = mkdtempSync(join(tmpdir(), "fb-build-change-"));
  try {
    const d = definition() as { fields: { id: string; required?: boolean }[]; formId: string };
    const a = await compile(d, dir);
    const field = d.fields.find((f) => f.id === "fld_email");
    if (!field) throw new Error("fixture");
    field.required = true;
    const b = await compile(d, dir);
    expect(b.candidateId).not.toBe(a.candidateId);
    d.formId = "other";
    await expect(compile(d, dir)).rejects.toThrow("E-RUNTIME-PROFILE-UNSUPPORTED");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}, 30000);
test.each([
  "pkg:motion@1/index.js",
  "platform:@fb/motion-adapter@1/index.js",
  "pkg:@platform/store-selector@1/browser.js",
])("negative module fixture rejects %s", (id) => {
  const graph: Chunk[] = [
    { file: "assets/entry.js", modules: [{ id, bytes: 1 }], staticImports: [], dynamicImports: [] },
  ];
  expect(() => {
    audit(graph, new Map([["assets/entry.js", Buffer.from("x")]]));
  }).toThrow("E-ARTIFACT-MOTION-OR-STORE");
});
test.each(["../x.js", "assets/out.map"])("negative inventory rejects %s", (path) => {
  expect(() => {
    audit([], new Map([[path, Buffer.from("x")]]));
  }).toThrow();
});
test("negative dynamic import and absolute-path canaries fail artifact verification", () => {
  expect(() => {
    audit(
      [{ file: "assets/entry.js", modules: [], staticImports: [], dynamicImports: ["motion.js"] }],
      new Map(),
    );
  }).toThrow("E-ARTIFACT-UNEXPECTED-DYNAMIC-IMPORT");
  expect(() => {
    audit([], new Map([["assets/entry.js", Buffer.from("/Users/synthetic/source.ts")]]));
  }).toThrow("E-ARTIFACT-SOURCE-LEAK");
});
