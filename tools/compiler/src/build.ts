import tailwindcss from "@tailwindcss/vite";
import { compactClasses, runtimeTailwind } from "./tailwind.ts";
import { rootUtilities } from "../../../packages/static-runtime/src/recipes.ts";
import { resolveTheme } from "./themes.ts";
import { localize } from "./l10n.ts";
import { expandBlocks, bindBlocks } from "./blocks.ts";
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
import { loadDefinition, assertIR } from "@fb/form-engine";
import { resolveAssets } from "./resolve.ts";
import { storeEntry, motionEntry } from "./bindings.ts";
import { gzipSync } from "node:zlib";
import { canonicalJson, type FormDefinitionV1 } from "@fb/contracts";
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
export function audit(
  chunks: Chunk[],
  files: Map<string, Buffer>,
  profile: { plugin: boolean; motion: boolean; enhancements?: boolean } = {
    plugin: false,
    motion: false,
  },
): void {
  const modules = chunks.flatMap((c) => c.modules);
  if (modules.some((m) => /\/server\/|\/design\/|fixtures\/|\.py$/u.test(m.id)))
    throw new Error("E-ARTIFACT-FORBIDDEN-FACET");
  if (
    modules.some(
      (m) =>
        (!profile.motion && /motion/iu.test(m.id)) ||
        (!profile.plugin && /store-selector/iu.test(m.id)),
    )
  )
    throw new Error("E-ARTIFACT-MOTION-OR-STORE");
  for (const c of chunks) {
    if (c.dynamicImports.length && !profile.plugin && !profile.motion && !profile.enhancements)
      throw new Error("E-ARTIFACT-UNEXPECTED-DYNAMIC-IMPORT");
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
    if (!profile.motion && /import\s*\(\s*["'][^"']*motion/iu.test(text))
      throw new Error("E-ARTIFACT-MOTION");
  }
}
const packageAllow = new Set([
  "ajv",
  "canonicalize",
  "fast-deep-equal",
  "fast-uri",
  "json-schema-traverse",
  "require-from-string",
  "react",
  "react-dom",
  "scheduler",
  "motion",
  "motion-dom",
  "motion-utils",
  "framer-motion",
  "tslib",
]);
function moduleId(id: string, generated: string): string {
  if (id.startsWith("\0")) {
    const name = id.slice(1);
    if (!["vite/preload-helper.js", "rolldown/runtime", "rolldown/runtime.js"].includes(name))
      throw new Error(`E-VIRTUAL-MODULE: ${name}`);
    return `virtual:${name}`;
  }
  const path = realpathSync(id.split("?")[0] ?? id);
  if (path === realpathSync(generated)) return "gen:entry.ts";
  if (
    dirname(path) === dirname(realpathSync(generated)) &&
    ["store.ts", "motion.ts", "enhancements.ts"].includes(path.split("/").at(-1) ?? "")
  )
    return `gen:${path.split("/").at(-1) ?? "entry"}`;
  const p = relative(root, path).replaceAll("\\", "/");
  if (
    /^packages\/(form-engine|contracts|static-runtime|sdk-browser|motion-presets|motion-adapter)\/src\/[^]*\.(tsx?|css)$/u.test(
      p,
    )
  ) {
    const name = p.split("/")[1];
    if (!name) throw new Error("E-MODULE-ID");
    return `platform:${(JSON.parse(readFileSync(join(root, "packages", name, "package.json"), "utf8")) as { name: string }).name}@${(JSON.parse(readFileSync(join(root, "packages", name, "package.json"), "utf8")) as { version: string }).version}/${p.split("/").slice(2).join("/")}`;
  }
  if (p === "plugins/store-selector/browser/index.tsx")
    return "rel:dev-store-selector@1.0.0/browser/index.tsx";
  if (p.startsWith("node_modules/") || path.includes("/node_modules/")) {
    let dir = dirname(path);
    while (
      !existsSync(join(dir, "package.json")) ||
      !(JSON.parse(readFileSync(join(dir, "package.json"), "utf8")) as { name?: string }).name
    ) {
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
export function candidateIdFor(manifest: unknown): string {
  return `${manifest && typeof manifest === "object" && "lrmFormat" in manifest ? "rel" : "dev"}_${base32(hash(json(manifest))).slice(0, 26)}`;
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
    localCandidateFormat?: number;
    lrmFormat?: number;
    formats?: { draftFormat: number; loadFormat: number };
    variant?: string;
    builderVerification?: string;
    form: { formId: string; siteId: string; revision: string; schemaVersion: string };
    inputs: Record<string, string>;
    toolchain: Record<string, string>;
    inventory: { path: string; size: number; sha256: string; contentType: string }[];
  };
  chunks: Chunk[];
}
export interface PreviewOptions {
  sourceDigest: string;
  stops: string[];
  blockedFields: string[];
  diagnostics: { code: string; gate: string; step?: string }[];
}
export async function compile(
  definition: unknown,
  outRoot: string,
  preview?: PreviewOptions,
): Promise<Candidate> {
  const expanded = expandBlocks(definition);
  const theme = resolveTheme(expanded.definition.siteId, expanded.definition.themeRef);
  const ir = loadDefinition(expanded.definition);
  bindBlocks(ir, expanded.bindings);
  assertIR(ir);
  localize(ir);
  const resolved = resolveAssets(root, definition as FormDefinitionV1, ir);
  const extended =
    ir.nodes.some((f) => f.type === "group") ||
    !!ir.appearance ||
    !!ir.customerDraft ||
    ir.nodes.some(
      (f) =>
        f.type !== "group" &&
        (!!f.appearance ||
          (f.type === "calculated" && !!f.formula && "ref" in f.formula) ||
          !!f.config?.searchable ||
          !!f.config?.postalAddressTarget ||
          !!f.config?.queryParameter ||
          f.config?.presentation === "native"),
    );
  const profile = {
    plugin: resolved.plugin,
    motion: resolved.preset !== "none",
    enhancements: extended,
  };
  if (
    !/^frm_[a-z0-9_]{1,64}$/u.test(ir.form.formId) ||
    ir.nodes.some((f) =>
      f.type === "group"
        ? f.fields.some(
            (child) =>
              !["text", "textarea", "number", "choice.select", "choice.radio"].includes(child.type),
          )
        : ![
            "number",
            "date",
            "tel",
            "postal",
            "katakana",
            "text",
            "textarea",
            "email",
            "boolean",
            "choice.radio",
            "choice.select",
            "calculated",
            "choice.checkboxes",
            "plugin:storeSel",
          ].includes(f.type),
    )
  )
    throw new Error("E-RUNTIME-PROFILE-UNSUPPORTED");
  const temp = mkdtempSync(join(tmpdir(), "fb-compiler-"));
  const entry = join(temp, "entry.ts");
  if (extended)
    writeFileSync(
      join(temp, "enhancements.ts"),
      'export * from "@fb/static-runtime-enhancements";',
    );
  if (resolved.plugin) writeFileSync(join(temp, "store.ts"), storeEntry);
  if (resolved.preset !== "none")
    writeFileSync(join(temp, "motion.ts"), motionEntry(resolved.preset));
  writeFileSync(
    entry,
    `import {boot} from "@fb/static-runtime";boot({${extended ? 'loadEnhancements:()=>import("./enhancements.ts"),' : ""}${resolved.plugin ? 'loadStore:()=>import("./store.ts"),' : ""}${resolved.preset !== "none" ? 'loadMotion:()=>import("./motion.ts"),' : ""}});`,
  );
  const files = new Map<string, Buffer>();
  const chunks: Chunk[] = [];
  try {
    const proof: Plugin = {
      name: "closed-sports-module-graph",
      transform(_code, id) {
        // CSS is already emitted as SRI links; the host verifies every dynamic group
        // before native import. Retain import failure propagation without a preload layer.
        if (id === "\0vite/preload-helper.js")
          return { code: "export const __vitePreload = load => load();", map: null };
        return null;
      },
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
      define: {
        __FB_PREVIEW__: preview ? "true" : "false",
        __FB_MOTION__: JSON.stringify(resolved.preset !== "none"),
        __FB_EXTENDED__: JSON.stringify(extended),
        __FB_RESETS__: JSON.stringify(
          ir.nodes.some((f) => f.type !== "group" && !!f.resetOnChange?.length),
        ),
        __FB_FORMATS__: JSON.stringify(
          ir.nodes.some(
            (f) => f.type !== "group" && f.validators?.some((v) => v.use.startsWith("format")),
          ),
        ),
      },
      envFile: false,
      root: temp,
      publicDir: false,
      base: "./",
      logLevel: "silent",
      plugins: [proof, tailwindcss(), runtimeTailwind()],
      resolve: {
        alias: {
          react: realpathSync(join(root, "tools/compiler/node_modules/react")),
          "react-dom": realpathSync(join(root, "tools/compiler/node_modules/react-dom")),
          "@fb/static-runtime": join(root, "packages/static-runtime/src/index.ts"),
          "@fb/static-runtime-enhancements": join(
            root,
            "packages/static-runtime/src/enhancements.ts",
          ),
          "@fb/form-engine": join(root, "packages/form-engine/src/index.ts"),
          "@fb/contracts": join(root, "packages/contracts/src/index.ts"),
          "@platform/store-selector/browser": join(
            root,
            "plugins/store-selector/browser/index.tsx",
          ),
          "@platform/motion-presets": join(root, "packages/motion-presets/src/index.ts"),
          "@fb/motion-adapter": join(root, "packages/motion-adapter/src/index.tsx"),
        },
      },
      build: {
        write: false,
        sourcemap: false,
        minify: "oxc",
        modulePreload: false,
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
    if (Array.isArray(result) && result.length !== 1) throw new Error("E-BUILD-OUTPUT");
    const built = Array.isArray(result) ? result[0] : result;
    if (!built || !("output" in built)) throw new Error("E-BUILD-OUTPUT");
    for (const item of built.output)
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
  const themeBytes = Buffer.from(theme.css);
  files.set(`assets/theme.${hash(themeBytes)}.css`, themeBytes);
  chunks.sort((a, b) => compare(a.file, b.file));
  audit(chunks, files, profile);
  const dataContract = {
    localDataContractFormat: 1,
    fields: ir.nodes.map((f) => ({
      id: f.id,
      key: f.key,
      path: f.type !== "group" ? (f.outputPath ?? [f.key]) : [f.key],
      identity: f.type !== "group" ? (f.sourceIdentity ?? f.id) : f.id,
      type: f.type,
      classification: f.classification,
      submit: f.submit ?? "include",
    })),
  };
  const graph = json({ chunkManifestFormat: 1, chunks });
  const manifest: Candidate["manifest"] = {
    localCandidateFormat: 1,
    variant:
      ir.form.formId === "frm_pc_reference"
        ? "pc-demo"
        : resolved.preset === "none"
          ? "sports-demo-nomotion"
          : "sports-demo",
    builderVerification: "VERIFICATION_PENDING",
    form: { ...ir.form, revision: `synthetic-${hash(json(definition)).slice(0, 16)}` },
    inputs: {
      ...(preview ? { previewProjection: `sha256:${hash(json(preview))}` } : {}),
      theme: `sha256:${hash(themeBytes)}`,
      themeResolver: `sha256:${hash(readFileSync(join(root, "tools/compiler/src/themes.ts")))}`,
      blockLock: `sha256:${hash(json(expanded.lock))}`,
      localization: `sha256:${hash(readFileSync(join(root, "tools/compiler/src/l10n.ts")))}`,
      blockResolver: `sha256:${hash(readFileSync(join(root, "tools/compiler/src/blocks.ts")))}`,
      bindingsSource: `sha256:${hash(readFileSync(join(root, "tools/compiler/src/bindings.ts")))}`,
      resolverSource: `sha256:${hash(readFileSync(join(root, "tools/compiler/src/resolve.ts")))}`,
      capabilityLock: `sha256:${hash(resolved.lockBytes)}`,
      compilerSource: `sha256:${hash(readFileSync(new URL(import.meta.url)))}`,
      buildConfig: `sha256:${hash(json({ profile: "sports-demo-nomotion-local", vite: "8.3.5", rolldown: "1.2.15", base: "./", minify: "oxc", hashCharacters: "hex", unsafeEval: false }))}`,
      definition: preview ? `sha256:${preview.sourceDigest}` : `sha256:${hash(json(definition))}`,
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
  const candidateId = candidateIdFor(manifest);
  const entryChunk = chunks.find((c) => c.modules.some((m) => m.id === "gen:entry.ts"));
  if (!entryChunk) throw new Error("E-ENTRY");
  const initial = new Set<string>();
  const visit = (file: string): void => {
    if (initial.has(file)) return;
    initial.add(file);
    for (const child of chunks.find((c) => c.file === file)?.staticImports ?? []) visit(child);
  };
  visit(entryChunk.file);
  if (!profile.plugin && !profile.motion && !preview) {
    const initialJS = [...initial].reduce(
      (n, file) => n + gzipSync(files.get(file) ?? Buffer.alloc(0), { level: 9 }).length,
      0,
    );
    if (initialJS > 12 * 1024)
      throw Object.assign(new Error("E-PERF-INITIAL-JS"), { bytes: initialJS });
  }
  const closure = (start: string): string[] => {
    const found = new Set<string>();
    const walk = (f: string): void => {
      if (found.has(f)) return;
      found.add(f);
      for (const child of chunks.find((c) => c.file === f)?.staticImports ?? []) walk(child);
    };
    walk(start);
    return [...found].sort(compare);
  };
  const group = (name: string) => {
    const c = chunks.find((c) => c.modules.some((m) => m.id === `gen:${name}.ts`));
    return c ? closure(c.file) : [];
  };
  if (
    [...initial].some((f) =>
      chunks.find((c) => c.file === f)?.modules.some((m) => /motion|store-selector/iu.test(m.id)),
    )
  )
    throw new Error("E-GROUP-IN-INITIAL");
  const metadata = {
    mode: preview ? "partial-preview" : "local-candidate",
    ...(preview ? { partial: preview } : {}),
    plugin: resolved.plugin,
    groups: {
      store: group("store"),
      motion: group("motion"),
      ...(extended ? { enhancements: group("enhancements") } : {}),
    },
    assets: manifest.inventory.map((f) => ({ path: f.path, sha256: f.sha256.slice(7) })),
    releaseId: candidateId,
    formId: ir.form.formId,
    siteId: ir.form.siteId,
    revision: manifest.form.revision,
    ir: { path: irPath, sha256: irHash },
  };
  const escape = (s: string) =>
    s.replaceAll("<", "\\u003c").replaceAll(">", "\\u003e").replaceAll("&", "\\u0026");
  const js = manifest.inventory.filter((f) => f.path === entryChunk.file),
    css = manifest.inventory.filter((f) => f.path.endsWith(".css"));
  if (js.length !== 1) throw new Error("E-UNEXPECTED-ENTRY-GRAPH");
  const main = js[0];
  if (!main) throw new Error("E-UNEXPECTED-ENTRY-GRAPH");
  const sri = (path: string) =>
    `sha256-${createHash("sha256")
      .update(files.get(path) ?? Buffer.alloc(0))
      .digest("base64")}`;
  const documentTitle = (
    ir.texts?.formTitle?.ja ||
    (ir.form.formId === "frm_pc_reference"
      ? "PC"
      : ir.form.formId === "frm_sports"
        ? "Sports"
        : "Form Master")
  )
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
  const html = `<!doctype html><html lang="ja" class="${compactClasses(rootUtilities).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;")}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${documentTitle} · Local Synthetic</title>${css.map((f) => `<link rel="stylesheet" href="./${f.path}" integrity="${sri(f.path)}" crossorigin="anonymous">`).join("")}</head><body><main id="app" aria-live="polite">読み込み中…</main><script type="application/json" id="release">${escape(canonicalJson(metadata))}</script><script type="module" src="./${main.path}" integrity="${sri(main.path)}" crossorigin="anonymous"></script></body></html>`;
  files.set("index.html", Buffer.from(html));
  if (!profile.plugin && !profile.motion && !preview) {
    const size = [...initial, "index.html", ...css.map((f) => f.path)].reduce(
      (n, file) => n + gzipSync(files.get(file) ?? Buffer.alloc(0), { level: 9 }).length,
      0,
    );
    if (size > 16 * 1024) throw Object.assign(new Error("E-PERF-INITIAL-TOTAL"), { bytes: size });
  }
  audit(chunks, files, profile);
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
    ["capability-lock.json", resolved.lockBytes],
    ["block-lock.json", json(expanded.lock)],
    [
      "local-integrity.json",
      json({ manifestDigest: hash(json(manifest)), indexHtmlDigest: hash(Buffer.from(html)) }),
    ],
  ] as const) {
    const path = join(privateDir, name);
    if (existsSync(path) && !readFileSync(path).equals(data))
      throw new Error("E-CANDIDATE-COLLISION");
    if (!existsSync(path)) writeFileSync(path, data, { flag: "wx" });
  }
  return { candidateId, directory, urlPath: `/r/${candidateId}/index.html`, manifest, chunks };
}
