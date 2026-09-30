import type { Meta, StoryObj } from "@storybook/react-vite";

import { screen, userEvent } from "storybook/test";

import { searchSampleCatalog } from "../sample/sample-catalog.ts";
import { KIND_OPTIONS } from "../sample/views.ts";
import { AddSheet } from "../screens/add-sheet.tsx";
import { Reopenable } from "./reopenable.tsx";

type Search = typeof searchSampleCatalog;

// Поиск, который не отвечает: «Ищу…» остаётся на экране.
const searchNeverAnswers: Search = () => new Promise(() => {});

// Поиск, который отклоняется: «Поиск не ответил».
const searchFails: Search = () => Promise.reject(new Error("Поиск не ответил"));

// Запрос набираем в поле поиска: шторка вынесена порталом, поэтому ищем по всему экрану.
async function typeQuery(query: string) {
  const field = await screen.findByRole("textbox", { name: "Поиск" });
  await userEvent.type(field, query);
}

const meta = {
  title: "Компоненты/AddSheet",
  render: ({ search }) => (
    <Reopenable>
      {(onClosed) => (
        <AddSheet
          search={search}
          searchPlaceholder="Название фильма или сериала"
          kindOptions={KIND_OPTIONS}
          onPick={() => {}}
          onCreate={() => {}}
          onClosed={onClosed}
        />
      )}
    </Reopenable>
  ),
  args: { search: searchSampleCatalog },
  argTypes: { search: { control: false } },
  // Автодокументации нет: шторка выходит порталом поверх страницы и на Docs не следует теме.
  tags: ["!autodocs"],
} satisfies Meta<{ search: Search }>;

export default meta;
type Story = StoryObj<typeof meta>;

export const EmptyField: Story = {};

export const Searching: Story = {
  args: { search: searchNeverAnswers },
  play: () => typeQuery("город"),
};

export const Results: Story = {
  play: () => typeQuery("город"),
};

export const NothingFound: Story = {
  play: () => typeQuery("ааа"),
};

export const SearchFailed: Story = {
  args: { search: searchFails },
  play: () => typeQuery("город"),
};

// Ручной ввод: по строке «Добавить вручную» набранный запрос становится названием.
export const ManualEntry: Story = {
  play: async () => {
    await typeQuery("Домашнее видео");
    await userEvent.click(
      await screen.findByRole("button", { name: /Домашнее видео.*Добавить вручную/ }),
    );
  },
};
