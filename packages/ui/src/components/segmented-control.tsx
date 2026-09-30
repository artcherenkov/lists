import { useId } from "react";

/** Вариант выбора: значение для кода и подпись для человека. Так же описаны вкладки списка. */
export interface ChoiceOption {
  value: string;
  label: string;
}

// Классы дорожки и пункта – копия TabsList и TabsTrigger из `ui/tabs.tsx` (пресет vega) без
// полосок `line`, вертикального вида, иконок и `flex-1`: дорожка у нас `w-fit`, пункты по ширине
// содержимого и не растягиваются.
// Общим кодом их не сделать: `ui/tabs.tsx` сгенерирован CLI shadcn и править его нельзя,
// а Tabs хранит выбор в Base UI и не умеет радио внутри. Поэтому «выбран» и фокус читаем
// через `has-[:checked]` и `has-[:focus-visible]` на подписи вместо `data-active` и `focus-visible`.
// При обновлении пресета сверяй классы с `ui/tabs.tsx`.
// Крупный размер (вкладки главного: 40px, `text-base`) остаётся у самого Tabs, здесь – компактный.
const trackClass = "flex h-9 w-fit max-w-full rounded-lg bg-muted p-[3px] text-muted-foreground";
const optionClass =
  "inline-flex cursor-pointer items-center justify-center rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap text-foreground/60 transition-all select-none hover:text-foreground dark:text-muted-foreground dark:hover:text-foreground has-[:checked]:bg-background has-[:checked]:text-foreground has-[:checked]:shadow-sm dark:has-[:checked]:border-input dark:has-[:checked]:bg-input/30 dark:has-[:checked]:text-foreground has-[:focus-visible]:border-ring has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50 has-[:focus-visible]:outline-1 has-[:focus-visible]:outline-ring";

// Подпись выглядит как `Label` («Название», «Статус» у выпадающего списка) в сетке с `gap-2`:
// те же `text-sm leading-none font-medium`, отступ `mb-2` вместо зазора сетки, потому что
// `legend` в сетку не встаёт.
const legendClass = "mb-2 text-sm leading-none font-medium";

/**
 * Компактный выбор одного варианта: дорожка со скруглёнными углами, выбранный пункт – плашка
 * внутри, как у компактных вкладок пресета. Внутри – нативный radio: клавиатура, группировка
 * и «выбран» достаются даром. Группа – `fieldset` с `legend` из `label`: так она получает имя
 * для скринридера.
 *
 * Для вариантов, которые не помещаются в строку, не подходит: нужен другой вид выбора.
 */
export function SegmentedControl({
  label,
  value,
  options,
  onChange,
}: {
  /** Подпись группы: видна над дорожкой и служит её именем. */
  label: string;
  value: string;
  options: readonly ChoiceOption[];
  onChange: (value: string) => void;
}) {
  const name = useId();

  return (
    <fieldset className="min-w-0">
      <legend className={legendClass}>{label}</legend>
      <div className={trackClass}>
        {options.map((option) => (
          <label key={option.value} className={optionClass}>
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
