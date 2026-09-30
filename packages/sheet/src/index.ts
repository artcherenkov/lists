import { flushSync } from "react-dom";

import { focusKeyboardInput, lockBodyScroll } from "./viewport";

export { Sheet, type SheetProps } from "./Sheet";
export { focusKeyboardInput, lockBodyScroll, useVisualViewportVars } from "./viewport";

/*
 * Открытие шторки с автофокусом поля — с выезжающей клавиатурой. Порядок важен,
 * и всё обязано выполниться в одном стеке обработчика клика:
 * 1) лок фона синхронно, до reveal-скролла WebKit — отложенный лок опаздывает,
 *    и подложка успевает дёрнуться;
 * 2) flushSync монтирует шторку, чтобы поле уже было в DOM;
 * 3) фокус рецептом Base UI — синхронно, иначе iOS не поднимет клавиатуру.
 */
export function openSheetWithAutofocus(open: () => void, field: () => HTMLElement | null) {
  lockBodyScroll();
  flushSync(open);
  focusKeyboardInput(field());
}
