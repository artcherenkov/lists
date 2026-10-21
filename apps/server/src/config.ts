/**
 * Настройки сервера из окружения. Значений по умолчанию нет: забытая переменная на сервере
 * остановит запуск, а не подставит значение разработки. Значения для разработки – в `dev.env`.
 */
export interface ServerConfig {
  /** Адрес Postgres: `postgres://пользователь:пароль@хост:порт/база`. */
  databaseUrl: string;
  /** Секрет better-auth: подписывает cookie сессии. */
  authSecret: string;
  /** Адрес сайта, как его видит браузер: от него better-auth сверяет `Origin`. */
  publicUrl: string;
  host: string;
  port: number;
  /** Токен бота от BotFather. */
  telegramBotToken: string;
  /** Адрес Bot API: в бою – `https://api.telegram.org`, в разработке и тестах – подделка. */
  telegramApiUrl: string;
  /** id Telegram владельца: ему бот пишет о подборе кодов. */
  telegramOwnerId: string;
}

/** Bot API Telegram; другой адрес вне разработки и тестов – ошибка настройки (решение 11 вехи 6). */
export const TELEGRAM_API_URL = "https://api.telegram.org";

// Разработку и тесты называют явно: забытый или опечатанный `NODE_ENV` на сервере – боевая работа.
const FAKE_BOT_API_ENVIRONMENTS = ["development", "test"];

const VARIABLES = {
  databaseUrl: "DATABASE_URL",
  authSecret: "AUTH_SECRET",
  publicUrl: "PUBLIC_URL",
  host: "HOST",
  port: "PORT",
  telegramBotToken: "TELEGRAM_BOT_TOKEN",
  telegramApiUrl: "TELEGRAM_API_URL",
  telegramOwnerId: "TELEGRAM_OWNER_ID",
} as const;

export function readConfig(env: NodeJS.ProcessEnv): ServerConfig {
  const missing = Object.values(VARIABLES).filter((name) => !env[name]);
  if (missing.length > 0) {
    throw new Error(`Не заданы переменные окружения: ${missing.join(", ")}`);
  }
  const value = (name: string) => env[name] ?? "";

  // Только цифры: Number() принял бы и `1e3`, и `0xD48`.
  const rawPort = value(VARIABLES.port);
  const port = Number(rawPort);
  if (!/^\d+$/.test(rawPort) || port < 1 || port > 65535) {
    throw new Error(`PORT – не номер порта: ${rawPort}`);
  }
  // Подделка Bot API впускает под любым id Telegram: на сервере ей не место.
  const telegramApiUrl = value(VARIABLES.telegramApiUrl);
  const fakeAllowed = FAKE_BOT_API_ENVIRONMENTS.includes(env.NODE_ENV ?? "");
  if (!fakeAllowed && telegramApiUrl !== TELEGRAM_API_URL) {
    throw new Error(
      `TELEGRAM_API_URL – только ${TELEGRAM_API_URL}, если NODE_ENV не development и не test`,
    );
  }
  // Ошибка в id владельца иначе всплыла бы только на оповещении о подборе, и оно бы не ушло.
  const telegramOwnerId = value(VARIABLES.telegramOwnerId);
  if (!/^\d+$/.test(telegramOwnerId)) {
    throw new Error(`TELEGRAM_OWNER_ID – не id Telegram: ${telegramOwnerId}`);
  }
  return {
    databaseUrl: value(VARIABLES.databaseUrl),
    authSecret: value(VARIABLES.authSecret),
    publicUrl: value(VARIABLES.publicUrl),
    host: value(VARIABLES.host),
    port,
    telegramBotToken: value(VARIABLES.telegramBotToken),
    telegramApiUrl,
    telegramOwnerId,
  };
}
