import postcss from "postcss";
import selectorParser from "postcss-selector-parser";
import type { Plugin } from "vite";
import * as recipes from "../../../packages/static-runtime/src/recipes.ts";
import * as displayRecipes from "../../../packages/static-runtime/src/display-recipes.ts";

// Release artifacts use compact deterministic utility names. Source stays readable Tailwind;
// semantic DOM hooks and selectors are preserved. Only trusted runtime recipes are considered.
const hooks = new Set([
  "field",
  "actions",
  "formTitle",
  "help",
  "form-fields",
  "choice-group",
  "choice-option",
]);
const tokens = (values: string[]) =>
  [
    ...new Set(values.flatMap((value) => value.split(/\s+/).filter((t) => t && !hooks.has(t)))),
  ].sort();
// Display utilities are numbered after the core set so core aliases stay stable.
const core = tokens(Object.values(recipes));
const utilities = [
  ...core,
  ...tokens(Object.values(displayRecipes)).filter((t) => !core.includes(t)),
];
const aliases = new Map(utilities.map((utility, index) => [utility, "tw_" + index.toString(36)]));
export function compactClasses(value: string): string {
  return value
    .split(/\s+/)
    .map((token) => aliases.get(token) ?? token)
    .join(" ");
}
export function runtimeTailwind(polished = false, display = true): Plugin {
  return {
    name: "pinned-tailwind-utilities",
    enforce: "pre",
    transform(code, id) {
      const path = id.split("?")[0]?.replaceAll("\\", "/");
      const source = path?.endsWith("/packages/static-runtime/src/recipes.ts")
        ? recipes
        : path?.endsWith("/packages/static-runtime/src/display-recipes.ts")
          ? displayRecipes
          : undefined;
      if (source) {
        return {
          code: Object.entries(source)
            .map(
              ([key, value]) => `export const ${key} = ${JSON.stringify(compactClasses(value))};`,
            )
            .join("\n"),
          map: null,
        };
      }
      if (!path?.endsWith("/packages/static-runtime/src/tailwind.css")) return;
      const sheet = postcss.parse(code);
      sheet.walkRules((rule) => {
        if (
          !polished &&
          /\.layout-wide|\.controls-outlined|\.progress-compact/u.test(rule.selector)
        ) {
          rule.remove();
          return;
        }
        if (!display && /\.display-item/u.test(rule.selector)) {
          rule.remove();
          return;
        }
        rule.selector = selectorParser((selectors) =>
          selectors.walkClasses((node) => {
            const alias = aliases.get(node.value);
            if (alias) node.value = alias;
          }),
        ).processSync(rule.selector);
      });
      return { code: sheet.toString(), map: null };
    },
  };
}
