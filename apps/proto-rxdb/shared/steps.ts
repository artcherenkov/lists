// Цепочка перевода данных: шаг N переводит запись из версии N-1 в версию N (решение 20).
// Один код на клиенте (копия на устройстве) и на сервере (выкладка, поднявшая версию).
export const CURRENT_DV = 3;

type Doc = Record<string, any>;

const steps: Record<number, (d: Doc) => Doc> = {
  // оценка 1–10 становится звёздами 1–5
  2: (d) => ({ ...d, rating: d.rating == null ? null : Math.floor((d.rating + 1) / 2) }),
  // значение «film» переименовано в «movie»
  3: (d) => ({ ...d, kind: d.kind === "film" ? "movie" : d.kind }),
  // тождественный шаг: только для замера цены копирования коллекции при подъёме версии
  4: (d) => d,
};

// Для проверки упавшего шага: клиент подставляет сюда свою неисправность.
export const faults: { step?: (to: number, d: Doc) => void } = {};

export function applyStep(to: number, d: Doc): Doc {
  faults.step?.(to, d);
  return { ...steps[to]!(d), dv: to };
}

/** Доводит запись до версии `to` по одному шагу. Бросает, если шаг упал. */
export function lift(d: Doc, to: number): Doc {
  for (let v = (d.dv ?? 1) + 1; v <= to; v++) d = applyStep(v, d);
  return d;
}
