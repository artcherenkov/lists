import { SAMPLE_ITEMS, type SampleItem } from "../sample/sample-items.ts";

/** Запись из подставного списка по id, например `"sample-4"` – сериал со статусом «Жду сезон». */
export function sampleItem(id: string): SampleItem {
  const item = SAMPLE_ITEMS.find((candidate) => candidate.id === id);
  if (!item) throw new Error(`Нет подставной записи ${id}`);
  return item;
}
