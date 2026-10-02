import type { StorybookConfig } from "@storybook/react-vite";

import { mergeConfig, type InlineConfig, type PluginOption } from "vite";

function withoutPwaPlugin(viteConfig: InlineConfig): InlineConfig {
  const isPwaPlugin = (plugin: PluginOption) =>
    Array.isArray(plugin)
      ? plugin.some(isPwaPlugin)
      : plugin && "name" in plugin && plugin.name.startsWith("vite-plugin-pwa");
  return { ...viteConfig, plugins: viteConfig.plugins?.filter((plugin) => !isPwaPlugin(plugin)) };
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
  // Tailwind, React и алиасы Storybook берёт из vite.config.ts приложения, а плагин PWA убирает:
  // с ним сборка падает, потому что sb-manager/globals-runtime.js больше предела предкеша.
  // Без плагина нет и модуля virtual:pwa-register/react: история, которая подключит код с хуком
  // регистрации, не соберётся.
  viteFinal: (viteConfig) =>
    mergeConfig(withoutPwaPlugin(viteConfig), {
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
