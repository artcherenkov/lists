import type { StorybookConfig } from "@storybook/react-vite";

import { mergeConfig } from "vite";

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
  // Без чек-листа «Get started» в боковой панели.
  features: { sidebarOnboardingChecklist: false },
  // Tailwind, React и алиасы Storybook берёт из vite.config.ts приложения.
  viteFinal: (viteConfig) =>
    mergeConfig(viteConfig, {
      build: {
        rolldownOptions: {
          // @base-ui помечает файлы директивой "use client" для серверных компонентов React.
          // В Storybook сервера нет, и сборщик по 100+ раз предупреждает, что директиву
          // не сохранит: эти предупреждения прячут настоящие. Остальные идут штатным путём.
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
