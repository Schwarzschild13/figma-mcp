import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { viteSingleFile } = require("vite-plugin-singlefile"); // ✅ fix here

export default defineConfig({
  plugins: [
    react(),
    viteSingleFile(), // ✅ plugin works now
  ],
  base: "./",
  build: {
    outDir: "dist",
    emptyOutDir: false,
    rollupOptions: {
      input: "ui.html",
    },
  },
});
