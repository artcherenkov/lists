import { serve } from "@hono/node-server";
import process from "node:process";

import { checkAuthSchema, createAuth } from "./auth/auth.ts";
import { issueTelegramCode } from "./auth/telegram-login.ts";
import { readConfig } from "./config.ts";
import { migrate } from "./database/migrate.ts";
import { readMigrations } from "./database/migration-files.ts";
import { createPool } from "./database/pool.ts";
import { createApp } from "./http/app.ts";
import { createBotApi } from "./telegram/bot-api.ts";
import { startBot } from "./telegram/bot.ts";
import { telegramNotifications } from "./telegram/notifications.ts";

/**
 * Запуск сервера: миграции и сверка схемы входа – до того, как сервер начнёт принимать запросы,
 * а бот – выдавать коды. Не прошли – процесс выходит с ошибкой, и выкладка возвращает прежний
 * релиз (решение 9 вехи 6).
 */
const config = readConfig(process.env);
const pool = createPool(config.databaseUrl);

const migrations = await migrate(pool, await readMigrations());
if (migrations.applied.length > 0) {
  console.log(`Применены миграции: ${migrations.applied.join(", ")}`);
}
if (migrations.unknown.length > 0) {
  console.log(`В базе есть миграции новее этого релиза: ${migrations.unknown.join(", ")}`);
}

const botApi = createBotApi({ apiUrl: config.telegramApiUrl, token: config.telegramBotToken });
const events = telegramNotifications({ api: botApi, ownerId: config.telegramOwnerId });
const auth = createAuth({ pool, config, events });
await checkAuthSchema(auth);

const app = createApp({ auth, pool });
const server = serve({ fetch: app.fetch, hostname: config.host, port: config.port }, (address) => {
  console.log(`Сервер слушает ${address.address}:${address.port}`);
});

const authContext = await auth.$context;
const bot = startBot({
  api: botApi,
  issueCode: (request) => issueTelegramCode(authContext, request),
  siteHost: new URL(config.publicUrl).host,
});

// Docker останавливает контейнер сигналом SIGTERM, разработка – SIGINT; придут оба – хватит одного.
let stopping = false;
function stop() {
  if (stopping) return;
  stopping = true;
  const serverClosed = new Promise((resolve) => server.close(resolve));
  void Promise.all([serverClosed, bot.stop()])
    .then(() => pool.end())
    .then(() => process.exit(0));
}
process.once("SIGTERM", stop);
process.once("SIGINT", stop);
