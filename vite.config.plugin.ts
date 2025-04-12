// vite.config.plugin.ts
import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: false,
    rollupOptions: {
      input: resolve(__dirname, "src/plugin/code.ts"),
      output: {
        entryFileNames: "code.js",
      },
    },
  },
});
