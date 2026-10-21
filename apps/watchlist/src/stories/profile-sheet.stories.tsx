import type { Meta, StoryObj } from "@storybook/react-vite";

import { useState } from "react";
import { screen, userEvent } from "storybook/test";

import { ProfileSheet } from "../screens/profile-sheet.tsx";
import { Reopenable } from "./reopenable.tsx";
import { SAMPLE_JOURNAL_TEXT } from "./sample-journal.ts";

const copySucceeds = () => Promise.resolve();
const copyRefused = () =>
  Promise.reject(new DOMException("Запись в буфер запрещена", "NotAllowedError"));

interface DemoArgs {
  accountName: string;
  /** Выход начат, сервер ещё не ответил. */
  signingOut: boolean;
  version: string;
  /** Пустая строка – журнал без записей. */
  journalText: string;
  onCopy: () => Promise<void>;
}

function ProfileSheetDemo({
  accountName,
  signingOut,
  version,
  journalText,
  onCopy,
  onClosed,
}: DemoArgs & { onClosed: () => void }) {
  const [text, setText] = useState(journalText);
  const entryCount = text === "" ? 0 : text.split("\n").length - 1;

  return (
    <ProfileSheet
      account={{ name: accountName, signingOut, onSignOut: () => {} }}
      version={version}
      journal={{ text, entryCount, onCopy, onClear: () => setText("") }}
      onClosed={onClosed}
    />
  );
}

// Шторка вынесена порталом, поэтому кнопки ищем по всему экрану, а не в canvas.
async function press(name: string) {
  await userEvent.click(await screen.findByRole("button", { name }));
}

const openJournal = () => press("Журнал приложения");

const meta = {
  title: "Компоненты/ProfileSheet",
  render: (args) => (
    <Reopenable>{(onClosed) => <ProfileSheetDemo {...args} onClosed={onClosed} />}</Reopenable>
  ),
  args: {
    accountName: "Анна Б.",
    signingOut: false,
    version: "2026-10-02 · d5c28ef",
    journalText: SAMPLE_JOURNAL_TEXT,
    onCopy: copySucceeds,
  },
  argTypes: { onCopy: { control: false } },
} satisfies Meta<DemoArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SigningOut: Story = {
  args: { signingOut: true },
};

export const LongName: Story = {
  args: { accountName: "Анна-Мария Константинопольская-Белорецкая" },
};

export const WithChanges: Story = {
  args: { version: "2026-10-02 · d5c28ef · с правками" },
};

export const Journal: Story = {
  play: openJournal,
};

export const JournalEmpty: Story = {
  args: { journalText: "" },
  play: openJournal,
};

// Надпись «Скопировано · N» держится 2,5 с, а «Точно?» – 3,5 с: нажмите кнопку снова.
export const JournalCopied: Story = {
  play: async () => {
    await openJournal();
    await press("Скопировать журнал");
  },
};

export const JournalConfirmClear: Story = {
  play: async () => {
    await openJournal();
    await press("Очистить");
  },
};

export const JournalCopyRefused: Story = {
  args: { onCopy: copyRefused },
  play: async () => {
    await openJournal();
    await press("Скопировать журнал");
  },
};
