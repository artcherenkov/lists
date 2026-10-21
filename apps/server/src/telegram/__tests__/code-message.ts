/**
 * Код из сообщения бота (`codeMessage` в `bot.ts`), `undefined` – кода в сообщении нет. Разбор
 * один на тесты сервера и e2e: смена текста сообщения правится здесь.
 */
export function codeInMessage(message: string): string | undefined {
  return /^Код для входа в Lists: (\d{8})$/m.exec(message)?.[1];
}
