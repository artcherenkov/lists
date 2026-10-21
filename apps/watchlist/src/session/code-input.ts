/**
 * Длина кода – договорённость с сервером (решение 2 вехи 6, `apps/server/src/auth/telegram-code.ts`):
 * полный код поле отправляет само. Расхождение с сервером роняет e2e входа: код из бота не впустит.
 */
export const CODE_LENGTH = 8;

// Группа цифр, внутри которой могут быть пробелы и дефисы, но не перевод строки.
const DIGIT_GROUP = /\d(?:[ -]*\d)*/g;

/**
 * Код из того, что человек ввёл или вставил в поле; `previous` – код в поле до этого.
 *
 * Если в поле стоял полный код – отклонённый или отправленный, – берётся то, что к нему добавили:
 * новый код, вставленный до или после прежнего, или набранную цифру. Из сообщения бота код
 * копируют вместе с текстом, где есть и другие числа, поэтому код – группа ровно из
 * `CODE_LENGTH` цифр, последняя. Если такой нет, человек набирает код: лишние цифры отбрасываются.
 */
export function codeFromInput(input: string, previous: string): string {
  const added =
    previous.length === CODE_LENGTH && input !== previous && input.includes(previous)
      ? input.replace(previous, "")
      : input;
  const groups = (added.match(DIGIT_GROUP) ?? []).map((group) => group.replace(/\D/g, ""));
  const whole = groups.filter((digits) => digits.length === CODE_LENGTH).at(-1);
  return whole ?? added.replace(/\D/g, "").slice(0, CODE_LENGTH);
}
