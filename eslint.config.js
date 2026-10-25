import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig(
  {
    ignores: [
      "spikes/**",
      ".venv/**",
      "python/**",
      "docs/**",
      "var/**",
      ".tools/**",
      "contracts/vendor/**",
      "tools/lint-fixtures/fixtures/**",
      "tools/boundaries/fixtures/**",
    ],
  },
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ["*.js", "*.cjs", "*.ts", "tools/test-setup/no-network.ts"],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // SEC-02: no dynamic code evaluation anywhere.
      "no-eval": "error",
      "no-new-func": "error",
      "@typescript-eslint/no-implied-eval": "error",
    },
  },
  {
    files: ["**/*.js", "**/*.cjs"],
    extends: [tseslint.configs.disableTypeChecked],
  },
  {
    files: ["**/*.cjs"],
    languageOptions: { sourceType: "commonjs", globals: { module: "readonly" } },
  },
);
