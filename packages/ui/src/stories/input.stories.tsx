import type { Meta, StoryObj } from "@storybook/react-vite";

import { Input } from "@lists/ui/components/ui/input";

const meta = {
  title: "Компоненты/Input",
  component: Input,
  decorators: [
    (Story) => (
      <div className="max-w-xs">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: { "aria-label": "Название" },
};

export const WithPlaceholder: Story = {
  args: { "aria-label": "Название", placeholder: "Название фильма или сериала" },
};

export const Filled: Story = {
  args: { "aria-label": "Название", defaultValue: "Твин Пикс" },
};

export const Disabled: Story = {
  args: { "aria-label": "Название", defaultValue: "Твин Пикс", disabled: true },
};

export const Invalid: Story = {
  args: { "aria-label": "Название", defaultValue: "Твин Пикс", "aria-invalid": true },
};
