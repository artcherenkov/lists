import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

import { resolveAppVersion } from "../watchlist/build/app-version.ts";

const appRoot = fileURLToPath(new URL(".", import.meta.url));
const release = JSON.parse(readFileSync(new URL("./release.json", import.meta.url), "utf8")) as {
  dataVersion: number;
  label: string;
};

/** Общие значения сборки: версия данных и метка идут из release.json, номер сборки – из git. */
export const releaseDefines = {
  __DATA_VERSION__: JSON.stringify(release.dataVersion),
  __LABEL__: JSON.stringify(release.label),
  __BUILD__: JSON.stringify(resolveAppVersion({ repoDir: appRoot, env: process.env })),
  // `TEST_PARAMS=1` – сборка для тестов: параметры из адреса, без service worker.
  __TEST_PARAMS__: JSON.stringify(process.env.TEST_PARAMS === "1"),
};

export default defineConfig({
  define: releaseDefines,
  build: { target: "es2022" },
  plugins: [
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      registerType: "prompt",
      injectRegister: false,
      injectManifest: { globPatterns: ["**/*"] },
      manifest: {
        name: `Макет Dexie ${release.label}`,
        short_name: "Макет Dexie",
        lang: "ru",
        display: "standalone",
        start_url: "/",
        scope: "/",
        background_color: "#c2410c",
        theme_color: "#c2410c",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      },
    }),
  ],
});
