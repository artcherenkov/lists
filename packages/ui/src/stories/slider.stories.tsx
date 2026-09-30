import type { Meta, StoryObj } from "@storybook/react-vite";

import { Slider } from "@lists/ui/components/ui/slider";

const meta = {
  title: "Компоненты/Slider",
  component: Slider,
  decorators: [
    (Story) => (
      <div className="max-w-xs px-2 py-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Single: Story = {
  args: { defaultValue: 50 },
};

export const Range: Story = {
  args: { defaultValue: [20, 80] },
};

export const Disabled: Story = {
  args: { defaultValue: [20, 80], disabled: true },
};

export const Vertical: Story = {
  args: { defaultValue: [20, 80], orientation: "vertical" },
  decorators: [
    (Story) => (
      <div className="h-48">
        <Story />
      </div>
    ),
  ],
};
