export interface ChipOption {
  value: string;
  label: string;
}

const chipBase =
  "cursor-pointer rounded-full border text-center text-sm select-none has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50";
const chipClass = `${chipBase} py-2.5`;
/** Заливка «выбрано». Отдельно от `chipBase`: не каждый чипс закрашивается. */
const chipFillClass =
  "has-[:checked]:border-primary has-[:checked]:bg-primary has-[:checked]:text-primary-foreground";

/**
 * Выбор из нескольких вариантов чипсами. Внутри — нативный radio: клавиатура, группировка
 * и «выбран» достаются даром, стилизуем обёртку через has-[:checked].
 */
export function Chips({
  name,
  value,
  options,
  onChange,
  className = "flex flex-wrap gap-2",
  itemClassName = "px-4",
}: {
  name: string;
  value: string;
  options: readonly ChipOption[];
  onChange: (value: string) => void;
  className?: string;
  itemClassName?: string;
}) {
  return (
    <div className={className}>
      {options.map((option) => (
        <label key={option.value} className={`${chipClass} ${chipFillClass} ${itemClassName}`}>
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
  );
}
