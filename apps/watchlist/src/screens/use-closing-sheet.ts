import { useRef, useState } from "react";

/**
 * Закрытие шторки в два шага: экран гасит `open`, а родитель размонтирует шторку, когда она
 * доедет вниз (`onClosed`). Все пути закрытия – кнопка, свайп, подложка, выбор результата –
 * идут через этот хук.
 *
 * Панель остаётся в DOM пока играет анимация закрытия, и по ней можно нажать ещё раз: двойной
 * тап по результату поиска иначе добавил бы две записи. Поэтому действие шторки выполняется
 * один раз за её жизнь, а всё, что пришло после начала закрытия, игнорируется.
 */
export function useClosingSheet() {
  const [open, setOpen] = useState(true);
  const closing = useRef(false);

  const close = () => {
    closing.current = true;
    setOpen(false);
  };

  /** Выполняет действие шторки сразу, затем закрывает её. Повторные вызовы ничего не делают. */
  const finishWith = (action: () => void) => {
    if (closing.current) return;
    action();
    close();
  };

  return { open, close, finishWith };
}
