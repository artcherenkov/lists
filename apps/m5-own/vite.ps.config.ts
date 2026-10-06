import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

import { releaseDefines } from "./vite.config.ts";

// Страница хранилища PowerSync: отдельное приложение под /ps/ со своим service worker (scope /ps/).
export default defineConfig({
  root: fileURLToPath(new URL("./ps", import.meta.url)),
  base: "/ps/",
  define: releaseDefines,
  optimizeDeps: { exclude: ["@journeyapps/wa-sqlite", "@powersync/web"] },
  worker: { format: "es" },
  build: { target: "es2022", outDir: "../dist-ps", emptyOutDir: true },
  plugins: [
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      base: "/ps/",
      scope: "/ps/",
      registerType: "prompt",
      injectRegister: false,
      injectManifest: {
        globPatterns: ["**/*"],
        // wasm SQLite около 2,5 МБ: при пределе по умолчанию (2 МБ) он не попал бы в предкеш.
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
      },
      manifest: {
        id: "/ps/",
        name: "Макет PowerSync",
        short_name: "Макет PS",
        lang: "ru",
        display: "standalone",
        start_url: "/ps/",
        scope: "/ps/",
        background_color: "#1e40af",
        theme_color: "#1e40af",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      },
    }),
  ],
});
