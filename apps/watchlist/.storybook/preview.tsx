import type { Preview } from "@storybook/react-vite";

import { withThemeByClassName } from "@storybook/addon-themes";

// Стили – как в src/main.tsx приложения.
import "../src/styles.css";
import "./preview.css";

const preview: Preview = {
  decorators: [
    // Как в приложении: тёмная тема – класс `dark` на <html>, светлая – без класса.
    withThemeByClassName({ themes: { light: "", dark: "dark" }, defaultTheme: "light" }),
    // Обёртка из index.html приложения: `Sheet` со `scaleBackground` отодвигает именно её.
    // Нужна страницам со шторками и экранам, то есть историям; на Docs образцы идут один
    // под другим, и `min-h-dvh` растянул бы каждый, а фон там даёт `.docs-story`.
    (Story, context) =>
      context.viewMode === "docs" ? (
        <Story />
      ) : (
        <div data-sheet-wrapper className="min-h-dvh bg-background will-change-transform">
          <Story />
        </div>
      ),
  ],
  // Экраны – страницы на весь вьюпорт; у маленьких компонентов отступ задаёт сама история.
  parameters: {
    layout: "fullscreen",
    options: { storySort: { order: ["Дизайн-система", "Компоненты"] } },
    // Ширина iPhone, как в e2e и в настоящем приложении.
    viewport: {
      options: {
        iphone: {
          name: "iPhone 393×852",
          styles: { width: "393px", height: "852px" },
          type: "mobile",
        },
      },
    },
  },
  initialGlobals: { viewport: { value: "iphone", isRotated: false } },
};

export default preview;
