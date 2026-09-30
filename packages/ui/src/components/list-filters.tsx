import type { ChipOption } from "./chips";

import { SlidersHorizontalIcon } from "lucide-react";
import { useId } from "react";

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
  kindFilterOptions: readonly ChipOption[];
  ratingBounds: readonly [min: number, max: number];
  /** Число на кнопке «Фильтры · N». */
  activeCount: number;
  /** `undefined` – ещё считается. */
  resultCount?: number;
  onReset: () => void;
}) {
  const kindName = useId();
  const ratingLabelId = useId();
  const [min, max] = value.rating;

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
        <fieldset className="min-w-0">
          <legend className="mb-2 text-sm leading-5 font-medium">Тип</legend>
          <div className="flex w-fit rounded-lg bg-muted p-0.5">
            {kindFilterOptions.map((option) => (
              // Фокус и выбор в тёмной теме — как у вкладок статуса под кнопкой.
              <label
                key={option.value}
                className="flex min-h-8 cursor-pointer items-center rounded-md px-3 text-sm font-medium whitespace-nowrap text-muted-foreground has-[:checked]:bg-background has-[:checked]:text-foreground has-[:checked]:shadow-sm has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50 has-[:focus-visible]:outline-1 has-[:focus-visible]:outline-ring dark:has-[:checked]:bg-input/30"
              >
                <input
                  type="radio"
                  name={kindName}
                  value={option.value}
                  checked={value.kind === option.value}
                  onChange={() => onChange({ ...value, kind: option.value })}
                  className="sr-only"
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>
        <div role="group" aria-labelledby={ratingLabelId} className="flex flex-col gap-2">
          <div id={ratingLabelId} className="text-sm leading-5 font-medium">
            Моя оценка
          </div>
          <div>
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
            <div
              className="mt-1 flex justify-between text-xs leading-4 text-muted-foreground tabular-nums"
              aria-hidden="true"
            >
              <span>{min}</span>
              <span>{max}</span>
            </div>
          </div>
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
