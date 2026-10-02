import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

import { formatAppVersion } from "./src/app-version.ts";

const appRoot = fileURLToPath(new URL(".", import.meta.url));

function git(...args: string[]): string {
  return execFileSync("git", args, { cwd: appRoot, encoding: "utf8", stdio: "pipe" }).trim();
}

/**
 * `APP_VERSION` – для сборок без `.git` и для второй сборки тестов обновления. Иначе – из git.
 * Подставное значение при отсутствии git дало бы разным сборкам один номер, поэтому сборка падает.
 */
function resolveAppVersion(): string {
  if (process.env.APP_VERSION) return process.env.APP_VERSION;
  try {
    const [date, hash] = git("log", "-1", "--format=%cs %H", "HEAD").split(" ");
    // Неотслеживаемые файлы не в счёт: черновики лежат у разработчика всегда. Код без ссылки из
    // отслеживаемого файла сборка не читает, а правка ссылки даст пометку. Исключения – новый файл
    // в `public`, он копируется в сборку целиком, и классы Tailwind из нового файла в `src`:
    // Tailwind сканирует все файлы, и CSS изменится. Оба случая идут без пометки.
    // `--no-optional-locks`: статус не берёт `index.lock`, пока рядом коммитят.
    const hasChanges =
      git("--no-optional-locks", "status", "--porcelain", "--untracked-files=no") !== "";
    return formatAppVersion({ date: date!, hash: hash!, hasChanges });
  } catch (error) {
    throw new Error(
      "Не удалось определить номер версии: задайте переменную окружения APP_VERSION или собирайте внутри git-репозитория",
      { cause: error },
    );
  }
}

export default defineConfig({
  define: { __APP_VERSION__: JSON.stringify(resolveAppVersion()) },
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
  // Свой порт: 5173 и 5174 занимает abc/cloud, и оба проекта можно держать запущенными вместе
  server: { port: 5175, strictPort: true },
});
