import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

import { resolveAppVersion } from "./build/app-version.ts";

const appRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(resolveAppVersion({ repoDir: appRoot, env: process.env })),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      strategies: "injectManifest",
      // По умолчанию плагин ищет worker в public.
      srcDir: "src",
      filename: "sw.ts",
      registerType: "prompt",
      // Регистрирует хук приложения.
      injectRegister: false,
      injectManifest: {
        // По умолчанию плагин не берёт шрифты и картинки, а перечень расширений промахнётся,
        // как только Vite вынесет новый тип файла в assets: без сети он не загрузится.
        globPatterns: ["**/*"],
      },
      manifest: {
        name: "Вотчлист",
        short_name: "Вотчлист",
        lang: "ru",
        display: "standalone",
        start_url: "/",
        // В манифесте один цвет, поэтому светлая тема; тёмную страница задаёт сама двумя
        // <meta name="theme-color"> с media.
        background_color: "#ffffff",
        theme_color: "#ffffff",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      },
    }),
  ],
  server: {
    // Свой порт: 5173 и 5174 занимает abc/cloud, и оба проекта можно держать запущенными вместе
    port: 5175,
    strictPort: true,
    // В разработке /api ведёт на сервер из apps/server, как Caddy на v2: браузер видит один адрес,
    // и cookie входа – того же сайта. Порт – PORT из apps/server/dev.env.
    proxy: { "/api/": "http://127.0.0.1:3400" },
  },
});
