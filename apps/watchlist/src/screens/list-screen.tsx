import type { ChoiceOption } from "@lists/ui/components/segmented-control";
import type { ReactNode } from "react";

import { Button } from "@lists/ui/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@lists/ui/components/ui/tabs";
import { PlusIcon, UserIcon } from "lucide-react";
import { createPortal } from "react-dom";

import { PosterCard, type PosterCardView } from "./poster-card.tsx";
import { UpdateButton } from "./update-button.tsx";

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
  onUpdate,
}: {
  title: string;
  tabs: readonly ChoiceOption[];
  tab: string;
  onTabChange: (tab: string) => void;
  filtersSlot: ReactNode;
  /** `undefined` – записи ещё не загрузились. */
  items: readonly PosterCardView[] | undefined;
  emptyText: string;
  onOpenItem: (id: string) => void;
  /** Синхронный: родитель открывает шторку через `openAddSheet` в стеке этого же клика. */
  onAdd: () => void;
  onOpenProfile: () => void;
  /** Есть, когда новая версия скачана: тогда слева от «Добавить» показана кнопка обновления. */
  onUpdate?: () => void;
}) {
  return (
    <main className="mx-auto max-w-4xl px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[calc(6rem+env(safe-area-inset-bottom))]">
      {/* h-16: высота подобрана под тост об удалении, он падает сверху по центру
          и иначе накрывает ряд под шапкой. */}
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
          {/* Ниже брейкпойнта `xs` ряд штатный, причина – у брейкпойнта `xs` в styles.css.
              Высоту дорожки у shadcn задаёт селектор `group-data-horizontal/tabs:h-9`:
              переопределение несёт тот же селектор, чтобы победа не зависела от порядка
              правил в CSS. */}
          <TabsList className="w-full xs:group-data-horizontal/tabs:h-10">
            {tabs.map(({ value, label }) => (
              // h-full: у shadcn плашка на 1 px ниже внутренней высоты дорожки, и зазоры сверху
              // и снизу выходят неравными.
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

      {/* Портал наружу из #root: причина – в комментарии к обёртке в index.html. */}
      {createPortal(
        <>
          {onUpdate && <UpdateButton onUpdate={onUpdate} />}
          <Button
            size="icon"
            aria-label="Добавить"
            onClick={onAdd}
            className="fixed right-6 bottom-[calc(1.5rem+env(safe-area-inset-bottom))] z-40 size-16 rounded-full border border-white/25 bg-primary/65 shadow-lg backdrop-blur-xl hover:bg-primary/75"
          >
            <PlusIcon className="size-7" />
          </Button>
        </>,
        document.body,
      )}
    </main>
  );
}
