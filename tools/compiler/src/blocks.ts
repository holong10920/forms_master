import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { validateSchema, type FormDefinitionV1, type EngineIRV1 } from "@fb/contracts";
const root = fileURLToPath(new URL("../../../", import.meta.url));
const sha = (v: string | Uint8Array) => createHash("sha256").update(v).digest("hex");
interface Block {
  schemaVersion: string;
  kind: string;
  blockId: string;
  revision: string;
  inputs: Record<string, { type: string; default?: unknown }>;
  exports: { id: string; field: string }[];
  fields: FormDefinitionV1["fields"];
}
export function blockCatalog() {
  const registry = JSON.parse(
    readFileSync(join(root, "contracts/fixtures/blocks/registry.json"), "utf8"),
  ) as Record<string, string>;
  return Object.entries(registry)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([pin, digest]) => {
      if (!/^blk_customer_info@r[12]$/u.test(pin)) throw Error("E-BLOCK-UNTRUSTED");
      const raw = readFileSync(join(root, "contracts/fixtures/blocks", pin + ".json"));
      if (sha(raw) !== digest) throw Error("E-BLOCK-INTEGRITY");
      const block = JSON.parse(raw.toString()) as Block;
      if (block.kind !== "block" || `${block.blockId}@${block.revision}` !== pin)
        throw Error("E-BLOCK-PIN");
      return { pin, digest, block };
    });
}
function fold(value: unknown, inputs: Record<string, unknown>, refs: Map<string, string>): unknown {
  if (Array.isArray(value)) return value.map((v) => fold(v, inputs, refs));
  if (value && typeof value === "object") {
    const x = value as Record<string, unknown>;
    if (Object.keys(x).length === 1 && typeof x.input === "string") {
      if (!Object.hasOwn(inputs, x.input)) throw Error("E-BLOCK-INPUT");
      return { const: inputs[x.input] };
    }
    if (Object.keys(x).length === 1 && typeof x.ref === "string" && !x.ref.startsWith("$item:")) {
      const ref = refs.get(x.ref);
      if (!ref) throw Error("E-BLOCK-PRIVATE-REF");
      return { ref: "$local:" + ref };
    }
    return Object.fromEntries(Object.entries(x).map(([k, v]) => [k, fold(v, inputs, refs)]));
  }
  return value;
}
export function expandBlocks(value: unknown) {
  if (!validateSchema("form-definition/v1", value).valid) throw Error("E-DEFINITION-SCHEMA");
  const original = value as FormDefinitionV1;
  if (!original.blockInstances?.length)
    return {
      definition: original,
      bindings: new Map<string, { outputPath: [string, string]; sourceIdentity: string }>(),
      lock: [] as { instance: string; alias: string; pin: string; digest: string }[],
    };
  const d = structuredClone(original),
    bindings = new Map<string, { outputPath: [string, string]; sourceIdentity: string }>(),
    lock: { instance: string; alias: string; pin: string; digest: string }[] = [],
    instances = new Map<string, string[]>(),
    external = new Map<string, string>();
  const ids = new Set<string>(),
    aliases = new Set<string>(),
    catalog = blockCatalog();
  for (const instance of original.blockInstances) {
    if (
      !/^inst_[a-zA-Z0-9_]+$/u.test(instance.id) ||
      !/^[a-zA-Z][a-zA-Z0-9_]*$/u.test(instance.alias) ||
      ids.has(instance.id) ||
      aliases.has(instance.alias) ||
      ["constructor", "prototype", "__proto__"].includes(instance.alias)
    )
      throw Error("E-BLOCK-IDENTITY");
    ids.add(instance.id);
    aliases.add(instance.alias);
    const pin = original.dependencies?.blocks?.[instance.block],
      entry = catalog.find((b) => b.pin === pin);
    if (!entry) throw Error("E-BLOCK-PIN");
    const inputs = {
      ...Object.fromEntries(Object.entries(entry.block.inputs).map(([k, s]) => [k, s.default])),
      ...instance.inputs,
    };
    for (const [k, v] of Object.entries(inputs))
      if (!entry.block.inputs[k] || typeof v !== entry.block.inputs[k].type)
        throw Error("E-BLOCK-INPUT");
    const local = new Map<string, string>();
    for (const f of entry.block.fields) {
      if (f.type === "group" || f.type === "plugin:storeSel") throw Error("E-BLOCK-PROFILE");
      local.set("$local:" + f.id, "fld_" + sha(instance.id + ":" + f.id).slice(0, 24));
    }
    for (const e of entry.block.exports) {
      const id = local.get("$local:" + e.field);
      if (!id) throw Error("E-BLOCK-EXPORT");
      external.set(instance.id + ":@" + e.id, id);
    }
    const expanded: string[] = [];
    for (const field of entry.block.fields) {
      const id = local.get("$local:" + field.id);
      if (!id) throw Error("E-BLOCK-IDENTITY");
      const f = fold(field, inputs, local) as FormDefinitionV1["fields"][number];
      f.id = id;
      f.key = "block_" + id.slice(4);
      d.fields.push(f);
      bindings.set(id, {
        outputPath: [instance.alias, field.key],
        sourceIdentity: instance.id + ":" + field.id,
      });
      expanded.push(id);
    }
    instances.set(instance.id, expanded);
    lock.push({
      instance: instance.id,
      alias: instance.alias,
      pin: entry.pin,
      digest: entry.digest,
    });
  }
  const rewrite = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(rewrite);
    if (v && typeof v === "object") {
      const x = v as Record<string, unknown>;
      if (
        typeof x.ref === "string" &&
        !x.ref.startsWith("$local:") &&
        !x.ref.startsWith("$item:")
      ) {
        const id = external.get(x.ref);
        if (!id) throw Error("E-BLOCK-PRIVATE-REF");
        return { ref: "$local:" + id };
      }
      return Object.fromEntries(Object.entries(x).map(([k, v]) => [k, rewrite(v)]));
    }
    return v;
  };
  d.fields = d.fields.map((f) => rewrite(f) as typeof f);
  d.conditions = rewrite(d.conditions ?? {}) as NonNullable<FormDefinitionV1["conditions"]>;
  for (const step of d.steps) {
    step.content = (step.content ?? []).flatMap((c) => {
      if (!("block" in c)) return [c];
      const fields = instances.get(c.block);
      if (!fields) throw Error("E-BLOCK-INSTANCE");
      return fields.map((id) => ({ field: "$local:" + id }));
    });
    if (step.transitions) step.transitions = rewrite(step.transitions) as typeof step.transitions;
  }
  delete d.blockInstances;
  if (d.dependencies) delete d.dependencies.blocks;
  return { definition: d, bindings, lock };
}
export function bindBlocks(ir: EngineIRV1, bindings: ReturnType<typeof expandBlocks>["bindings"]) {
  for (const f of ir.nodes)
    if (f.type !== "group") {
      const binding = bindings.get(f.id);
      if (binding) Object.assign(f, binding);
    }
}
