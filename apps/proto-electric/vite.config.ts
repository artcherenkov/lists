import { defineConfig } from "vite";
declare const process: any;
export default defineConfig(({ mode }) => ({
  build: {
    target: "es2022",
    outDir: `dist-${mode}`,
    emptyOutDir: true,
    sourcemap: false,
    minify: process.env.NOMIN ? false : "esbuild",
  },
  worker: { format: "es" },
  optimizeDeps: { exclude: ["@journeyapps/wa-sqlite"] },
  define: { __DATA_VERSION__: Number(process.env.DATA_VERSION ?? 1) },
}));
