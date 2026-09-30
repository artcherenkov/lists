import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Свой порт: 5173 и 5174 занимает abc/cloud, и оба проекта можно держать запущенными вместе
  server: { port: 5175, strictPort: true },
});
