/**
 * Длина кода – договорённость с сервером (решение 2 вехи 6, `apps/server/src/auth/telegram-code.ts`):
 * полный код поле отправляет само. Расхождение с сервером роняет e2e входа: код из бота не впустит.
 */
export const CODE_LENGTH = 8;

/** Что поле кода делает с вводом: какой код в нём будет и отправлять ли его сразу. */
export type CodeEntry = { code: string; submit: boolean };

// Число, цифры которого могут разделять одиночные пробелы или дефисы: «4815 1623».
const NUMBER = /\d+(?:[ -]\d+)*/g;

/**
 * Код в тексте – последнее в нём число ровно из `CODE_LENGTH` цифр, иначе `undefined`. Так код
 * находится и в сообщении бота, скопированном целиком: другие числа в нём короче, а из двух
 * сообщений новое – последнее.
 */
function codeInText(text: string): string | undefined {
  return (text.match(NUMBER) ?? [])
    .map((number) => number.replace(/\D/g, ""))
    .filter((digits) => digits.length === CODE_LENGTH)
    .at(-1);
}

/**
 * Вставка: код из вставленного текста заменяет поле и отправляется, даже тот же, что был, –
 * например, когда вернулась связь. `undefined` – кода в тексте нет, и текст вставится как набор.
 */
export function pastedCode(text: string): CodeEntry | undefined {
  const code = codeInText(text);
  return code === undefined ? undefined : { code, submit: true };
}

/**
 * Набор: `value` – значение поля после него, `current` – код в поле до него. Поле держит не больше
 * `CODE_LENGTH` цифр: лишняя цифра не принимается, как в поле с `maxLength`. Длинный текст,
 * попавший в поле без события вставки, – например, его подставила клавиатура, – разбирается как
 * вставленный. `undefined` – код в поле не меняется.
 */
export function typedCode(value: string, current: string): CodeEntry | undefined {
  const digits = value.replace(/\D/g, "");
  const code = digits.length <= CODE_LENGTH ? digits : codeInText(value);
  if (code === undefined || code === current) return undefined;
  return { code, submit: code.length === CODE_LENGTH };
}
