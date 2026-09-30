import aurora from "./posters/aurora.svg";
import dusk from "./posters/dusk.svg";
import hills from "./posters/hills.svg";
import sea from "./posters/sea.svg";

// Подставные данные вехи 1. Модель записи настоящая появится в вехе 4 вместе со слоем данных,
// поэтому здесь – минимум, чтобы экраны было на чём показать. Правил списка тут нет.

export type SampleKind = "movie" | "series";
export type SampleStatus = "want" | "watching" | "watched" | "waiting";

export interface SampleItem {
  id: string;
  title: string;
  kind: SampleKind;
  status: SampleStatus;
  year?: number;
  rating?: number;
  posterUrl?: string;
  /** Запись заведена руками, а не выбрана из каталога. */
  manual: boolean;
  /** Мягкое удаление: запись остаётся, пока можно нажать «Отменить». */
  deleted: boolean;
}

export const SAMPLE_KIND_LABELS: Record<SampleKind, string> = {
  movie: "Фильм",
  series: "Сериал",
};

export const SAMPLE_STATUS_LABELS: Record<SampleStatus, string> = {
  want: "Хочу",
  watching: "Смотрю",
  watched: "Посмотрел",
  waiting: "Жду сезон",
};

/** Что известно о новой записи. Статус у неё всегда «хочу», остальное правится в карточке. */
export type NewSampleItem = Pick<SampleItem, "title" | "kind" | "year" | "posterUrl" | "manual">;

export function isSampleKind(value: string): value is SampleKind {
  return value === "movie" || value === "series";
}

export function isSampleStatus(value: string): value is SampleStatus {
  return value === "want" || value === "watching" || value === "watched" || value === "waiting";
}

// Порядок – как в списке: новые сверху. «Смотрю» нарочно одна запись: из неё выходит
// пустая вкладка, когда запись удалена или сменила статус.
export const SAMPLE_ITEMS: readonly SampleItem[] = [
  {
    id: "sample-1",
    title: "Ночной экспресс",
    kind: "movie",
    status: "want",
    year: 2023,
    posterUrl: dusk,
    manual: false,
    deleted: false,
  },
  {
    id: "sample-2",
    title: "Северный свет",
    kind: "series",
    status: "watching",
    year: 2022,
    posterUrl: aurora,
    manual: false,
    deleted: false,
  },
  {
    id: "sample-3",
    title: "Кольцо холмов",
    kind: "movie",
    status: "watched",
    year: 2019,
    rating: 8,
    posterUrl: hills,
    manual: false,
    deleted: false,
  },
  {
    id: "sample-4",
    title: "Тихая гавань",
    kind: "series",
    status: "waiting",
    year: 2021,
    rating: 9,
    posterUrl: sea,
    manual: false,
    deleted: false,
  },
  {
    id: "sample-5",
    title: "Письма из Лиссабона",
    kind: "movie",
    status: "want",
    year: 2020,
    manual: false,
    deleted: false,
  },
  {
    id: "sample-6",
    title: "Старый маяк",
    kind: "movie",
    status: "watched",
    year: 2016,
    posterUrl: sea,
    manual: false,
    deleted: false,
  },
  {
    id: "sample-7",
    title: "Долгая осень",
    kind: "series",
    status: "watched",
    year: 2018,
    rating: 10,
    posterUrl: hills,
    manual: false,
    deleted: false,
  },
  {
    id: "sample-8",
    title: "Домашнее видео 1994",
    kind: "movie",
    status: "want",
    manual: true,
    deleted: false,
  },
];
