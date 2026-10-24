import { describe, expect, test } from "vitest";

import { pastedCode, typedCode } from "../code-input.ts";

// Образец сообщения бота. Что разбор понимает настоящее сообщение, проверяет e2e входа: он
// вставляет в поле ответ бота целиком.
const BOT_MESSAGE = [
  "Код для входа в Lists: 48151623",
  "",
  "Введите его на v2.watchlist.acherenkov.com в течение 5 минут.",
  "Никому не сообщайте код: он впускает в ваш аккаунт.",
].join("\n");
// В значении поля переводов строк нет: браузер заменяет их пробелами.
const BOT_MESSAGE_IN_FIELD = BOT_MESSAGE.replaceAll("\n", " ");

describe("вставка в поле кода", () => {
  test.each([
    ["код", "48151623"],
    ["код с пробелом", "4815 1623"],
    ["код с дефисом", "4815-1623"],
    ["сообщение бота целиком", BOT_MESSAGE],
    [
      "два сообщения бота – код из последнего",
      `${BOT_MESSAGE.replace("48151623", "00000000")}\n${BOT_MESSAGE}`,
    ],
  ])("%s – код заменяет поле и отправляется", (_case, text) => {
    expect(pastedCode(text)).toEqual({ code: "48151623", submit: true });
  });

  test.each([
    ["часть кода", "4815"],
    ["лишняя цифра", "481516239"],
  ])("%s – кода нет, текст вставится как набор", (_case, text) => {
    expect(pastedCode(text)).toBeUndefined();
  });
});

describe("набор в поле кода", () => {
  test.each([
    ["набранные цифры", "4815", "481", { code: "4815", submit: false }],
    ["набранные цифры с пробелом", "4815 16", "4815", { code: "481516", submit: false }],
    ["стёртая цифра", "481", "4815", { code: "481", submit: false }],
    ["последняя цифра кода", "48151623", "4815162", { code: "48151623", submit: true }],
    [
      "сообщение бота, подставленное после набранных цифр",
      `1234${BOT_MESSAGE_IN_FIELD}`,
      "1234",
      { code: "48151623", submit: true },
    ],
  ])("%s", (_case, value, current, entry) => {
    expect(typedCode(value, current)).toEqual(entry);
  });

  test.each([
    ["пробел после полного кода", "48151623 "],
    ["цифра после полного кода", "481516239"],
    ["цифра в середине полного кода", "481591623"],
  ])("%s не меняет код", (_case, value) => {
    expect(typedCode(value, "48151623")).toBeUndefined();
  });
});
