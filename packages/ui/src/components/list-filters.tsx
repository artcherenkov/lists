import type { ChoiceOption } from "./segmented-control";

import { SlidersHorizontalIcon } from "lucide-react";
import { useId } from "react";

import { formatRatingRange } from "../lib/rating-range";
import { SegmentedControl } from "./segmented-control";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "./ui/popover";
import { Slider } from "./ui/slider";

export interface ListFiltersValue {
  kind: string;
  rating: readonly [min: number, max: number];
}

/**
 * Кнопка «Фильтры» и окно с ними. Что считать действующим фильтром и сколько записей
 * нашлось – решает родитель: сюда приходят готовые числа.
 */
export function ListFilters({
  value,
  onChange,
  kindFilterOptions,
  ratingBounds,
  activeCount,
  resultCount,
  onReset,
}: {
  value: ListFiltersValue;
  onChange: (value: ListFiltersValue) => void;
  /** Первый вариант – «без фильтра» (например, «Все»). */
  kindFilterOptions: readonly ChoiceOption[];
  ratingBounds: readonly [min: number, max: number];
  /** Число на кнопке «Фильтры · N». */
  activeCount: number;
  /** `undefined` – ещё считается. */
  resultCount?: number;
  onReset: () => void;
}) {
  const kindName = useId();
  const ratingLabelId = useId();

  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" size="lg" />}>
        <SlidersHorizontalIcon data-icon="inline-start" />
        {activeCount ? `Фильтры · ${activeCount}` : "Фильтры"}
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-80 max-w-[calc(100vw-2rem)] gap-5 p-4"
      >
        <PopoverTitle className="sr-only">Фильтры списка</PopoverTitle>
        <SegmentedControl
          name={kindName}
          label="Тип"
          value={value.kind}
          options={kindFilterOptions}
          onChange={(kind) => onChange({ ...value, kind })}
        />
        <div role="group" aria-labelledby={ratingLabelId} className="flex flex-col gap-2.5">
          <div className="flex items-baseline justify-between gap-3">
            <div id={ratingLabelId} className="text-base leading-none font-medium">
              Моя оценка
            </div>
            {/* Ползунки сами сообщают значения скринридеру, строка только для глаз. */}
            <div
              className="text-2xl leading-8 font-bold tracking-[-0.01em] tabular-nums"
              aria-hidden="true"
            >
              {formatRatingRange(value.rating)}
            </div>
          </div>
          <Slider
            min={ratingBounds[0]}
            max={ratingBounds[1]}
            step={1}
            minStepsBetweenValues={0}
            value={value.rating}
            onValueChange={(rating) => {
              // Тип слайдера допускает и одно число, но ползунков у нас два – всегда пара.
              if (typeof rating === "number") return;
              const [newMin, newMax] = rating;
              if (newMin === undefined || newMax === undefined) return;
              onChange({ ...value, rating: [newMin, newMax] });
            }}
            className="py-2"
          />
        </div>
        <div className="flex items-center justify-between gap-3 border-t pt-3">
          <span className="text-sm text-muted-foreground" role="status">
            Найдено: {resultCount ?? "…"}
          </span>
          <Button variant="ghost" size="sm" disabled={activeCount === 0} onClick={onReset}>
            Сбросить
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
