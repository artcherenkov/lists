import type { Meta, StoryObj } from "@storybook/react-vite";

import { toPosterCardView } from "../sample/views.ts";
import { PosterCard } from "../screens/poster-card.tsx";
import { sampleItem } from "./sample-item.ts";

const meta = {
  title: "Компоненты/PosterCard",
  component: PosterCard,
  args: { item: toPosterCardView(sampleItem("sample-1")), onOpen: () => {} },
  // `item` не показываем: в нём адрес постера `data:` на несколько килобайт. Выбор записи –
  // это отдельные истории ниже.
  argTypes: { item: { table: { disable: true } }, onOpen: { control: false } },
  decorators: [
    // Ширина плитки в сетке списка на iPhone: два столбца.
    (Story) => (
      <div className="w-44 p-4">
        <Story />
      </div>
    ),
  ],
  tags: ["autodocs"],
} satisfies Meta<typeof PosterCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithPoster: Story = {};

// Нет постера – вместо него на плашке название.
export const WithoutPoster: Story = {
  args: { item: toPosterCardView(sampleItem("sample-5")) },
};

export const WithRating: Story = {
  args: { item: toPosterCardView(sampleItem("sample-3")) },
};

export const WithHourglass: Story = {
  args: { item: toPosterCardView({ ...sampleItem("sample-4"), rating: undefined }) },
};

// Оценка и песочные часы вместе, как у записи «Жду сезон» с оценкой.
export const WithRatingAndHourglass: Story = {
  args: { item: toPosterCardView(sampleItem("sample-4")) },
};
