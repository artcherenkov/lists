const pad = (n: number) => String(n).padStart(2, "0");

/** «2026-10-04 12:03:01» по местному времени платформы. */
export function formatTime(ms: number) {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/** Смещение от UTC в минутах на восток, например 180, в виде «+03:00». */
export function formatOffset(minutesEast: number) {
  const sign = minutesEast >= 0 ? "+" : "-";
  const abs = Math.abs(minutesEast);
  return `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}

/** «2 д 3 ч 4 мин 5 с»: старшие нулевые единицы опускаются, внутренние остаются. */
export function formatDuration(ms: number) {
  const total = Math.max(0, Math.round(ms / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return [
    days > 0 && `${days} д`,
    days + hours > 0 && `${hours} ч`,
    days + hours + minutes > 0 && `${minutes} мин`,
    `${seconds} с`,
  ]
    .filter(Boolean)
    .join(" ");
}

export const yesNo = (value: boolean) => (value ? "да" : "нет");
