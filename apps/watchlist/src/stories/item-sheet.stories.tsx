import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";

import { useState } from "react";

import { type SampleItem } from "../sample/sample-items.ts";
import {
  applyItemPatch,
  KIND_OPTIONS,
  statusOptionsFor,
  toItemSheetView,
} from "../sample/views.ts";
import { ItemSheet } from "../screens/item-sheet.tsx";
import { Reopenable } from "./reopenable.tsx";
import { sampleItem } from "./sample-item.ts";

function ItemSheetDemo({
  item: initialItem,
  withoutStatus = false,
  onClosed,
}: {
  item: SampleItem;
  withoutStatus?: boolean;
  onClosed: () => void;
}) {
  const [item, setItem] = useState(initialItem);
  return (
    <ItemSheet
      item={toItemSheetView(item)}
      kindOptions={KIND_OPTIONS}
      statusOptions={withoutStatus ? [] : statusOptionsFor(item.kind)}
      onChange={(patch) => setItem((current) => applyItemPatch(current, patch))}
      onDelete={() => {}}
      onClosed={onClosed}
    />
  );
}

const meta = {
  title: "Компоненты/ItemSheet",
  render: (args) => (
    <Reopenable>{(onClosed) => <ItemSheetDemo {...args} onClosed={onClosed} />}</Reopenable>
  ),
  args: { item: sampleItem("sample-1") },
  argTypes: { item: { control: false } },
} satisfies Meta<Omit<ComponentProps<typeof ItemSheetDemo>, "onClosed">>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FromCatalog: Story = {};

export const Manual: Story = {
  args: { item: sampleItem("sample-8") },
};

export const SeriesWaitingForSeason: Story = {
  args: { item: sampleItem("sample-4") },
};

export const WithoutStatus: Story = {
  args: { withoutStatus: true },
};
