/** Вариант выбора: значение для кода и подпись для человека. Так же описаны вкладки списка. */
export interface ChoiceOption {
  value: string;
  label: string;
}

// Классы дорожки и пункта – копия TabsList и TabsTrigger из `ui/tabs.tsx` без полосок,
// вертикального вида и классов, которые там перебиваются (`border-transparent!` гасит рамку
// выбранного пункта в тёмной теме и рамку фокуса, поэтому у нас рамка просто прозрачная).
// Общим кодом их не сделать: `ui/tabs.tsx` сгенерирован CLI shadcn и править его нельзя,
// а Tabs хранит выбор в Base UI и не умеет радио внутри. Поэтому «выбран» и фокус читаем
// через `has-[:checked]` и `has-[:focus-visible]` на подписи.
// Крупный размер (вкладки главного, `min-h-12`, `text-base`) остаётся у самого Tabs, здесь – компактный.
const trackClass = "flex h-9 w-fit max-w-full rounded-full bg-muted p-[3px] text-muted-foreground";
const optionClass =
  "inline-flex cursor-pointer items-center justify-center rounded-full border border-transparent px-3 text-sm font-medium whitespace-nowrap text-foreground/60 transition-all select-none hover:text-foreground dark:text-muted-foreground dark:hover:text-foreground has-[:checked]:bg-background has-[:checked]:text-foreground dark:has-[:checked]:bg-input/30 dark:has-[:checked]:text-foreground has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50 has-[:focus-visible]:outline-1 has-[:focus-visible]:outline-ring";

// Подпись выглядит как `Label` («Название», «Статус» у выпадающего списка) в сетке с `gap-2`:
// те же `text-sm leading-none font-medium`, отступ `mb-2` вместо зазора сетки, потому что
// `legend` в сетку не встаёт.
const legendClass = "mb-2 text-sm leading-none font-medium";

/**
 * Компактный выбор одного варианта: дорожка-пилюля, выбранный пункт – пилюля внутри, как у
 * вкладок списка. Внутри – нативный radio: клавиатура, группировка и «выбран» достаются даром.
 * Группа – `fieldset` с `legend` из `label`: так она получает имя для скринридера.
 *
 * Для вариантов, которые не помещаются в строку, не подходит: нужен другой вид выбора.
 */
export function SegmentedControl({
  name,
  label,
  value,
  options,
  onChange,
}: {
  name: string;
  /** Подпись группы: видна над дорожкой и служит её именем. */
  label: string;
  value: string;
  options: readonly ChoiceOption[];
  onChange: (value: string) => void;
}) {
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
