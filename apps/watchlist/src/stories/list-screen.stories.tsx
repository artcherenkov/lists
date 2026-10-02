import type { ListFiltersValue } from "@lists/ui/components/list-filters";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { useState } from "react";

import { SAMPLE_ITEMS, type SampleItem } from "../sample/sample-items.ts";
import { ALL_TAB, itemsOfTab, TAB_OPTIONS, toPosterCardView } from "../sample/views.ts";
import { ListScreen } from "../screens/list-screen.tsx";
import { StatefulListFilters } from "./stateful-list-filters.tsx";

function ListScreenDemo({
  records,
  emptyText,
  initialFilters,
  onUpdate,
}: {
  records: readonly SampleItem[] | undefined;
  emptyText: string;
  initialFilters?: ListFiltersValue;
  onUpdate?: () => void;
}) {
  const [tab, setTab] = useState(ALL_TAB);
  const visible = records && itemsOfTab(records, tab);

  return (
    <ListScreen
      title="Вотчлист"
      tabs={TAB_OPTIONS}
      tab={tab}
      onTabChange={setTab}
      filtersSlot={
        <StatefulListFilters initialValue={initialFilters} resultCount={visible?.length} />
      }
      items={visible?.map(toPosterCardView)}
      emptyText={emptyText}
      onOpenItem={() => {}}
      onAdd={() => {}}
      onOpenProfile={() => {}}
      onUpdate={onUpdate}
    />
  );
}

const meta = {
  title: "Компоненты/ListScreen",
  component: ListScreenDemo,
  args: { records: SAMPLE_ITEMS, emptyText: "Пока пусто" },
  argTypes: {
    records: { control: false },
    initialFilters: { control: false },
    onUpdate: { control: false },
  },
} satisfies Meta<typeof ListScreenDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithItems: Story = {};

export const WithActiveFilter: Story = {
  args: { initialFilters: { kind: "series", rating: [1, 10] } },
};

export const Empty: Story = {
  args: { records: [] },
};

export const WithNewVersion: Story = {
  args: { onUpdate: () => {} },
};

export const Loading: Story = {
  args: { records: undefined },
};
