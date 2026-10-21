import type { TelegramLoginEvents } from "../auth/telegram-login.ts";
import type { BotApi } from "./bot-api.ts";

/**
 * Оповещения входа через бота (решение 2 вехи 6): человеку – о каждом входе в его аккаунт,
 * владельцу – о подборе кодов. Подобранный или выманенный код иначе ничем себя не выдал бы.
 */
export function telegramNotifications({
  api,
  ownerId,
}: {
  api: BotApi;
  ownerId: string;
}): TelegramLoginEvents {
  return {
    signedIn: async ({ telegramId, userAgent, at }) => {
      await api.sendMessage(
        telegramId,
        [
          `Вход в Lists: ${formatTime(at)}, ${describeBrowser(userAgent)}.`,
          "Если это были не вы, кто-то узнал ваш код: не сообщайте коды никому.",
        ].join("\n"),
      );
    },
    manyWrongCodes: async ({ failures }) => {
      await api.sendMessage(
        ownerId,
        `Неверных кодов в Lists за последний час: ${failures}. Похоже, коды подбирают.`,
      );
    },
  };
}

const TIME = new Intl.DateTimeFormat("ru-RU", {
  timeZone: "Europe/Moscow",
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

function formatTime(at: Date) {
  return `${TIME.format(at)} по Москве`;
}

// Порядок важен: строка Edge содержит и `Chrome/`, и `Safari/`, строка Chrome – `Safari/`.
const BROWSERS = [
  ["Edg", "Edge"],
  ["YaBrowser/", "Яндекс Браузер"],
  ["Firefox/", "Firefox"],
  ["FxiOS/", "Firefox"],
  ["CriOS/", "Chrome"],
  ["Chrome/", "Chrome"],
  ["Safari/", "Safari"],
] as const;

// Строка iPad и iPhone содержит `like Mac OS X`, строка Android – `Linux`.
const SYSTEMS = [
  ["iPhone", "iPhone"],
  ["iPad", "iPad"],
  ["Android", "Android"],
  ["Mac OS X", "Mac"],
  ["Windows", "Windows"],
  ["Linux", "Linux"],
] as const;

/** «Safari, iPhone» из строки браузера; чего не узнали, того в описании нет. */
function describeBrowser(userAgent: string | null) {
  if (!userAgent) return "браузер неизвестен";
  const browser = BROWSERS.find(([mark]) => userAgent.includes(mark))?.[1];
  const system = SYSTEMS.find(([mark]) => userAgent.includes(mark))?.[1];
  return [browser, system].filter(Boolean).join(", ") || "браузер неизвестен";
}
