import { HourglassIcon } from "lucide-react";

export interface PosterCardView {
  id: string;
  title: string;
  /** Готовая к показу строка, например «Тип · 2024 · Статус». */
  subtitle: string;
  /** Нет постера – вместо него на плашке название. */
  posterUrl?: string;
  /** Оценка в правом верхнем углу. Показывать ли её, решает слой выше. */
  badge?: string;
  /** Есть – в левом верхнем углу песочные часы, а строка служит их подписью для скринридера. */
  waitingLabel?: string;
}

/** Плитка записи в сетке списка. */
export function PosterCard({
  item,
  onOpen,
}: {
  item: PosterCardView;
  onOpen: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(item.id)}
      className="group w-full text-left outline-none"
    >
      <div className="relative aspect-2/3 overflow-hidden rounded-lg border bg-muted group-focus-visible:border-ring group-focus-visible:ring-3 group-focus-visible:ring-ring/50">
        {item.posterUrl ? (
          <img src={item.posterUrl} alt="" loading="lazy" className="size-full object-cover" />
        ) : (
          <span className="flex size-full items-center justify-center p-3 text-center text-sm text-muted-foreground">
            {item.title}
          </span>
        )}
        {/* Песочные часы: запись ждёт продолжения. */}
        {item.waitingLabel && (
          <span
            role="img"
            aria-label={item.waitingLabel}
            className="absolute top-1.5 left-1.5 rounded-md bg-black/70 p-1 text-white"
          >
            <HourglassIcon className="size-3.5" />
          </span>
        )}
        {item.badge && (
          <span className="absolute top-1.5 right-1.5 rounded-md bg-black/70 px-1.5 py-0.5 text-xs font-medium text-white">
            <span className="sr-only">Оценка: </span>
            {item.badge}
          </span>
        )}
      </div>
      <div className="mt-2 line-clamp-2 text-sm font-medium">{item.title}</div>
      <div className="text-xs text-muted-foreground">{item.subtitle}</div>
    </button>
  );
}
