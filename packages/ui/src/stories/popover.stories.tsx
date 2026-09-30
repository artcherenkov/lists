import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "@lists/ui/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@lists/ui/components/ui/popover";

const meta = {
  title: "Компоненты/Popover",
  component: Popover,
  // Кнопка и окно передаются историей, в таблице свойств их не редактируют.
  argTypes: { children: { control: false } },
  // Открытое окно выходит порталом в body: на странице документации оно легло бы поверх
  // текста, поэтому образцы – в iframe.
  parameters: { docs: { story: { inline: false, height: "260px" } } },
  decorators: [
    // Место под окно: оно раскрывается вниз от кнопки.
    (Story) => (
      <div className="flex h-56 justify-center">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

const filtersPopover = (
  <>
    <PopoverTrigger render={<Button variant="outline" />}>Фильтры</PopoverTrigger>
    <PopoverContent>
      <PopoverHeader>
        <PopoverTitle>Фильтры</PopoverTitle>
        <PopoverDescription>Показать только нужные записи.</PopoverDescription>
      </PopoverHeader>
    </PopoverContent>
  </>
);

export const Open: Story = {
  args: { defaultOpen: true, children: filtersPopover },
};

export const Closed: Story = {
  args: { children: filtersPopover },
};
