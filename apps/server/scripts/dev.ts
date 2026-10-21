import process from "node:process";
import readline from "node:readline";

import { readConfig } from "../src/config.ts";
import { startFakeBotApi } from "../src/telegram/fake-bot-api.ts";

/**
 * Сервер в `pnpm dev`: подделка Bot API с консолью и сам сервер в одном процессе (решение 11
 * вехи 6). Строка, набранная в задаче `server#dev`, уходит боту от имени разработчика, ответы бота
 * печатаются. Рабочий токен здесь не нужен: второй процесс с ним забрал бы обновления у сервера.
 */
const config = readConfig(process.env);
const DEVELOPER = { id: Number(config.telegramOwnerId), firstName: "Разработчик" };
// Без явного порта подделка встала бы на случайный, а бот стучался бы на 80-й.
const { port } = new URL(config.telegramApiUrl);
if (!port) throw new Error("TELEGRAM_API_URL в разработке – адрес подделки с портом");

const fake = await startFakeBotApi({
  token: config.telegramBotToken,
  port: Number(port),
  onSent: (chatId, text) => console.log(`\nБот → ${chatId}:\n${text}\n`),
});
readline.createInterface({ input: process.stdin }).on("line", (line) => {
  if (line.trim()) fake.send(DEVELOPER, line.trim());
});
console.log("Подделка Telegram: напишите боту /start, чтобы получить код входа.");

await import("../src/main.ts");
