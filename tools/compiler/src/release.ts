import { gzipSync } from "node:zlib";
/** Host release orchestration. Canonical container K13 remains a distinct, mandatory gate. */
import {
  readFileSync,
  readdirSync,
  mkdtempSync,
  mkdirSync,
  existsSync,
  writeFileSync,
  rmSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { canonicalJson, type EngineIRV1 } from "@fb/contracts";
import { createSession, snapshot, payloadPreview, validation } from "@fb/form-engine";
import { compile, audit, candidateIdFor, root, type Candidate } from "./build.ts";
const sha = (v: string | Uint8Array) => createHash("sha256").update(v).digest("hex");
const bytes = (v: unknown) => Buffer.from(canonicalJson(v));
function tree(dir: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const item of readdirSync(dir, { withFileTypes: true })) {
    if (item.isDirectory())
      for (const [p, d] of Object.entries(tree(join(dir, item.name))))
        result[item.name + "/" + p] = d;
    else result[item.name] = sha(readFileSync(join(dir, item.name)));
  }
  return result;
}
function once(path: string, data: Buffer) {
  mkdirSync(join(path, ".."), { recursive: true });
  if (existsSync(path)) {
    if (!readFileSync(path).equals(data)) throw Error("E-RELEASE-ID-COLLISION");
  } else writeFileSync(path, data, { flag: "wx" });
}
const bootstrap =
  'let p=JSON.parse(document.querySelector("#release").textContent).load,s=document.createElement("script");s.type="module";s.src=p.entry;s.integrity=p.entryIntegrity;document.head.append(s);';
const template =
  "canonical-release-html-v1:external-bootstrap+sri;metadata-jcs;no-inline-executable";
