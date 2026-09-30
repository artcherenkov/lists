import type { Meta, StoryObj } from "@storybook/react-vite";

import { userEvent, within } from "storybook/test";

import { StatefulListFilters } from "./stateful-list-filters.tsx";

// Окно открывается по клику на кнопку: у компонента нет свойства «открыто».
async function openFilters({ canvasElement }: { canvasElement: HTMLElement }) {
  await userEvent.click(within(canvasElement).getByRole("button", { name: /Фильтры/ }));
}

const meta = {
  title: "Компоненты/ListFilters",
  component: StatefulListFilters,
  args: { resultCount: 12 },
  decorators: [
    // Кнопка – справа, как в шапке списка; внизу место под открытое окно.
    (Story) => (
      <div className="flex h-96 justify-end p-4">
        <div>
          <Story />
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof StatefulListFilters>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {};

export const ClosedWithActiveFilters: Story = {
  args: { initialValue: { kind: "series", rating: [7, 10] } },
};

export const Open: Story = {
  args: { initialValue: { kind: "series", rating: [7, 10] }, resultCount: 5 },
  play: openFilters,
};

export const OpenWithOneActiveFilter: Story = {
  args: { initialValue: { kind: "movie", rating: [1, 10] }, resultCount: 6 },
  play: openFilters,
};

export const OpenWithNarrowedRating: Story = {
  args: { initialValue: { kind: "all", rating: [6, 9] }, resultCount: 4 },
  play: openFilters,
};

export const OpenWithSingleRating: Story = {
  args: { initialValue: { kind: "all", rating: [7, 7] }, resultCount: 1 },
  play: openFilters,
};

export const OpenCounting: Story = {
  args: { resultCount: undefined },
  play: openFilters,
};
