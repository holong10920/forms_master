import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({
  plugins: [tailwindcss()],
  server: {
    watch: { usePolling: true },
    proxy: {
      "/healthz": { target: "http://127.0.0.1:4181", changeOrigin: false },
      "/api": { target: "http://127.0.0.1:4181", changeOrigin: false },
    },
  },
});
