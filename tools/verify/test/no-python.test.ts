import { existsSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { expect, test } from "vitest";
const root = resolve(import.meta.dirname, "../../..");
function ownedPython(path: string): string[] {
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    if (
      entry.isSymbolicLink() ||
      ["node_modules", "evidence", "dist", "public"].includes(entry.name)
    )
      return [];
    const file = join(path, entry.name);
    return entry.isDirectory() ? ownedPython(file) : entry.name.endsWith(".py") ? [file] : [];
  });
}
test("active repository has no Python source, environment, configuration or legacy host", () => {
  for (const dir of ["tools", "packages", "plugins", "contracts"])
    expect(ownedPython(join(root, dir))).toEqual([]);
  for (const file of [
    "python",
    ".venv",
    "pyproject.toml",
    "uv.lock",
    ".python-version",
    "tools/local_p0",
  ])
    expect(existsSync(join(root, file)), file).toBe(false);
});
