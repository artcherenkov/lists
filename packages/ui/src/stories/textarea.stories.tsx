import type { Meta, StoryObj } from "@storybook/react-vite";

import { Textarea } from "@lists/ui/components/ui/textarea";

const meta = {
  title: "Компоненты/Textarea",
  component: Textarea,
  decorators: [
    (Story) => (
      <div className="max-w-xs">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: { "aria-label": "Заметка" },
};

export const WithPlaceholder: Story = {
  args: { "aria-label": "Заметка", placeholder: "Что запомнилось" },
};

export const Filled: Story = {
  args: {
    "aria-label": "Заметка",
    defaultValue: "Смотреть вечером, лучше с пледом.\nПосоветовала Маша.",
  },
};

export const Disabled: Story = {
  args: { "aria-label": "Заметка", defaultValue: "Смотреть вечером", disabled: true },
};

export const Invalid: Story = {
  args: { "aria-label": "Заметка", defaultValue: "Смотреть вечером", "aria-invalid": true },
};
