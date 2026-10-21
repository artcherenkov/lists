import { describe, expect, test } from "vitest";

import { readConfig } from "../config.ts";

const complete = {
  DATABASE_URL: "postgres://lists:lists@127.0.0.1:5440/lists",
  AUTH_SECRET: "secret",
  PUBLIC_URL: "https://lists.example",
  HOST: "0.0.0.0",
  PORT: "3400",
  TELEGRAM_BOT_TOKEN: "123:token",
  TELEGRAM_API_URL: "https://api.telegram.org",
  TELEGRAM_OWNER_ID: "1000",
};

describe("настройки сервера из окружения", () => {
  test("все заданы – читаются", () => {
    expect(readConfig(complete)).toEqual({
      databaseUrl: complete.DATABASE_URL,
      authSecret: "secret",
      publicUrl: "https://lists.example",
      host: "0.0.0.0",
      port: 3400,
      telegramBotToken: "123:token",
      telegramApiUrl: "https://api.telegram.org",
      telegramOwnerId: "1000",
    });
  });

  test("незаданные и пустые – отказ со списком, умолчаний нет", () => {
    expect(() => readConfig({ ...complete, AUTH_SECRET: "", PORT: undefined })).toThrow(
      "Не заданы переменные окружения: AUTH_SECRET, PORT",
    );
  });

  test("порт не номером порта – отказ", () => {
    expect(() => readConfig({ ...complete, PORT: "http" })).toThrow("PORT – не номер порта: http");
    expect(() => readConfig({ ...complete, PORT: "70000" })).toThrow(
      "PORT – не номер порта: 70000",
    );
    expect(() => readConfig({ ...complete, PORT: "1e3" })).toThrow("PORT – не номер порта: 1e3");
  });

  test("подделка Bot API – только в разработке и тестах, без NODE_ENV и с опечаткой – отказ", () => {
    const fake = { ...complete, TELEGRAM_API_URL: "http://127.0.0.1:3401" };

    for (const NODE_ENV of ["production", "prod", undefined]) {
      expect(() => readConfig({ ...fake, NODE_ENV })).toThrow(
        "TELEGRAM_API_URL – только https://api.telegram.org, если NODE_ENV не development и не test",
      );
    }
    for (const NODE_ENV of ["development", "test"]) {
      expect(readConfig({ ...fake, NODE_ENV }).telegramApiUrl).toBe("http://127.0.0.1:3401");
    }
  });

  test("id владельца не числом – отказ", () => {
    expect(() => readConfig({ ...complete, TELEGRAM_OWNER_ID: "@owner" })).toThrow(
      "TELEGRAM_OWNER_ID – не id Telegram: @owner",
    );
  });
});
