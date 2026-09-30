import type { Preview } from "@storybook/react-vite";

import { withThemeByClassName } from "@storybook/addon-themes";

import "./preview.css";

const preview: Preview = {
  // Автодокументация со свойствами – у каждой истории, кроме тех, что отказались сами.
  tags: ["autodocs"],
  decorators: [
    // Как в приложении: тёмная тема – класс `dark` на <html>, светлая – без класса.
    withThemeByClassName({ themes: { light: "", dark: "dark" }, defaultTheme: "light" }),
  ],
  parameters: {
    layout: "padded",
    options: { storySort: { order: ["Дизайн-система", "Компоненты"] } },
  },
};

export default preview;
