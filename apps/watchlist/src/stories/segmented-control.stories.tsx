import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";

import { SegmentedControl } from "@lists/ui/components/segmented-control";
import { useState } from "react";

import { KIND_FILTER_OPTIONS, KIND_OPTIONS } from "../sample/views.ts";

function StatefulSegmentedControl({
  value: initialValue,
  ...props
}: ComponentProps<typeof SegmentedControl>) {
  const [value, setValue] = useState(initialValue);
  return <SegmentedControl {...props} value={value} onChange={setValue} />;
}

const meta = {
  title: "Компоненты/SegmentedControl",
  component: SegmentedControl,
  args: {
    label: "Тип",
    value: "all",
    options: KIND_FILTER_OPTIONS,
    onChange: () => {},
  },
  argTypes: { onChange: { control: false }, options: { control: false } },
  render: (args) => <StatefulSegmentedControl {...args} />,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof SegmentedControl>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const TwoOptions: Story = {
  args: { value: "series", options: KIND_OPTIONS },
};
