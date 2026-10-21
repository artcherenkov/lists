import { serve } from "@hono/node-server";
import process from "node:process";

import { checkAuthSchema, createAuth } from "./auth/auth.ts";
import { readConfig } from "./config.ts";
import { migrate, readMigrations } from "./database/migrate.ts";
import { createPool } from "./database/pool.ts";
import { createApp } from "./http/app.ts";

/**
 * Запуск сервера: миграции и сверка схемы входа – до того, как сервер начнёт принимать запросы.
 * Не прошли – процесс выходит с ошибкой, и выкладка возвращает прежний релиз (решение 9 вехи 6).
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

const auth = createAuth({ pool, config });
await checkAuthSchema(auth);

const app = createApp({ auth, pool });
const server = serve({ fetch: app.fetch, hostname: config.host, port: config.port }, (address) => {
  console.log(`Сервер слушает ${address.address}:${address.port}`);
});

// Docker останавливает контейнер сигналом SIGTERM, разработка – SIGINT; придут оба – хватит одного.
let stopping = false;
function stop() {
  if (stopping) return;
  stopping = true;
  server.close(() => {
    void pool.end().then(() => process.exit(0));
  });
}
process.once("SIGTERM", stop);
process.once("SIGINT", stop);
