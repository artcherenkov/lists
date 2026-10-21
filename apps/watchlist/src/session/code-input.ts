/**
 * Длина кода – договорённость с сервером (решение 2 вехи 6, `apps/server/src/auth/telegram-code.ts`):
 * полный код поле отправляет само. Расхождение с сервером роняет e2e входа: код из бота не впустит.
 */
export const CODE_LENGTH = 8;

// Число, цифры которого могут разделять одиночные пробелы или дефисы: «4815 1623».
const NUMBER = /\d+(?:[ -]\d+)*/g;

/**
 * Код во вставленном тексте – единственное в нём число ровно из `CODE_LENGTH` цифр, иначе
 * `undefined`. Так код находится и в сообщении бота, скопированном целиком: другие числа в нём
 * короче.
 */
export function codeInText(text: string): string | undefined {
  const codes = (text.match(NUMBER) ?? [])
    .map((number) => number.replace(/\D/g, ""))
    .filter((digits) => digits.length === CODE_LENGTH);
  return codes.length === 1 ? codes[0] : undefined;
}

/**
 * Код из поля после набора, `undefined` – набор не принят и в поле остаётся прежний код. Поле
 * держит не больше `CODE_LENGTH` цифр: лишняя цифра не принимается, как в поле с `maxLength`.
 * Длинный текст, попавший в поле без события вставки, – например, его подставила клавиатура, –
 * разбирается как вставленный.
 */
export function codeFromField(value: string): string | undefined {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= CODE_LENGTH) return digits;
  return codeInText(value);
}
