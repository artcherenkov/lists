import type { Meta, StoryObj } from "@storybook/react-vite";
import type { VariantProps } from "class-variance-authority";

import { Button, type buttonVariants } from "@lists/ui/components/ui/button";
import { ArrowRightIcon, PlusIcon, TrashIcon } from "lucide-react";

type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>["variant"]>;
type ButtonSize = NonNullable<VariantProps<typeof buttonVariants>["size"]>;

const variants: ButtonVariant[] = [
  "default",
  "outline",
  "secondary",
  "ghost",
  "destructive",
  "link",
];
const textSizes: ButtonSize[] = ["xs", "sm", "default", "lg"];
const iconSizes: ButtonSize[] = ["icon-xs", "icon-sm", "icon", "icon-lg"];

const meta = {
  title: "Компоненты/Button",
  component: Button,
  args: { children: "Добавить", variant: "default", size: "default" },
  // react-docgen не видит варианты cva: перечисляем их, чтобы в Controls был выбор.
  argTypes: {
    variant: { control: "select", options: variants },
    size: { control: "select", options: [...textSizes, ...iconSizes] },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      {variants.map((variant) => (
        <Button key={variant} variant={variant}>
          {variant}
        </Button>
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      {textSizes.map((size) => (
        <Button key={size} size={size}>
          {size}
        </Button>
      ))}
    </div>
  ),
};

export const WithIcon: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button>
          <PlusIcon data-icon="inline-start" />
          Добавить
        </Button>
        <Button variant="outline">
          Дальше
          <ArrowRightIcon data-icon="inline-end" />
        </Button>
        <Button variant="destructive">
          <TrashIcon data-icon="inline-start" />
          Удалить
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {iconSizes.map((size) => (
          <Button key={size} size={size} variant="secondary" aria-label={size}>
            <PlusIcon />
          </Button>
        ))}
      </div>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      {variants.map((variant) => (
        <Button key={variant} variant={variant} disabled>
          {variant}
        </Button>
      ))}
    </div>
  ),
};
