import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Свой порт: 5173 и 5174 занимает abc/cloud, и оба проекта можно держать запущенными вместе
  server: { port: 5175, strictPort: true },
  // Алиас продублирован здесь намеренно: `paths` из tsconfig знает только TypeScript,
  // а сканер зависимостей Vite резолвит импорты сам.
  resolve: { alias: { "@": fileURLToPath(new URL("src", import.meta.url)) } },
});
