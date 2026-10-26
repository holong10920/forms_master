import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { compile, root } from "./build.ts";
import type { FormDefinitionV1 } from "@fb/contracts";
export function publication(
  action: "publish" | "rollback" | "active",
  request: unknown,
): { candidateId?: string; version?: number } {
  return JSON.parse(
    execFileSync(
      "uv",
      ["run", "--locked", "--offline", "python", "-m", "tools.compiler.local_publish", action],
      { cwd: root, input: JSON.stringify(request), encoding: "utf8", timeout: 30000 },
    ),
  ) as { candidateId?: string; version?: number };
}
export async function publishDemo() {
  const definition = JSON.parse(
    readFileSync(join(root, "contracts/fixtures/engine/sports.json"), "utf8"),
  ) as FormDefinitionV1;
  const form = definition.formId,
    site = definition.siteId;
  const start = publication("active", { site, form }).version ?? 0;
  const a = await compile(definition, join(root, "var/s2-candidates"));
  const first = publication("publish", { path: a.directory, expected: start });
  const email = definition.fields.find((f) => f.id === "fld_email");
  if (!email || email.type === "group") throw new Error("fixture");
  email.required = true;
  const b = await compile(definition, join(root, "var/s2-candidates"));
  const second = publication("publish", { path: b.directory, expected: start + 1 });
  const rollback = publication("rollback", {
    site,
    form,
    target: a.candidateId,
    expected: start + 2,
  });
  return {
    first,
    second,
    rollback,
    active: publication("active", { site, form }),
    alias: `http://127.0.0.1:4173/forms/${site}/${form}/`,
  };
}
