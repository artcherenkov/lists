import type { Meta, StoryObj } from "@storybook/react-vite";

import { toPosterCardView } from "../sample/views.ts";
import { PosterCard } from "../screens/poster-card.tsx";
import { sampleItem } from "./sample-item.ts";

const meta = {
  title: "Компоненты/PosterCard",
  component: PosterCard,
  args: { item: toPosterCardView(sampleItem("sample-1")), onOpen: () => {} },
  // `item` не показываем в таблице свойств: в нём `data:`-адрес постера на несколько килобайт.
  argTypes: { item: { table: { disable: true } }, onOpen: { control: false } },
  decorators: [
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

export const WithoutPoster: Story = {
  args: { item: toPosterCardView(sampleItem("sample-5")) },
};

export const WithRating: Story = {
  args: { item: toPosterCardView(sampleItem("sample-3")) },
};

export const WithHourglass: Story = {
  args: { item: toPosterCardView({ ...sampleItem("sample-4"), rating: undefined }) },
};

export const WithRatingAndHourglass: Story = {
  args: { item: toPosterCardView(sampleItem("sample-4")) },
};
