import { formatOffset, formatTime } from "./format.ts";

export const MAX_ENTRIES = 1000;
const MAX_TEXT_LENGTH = 500;

export interface JournalEntry {
  /** Время события, мс от эпохи. */
  t: number;
  /** Текст для показа. */
  text: string;
}

/** Запись занимает одну строку копии, а длинное сообщение об ошибке не раздувает хранилище. */
export function normalizeText(text: string) {
  return text.replace(/\s+/g, " ").trim().slice(0, MAX_TEXT_LENGTH);
}

/** Добавляет записи в конец и вытесняет самые старые сверх `MAX_ENTRIES`. */
export function appendEntries(entries: readonly JournalEntry[], added: readonly JournalEntry[]) {
  return [...entries, ...added].slice(-MAX_ENTRIES);
}

/** Ставит старые записи в начало; при переполнении вытесняются самые старые. */
export function prependEntries(entries: readonly JournalEntry[], older: readonly JournalEntry[]) {
  return [...older, ...entries].slice(-MAX_ENTRIES);
}

/** Повреждённые данные дают пустой журнал, негодные записи отбрасываются. */
export function parseEntries(raw: string | null): JournalEntry[] {
  if (raw === null) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return value.filter(
      (x): x is JournalEntry =>
        typeof x === "object" &&
        x !== null &&
        typeof x.t === "number" &&
        typeof x.text === "string",
    );
  } catch {
    return [];
  }
}

/** Записи пробы вехи 4: формат `{ t, e, d }`. Негодные записи и битый JSON дают пустой список. */
export function parseProbeLog(raw: string | null): JournalEntry[] {
  if (raw === null) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    const entries: JournalEntry[] = [];
    for (const x of value) {
      if (typeof x !== "object" || x === null) continue;
      if (typeof x.t !== "number" || typeof x.e !== "string") continue;
      const details = typeof x.d === "string" && x.d !== "" ? ` ${x.d}` : "";
      entries.push({ t: x.t, text: normalizeText(`проба: ${x.e}${details}`) });
    }
    return entries;
  } catch {
    return [];
  }
}

export function formatEntryLine(entry: JournalEntry) {
  return `${formatTime(entry.t)} ${entry.text}`;
}

export interface CopyContext {
  version: string;
  /** Когда снята копия, мс от эпохи. */
  takenAt: number;
  /** Смещение местного времени от UTC в минутах на восток. */
  offsetMinutes: number;
  userAgent: string;
}

/** Текст копии: первая строка – сведения об устройстве и журнале, дальше записи по одной на строку. */
export function formatCopy(entries: readonly JournalEntry[], context: CopyContext) {
  const header = `Журнал приложения, версия ${context.version}, снят ${formatTime(context.takenAt)}, часовой пояс UTC${formatOffset(context.offsetMinutes)}, записей ${entries.length}, userAgent ${normalizeText(context.userAgent)}`;
  return [header, ...entries.map(formatEntryLine)].join("\n");
}
