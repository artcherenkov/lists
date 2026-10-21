/**
 * Длина кода – договорённость с сервером (решение 2 вехи 6, `apps/server/src/auth/telegram-code.ts`):
 * полный код поле отправляет само. Расхождение с сервером роняет e2e входа: код из бота не впустит.
 */
export const CODE_LENGTH = 8;

// Группа цифр, внутри которой могут быть пробелы и дефисы, но не перевод строки.
const DIGIT_GROUP = /\d(?:[ -]*\d)*/g;

/**
 * Код из того, что человек ввёл или вставил в поле. Из сообщения бота код копируют вместе с
 * текстом, где есть и другие числа, поэтому сначала ищется группа ровно из `CODE_LENGTH` цифр.
 * Иначе берутся последние цифры: новый код, вставленный в поле с прежним, оказывается в конце.
 */
export function codeFromInput(input: string): string {
  const groups = (input.match(DIGIT_GROUP) ?? []).map((group) => group.replace(/\D/g, ""));
  const whole = groups.filter((digits) => digits.length === CODE_LENGTH).at(-1);
  return whole ?? input.replace(/\D/g, "").slice(-CODE_LENGTH);
}
