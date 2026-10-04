const TIME = String.raw`\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}`;

export const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);

/**
 * Строка журнала на экране: «время текст». Время зависит от часов и часового пояса, поэтому
 * его задаёт только формат. Строка-текст должна совпасть со строкой целиком; регулярное
 * выражение продолжает строку после времени и само решает, где она кончается.
 */
export function journalLine(body: string | RegExp): RegExp {
  const rest = typeof body === "string" ? `${escapeRegExp(body)}$` : body.source;
  return new RegExp(`^${TIME} ${rest}`);
}
