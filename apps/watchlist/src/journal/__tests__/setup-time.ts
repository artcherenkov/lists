/** Московское время без переходов на летнее: ожидаемые значения в тестах не зависят от машины. */
export function useMoscowTime() {
  process.env.TZ = "Europe/Moscow";
}

/** Мс от эпохи для местного московского времени; месяц с 1. */
export function moscow(y: number, mo: number, d: number, h = 0, mi = 0, s = 0) {
  return Date.UTC(y, mo - 1, d, h - 3, mi, s);
}
