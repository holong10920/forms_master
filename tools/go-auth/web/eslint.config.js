import js from "@eslint/js";
import ts from "typescript-eslint";
export default [
  { ignores: ["dist/**", "public/studio/**", "node_modules/**"] },
  js.configs.recommended,
  ...ts.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
  },
  { files: ["*.js"], ...ts.configs.disableTypeChecked },
];
