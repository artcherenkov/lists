import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "Дизайн-система/Токены",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// Переменные темы из `packages/ui/src/styles.css`; список ведём руками.
const colorGroups: { title: string; names: string[] }[] = [
  {
    title: "Основные",
    names: ["background", "foreground", "card", "card-foreground", "popover", "popover-foreground"],
  },
  {
    title: "Акценты",
    names: [
      "primary",
      "primary-foreground",
      "secondary",
      "secondary-foreground",
      "accent",
      "accent-foreground",
      "destructive",
    ],
  },
  {
    title: "Приглушённые и границы",
    names: ["muted", "muted-foreground", "border", "input", "ring"],
  },
  {
    title: "Графики",
    names: ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5"],
  },
  {
    title: "Боковая панель",
    names: [
      "sidebar",
      "sidebar-foreground",
      "sidebar-primary",
      "sidebar-primary-foreground",
      "sidebar-accent",
      "sidebar-accent-foreground",
      "sidebar-border",
      "sidebar-ring",
    ],
  },
  {
    title: "Шторка",
    names: ["sheet-bg", "sheet-fg", "sheet-handle"],
  },
];

// Классы Tailwind пишем целиком: сборщик находит их по тексту.
const radii = [
  { name: "sm", className: "rounded-sm" },
  { name: "md", className: "rounded-md" },
  { name: "lg", className: "rounded-lg" },
  { name: "xl", className: "rounded-xl" },
  { name: "2xl", className: "rounded-2xl" },
  { name: "3xl", className: "rounded-3xl" },
  { name: "4xl", className: "rounded-4xl" },
];

const fontWeights = [
  { name: "400", className: "font-normal" },
  { name: "500", className: "font-medium" },
  { name: "600", className: "font-semibold" },
  { name: "700", className: "font-bold" },
];

function ColorSwatch({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="size-10 shrink-0 rounded-lg border border-border"
        style={{ backgroundColor: `var(--${name})` }}
      />
      <code className="text-sm">--{name}</code>
    </div>
  );
}

function Colors() {
  return (
    <section className="flex flex-col gap-6">
      <h2 className="font-heading text-xl font-medium">Цвета</h2>
      {colorGroups.map((group) => (
        <div key={group.title} className="flex flex-col gap-3">
          <h3 className="text-sm text-muted-foreground">{group.title}</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {group.names.map((name) => (
              <ColorSwatch key={name} name={name} />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

function Radii() {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-heading text-xl font-medium">Радиусы</h2>
      <div className="flex flex-wrap gap-4">
        {radii.map(({ name, className }) => (
          <div key={name} className="flex flex-col items-center gap-2">
            <div className={`size-16 border-2 border-foreground/40 bg-muted ${className}`} />
            <code className="text-sm">{name}</code>
          </div>
        ))}
      </div>
    </section>
  );
}

function Typography() {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-heading text-xl font-medium">Шрифт</h2>
      <p className="text-sm text-muted-foreground">Inter Variable, файлы – из сборки.</p>
      <p className="font-heading text-3xl font-medium">Вотчлист: что посмотреть вечером</p>
      <div className="flex flex-col gap-1">
        {fontWeights.map(({ name, className }) => (
          <p key={name} className={`text-base ${className}`}>
            {name} – Съешь ещё этих мягких французских булок, да выпей чаю. 0123456789
          </p>
        ))}
      </div>
    </section>
  );
}

export const Tokens: Story = {
  render: () => (
    <div className="flex flex-col gap-10">
      <Colors />
      <Radii />
      <Typography />
    </div>
  ),
};