export async function compileRelease(
  definition: unknown,
  outRoot: string,
  verifyFinal = true,
): Promise<Candidate> {
  const work = mkdtempSync(join(tmpdir(), "fb-k13-host-"));
  try {
    const a = await compile(definition, join(work, "a")),
      b = await compile(definition, join(work, "b"));
    if (
      a.candidateId !== b.candidateId ||
      canonicalJson(tree(a.directory)) !== canonicalJson(tree(b.directory)) ||
      canonicalJson(tree(join(work, "a/private", a.candidateId))) !==
        canonicalJson(tree(join(work, "b/private", b.candidateId)))
    )
      throw Error("E-BUILD-NON-REPRODUCIBLE");
    const privateDir = join(work, "a/private", a.candidateId),
      files = new Map<string, Buffer>();
    for (const asset of a.manifest.inventory)
      files.set(asset.path, readFileSync(join(a.directory, asset.path)));
    const original = readFileSync(join(a.directory, "index.html"), "utf8");
    const metadataMatch = /<script type="application\/json" id="release">([^]*?)<\/script>/u.exec(
      original,
    );
    if (!metadataMatch?.[1]) throw Error("E-RELEASE-HTML");
    const pin = JSON.parse(metadataMatch[1]) as {
      releaseId: string;
      mode: string;
      groups: { store: string[]; motion: string[] };
      ir: { path: string };
      assets: { path: string; sha256: string }[];
      load?: { entry: string; entryIntegrity: string };
    };
    const entry = /<script type="module" src="\.\/([^"]+)" integrity="([^"]+)"/u.exec(original);
    if (!entry?.[1] || !entry[2]) throw Error("E-ENTRY");
    const bootstrapPath = "assets/bootstrap." + sha(bootstrap) + ".js";
    files.set(bootstrapPath, Buffer.from(bootstrap));
    const graph = JSON.parse(readFileSync(join(privateDir, "chunk-manifest.json"), "utf8")) as {
      chunks: Candidate["chunks"];
    };
    graph.chunks.push({
      file: bootstrapPath,
      modules: [{ id: "platform:@fb/compiler@0.1.0/bootstrap", bytes: bootstrap.length }],
      staticImports: [entry[1]],
      dynamicImports: [],
    });
    graph.chunks.sort((x, y) => (x.file < y.file ? -1 : 1));
    const initial = new Set<string>();
    const visit = (path: string) => {
      if (initial.has(path)) return;
      initial.add(path);
      for (const child of graph.chunks.find((c) => c.file === path)?.staticImports ?? [])
        visit(child);
    };
    visit(bootstrapPath);
    const plan = { chunkPlanFormat: 1, initial: [...initial].sort(), groups: pin.groups };
    const inventory = [...files]
      .map(([path, data]) => ({
        path,
        size: data.length,
        sha256: "sha256:" + sha(data),
        contentType: path.endsWith(".js")
          ? "text/javascript"
          : path.endsWith(".css")
            ? "text/css"
            : "application/json",
      }))
      .sort((x, y) => (x.path < y.path ? -1 : 1));
    const manifest: Candidate["manifest"] = {
      lrmFormat: 1,
      formats: { draftFormat: 1, loadFormat: 1 },
      form: a.manifest.form,
      inputs: {
        ...a.manifest.inputs,
        chunkPlan: "sha256:" + sha(bytes(plan)),
        chunkManifest: "sha256:" + sha(bytes(graph)),
        bootstrap: "sha256:" + sha(bootstrap),
        releaseHtmlTemplate: "sha256:" + sha(template),
      },
      toolchain: {
        ...a.manifest.toolchain,
        engine: "0.1.0",
        browserHostApi: "0.1.0",
        packageManager: "pnpm@12.15.0",
        lockfile: a.manifest.inputs.lockfile ?? "",
        verificationScope: "HOST_ONLY",
        hostNodeDigest: "sha256:" + sha(readFileSync(process.execPath)),
      },
      inventory,
    };
    const id = candidateIdFor(manifest);
    pin.releaseId = id;
    pin.mode = "canonical-release";
    pin.load = { entry: entry[1], entryIntegrity: entry[2] };
    pin.assets = inventory.map((f) => ({ path: f.path, sha256: f.sha256.slice(7) }));
    const escape = (s: string) =>
      s.replaceAll("<", "\\u003c").replaceAll(">", "\\u003e").replaceAll("&", "\\u0026");
    const html = original
      .replace(
        /<script type="application\/json" id="release">[^]*?<\/script>/u,
        '<script type="application/json" id="release">' + escape(canonicalJson(pin)) + "</script>",
      )
      .replace(
        /<script type="module" src="[^]*?<\/script>/u,
        '<script type="module" src="./' +
          bootstrapPath +
          '" integrity="sha256-' +
          createHash("sha256").update(bootstrap).digest("base64") +
          '" crossorigin="anonymous"></script>',
      );
    files.set("index.html", Buffer.from(html));
    audit(graph.chunks, files, {
      plugin: pin.groups.store.length > 0,
      motion: pin.groups.motion.length > 0,
    });
    if (!pin.groups.store.length && !pin.groups.motion.length) {
      const gzip = (paths: string[]) =>
        paths.reduce(
          (n, p) => n + gzipSync(files.get(p) ?? Buffer.alloc(0), { level: 9 }).length,
          0,
        );
      if (
        gzip([...initial]) > 12 * 1024 ||
        gzip([
          ...initial,
          "index.html",
          ...inventory.filter((f) => f.path.endsWith(".css")).map((f) => f.path),
        ]) >
          16 * 1024
      )
        throw Error(
          "E-PERF-CANONICAL-INITIAL:" +
            String(gzip([...initial])) +
            ":" +
            String(
              gzip([
                ...initial,
                "index.html",
                ...inventory.filter((f) => f.path.endsWith(".css")).map((f) => f.path),
              ]),
            ),
        );
    }
    const ir = JSON.parse(readFileSync(join(a.directory, pin.ir.path), "utf8")) as EngineIRV1;
    const review = ir.steps.find((s) => s.kind === "review")?.id ?? ir.steps[0].id;
    const values: Record<string, string | number | boolean | string[]> = {};
    for (const f of ir.nodes)
      if (f.type !== "group" && !f.formula)
        values[f.id] =
          f.type === "number"
            ? 1
            : f.type === "boolean"
              ? true
              : f.type === "choice.checkboxes"
                ? [f.options?.[0]?.value ?? "synthetic"]
                : (f.options?.[0]?.value ??
                  (f.type === "email" ? "synthetic@example.invalid" : "Synthetic"));
    const cases = [{}, values].map((v, i) => {
      const state = { ...createSession(ir, v), current: review },
        view = snapshot(ir, state);
      return {
        name: "generated-" + String(i),
        current: review,
        values: v,
        expected: {
          path: view.path,
          active: [...view.active].sort(),
          errors: validation(ir, state, true),
          payload: payloadPreview(ir, state),
        },
      };
    });
    const fixtures = { semanticFixtureFormat: 1, irDigest: a.manifest.inputs.ir, cases };
    const python = execFileSync(
      join(root, ".venv/bin/python"),
      [join(root, "tools/engine-demo/adapter.py"), "--ir", join(a.directory, pin.ir.path)],
      { input: JSON.stringify(cases), cwd: root, encoding: "utf8" },
    );
    if (canonicalJson(JSON.parse(python)) !== canonicalJson(cases.map((c) => c.expected)))
      throw Error("E-SEMANTIC-CONFORMANCE");
    const artifactSet = [...files]
      .map(([path, data]) => ({ path, sha256: sha(data) }))
      .sort((x, y) => (x.path < y.path ? -1 : 1));
    if (verifyFinal) {
      const other = await compileRelease(definition, join(work, "final-b"), false);
      const expected = Object.fromEntries([...files].map(([path, data]) => [path, sha(data)]));
      if (
        other.candidateId !== id ||
        canonicalJson(other.manifest) !== canonicalJson(manifest) ||
        canonicalJson(tree(other.directory)) !== canonicalJson(expected)
      )
        throw Error("E-BUILD-NON-REPRODUCIBLE");
    }
    const provenance = {
      source: {
        commit: execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim(),
        treeClean:
          execFileSync("git", ["status", "--porcelain"], { cwd: root, encoding: "utf8" }).trim() ===
          "",
      },
      builder: { execution: "host", imageVerification: "VERIFICATION_PENDING" },
      buildInstructions: {
        command: "compiler release",
        hostOrchestratorDigest: "sha256:" + sha(readFileSync(new URL(import.meta.url))),
      },
      toolchain: manifest.toolchain,
      reproducibility: {
        runA: tree(a.directory),
        runB: tree(b.directory),
        identical: true,
        finalIdentical: verifyFinal,
        canonicalPublicFiles: Object.fromEntries(
          [...files].map(([path, data]) => [path, sha(data)]),
        ),
        scope: "HOST_ONLY",
      },
      resolvedDependencies: [{ name: "pnpm-lock.yaml", digest: manifest.inputs.lockfile }],
      semanticFixturesDigest: "sha256:" + sha(bytes(fixtures)),
    };
    const destination = join(outRoot, "r", id),
      privateOut = join(outRoot, "private", id);
    mkdirSync(destination, { recursive: true });
    mkdirSync(privateOut, { recursive: true });
    if (existsSync(join(privateOut, "attestation.json"))) {
      const old = JSON.parse(readFileSync(join(privateOut, "attestation.json"), "utf8")) as {
        artifactSetDigest: string;
      };
      if (old.artifactSetDigest !== "sha256:" + sha(bytes(artifactSet)))
        throw Error("E-RELEASE-ID-COLLISION");
    }
    const attestation = {
      attestationFormat: 1,
      releaseId: id,
      lrmDigest: "sha256:" + sha(bytes(manifest)),
      indexHtmlSha256: sha(Buffer.from(html)),
      artifactSetDigest: "sha256:" + sha(bytes(artifactSet)),
      provenanceDigest: "sha256:" + sha(bytes(provenance)),
      semanticFixturesDigest: "sha256:" + sha(bytes(fixtures)),
      verificationScope: "HOST_ONLY",
      canonicalK13: "VERIFICATION_PENDING",
    };
    for (const [path, data] of files) once(join(destination, path), data);
    if (
      canonicalJson(Object.keys(tree(destination)).sort()) !==
      canonicalJson([...files.keys()].sort())
    )
      throw Error("E-ARTIFACT-UNEXPECTED-FILE");
    for (const name of ["data-contract.json", "capability-lock.json", "block-lock.json"])
      once(join(privateOut, name), readFileSync(join(privateDir, name)));
    for (const [name, data] of [
      ["candidate-manifest.json", bytes(manifest)],
      ["lrm.json", bytes(manifest)],
      ["chunk-manifest.json", bytes(graph)],
      ["chunk-plan.json", bytes(plan)],
      ["semantic-fixtures.json", bytes(fixtures)],
      [
        "local-integrity.json",
        bytes({ manifestDigest: sha(bytes(manifest)), indexHtmlDigest: sha(Buffer.from(html)) }),
      ],
    ] as const)
      once(join(privateOut, name), data);
    // Immutable release attestation belongs to the first registration; later builds add verification records.
    if (!existsSync(join(privateOut, "attestation.json"))) {
      once(join(privateOut, "provenance.json"), bytes(provenance));
      once(join(privateOut, "attestation.json"), bytes(attestation));
    }
    once(join(outRoot, "verification", id, sha(bytes(provenance)) + ".json"), bytes(provenance));
    return {
      candidateId: id,
      directory: destination,
      urlPath: "/r/" + id + "/index.html",
      manifest,
      chunks: graph.chunks,
    };
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}
