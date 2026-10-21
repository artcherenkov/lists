import type { BotApi } from "../bot-api.ts";

import { expect, test, vi } from "vitest";

import { telegramNotifications } from "../notifications.ts";

function recordingApi() {
  const sendMessage = vi.fn<BotApi["sendMessage"]>(async () => {});
  const api: BotApi = { getUpdates: async () => [], sendMessage };
  return { api, sendMessage };
}

test("о входе бот пишет самому человеку: время по Москве и браузер", async () => {
  const { api, sendMessage } = recordingApi();

  await telegramNotifications({ api, ownerId: "1" }).signedIn({
    telegramId: "1001",
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
    at: new Date("2026-10-21T11:04:00Z"),
  });

  expect(sendMessage).toHaveBeenCalledWith(
    "1001",
    "Вход в Lists: 21 октября в 14:04 по Москве, Chrome, Mac.\n" +
      "Если это были не вы, кто-то узнал ваш код: не сообщайте коды никому.",
  );
});

test("о подборе кодов бот пишет владельцу", async () => {
  const { api, sendMessage } = recordingApi();

  await telegramNotifications({ api, ownerId: "1" }).manyWrongCodes({ failures: 101 });

  expect(sendMessage).toHaveBeenCalledWith(
    "1",
    "Неверных кодов в Lists за последний час: 101. Похоже, коды подбирают.",
  );
});

test.each([
  [
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1",
    "Safari, iPhone",
  ],
  [
    "Mozilla/5.0 (iPad; CPU OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/141.0.0.0 Mobile/15E148 Safari/604.1",
    "Chrome, iPad",
  ],
  [
    "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36",
    "Chrome, Android",
  ],
  [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0",
    "Edge, Windows",
  ],
  [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 YaBrowser/25.8.0.0 Safari/537.36",
    "Яндекс Браузер, Windows",
  ],
  ["Mozilla/5.0 (X11; Linux x86_64; rv:144.0) Gecko/20100101 Firefox/144.0", "Firefox, Linux"],
  ["curl/8.5.0", "браузер неизвестен"],
  [null, "браузер неизвестен"],
])("браузер из строки %s – %s", async (userAgent, expected) => {
  const { api, sendMessage } = recordingApi();

  await telegramNotifications({ api, ownerId: "1" }).signedIn({
    telegramId: "1001",
    userAgent,
    at: new Date("2026-10-21T11:04:00Z"),
  });

  expect(sendMessage.mock.calls[0]?.[1]).toContain(`по Москве, ${expected}.\n`);
});
