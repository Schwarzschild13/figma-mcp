// vite.config.plugin.ts
import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, "src/plugin/code.ts"),
      formats: ["es"], // required for Figma
      fileName: () => "code.js",
    },
    rollupOptions: {
      external: [], // no node modules bundled
    },
  },
});
