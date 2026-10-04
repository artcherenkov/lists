import { type RefObject, useLayoutEffect, useRef } from "react";

// `@lists/sheet` ставит эту метку на свой скроллер, а сам элемент не отдаёт.
const SHEET_SCROLLER = "[data-sheet-scroller]";
// Запас, в пределах которого прокрутку считаем «в конце»: дробные пиксели и резинка iOS.
const END_THRESHOLD_PX = 16;

/**
 * Журнал открывается прокрученным к концу. Запись, которая пришла при открытом экране, не
 * сдвигает прокрутку, если читатель ушёл вверх, и тянет её за собой, если он смотрел на конец:
 * так при возврате в приложение новая запись видна сразу.
 */
function useFollowEnd(ref: RefObject<HTMLElement | null>, text: string) {
  const atEnd = useRef(true);

  useLayoutEffect(() => {
    const scroller = ref.current?.closest<HTMLElement>(SHEET_SCROLLER);
    if (!scroller) return;
    const onScroll = () => {
      atEnd.current =
        scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < END_THRESHOLD_PX;
    };
    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => scroller.removeEventListener("scroll", onScroll);
  }, [ref]);

  useLayoutEffect(() => {
    const scroller = ref.current?.closest<HTMLElement>(SHEET_SCROLLER);
    if (scroller && atEnd.current) scroller.scrollTop = scroller.scrollHeight;
  }, [ref, text]);
}

/** Выделяет всё содержимое узла: запасной путь, когда буфер обмена недоступен. */
export function selectContents(node: HTMLElement) {
  const range = document.createRange();
  range.selectNodeContents(node);
  const selection = getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
}

/**
 * Журнал сплошным моноширинным текстом: строка в строку, как в копии, с её первой строкой.
 * Монтируется внутри шторки: прокручивает её скроллер.
 */
export function JournalLog({
  text,
  entryCount,
  ref,
}: {
  /** Текст копии: первая строка со сведениями об устройстве, дальше записи по одной на строку. */
  text: string;
  entryCount: number;
  ref: RefObject<HTMLDivElement | null>;
}) {
  useFollowEnd(ref, text);
  const [header, ...lines] = text.split("\n");

  return (
    <div ref={ref} data-testid="journal-log" className="pt-1 pb-3">
      {entryCount === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Записей пока нет</p>
      ) : (
        <div className="font-mono text-[11px] leading-relaxed break-words whitespace-pre-wrap select-text">
          {/* Висячий отступ: перенесённая строка не сливается со следующей записью. */}
          <div className="pb-1 pl-4 -indent-4 text-muted-foreground">{header}</div>
          {lines.map((line, index) => (
            <div key={index} className="pl-4 -indent-4">
              {line}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
