import { createHmac, randomInt } from "node:crypto";

/**
 * Код входа из бота (решение 2 вехи 6): 8 цифр, живёт 5 минут. Код свободный – он сам определяет
 * человека, – поэтому длина возмещает отсутствие предела попыток на один код.
 */
const CODE_DIGITS = 8;

export const CODE_LIFETIME_MS = 5 * 60 * 1000;

export function generateCode() {
  return String(randomInt(0, 10 ** CODE_DIGITS)).padStart(CODE_DIGITS, "0");
}

/** Код, как его ввёл человек, без пробелов и дефисов; не похоже на код – `null`. */
export function normalizeCode(input: string) {
  const code = input.replaceAll(/[\s-]/g, "");
  return code.length === CODE_DIGITS && /^\d+$/.test(code) ? code : null;
}

/**
 * В базе лежит только это: без секрета сервера код по утёкшей таблице не перебрать, а SHA-256 без
 * ключа восьми цифр перебирается за секунды.
 */
export function codeDigest(code: string, secret: string) {
  return createHmac("sha256", secret).update(code).digest("hex");
}
