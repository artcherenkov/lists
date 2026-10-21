import { describe, expect, test } from "vitest";

import { readConfig } from "../config.ts";

const complete = {
  DATABASE_URL: "postgres://lists:lists@127.0.0.1:5440/lists",
  AUTH_SECRET: "secret",
  PUBLIC_URL: "https://lists.example",
  HOST: "0.0.0.0",
  PORT: "3400",
};

describe("настройки сервера из окружения", () => {
  test("все заданы – читаются", () => {
    expect(readConfig(complete)).toEqual({
      databaseUrl: complete.DATABASE_URL,
      authSecret: "secret",
      publicUrl: "https://lists.example",
      host: "0.0.0.0",
      port: 3400,
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
  });
});
