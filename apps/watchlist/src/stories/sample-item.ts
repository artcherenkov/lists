import { SAMPLE_ITEMS, type SampleItem } from "../sample/sample-items.ts";

export function sampleItem(id: string): SampleItem {
  const item = SAMPLE_ITEMS.find((candidate) => candidate.id === id);
  if (!item) throw new Error(`Нет подставной записи ${id}`);
  return item;
}
