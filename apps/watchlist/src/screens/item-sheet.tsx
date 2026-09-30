import type { ChoiceOption } from "@lists/ui/components/segmented-control";

import { Sheet } from "@lists/sheet";
import { SegmentedControl } from "@lists/ui/components/segmented-control";
import { Button } from "@lists/ui/components/ui/button";
import { Input } from "@lists/ui/components/ui/input";
import { Label } from "@lists/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@lists/ui/components/ui/select";
import { Trash2Icon } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { useClosingSheet } from "./use-closing-sheet.ts";

const inputClass = "h-11 text-base";

/** Какую долю шторки надо протянуть вниз, чтобы она закрылась. У Sheet по умолчанию 0.25. */
const CLOSE_THRESHOLD = 0.4;

/** Сколько ждать после последней правки названия, прежде чем отдать его наружу. */
const TITLE_DEBOUNCE_MS = 400;

export interface ItemSheetView {
  title: string;
  /** Подпись под названием, например «Тип · 2021». */
  details: string;
  posterUrl?: string;
  /** Запись заведена руками, а не выбрана из каталога: вместо блока с постером – поля названия и типа. */
  manual: boolean;
  kind: string;
  status: string;
}

export type ItemSheetPatch = Partial<Pick<ItemSheetView, "title" | "kind" | "status">>;

/**
 * Карточка записи: постер, статус, у записи, заведённой руками, – название и тип, удаление, «Готово».
 * Правка уходит наружу сразу, кнопки «Сохранить» нет. Монтируется на время показа.
 */
export function ItemSheet({
  item,
  kindOptions,
  statusOptions,
  onChange,
  onDelete,
  onClosed,
}: {
  /** Должен оставаться валидным до `onClosed`: удалённая запись показывается, пока шторка едет вниз. */
  item: ItemSheetView;
  kindOptions: readonly ChoiceOption[];
  /** Зависят от типа, пересчитывает родитель. Пустой список прячет блок статуса. */
  statusOptions: readonly ChoiceOption[];
  onChange: (patch: ItemSheetPatch) => void;
  onDelete: () => void;
  /** Шторка доехала вниз: родитель её размонтирует. */
  onClosed: () => void;
}) {
  const { open, finishWith } = useClosingSheet();
  const titleId = useId();
  const kindName = useId();
  const statusId = useId();

  // Название набирают по буквам, а наружу оно уходит после паузы: родитель не должен
  // получать каждую букву. `sentTitle` – то, что родитель уже знает.
  const [titleDraft, setTitleDraft] = useState(item.title);
  const sentTitle = useRef(item.title);
  const titleTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Пустое название не отдаём: у записи оно обязательно, прежнее остаётся.
  const sendTitle = (draft: string) => {
    const title = draft.trim();
    if (!title || title === sentTitle.current) return;
    sentTitle.current = title;
    onChange({ title });
  };

  const editTitle = (draft: string) => {
    setTitleDraft(draft);
    clearTimeout(titleTimer.current);
    titleTimer.current = setTimeout(() => sendTitle(draft), TITLE_DEBOUNCE_MS);
  };

  // «Готово», свайп и подложка закрывают карточку, досылая название, которое ещё ждёт своей паузы.
  // Досылка – часть закрытия: если шторка уже закрывается (например, после «Удалить»),
  // повторное нажатие ничего не досылает.
  const closeWithTitle = () =>
    finishWith(() => {
      clearTimeout(titleTimer.current);
      sendTitle(titleDraft);
    });

  // Удаляемой записи правка названия ни к чему.
  const deleteItem = () =>
    finishWith(() => {
      clearTimeout(titleTimer.current);
      onDelete();
    });

  useEffect(() => () => clearTimeout(titleTimer.current), []);

  return (
    <Sheet
      open={open}
      onClose={closeWithTitle}
      // Родитель размонтирует нас только после анимации — иначе форма пропадала бы рывком,
      // не доехав вниз.
      onClosed={onClosed}
      // Заголовок только для скринридеров: и так видно, что за форма.
      title="Изменить"
      hideTitle
      closeFraction={CLOSE_THRESHOLD}
      // Фон отъезжает вглубь, как в iOS. Обёртка помечена в index.html.
      scaleBackground
      footer={
        // pb-3 сверх отступа шторки: кнопки прижимались к самому краю экрана.
        <div className="flex items-center gap-2 pt-4 pb-3">
          <Button type="button" variant="ghost" className="h-11" onClick={deleteItem}>
            <Trash2Icon />
            Удалить
          </Button>
          {/* Правка уходит сразу, поэтому кнопка только закрывает. */}
          <Button
            type="button"
            variant="outline"
            className="ml-auto h-11 px-5"
            onClick={closeWithTitle}
          >
            Готово
          </Button>
        </div>
      }
    >
      {/* pb-4 — иначе скроллер шторки срезает тень нижнего поля. */}
      <div className="grid gap-4 pt-2 pb-4">
        {/* Выбранное из каталога показываем, а не переспрашиваем: заменить его нельзя,
            это была бы другая запись. Рамка скруглена, как поля ниже; постер – меньше рамки,
            но не до нуля, как дало бы строгое вложение при отступе 12 px. */}
        {!item.manual && (
          <div className="flex items-center gap-4 rounded-md border p-3">
            {item.posterUrl ? (
              <img
                src={item.posterUrl}
                alt=""
                className="h-32 w-22 shrink-0 rounded-sm object-cover"
              />
            ) : (
              <div className="h-32 w-22 shrink-0 rounded-sm bg-muted" />
            )}
            <span className="min-w-0 flex-1">
              <span className="block text-2xl leading-tight font-semibold text-balance">
                {item.title}
              </span>
              <span className="mt-1 block text-sm text-muted-foreground">{item.details}</span>
            </span>
          </div>
        )}

        {item.manual && (
          <>
            <div className="grid gap-2">
              <Label htmlFor={titleId}>Название</Label>
              <Input
                id={titleId}
                value={titleDraft}
                onChange={(event) => editTitle(event.target.value)}
                className={inputClass}
                required
              />
            </div>
            <SegmentedControl
              name={kindName}
              label="Тип"
              value={item.kind}
              options={kindOptions}
              onChange={(kind) => onChange({ kind })}
            />
          </>
        )}

        {statusOptions.length > 0 && (
          <div className="grid gap-2">
            <Label htmlFor={statusId}>Статус</Label>
            {/* Размеры триггера – как у поля «Название» (`inputClass`): `data-[size=default]:h-11`,
                потому что штатную высоту `h-9` задаёт такой же селектор. */}
            <Select
              items={statusOptions}
              value={item.status}
              onValueChange={(status) => {
                if (status !== null) onChange({ status });
              }}
            >
              <SelectTrigger id={statusId} className="w-full text-base data-[size=default]:h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {/* Внутренний отступ меню даёт SelectGroup, как в примерах shadcn: без него
                    подсветка пункта упирается в края. */}
                <SelectGroup>
                  {statusOptions.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className="min-h-10 text-base"
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </Sheet>
  );
}
