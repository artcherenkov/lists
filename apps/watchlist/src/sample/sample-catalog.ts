import type { SearchResultView } from "../screens/add-sheet.tsx";
import type { SampleKind } from "./sample-items.ts";

import aurora from "./posters/aurora.svg";
import dusk from "./posters/dusk.svg";
import hills from "./posters/hills.svg";
import sea from "./posters/sea.svg";
import { SAMPLE_KIND_LABELS } from "./sample-items.ts";

export interface CatalogEntry extends SearchResultView {
  kind: SampleKind;
  year: number;
}

// Подставной каталог для поиска: вместо TMDB, до которого на этой вехе ещё нет сервера.
const CATALOG: readonly CatalogEntry[] = [
  entry("catalog-1", "Звёздный ветер", "movie", 2022, dusk),
  entry("catalog-2", "Звёздная пыль севера", "series", 2020, aurora),
  entry("catalog-3", "Город под водой", "movie", 2018, sea),
  entry("catalog-4", "Город ночью", "series", 2024),
  entry("catalog-5", "Маяк на краю", "movie", 2021, sea),
  entry("catalog-6", "Зимний сад", "series", 2019, hills),
];

function entry(
  id: string,
  title: string,
  kind: SampleKind,
  year: number,
  posterUrl?: string,
): CatalogEntry {
  return { id, title, kind, year, posterUrl, details: `${SAMPLE_KIND_LABELS[kind]} · ${year}` };
}

const SEARCH_DELAY_MS = 250;

/** Ищет по названию в подставном каталоге. Отвечает с задержкой, как сеть, и уважает `signal`. */
export async function searchSampleCatalog(
  query: string,
  signal: AbortSignal,
): Promise<readonly CatalogEntry[]> {
  await waitOrAbort(SEARCH_DELAY_MS, signal);
  const needle = query.toLowerCase();
  return CATALOG.filter((candidate) => candidate.title.toLowerCase().includes(needle));
}

function waitOrAbort(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(signal.reason);
      return;
    }
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    function onAbort() {
      clearTimeout(timer);
      reject(signal.reason);
    }
    signal.addEventListener("abort", onAbort, { once: true });
  });
}
