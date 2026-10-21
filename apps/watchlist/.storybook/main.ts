import type { StorybookConfig } from "@storybook/react-vite";

import { mergeConfig, type InlineConfig, type PluginOption } from "vite";

import { CSP_PLUGIN_NAME } from "../build/content-security-policy.ts";

function withoutAppPagePlugins(viteConfig: InlineConfig): InlineConfig {
  const isAppPagePlugin = (plugin: PluginOption): boolean =>
    Array.isArray(plugin)
      ? plugin.some(isAppPagePlugin)
      : Boolean(plugin) &&
        typeof plugin === "object" &&
        "name" in plugin &&
        (plugin.name.startsWith("vite-plugin-pwa") || plugin.name === CSP_PLUGIN_NAME);
  return {
    ...viteConfig,
    plugins: viteConfig.plugins?.filter((plugin) => !isAppPagePlugin(plugin)),
  };
}

const config: StorybookConfig = {
  stories: ["../src/stories/**/*.stories.tsx"],
  addons: ["@storybook/addon-themes", "@storybook/addon-docs"],
  framework: "@storybook/react-vite",
  // Таблица свойств – react-docgen по умолчанию. `react-docgen-typescript` не включаем:
  // на TypeScript 7 он ломает сборку.
  core: {
    // Ни телеметрии, ни запросов за новостями Storybook: клиент ходит только на свои адреса.
    disableTelemetry: true,
    disableWhatsNewNotifications: true,
  },
  features: { sidebarOnboardingChecklist: false },
  // Tailwind, React и алиасы Storybook берёт из vite.config.ts приложения, а плагины страницы
  // приложения убирает. С плагином PWA сборка падает, потому что sb-manager/globals-runtime.js
  // больше предела предкеша; без него нет и модуля virtual:pwa-register/react: история, которая
  // подключит код с хуком регистрации, не соберётся. Политика CSP приложения разрешила бы
  // встроенные скрипты Storybook только случайно.
  viteFinal: (viteConfig) =>
    mergeConfig(withoutAppPagePlugins(viteConfig), {
      build: {
        rolldownOptions: {
          // @base-ui помечает файлы директивой "use client", и сборщик на каждый предупреждает,
          // что не сохранит её: эти предупреждения прячут настоящие. Остальные идут штатным путём.
          onwarn(warning, defaultHandler) {
            const isUseClientDirective =
              warning.code === "MODULE_LEVEL_DIRECTIVE" && warning.message.includes('"use client"');
            if (!isUseClientDirective) defaultHandler(warning);
          },
        },
      },
    }),
};

export default config;
