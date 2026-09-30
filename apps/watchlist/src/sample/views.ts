import type { ItemSheetPatch, ItemSheetView } from "../screens/item-sheet.tsx";
import type { PosterCardView } from "../screens/poster-card.tsx";
import type { CatalogEntry } from "./sample-catalog.ts";
import type { NewSampleItem, SampleItem, SampleKind, SampleStatus } from "./sample-items.ts";
import type { ListFiltersValue } from "@lists/ui/components/list-filters";
import type { ChoiceOption } from "@lists/ui/components/segmented-control";

import {
  isSampleKind,
  isSampleStatus,
  SAMPLE_KIND_LABELS,
  SAMPLE_STATUS_LABELS,
} from "./sample-items.ts";

// Экраны получают готовые строки: всё, что зависит от модели записи, вычисляется здесь.

export const ALL_TAB = "all";

/** У «Жду сезон» своей вкладки нет: запись видна во вкладке «Все». */
export const TAB_OPTIONS: readonly ChoiceOption[] = [
  { value: ALL_TAB, label: "Все" },
  { value: "want", label: SAMPLE_STATUS_LABELS.want },
  { value: "watching", label: SAMPLE_STATUS_LABELS.watching },
  { value: "watched", label: SAMPLE_STATUS_LABELS.watched },
];

export const KIND_OPTIONS: readonly [ChoiceOption, ...ChoiceOption[]] = [
  { value: "movie", label: SAMPLE_KIND_LABELS.movie },
  { value: "series", label: SAMPLE_KIND_LABELS.series },
];

export const ALL_KINDS = "all";

export const KIND_FILTER_OPTIONS: readonly ChoiceOption[] = [
  { value: ALL_KINDS, label: "Все" },
  { value: "movie", label: "Фильмы" },
  { value: "series", label: "Сериалы" },
];

export const RATING_BOUNDS = [1, 10] as const;

export const DEFAULT_FILTERS: ListFiltersValue = { kind: ALL_KINDS, rating: RATING_BOUNDS };

export function countChangedFilters(filters: ListFiltersValue): number {
  const kindChanged = filters.kind !== DEFAULT_FILTERS.kind;
  const ratingChanged =
    filters.rating[0] !== DEFAULT_FILTERS.rating[0] ||
    filters.rating[1] !== DEFAULT_FILTERS.rating[1];
  return Number(kindChanged) + Number(ratingChanged);
}

export function itemsOfTab(items: readonly SampleItem[], tab: string): readonly SampleItem[] {
  return items.filter((item) => !item.deleted && (tab === ALL_TAB || item.status === tab));
}

export function statusOptionsFor(kind: SampleKind): readonly ChoiceOption[] {
  const statuses: SampleStatus[] =
    kind === "series"
      ? ["want", "watching", "watched", "waiting"]
      : ["want", "watching", "watched"];
  return statuses.map((status) => ({ value: status, label: SAMPLE_STATUS_LABELS[status] }));
}

/** Год у сериала не показываем: там важен сезон. */
function subtitleOf(item: SampleItem): string {
  return [
    SAMPLE_KIND_LABELS[item.kind],
    item.kind === "movie" && item.year,
    SAMPLE_STATUS_LABELS[item.status],
  ]
    .filter(Boolean)
    .join(" · ");
}

function detailsOf(item: SampleItem): string {
  return [SAMPLE_KIND_LABELS[item.kind], item.year].filter(Boolean).join(" · ");
}

export function toPosterCardView(item: SampleItem): PosterCardView {
  return {
    id: item.id,
    title: item.title,
    subtitle: subtitleOf(item),
    posterUrl: item.posterUrl,
    badge: item.rating === undefined ? undefined : String(item.rating),
    waitingLabel: item.status === "waiting" ? SAMPLE_STATUS_LABELS.waiting : undefined,
  };
}

export function toItemSheetView(item: SampleItem): ItemSheetView {
  return {
    title: item.title,
    details: detailsOf(item),
    posterUrl: item.posterUrl,
    manual: item.manual,
    kind: item.kind,
    status: item.status,
  };
}

/**
 * Значения приходят строками, поэтому неизвестный тип или статус отбрасывается. Если после
 * смены типа статус не подходит (фильм не может «ждать сезон»), запись возвращается в «хочу».
 */
export function applyItemPatch(item: SampleItem, patch: ItemSheetPatch): SampleItem {
  const kind = patch.kind !== undefined && isSampleKind(patch.kind) ? patch.kind : item.kind;
  const status =
    patch.status !== undefined && isSampleStatus(patch.status) ? patch.status : item.status;
  const statusFits = statusOptionsFor(kind).some((option) => option.value === status);
  return {
    ...item,
    title: patch.title ?? item.title,
    kind,
    status: statusFits ? status : "want",
  };
}

export function newItemFromCatalog(entry: CatalogEntry): NewSampleItem {
  return {
    title: entry.title,
    kind: entry.kind,
    year: entry.year,
    posterUrl: entry.posterUrl,
    manual: false,
  };
}

/** Тип приходит строкой из формы, но берётся из `KIND_OPTIONS`: неизвестный – ошибка кода. */
export function newItemFromDraft(draft: { title: string; kind: string }): NewSampleItem {
  if (!isSampleKind(draft.kind)) throw new Error(`Неизвестный тип записи: ${draft.kind}`);
  return { title: draft.title, kind: draft.kind, manual: true };
}
