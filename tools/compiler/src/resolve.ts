import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { canonicalJson, type FormDefinitionV1, type EngineIRV1 } from "@fb/contracts";
import { subtle, guided } from "@platform/motion-presets";
export const digest = (x: string | Uint8Array) => createHash("sha256").update(x).digest("hex");
export function resolveAssets(root: string, d: FormDefinitionV1, ir: EngineIRV1) {
  const declared = d.dependencies?.capabilities.storeSel;
  const plugin = ir.nodes.some((f) => f.type === "plugin:storeSel");
  if (plugin !== !!declared) throw new Error("E-CAPABILITY-UNDECLARED");
  const manifestPath = join(root, "plugins/store-selector/plugin.manifest.json");
  const manifest = JSON.parse(
    plugin
      ? readFileSync(manifestPath, "utf8")
      : '{"plugin":"","version":"","facets":{"browser":{"packageExport":""},"server":{"pythonPackage":""}},"capabilities":[]}',
  ) as {
    plugin: string;
    version: string;
    facets: { browser: { packageExport: string }; server: { pythonPackage: string } };
    capabilities: {
      id: string;
      kind: string;
      bindings: { browser?: string; server?: string; design?: string };
      verification?: { policy: string; check: string };
    }[];
  };
  if (
    plugin &&
    `sha256:${digest(Buffer.from(canonicalJson(manifest)))}` !==
      "sha256:6297222ec6f4e8e0760f8ffe6c5799a960684286286515316694bbfd5d66e806"
  )
    throw new Error("E-PLUGIN-MANIFEST-DIGEST");
  if (
    plugin &&
    (manifest.plugin !== declared?.plugin ||
      manifest.version !== declared.version ||
      manifest.facets.browser.packageExport !== "./browser" ||
      manifest.facets.server.pythonPackage !== "store_selector_server" ||
      manifest.capabilities.length !== 3 ||
      manifest.capabilities.some((c) => c.bindings.design) ||
      manifest.capabilities.find((c) => c.id === "storeSelector")?.verification?.policy !==
        "authoritativeCheck" ||
      manifest.capabilities.find((c) => c.id === "storeSelector")?.verification?.check !==
        "storeIdValid" ||
      !manifest.capabilities.some(
        (c) =>
          c.id === "storeSelector" &&
          c.kind === "fieldType" &&
          c.bindings.browser === "StoreSelectorField",
      ))
  )
    throw new Error("E-PLUGIN-CONTRACT");
  const browserDigest = digest(
    readFileSync(join(root, "plugins/store-selector/browser/index.tsx")),
  );
  const serverDigest = digest(
    readFileSync(join(root, "plugins/store-selector/server/store_selector_server.py")),
  );
  const pluginManifestDigest = digest(readFileSync(manifestPath));
  const lock = plugin
    ? {
        localWorkspaceIdentity: `dev:@platform/store-selector@1.0.0+ws.${browserDigest.slice(0, 12)}`,
        manifestDigest: `sha256:${pluginManifestDigest}`,
        bindings: [
          {
            key: {
              plugin: manifest.plugin,
              version: manifest.version,
              capability: "storeSelector",
              facet: "browser",
            },
            sourceDigest: `sha256:${browserDigest}`,
          },
          {
            key: {
              plugin: manifest.plugin,
              version: manifest.version,
              capability: "storeList",
              facet: "server",
            },
            sourceDigest: `sha256:${serverDigest}`,
          },
          {
            key: {
              plugin: manifest.plugin,
              version: manifest.version,
              capability: "storeIdValid",
              facet: "server",
            },
            sourceDigest: `sha256:${serverDigest}`,
          },
        ],
      }
    : { bindings: [] };
  const preset = d.motion?.preset.id ?? "none";
  if (preset === "none" && (d.motion?.categories || d.motion?.speed))
    throw new Error("E-MOTION-NONE-CONFIG");
  const selected = preset === "guided" ? guided : subtle;
  const keys = {
    step: "stepTransition",
    reveal: "conditionalReveal",
    validation: "validationFeedback",
    submit: "submitFeedback",
  } as const;
  const recipes =
    preset === "none"
      ? []
      : selected
          .filter((r) => d.motion?.categories?.[keys[r.kind]] !== "off")
          .map((r) => ({
            ...r,
            durationMs: Math.round(
              r.durationMs *
                (d.motion?.speed === "slow" ? 1.3 : d.motion?.speed === "fast" ? 0.75 : 1),
            ),
          }));
  if (preset !== "none")
    ir.motion = {
      presetRef: {
        package: "@platform/motion-presets",
        version: "1.0.0",
        digest: `sha256:${digest(readFileSync(join(root, "packages/motion-presets/src/index.ts")))}`,
      },
      recipesByCategory: Object.fromEntries(recipes.map((r) => [r.kind, r.id])),
      durationsMs: Object.fromEntries(recipes.map((r) => [r.kind, r.durationMs])),
      reduced: "none",
    };
  return { plugin, preset, recipes, lock, lockBytes: Buffer.from(canonicalJson(lock)) };
}
