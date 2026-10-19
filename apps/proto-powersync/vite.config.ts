import { defineConfig } from "vite";

export default defineConfig({
  optimizeDeps: { exclude: ["@journeyapps/wa-sqlite", "@powersync/web"] },
  worker: { format: "es" },
  build: { target: "es2022" },
});
