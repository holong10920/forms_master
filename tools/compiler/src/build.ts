import { createHash } from "node:crypto";
import {
  readFileSync,
  realpathSync,
  mkdtempSync,
  rmSync,
  mkdirSync,
  writeFileSync,
  existsSync,
  readdirSync,
  renameSync,
} from "node:fs";
import { join, resolve, relative, dirname } from "node:path";
import { tmpdir } from "node:os";
import { build, type Plugin } from "vite";
import { loadDefinition } from "@fb/form-engine";
import { canonicalJson } from "@fb/contracts";
export const root = resolve(import.meta.dirname, "../../..");
const hash = (value: string | Uint8Array) => createHash("sha256").update(value).digest("hex");
const json = (value: unknown) => Buffer.from(canonicalJson(value));
const compare = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
export interface Chunk {
  file: string;
  modules: { id: string; bytes: number }[];
  staticImports: string[];
  dynamicImports: string[];
}
export function audit(chunks: Chunk[], files: Map<string, Buffer>): void {
  const modules = chunks.flatMap((c) => c.modules);
  if (modules.some((m) => /motion|store-selector/iu.test(m.id)))
    throw new Error("E-ARTIFACT-MOTION-OR-STORE");
  for (const c of chunks) {
    if (c.dynamicImports.length) throw new Error("E-ARTIFACT-UNEXPECTED-DYNAMIC-IMPORT");
    for (const path of c.staticImports) if (!files.has(path)) throw new Error("E-ARTIFACT-IMPORT");
  }
  for (const [path, bytes] of files) {
    if (
      !/^[a-z0-9._/-]+$/u.test(path) ||
      path.startsWith("/") ||
      path.split("/").some((s) => s === ".." || s === "." || !s)
    )
      throw new Error("E-ARTIFACT-PATH");
    const text = bytes.toString("utf8");
    if (path.endsWith(".map") || /sourceMappingURL|\/Users\/|\/home\/|[A-Z]:\\/u.test(text))
      throw new Error("E-ARTIFACT-SOURCE-LEAK");
    if (/import\s*\(\s*["'][^"']*motion/iu.test(text)) throw new Error("E-ARTIFACT-MOTION");
  }
}
const packageAllow = new Set([
  "ajv",
  "canonicalize",
  "fast-deep-equal",
  "fast-uri",
  "json-schema-traverse",
  "require-from-string",
]);
function moduleId(id: string, generated: string): string {
  if (id.startsWith("\0")) {
    const name = id.slice(1);
    if (!["vite/preload-helper.js", "rolldown/runtime"].includes(name))
      throw new Error(`E-VIRTUAL-MODULE: ${name}`);
    return `virtual:${name}`;
  }
  const path = realpathSync(id.split("?")[0] ?? id);
  if (path === realpathSync(generated)) return "gen:entry.ts";
  const p = relative(root, path).replaceAll("\\", "/");
  if (/^packages\/(form-engine|contracts|static-runtime)\/src\/[^]*\.(ts|css)$/u.test(p)) {
    const name = p.split("/")[1];
    if (!name) throw new Error("E-MODULE-ID");
    return `platform:@fb/${name}@${(JSON.parse(readFileSync(join(root, "packages", name, "package.json"), "utf8")) as { version: string }).version}/${p.split("/").slice(2).join("/")}`;
  }
  if (p.startsWith("node_modules/") || path.includes("/node_modules/")) {
    let dir = dirname(path);
    while (!existsSync(join(dir, "package.json"))) {
      const parent = dirname(dir);
      if (parent === dir) throw new Error("E-MODULE-ID");
      dir = parent;
    }
    const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8")) as {
      name: string;
      version: string;
    };
    if (!packageAllow.has(pkg.name)) throw new Error(`E-ARTIFACT-ILLEGAL-PACKAGE: ${pkg.name}`);
    return `pkg:${pkg.name}@${pkg.version}/${relative(dir, path).replaceAll("\\", "/")}`;
  }
  throw new Error(`E-ARTIFACT-ILLEGAL-MODULE: ${p}`);
}
function base32(hex: string): string {
  const symbol = (n: number): string => (n < 26 ? String.fromCharCode(97 + n) : String(n - 24));
  let n = 0,
    bits = 0,
    out = "";
  for (const byte of Buffer.from(hex, "hex")) {
    n = (n << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      out += symbol((n >>> bits) & 31);
    }
  }
  if (bits) out += symbol((n << (5 - bits)) & 31);
  return out;
}
const cssType = (path: string) =>
  path.endsWith(".js")
    ? "text/javascript"
    : path.endsWith(".css")
      ? "text/css"
      : "application/json";
export interface Candidate {
  candidateId: string;
  directory: string;
  urlPath: string;
  manifest: {
    localCandidateFormat: number;
    variant: string;
    builderVerification: string;
    form: { formId: string; siteId: string; revision: string; schemaVersion: string };
    inputs: Record<string, string>;
    toolchain: Record<string, string>;
    inventory: { path: string; size: number; sha256: string; contentType: string }[];
  };
  chunks: Chunk[];
}
export async function compile(definition: unknown, outRoot: string): Promise<Candidate> {
  const ir = loadDefinition(definition);
  if (
    ir.form.formId !== "frm_sports" ||
    ir.nodes.some(
      (f) =>
        f.type === "group" ||
        ![
          "text",
          "textarea",
          "email",
          "boolean",
          "choice.radio",
          "choice.select",
          "calculated",
        ].includes(f.type),
    )
  )
    throw new Error("E-RUNTIME-PROFILE-UNSUPPORTED");
  const temp = mkdtempSync(join(tmpdir(), "fb-compiler-"));
  const entry = join(temp, "entry.ts");
  writeFileSync(entry, 'import { boot } from "@fb/static-runtime"; boot();\n');
  const files = new Map<string, Buffer>();
  const chunks: Chunk[] = [];
  try {
    const proof: Plugin = {
      name: "closed-sports-module-graph",
      load(id) {
        moduleId(id, entry);
        return null;
      },
      generateBundle(_options, bundle) {
        for (const [file, item] of Object.entries(bundle)) {
          if (item.type === "chunk") {
            const modules = Object.entries(item.modules)
              .map(([id, info]) => ({ id: moduleId(id, entry), bytes: info.renderedLength }))
              .sort((a, b) => compare(a.id, b.id));
            chunks.push({
              file,
              modules,
              staticImports: [...item.imports].sort(compare),
              dynamicImports: [...item.dynamicImports].sort(compare),
            });
          }
        }
      },
    };
    const result = await build({
      configFile: false,
      envFile: false,
      root: temp,
      publicDir: false,
      base: "./",
      logLevel: "silent",
      plugins: [proof],
      resolve: {
        alias: {
          "@fb/static-runtime": join(root, "packages/static-runtime/src/index.ts"),
          "@fb/form-engine": join(root, "packages/form-engine/src/index.ts"),
          "@fb/contracts": join(root, "packages/contracts/src/index.ts"),
        },
      },
      build: {
        write: false,
        sourcemap: false,
        minify: "oxc",
        modulePreload: { polyfill: false },
        rolldownOptions: {
          input: entry,
          output: {
            entryFileNames: "assets/entry.[hash:12].js",
            chunkFileNames: "assets/chunk.[hash:12].js",
            assetFileNames: "assets/[name].[hash:12].[ext]",
            hashCharacters: "hex",
          },
          treeshake: { moduleSideEffects: (id) => id.endsWith(".css") },
        },
      },
    });
    if (!("output" in result)) throw new Error("E-BUILD-OUTPUT");
    for (const item of result.output)
      files.set(
        item.fileName,
        item.type === "chunk" ? Buffer.from(item.code) : Buffer.from(item.source),
      );
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
  const irBytes = json(ir),
    irHash = hash(irBytes),
    irPath = `assets/form-ir.${irHash}.json`;
  files.set(irPath, irBytes);
  chunks.sort((a, b) => compare(a.file, b.file));
  audit(chunks, files);
  const dataContract = {
    localDataContractFormat: 1,
    fields: ir.nodes.map((f) => ({
      id: f.id,
      key: f.key,
      type: f.type,
      classification: f.classification,
      submit: f.submit ?? "include",
    })),
  };
  const graph = json({ chunkManifestFormat: 1, chunks });
  const manifest: Candidate["manifest"] = {
    localCandidateFormat: 1,
    variant: "sports-demo-nomotion",
    builderVerification: "VERIFICATION_PENDING",
    form: { ...ir.form, revision: `synthetic-${hash(json(definition)).slice(0, 16)}` },
    inputs: {
      compilerSource: `sha256:${hash(readFileSync(new URL(import.meta.url)))}`,
      buildConfig: `sha256:${hash(json({ profile: "sports-demo-nomotion-local", vite: "8.3.5", rolldown: "1.2.15", base: "./", minify: "oxc", hashCharacters: "hex", unsafeEval: false }))}`,
      definition: `sha256:${hash(json(definition))}`,
      ir: `sha256:${irHash}`,
      dataContract: `sha256:${hash(json(dataContract))}`,
      chunkManifest: `sha256:${hash(graph)}`,
      lockfile: `sha256:${hash(readFileSync(join(root, "pnpm-lock.yaml")))}`,
    },
    toolchain: {
      node: process.versions.node,
      vite: "8.3.5",
      rolldown: "1.2.15",
      compiler: "0.1.0",
      runtime: "0.1.0",
    },
    inventory: [...files]
      .map(([path, bytes]) => ({
        path,
        size: bytes.length,
        sha256: `sha256:${hash(bytes)}`,
        contentType: cssType(path),
      }))
      .sort((a, b) => compare(a.path, b.path)),
  };
  const candidateId = `dev_${base32(hash(json(manifest))).slice(0, 26)}`;
  const metadata = {
    mode: "local-candidate",
    releaseId: candidateId,
    formId: ir.form.formId,
    siteId: ir.form.siteId,
    revision: manifest.form.revision,
    ir: { path: irPath, sha256: irHash },
  };
  const escape = (s: string) =>
    s.replaceAll("<", "\\u003c").replaceAll(">", "\\u003e").replaceAll("&", "\\u0026");
  const js = manifest.inventory.filter((f) => f.path.endsWith(".js")),
    css = manifest.inventory.filter((f) => f.path.endsWith(".css"));
  if (js.length !== 1) throw new Error("E-UNEXPECTED-ENTRY-GRAPH");
  const main = js[0];
  if (!main) throw new Error("E-UNEXPECTED-ENTRY-GRAPH");
  const sri = (path: string) =>
    `sha256-${createHash("sha256")
      .update(files.get(path) ?? Buffer.alloc(0))
      .digest("base64")}`;
  const html = `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sports · Local Synthetic</title>${css.map((f) => `<link rel="stylesheet" href="./${f.path}" integrity="${sri(f.path)}" crossorigin="anonymous">`).join("")}</head><body><main id="app" aria-live="polite">読み込み中…</main><script type="application/json" id="release">${escape(canonicalJson(metadata))}</script><script type="module" src="./${main.path}" integrity="${sri(main.path)}" crossorigin="anonymous"></script></body></html>`;
  files.set("index.html", Buffer.from(html));
  audit(chunks, files);
  const directory = resolve(outRoot, "r", candidateId);
  mkdirSync(dirname(directory), { recursive: true });
  if (existsSync(directory)) {
    const actual: string[] = [];
    function walk(dir: string, prefix = ""): void {
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        const name = prefix + e.name;
        if (e.isSymbolicLink()) throw new Error("E-ARTIFACT-UNEXPECTED-FILE");
        if (e.isDirectory()) walk(join(dir, e.name), name + "/");
        else if (e.isFile()) actual.push(name);
        else throw new Error("E-ARTIFACT-UNEXPECTED-FILE");
      }
    }
    walk(directory);
    if (JSON.stringify(actual.sort(compare)) !== JSON.stringify([...files.keys()].sort(compare)))
      throw new Error("E-ARTIFACT-UNEXPECTED-FILE");
    for (const [path, data] of files)
      if (!existsSync(join(directory, path)) || !readFileSync(join(directory, path)).equals(data))
        throw new Error("E-CANDIDATE-COLLISION");
  } else {
    const stage = mkdtempSync(join(dirname(directory), ".candidate-"));
    try {
      for (const [path, data] of files) {
        mkdirSync(dirname(join(stage, path)), { recursive: true });
        writeFileSync(join(stage, path), data);
      }
      renameSync(stage, directory);
    } finally {
      if (existsSync(stage)) rmSync(stage, { recursive: true, force: true });
    }
  }
  const privateDir = resolve(outRoot, "private", candidateId);
  mkdirSync(privateDir, { recursive: true });
  for (const [name, data] of [
    ["candidate-manifest.json", json(manifest)],
    ["chunk-manifest.json", graph],
    ["data-contract.json", json(dataContract)],
  ] as const) {
    const path = join(privateDir, name);
    if (existsSync(path) && !readFileSync(path).equals(data))
      throw new Error("E-CANDIDATE-COLLISION");
    if (!existsSync(path)) writeFileSync(path, data, { flag: "wx" });
  }
  return { candidateId, directory, urlPath: `/r/${candidateId}/index.html`, manifest, chunks };
}
