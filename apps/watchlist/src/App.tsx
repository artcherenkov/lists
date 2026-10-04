import { ListFilters, type ListFiltersValue } from "@lists/ui/components/list-filters";
import { useState } from "react";
import { toast } from "sonner";

import { ConnectedProfileSheet } from "./connected-profile-sheet.tsx";
import { searchSampleCatalog } from "./sample/sample-catalog.ts";
import { useSampleList } from "./sample/use-sample-list.ts";
import {
  ALL_TAB,
  countChangedFilters,
  DEFAULT_FILTERS,
  itemsOfTab,
  KIND_FILTER_OPTIONS,
  KIND_OPTIONS,
  newItemFromCatalog,
  newItemFromDraft,
  RATING_BOUNDS,
  statusOptionsFor,
  TAB_OPTIONS,
  toItemSheetView,
  toPosterCardView,
} from "./sample/views.ts";
import { AddSheet, openAddSheet } from "./screens/add-sheet.tsx";
import { ItemSheet } from "./screens/item-sheet.tsx";
import { ListScreen } from "./screens/list-screen.tsx";
import { useServiceWorker } from "./use-service-worker.ts";

// Подставное состояние до слоя данных: записи в памяти, фильтры записи не отбирают.
export function App() {
  const { isNewVersionReady, updateToNewVersion } = useServiceWorker();
  const list = useSampleList();
  const [tab, setTab] = useState(ALL_TAB);
  const [filters, setFilters] = useState<ListFiltersValue>(DEFAULT_FILTERS);
  const [adding, setAdding] = useState(false);
  const [openedId, setOpenedId] = useState<string>();
  const [profileOpen, setProfileOpen] = useState(false);

  const tabItems = itemsOfTab(list.items, tab);
  const changedFilters = countChangedFilters(filters);
  const opened = list.items.find((item) => item.id === openedId);

  const showAdded = () => setTab("want");

  const deleteOpened = () => {
    if (!opened) return;
    const { id, title } = opened;
    list.setDeleted(id, true);
    toast(`«${title}» удалён`, {
      action: { label: "Отменить", onClick: () => list.setDeleted(id, false) },
    });
  };

  return (
    <>
      <ListScreen
        title="Вотчлист"
        tabs={TAB_OPTIONS}
        tab={tab}
        onTabChange={setTab}
        filtersSlot={
          <ListFilters
            value={filters}
            onChange={setFilters}
            kindFilterOptions={KIND_FILTER_OPTIONS}
            ratingBounds={RATING_BOUNDS}
            activeCount={changedFilters}
            resultCount={tabItems.length}
            onReset={() => setFilters(DEFAULT_FILTERS)}
          />
        }
        items={tabItems.map(toPosterCardView)}
        emptyText={changedFilters > 0 ? "Нет записей с такими фильтрами" : "Пока пусто"}
        onOpenItem={setOpenedId}
        onAdd={() => openAddSheet(() => setAdding(true))}
        onOpenProfile={() => setProfileOpen(true)}
        onUpdate={isNewVersionReady ? updateToNewVersion : undefined}
      />

      {adding && (
        <AddSheet
          search={searchSampleCatalog}
          searchPlaceholder="Название фильма или сериала"
          kindOptions={KIND_OPTIONS}
          onPick={(entry) => {
            list.add(newItemFromCatalog(entry));
            showAdded();
          }}
          onCreate={(draft) => {
            list.add(newItemFromDraft(draft));
            showAdded();
          }}
          onClosed={() => setAdding(false)}
        />
      )}

      {opened && (
        // key: для другой записи шторка создаётся заново – черновик названия не переходит дальше.
        <ItemSheet
          key={opened.id}
          item={toItemSheetView(opened)}
          kindOptions={KIND_OPTIONS}
          statusOptions={statusOptionsFor(opened.kind)}
          onChange={(patch) => list.update(opened.id, patch)}
          onDelete={deleteOpened}
          onClosed={() => setOpenedId(undefined)}
        />
      )}

      {profileOpen && <ConnectedProfileSheet onClosed={() => setProfileOpen(false)} />}
    </>
  );
}
