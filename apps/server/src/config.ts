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
}

const VARIABLES = {
  databaseUrl: "DATABASE_URL",
  authSecret: "AUTH_SECRET",
  publicUrl: "PUBLIC_URL",
  host: "HOST",
  port: "PORT",
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
  return {
    databaseUrl: value(VARIABLES.databaseUrl),
    authSecret: value(VARIABLES.authSecret),
    publicUrl: value(VARIABLES.publicUrl),
    host: value(VARIABLES.host),
    port,
  };
}
