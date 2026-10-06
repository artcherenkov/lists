import { copyFileSync, mkdirSync } from "node:fs";
import { defineConfig } from "vite";

import { releaseDefines } from "./vite.config.ts";

// Сервер одним файлом: `vite build --ssr`, `schema.sql` кладётся рядом (его читает setupSchema).
export default defineConfig({
  define: { __DATA_VERSION__: releaseDefines.__DATA_VERSION__ },
  publicDir: false,
  ssr: { noExternal: true },
  build: {
    ssr: "server/index.ts",
    target: "node24",
    outDir: "dist-server",
    emptyOutDir: true,
    minify: false,
    rollupOptions: {
      external: ["pg-native"],
      output: { format: "es", entryFileNames: "index.mjs" },
    },
  },
  plugins: [
    {
      name: "copy-schema",
      closeBundle() {
        mkdirSync("dist-server", { recursive: true });
        copyFileSync("server/schema.sql", "dist-server/schema.sql");
      },
    },
  ],
});
