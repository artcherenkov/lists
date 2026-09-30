import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";

import { Chips } from "@lists/ui/components/chips";
import { useState } from "react";

import { KIND_FILTER_OPTIONS, statusOptionsFor } from "../sample/views.ts";

// Chips управляется снаружи: выбранное значение хранит родитель. Здесь его хранит история,
// чтобы по чипсам можно было кликать.
function StatefulChips({ value: initialValue, ...props }: ComponentProps<typeof Chips>) {
  const [value, setValue] = useState(initialValue);
  return <Chips {...props} value={value} onChange={setValue} />;
}

const meta = {
  title: "Компоненты/Chips",
  component: Chips,
  args: { name: "chips", value: "all", options: KIND_FILTER_OPTIONS, onChange: () => {} },
  // Значение и обработчик подменяет состояние истории.
  argTypes: { onChange: { control: false }, options: { control: false } },
  render: (args) => <StatefulChips {...args} />,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Chips>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Statuses: Story = {
  args: { name: "status", value: "watching", options: statusOptionsFor("series") },
};

// Ширина как у узкой шторки: четыре статуса не помещаются в строку и переносятся.
export const Wrapping: Story = {
  args: { name: "status-wrapping", value: "waiting", options: statusOptionsFor("series") },
  decorators: [
    (Story) => (
      <div className="w-64">
        <Story />
      </div>
    ),
  ],
};

// Свои `className` и `itemClassName`: сетка в две колонки вместо строки с переносом.
export const Grid: Story = {
  args: {
    name: "status-grid",
    value: "want",
    options: statusOptionsFor("series"),
    className: "grid max-w-xs grid-cols-2 gap-2",
    itemClassName: "px-2",
  },
};
