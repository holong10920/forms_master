import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["tools/test-setup/no-network.ts"],
    include: ["packages/*/test/**/*.test.ts", "tools/*/test/**/*.test.ts"],
    exclude: ["**/node_modules/**", "spikes/**", "var/**"],
  },
});
