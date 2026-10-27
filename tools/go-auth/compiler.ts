import { validateSchema } from "../../packages/contracts/src/schema.ts";
// Fixed compiler IPC: no HTTP listener and no Python business adapter.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { compile, root } from "../compiler/src/build.ts";
import { compileRelease } from "../compiler/src/release.ts";
import { expandBlocks, bindBlocks, blockCatalog } from "../compiler/src/blocks.ts";
import { themes } from "../compiler/src/themes.ts";
import { systemTexts } from "../compiler/src/l10n.ts";
import { loadDefinition } from "../../packages/form-engine/src/definition.ts";
import { projectPreview } from "../../packages/form-engine/src/preview.ts";
import { canonicalJson } from "../../packages/contracts/src/jcs.ts";
import { createHash } from "node:crypto";
import type { FormDefinitionV1 } from "../../packages/contracts/src/generated/form-definition.v1.ts";
const sha = (v: unknown) => createHash("sha256").update(canonicalJson(v)).digest("hex");
const chunks: Buffer[] = [];
for await (const c of process.stdin) {
  chunks.push(Buffer.from(c as Uint8Array));
  if (chunks.reduce((n, b) => n + b.length, 0) > 2100000) throw Error("E-BODY-LIMIT");
}
const input = JSON.parse(Buffer.concat(chunks).toString()) as {
  action: string;
  definition: FormDefinitionV1;
  partial?: boolean;
  blocked?: boolean;
};
let result: unknown;
try {
  if (input.action === "catalog")
    result = {
      themes,
      texts: systemTexts,
      blocks: blockCatalog(),
      schema: JSON.parse(
        readFileSync(join(root, "contracts/schemas/form-definition/v1.schema.json"), "utf8"),
      ) as unknown,
    };
  else if (input.action === "schema") {
    if (!validateSchema("form-definition/v1", input.definition).valid)
      throw Error("E-DEFINITION-SCHEMA");
    result = { valid: true };
  } else if (["lower", "compile", "release"].includes(input.action)) {
    let definition = input.definition;
    let options: import("../compiler/src/build.ts").PreviewOptions | undefined;
    if (input.partial) {
      const projected = projectPreview(definition, !!input.blocked);
      if (projected.stops.length || projected.blockedFields.length) {
        definition = projected.definition;
        options = {
          sourceDigest: sha(input.definition),
          stops: projected.stops,
          blockedFields: projected.blockedFields,
          diagnostics: projected.diagnostics,
        };
      }
    }
    const expanded = expandBlocks(definition);
    const ir = loadDefinition(expanded.definition);
    bindBlocks(ir, expanded.bindings);
    if (input.action === "lower") result = { ir, diagnostics: [] };
    else {
      const out = join(root, "var/master-candidates");
      const c =
        input.action === "release"
          ? await compileRelease(definition, out)
          : await compile(definition, out, options);
      result = {
        candidateId: c.candidateId,
        diagnostics: options?.diagnostics ?? [],
        partial: !!options,
      };
    }
  } else throw Error("E-ACTION");
  process.stdout.write(JSON.stringify({ ok: true, result }));
} catch (e) {
  process.stdout.write(
    JSON.stringify({
      ok: false,
      code: "DEFINITION_INVALID",
      diagnostics: [e instanceof Error ? e.message : "E-COMPILER"],
    }),
  );
  process.exitCode = 1;
}
