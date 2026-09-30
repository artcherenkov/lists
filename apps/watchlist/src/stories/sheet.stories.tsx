import type { Meta, StoryObj } from "@storybook/react-vite";

import { Sheet } from "@lists/sheet";
import { Button } from "@lists/ui/components/ui/button";
import { Input } from "@lists/ui/components/ui/input";
import { useState } from "react";

import { Reopenable } from "./reopenable.tsx";

function SheetDemo({ longContent, onClosed }: { longContent: boolean; onClosed: () => void }) {
  const [open, setOpen] = useState(true);
  const paragraphCount = longContent ? 30 : 2;

  return (
    <Sheet
      open={open}
      onClose={() => setOpen(false)}
      onClosed={onClosed}
      title="Заголовок шторки"
      scaleBackground
      header={<Input placeholder="Закреплено над прокруткой" aria-label="Поле в шапке" />}
      footer={
        <div className="flex justify-end gap-2 pt-4 pb-3">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Закрыть
          </Button>
        </div>
      }
    >
      <div className="grid gap-3 py-2 text-sm">
        {Array.from({ length: paragraphCount }, (_, index) => (
          <p key={index}>
            Абзац {index + 1}. Содержимое шторки: заголовок, шапка и подвал закреплены, а всё
            остальное прокручивается.
          </p>
        ))}
      </div>
    </Sheet>
  );
}

const meta = {
  title: "Компоненты/Sheet",
  render: ({ longContent }) => (
    <Reopenable>
      {(onClosed) => <SheetDemo longContent={longContent} onClosed={onClosed} />}
    </Reopenable>
  ),
  args: { longContent: false },
} satisfies Meta<{ longContent: boolean }>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithHeaderAndFooter: Story = {};

export const LongContent: Story = {
  args: { longContent: true },
};
