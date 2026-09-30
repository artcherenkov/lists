import type { Meta, StoryObj } from "@storybook/react-vite";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@lists/ui/components/ui/tabs";

const meta = {
  title: "Компоненты/Tabs",
  component: Tabs,
  // Вкладки передаются историей, в таблице свойств их не редактируют.
  argTypes: { children: { control: false } },
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    defaultValue: "watching",
    children: (
      <>
        <TabsList className="w-full">
          <TabsTrigger value="all">Все</TabsTrigger>
          <TabsTrigger value="want">Хочу</TabsTrigger>
          <TabsTrigger value="watching">Смотрю</TabsTrigger>
          <TabsTrigger value="watched">Посмотрел</TabsTrigger>
        </TabsList>
        <TabsContent value="watching">Сейчас в процессе.</TabsContent>
        <TabsContent value="want">Собираюсь посмотреть.</TabsContent>
      </>
    ),
  },
};

export const Line: Story = {
  args: {
    defaultValue: "watching",
    children: (
      <TabsList variant="line">
        <TabsTrigger value="all">Все</TabsTrigger>
        <TabsTrigger value="want">Хочу</TabsTrigger>
        <TabsTrigger value="watching">Смотрю</TabsTrigger>
        <TabsTrigger value="watched">Посмотрел</TabsTrigger>
      </TabsList>
    ),
  },
};

export const Vertical: Story = {
  args: {
    defaultValue: "watching",
    orientation: "vertical",
    children: (
      <>
        <TabsList>
          <TabsTrigger value="all">Все</TabsTrigger>
          <TabsTrigger value="want">Хочу</TabsTrigger>
          <TabsTrigger value="watching">Смотрю</TabsTrigger>
          <TabsTrigger value="watched">Посмотрел</TabsTrigger>
        </TabsList>
        <TabsContent value="watching">Сейчас в процессе.</TabsContent>
        <TabsContent value="want">Собираюсь посмотреть.</TabsContent>
      </>
    ),
  },
};

export const DisabledTab: Story = {
  args: {
    defaultValue: "want",
    children: (
      <TabsList className="w-full">
        <TabsTrigger value="all">Все</TabsTrigger>
        <TabsTrigger value="want">Хочу</TabsTrigger>
        <TabsTrigger value="watching" disabled>
          Смотрю
        </TabsTrigger>
        <TabsTrigger value="watched">Посмотрел</TabsTrigger>
      </TabsList>
    ),
  },
};
