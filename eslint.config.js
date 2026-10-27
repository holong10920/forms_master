import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig(
  {
    ignores: [
      "spikes/**",
      ".venv/**",
      "docs/**",
      "var/**",
      ".tools/**",
      "contracts/vendor/**",
      "tools/lint-fixtures/fixtures/**",
      "tools/go-auth/web/public/studio/**",
      "tools/go-auth/web/dist/**",
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
  {
    files: ["packages/contracts/src/generated/**/*.ts"],
    rules: { "@typescript-eslint/no-empty-object-type": "off" },
  },
  {
    files: ["packages/form-engine/src/**/*.ts"],
    rules: {
      "no-restricted-globals": ["error", "Date", "fetch", "performance"],
      "no-restricted-properties": [
        "error",
        { object: "Math", property: "random" },
        { object: "crypto", property: "getRandomValues" },
        { object: "crypto", property: "randomUUID" },
      ],
    },
  },
  {
    files: ["plugins/*/browser/**/*.{ts,tsx}", "packages/motion-adapter/src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-globals": [
        "error",
        "fetch",
        "XMLHttpRequest",
        "WebSocket",
        "localStorage",
        "sessionStorage",
        "document",
        "location",
      ],
      "no-restricted-properties": ["error", { object: "Math", property: "random" }],
    },
  },
  {
    files: ["tools/go-auth/studio/*.js"],
    languageOptions: {
      parserOptions: { projectService: false },
      globals: Object.fromEntries(
        [
          "window",
          "document",
          "fetch",
          "location",
          "history",
          "parent",
          "Option",
          "Headers",
          "URL",
          "DOMParser",
          "crypto",
        ].map((k) => [k, "readonly"]),
      ),
    },
  },
);
