import type { Preview } from "@storybook/react-vite";

import { withThemeByClassName } from "@storybook/addon-themes";

import "../src/styles.css";
import "./preview.css";

const preview: Preview = {
  decorators: [
    withThemeByClassName({ themes: { light: "", dark: "dark" }, defaultTheme: "light" }),
    // Обёртка из index.html: `Sheet` со `scaleBackground` отодвигает именно её. На Docs её нет:
    // образцы идут один под другим, а `min-h-dvh` растянул бы каждый.
    (Story, context) =>
      context.viewMode === "docs" ? (
        <Story />
      ) : (
        <div data-sheet-wrapper className="min-h-dvh bg-background will-change-transform">
          <Story />
        </div>
      ),
  ],
  parameters: {
    layout: "fullscreen",
    options: { storySort: { order: ["Дизайн-система", "Компоненты"] } },
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
