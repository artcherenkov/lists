import type { Meta, StoryObj } from "@storybook/react-vite";

import { useState } from "react";

import { SAMPLE_ITEMS, type SampleItem } from "../sample/sample-items.ts";
import { ALL_TAB, itemsOfTab, TAB_OPTIONS, toPosterCardView } from "../sample/views.ts";
import { ListScreen } from "../screens/list-screen.tsx";
import { StatefulListFilters } from "./stateful-list-filters.tsx";

// Экран получает готовые вид-модели и обработчики. Здесь вкладкой управляет история,
// а записи приходят из подставного списка; `undefined` – «ещё не загрузились».
function ListScreenDemo({
  records,
  emptyText,
}: {
  records: readonly SampleItem[] | undefined;
  emptyText: string;
}) {
  const [tab, setTab] = useState(ALL_TAB);
  const visible = records && itemsOfTab(records, tab);

  return (
    <ListScreen
      title="Вотчлист"
      tabs={TAB_OPTIONS}
      tab={tab}
      onTabChange={setTab}
      filtersSlot={<StatefulListFilters resultCount={visible?.length} />}
      items={visible?.map(toPosterCardView)}
      emptyText={emptyText}
      onOpenItem={() => {}}
      onAdd={() => {}}
      onOpenProfile={() => {}}
    />
  );
}

const meta = {
  title: "Компоненты/ListScreen",
  component: ListScreenDemo,
  args: { records: SAMPLE_ITEMS, emptyText: "Пока пусто" },
  argTypes: { records: { control: false } },
  // Автодокументации нет: экран на всю страницу, а кнопка «+» выходит порталом и вставала бы
  // поверх документации.
  tags: ["!autodocs"],
} satisfies Meta<typeof ListScreenDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithItems: Story = {};

export const Empty: Story = {
  args: { records: [] },
};

// Записи ещё грузятся: сетки и текста пустого списка нет.
export const Loading: Story = {
  args: { records: undefined },
};
