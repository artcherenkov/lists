import type { FakeBotApi } from "../../apps/server/src/telegram/fake-bot-api.ts";

import { type ChildProcess, spawn } from "node:child_process";
import { once } from "node:events";
import { fileURLToPath } from "node:url";

import { createTestDatabase } from "../../apps/server/src/__tests__/test-database.ts";
import { startFakeBotApi } from "../../apps/server/src/telegram/fake-bot-api.ts";

/** Имя бота, которое сервер тестов называет экрану входа. */
export const BOT_USERNAME = "lists_e2e_bot";
const BOT_TOKEN = "e2e-token";

const SERVER_MAIN = fileURLToPath(new URL("../../apps/server/src/main.ts", import.meta.url));
const START_TIMEOUT_MS = 30_000;

export type ApiServer = {
  url: string;
  /** Подделка Telegram, с которой говорит бот сервера: `send` пишет боту, `sentTo` – его ответы. */
  telegram: FakeBotApi;
  stop: () => Promise<void>;
};

/**
 * Сервер `apps/server` в своём процессе – тот же `main.ts`, что в релизе: миграции при старте,
 * сверка схемы, бот. База – пустая своя (`createTestDatabase`), Telegram – подделка Bot API в
 * процессе теста (решение 11 вехи 6). `publicUrl` – адрес сайта, с которого браузер шлёт запросы:
 * с него сервер сверяет `Origin`.
 */
export async function startApiServer({
  port,
  publicUrl,
}: {
  port: number;
  publicUrl: string;
}): Promise<ApiServer> {
  const database = await createTestDatabase({ migrated: false });
  const telegram = await startFakeBotApi({ token: BOT_TOKEN });
  const url = `http://127.0.0.1:${port}`;

  // Окружение – только настройки сервера: окружение воркера Playwright несёт его загрузчик TS.
  const server = spawn(process.execPath, [SERVER_MAIN], {
    env: {
      NODE_ENV: "test",
      DATABASE_URL: database.url,
      AUTH_SECRET: "e2e-secret-0123456789-0123456789-0123456789",
      PUBLIC_URL: publicUrl,
      HOST: "127.0.0.1",
      PORT: String(port),
      TELEGRAM_BOT_TOKEN: BOT_TOKEN,
      TELEGRAM_BOT_USERNAME: BOT_USERNAME,
      TELEGRAM_API_URL: telegram.url,
      TELEGRAM_OWNER_ID: "1",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  server.stdout.on("data", (chunk) => (output += chunk));
  server.stderr.on("data", (chunk) => (output += chunk));

  const stop = async () => {
    await stopProcess(server);
    await telegram.close();
    await database.drop();
  };

  try {
    await waitUntilHealthy(server, url);
  } catch (error) {
    await stop();
    throw new Error(`Сервер не запустился: ${String(error)}\n${output}`);
  }
  return { url, telegram, stop };
}

/** Сервер готов, когда проверка здоровья отвечает `200`: миграции и сверка схемы позади. */
async function waitUntilHealthy(server: ChildProcess, url: string) {
  const deadline = Date.now() + START_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (server.exitCode !== null || server.signalCode !== null) {
      throw new Error(`процесс вышел: код ${server.exitCode}, сигнал ${server.signalCode}`);
    }
    try {
      const response = await fetch(`${url}/api/health`);
      if (response.ok) return;
    } catch {
      // Порт ещё не открыт.
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`проверка здоровья не ответила за ${START_TIMEOUT_MS / 1000} с`);
}

/** SIGTERM, как Docker: сервер дожидается бота и закрывает пул, иначе база не удалится. */
async function stopProcess(server: ChildProcess) {
  if (server.exitCode !== null || server.signalCode !== null) return;
  const exited = once(server, "exit");
  server.kill("SIGTERM");
  await exited;
}
