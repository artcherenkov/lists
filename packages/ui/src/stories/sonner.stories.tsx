import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "@lists/ui/components/ui/button";
import { Toaster } from "@lists/ui/components/ui/sonner";
import { toast } from "sonner";

const meta = {
  title: "Компоненты/Sonner",
  component: Toaster,
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

// Тост показывается по кнопке: так видно и появление, и само сообщение.
export const Toasts: Story = {
  render: (args) => (
    <>
      <Toaster position="top-center" {...args} />
      {/* Отступ сверху: тосты падают сюда же и иначе закрыли бы кнопки. */}
      <div className="flex flex-wrap items-center gap-3 pt-36">
        <Button variant="outline" onClick={() => toast("Запись добавлена")}>
          Обычный
        </Button>
        <Button variant="outline" onClick={() => toast.success("Сохранено")}>
          Успех
        </Button>
        <Button variant="outline" onClick={() => toast.info("Список обновился")}>
          Информация
        </Button>
        <Button variant="outline" onClick={() => toast.warning("Связь пропала")}>
          Предупреждение
        </Button>
        <Button variant="outline" onClick={() => toast.error("Поиск не ответил")}>
          Ошибка
        </Button>
        <Button variant="outline" onClick={() => toast.loading("Ищем…")}>
          Загрузка
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            toast("«Твин Пикс» удалён", {
              action: { label: "Отменить", onClick: () => toast.success("Вернули") },
            })
          }
        >
          С действием «Отменить»
        </Button>
      </div>
    </>
  ),
};
