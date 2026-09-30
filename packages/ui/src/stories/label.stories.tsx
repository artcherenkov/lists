import type { Meta, StoryObj } from "@storybook/react-vite";

import { Input } from "@lists/ui/components/ui/input";
import { Label } from "@lists/ui/components/ui/label";

const meta = {
  title: "Компоненты/Label",
  component: Label,
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithField: Story = {
  render: () => (
    <div className="flex max-w-xs flex-col gap-2">
      <Label htmlFor="title">Название</Label>
      <Input id="title" placeholder="Название фильма или сериала" />
    </div>
  ),
};

// `peer-disabled` у подписи срабатывает, когда поле стоит перед ней и помечено `peer`.
export const WithDisabledField: Story = {
  render: () => (
    <div className="flex max-w-xs flex-col gap-2">
      <Input id="disabled-title" className="peer" placeholder="Название" disabled />
      <Label htmlFor="disabled-title">Название недоступно</Label>
    </div>
  ),
};
