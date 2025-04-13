// vite.config.plugin.ts
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    target: 'esnext',        // ✅ ensures optional chaining is allowed
    outDir: 'dist',
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, 'src/plugin/code.ts'),
      formats: ['es'],
      fileName: () => 'code.js'
    },
    rollupOptions: {
      external: []
    }
  },
  esbuild: {
    target: 'esnext' // ✅ explicitly tell esbuild to allow modern syntax
  }
});
