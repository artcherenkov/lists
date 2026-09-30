import type { ItemSheetPatch } from "../screens/item-sheet.tsx";
import type { NewSampleItem, SampleItem } from "./sample-items.ts";

import { useRef, useState } from "react";

import { SAMPLE_ITEMS } from "./sample-items.ts";
import { applyItemPatch } from "./views.ts";

/**
 * Удаление мягкое: помеченная запись остаётся в `items`, поэтому открытая карточка доезжает
 * вниз с прежним видом, а «Отменить» возвращает запись на то же место.
 */
export function useSampleList() {
  const [items, setItems] = useState<readonly SampleItem[]>(SAMPLE_ITEMS);
  const nextId = useRef(1);

  const add = (newItem: NewSampleItem) => {
    const id = `added-${nextId.current++}`;
    setItems((current) => [{ ...newItem, id, status: "want", deleted: false }, ...current]);
  };

  const update = (id: string, patch: ItemSheetPatch) => {
    setItems((current) =>
      current.map((item) => (item.id === id ? applyItemPatch(item, patch) : item)),
    );
  };

  const setDeleted = (id: string, deleted: boolean) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, deleted } : item)));
  };

  return { items, add, update, setDeleted };
}
