import type { ChoiceOption } from "@lists/ui/components/segmented-control";
import type { ReactNode } from "react";

import { Button } from "@lists/ui/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@lists/ui/components/ui/tabs";
import { PlusIcon, UserIcon } from "lucide-react";
import { createPortal } from "react-dom";

import { PosterCard, type PosterCardView } from "./poster-card.tsx";

/** Экран списка: шапка, ряд из вкладок и значка фильтров, сетка постеров и плавающая кнопка «+». */
export function ListScreen({
  title,
  tabs,
  tab,
  onTabChange,
  filtersSlot,
  items,
  emptyText,
  onOpenItem,
  onAdd,
  onOpenProfile,
}: {
  title: string;
  tabs: readonly ChoiceOption[];
  tab: string;
  onTabChange: (tab: string) => void;
  /** Значок и окно фильтров: их собирает родитель, экран лишь отводит им место справа от вкладок. */
  filtersSlot: ReactNode;
  /** `undefined` – записи ещё не загрузились. */
  items: readonly PosterCardView[] | undefined;
  /** Что написать, когда записей нет: «Пока пусто» или «Нет записей с такими фильтрами». */
  emptyText: string;
  onOpenItem: (id: string) => void;
  /** Синхронный: родитель открывает шторку через `openAddSheet` в стеке этого же клика. */
  onAdd: () => void;
  onOpenProfile: () => void;
}) {
  return (
    // pb-24 — чтобы плавающая кнопка не накрывала последнюю карточку.
    // Отступы через env(): с viewport-fit=cover контент тянется под статус-зону
    // и стеклянные контролы, safe-area компенсирует.
    <main className="mx-auto max-w-4xl px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[calc(6rem+env(safe-area-inset-bottom))]">
      {/* h-16 — высота под тост: он падает сверху по центру и накрывал ряд под шапкой. */}
      <header className="mb-3 flex h-16 items-center justify-between gap-4">
        <h1 className="font-heading text-xl font-medium">{title}</h1>
        <Button variant="ghost" size="icon-lg" aria-label="Профиль" onClick={onOpenProfile}>
          <UserIcon className="size-6" />
        </Button>
      </header>

      <div className="mb-4 flex items-center gap-2">
        <Tabs
          value={tab}
          onValueChange={(value) => onTabChange(String(value))}
          className="min-w-0 flex-1"
        >
          {/* Ниже брейкпойнта `xs` ряд штатный: на узких экранах (iPhone SE, mini) крупный
              текст не умещается. Значок фильтров меняет размер на той же границе, см.
              `list-filters.tsx`. Высота дорожки: у shadcn она задана селектором
              `group-data-horizontal/tabs:h-9`; переопределение несёт тот же селектор, чтобы
              победа не зависела от порядка правил в CSS. */}
          <TabsList className="w-full xs:group-data-horizontal/tabs:h-10">
            {tabs.map(({ value, label }) => (
              // flex-auto вместо flex-1: ширина от слова, а не поровну — «Все» короче «Посмотрел».
              // h-full: у shadcn плашка на 1px ниже внутренней высоты дорожки, и зазоры сверху
              // и снизу выходят 4px и 3px; с h-full оба по 3px.
              // Скругления – из vega: у списка `rounded-lg`, у плашки `rounded-md`, они концентричны
              // при отступе 3px, а от высоты не зависят.
              <TabsTrigger key={value} value={value} className="h-full flex-auto xs:text-base">
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        {filtersSlot}
      </div>

      {items?.length === 0 && (
        <p className="py-12 text-center text-sm text-muted-foreground">{emptyText}</p>
      )}

      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {items?.map((item) => (
          <li key={item.id}>
            <PosterCard item={item} onOpen={onOpenItem} />
          </li>
        ))}
      </ul>

      {/* Портал наружу из #root: пока scale-эффект держит transform на обёртке,
          fixed-элементы внутри неё позиционируются от обёртки и съезжают. */}
      {createPortal(
        <Button
          size="icon"
          aria-label="Добавить"
          onClick={onAdd}
          // Стекло: сквозь кнопку видно размытые постеры, обводка ловит светлый край.
          className="fixed right-6 bottom-[calc(1.5rem+env(safe-area-inset-bottom))] z-40 size-16 rounded-full border border-white/25 bg-primary/65 shadow-lg backdrop-blur-xl hover:bg-primary/75"
        >
          <PlusIcon className="size-7" />
        </Button>,
        document.body,
      )}
    </main>
  );
}
