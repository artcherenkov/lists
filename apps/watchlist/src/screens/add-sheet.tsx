import type { ChoiceOption } from "@lists/ui/components/segmented-control";
import type { ReactNode } from "react";

import { Sheet, openSheetWithAutofocus } from "@lists/sheet";
import { SegmentedControl } from "@lists/ui/components/segmented-control";
import { Button } from "@lists/ui/components/ui/button";
import { Input } from "@lists/ui/components/ui/input";
import { Label } from "@lists/ui/components/ui/label";
import { SearchIcon } from "lucide-react";
import { useEffect, useId, useState } from "react";

import { useClosingSheet } from "./use-closing-sheet.ts";

const inputClass = "h-11 text-base";

/** Какую долю шторки надо протянуть вниз, чтобы она закрылась. У Sheet по умолчанию 0.25. */
const CLOSE_THRESHOLD = 0.4;

const SEARCH_DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

/**
 * По этой метке (`data-add-sheet-search` у поля поиска) `openAddSheet` находит поле: id у
 * полей свой на каждую шторку, а в DOM на время анимации могут быть две шторки сразу.
 */
const SEARCH_FIELD_SELECTOR = "[data-add-sheet-search]";

/** Чем закончился поиск по запросу `query` (уже без пробелов по краям). */
interface SearchOutcome<T> {
  query: string;
  results: readonly T[];
  /** Поиск не ответил: запись всё равно можно завести руками – без сети это единственный путь. */
  failed: boolean;
}

export interface SearchResultView {
  id: string;
  title: string;
  /** Подпись под названием, например «Тип · 2024». */
  details: string;
  posterUrl?: string;
}

/**
 * Открывает шторку добавления. Вызывать прямо в обработчике клика: клавиатура iOS поднимается
 * только на синхронный `focus()` внутри стека жеста, поэтому фокус в поле поиска ставит
 * открытие, а не `autoFocus` самого поля.
 */
export function openAddSheet(show: () => void) {
  openSheetWithAutofocus(show, () => document.querySelector<HTMLElement>(SEARCH_FIELD_SELECTOR));
}

/**
 * Добавление: только выбрать, что добавить, остальное правится потом в карточке.
 * Монтируется на время показа, поэтому состояние не сбрасываем.
 */
export function AddSheet<T extends SearchResultView>({
  search,
  searchPlaceholder,
  kindOptions,
  onPick,
  onCreate,
  onClosed,
}: {
  /** Должна быть одной и той же функцией между рендерами: смена функции перезапускает поиск. */
  search: (query: string, signal: AbortSignal) => Promise<readonly T[]>;
  searchPlaceholder: string;
  /** Первый вариант выбран по умолчанию в ручном вводе, поэтому список не бывает пустым. */
  kindOptions: readonly [ChoiceOption, ...ChoiceOption[]];
  /** Получает тот же объект, что вернул `search`. */
  onPick: (result: T) => void;
  onCreate: (draft: { title: string; kind: string }) => void;
  /** Шторка доехала вниз: родитель её размонтирует. */
  onClosed: () => void;
}) {
  const [defaultKind] = kindOptions;

  const { open, close, finishWith } = useClosingSheet();
  const manualTitleId = useId();
  const manualKindName = useId();

  const [query, setQuery] = useState("");
  const [outcome, setOutcome] = useState<SearchOutcome<T>>();
  // Ручной ввод — редкий случай, поэтому он не отдельное поле, а пункт в выпадашке.
  const [manual, setManual] = useState(false);
  const [draft, setDraft] = useState({ title: "", kind: defaultKind.value });

  const patch = (fields: Partial<typeof draft>) =>
    setDraft((current) => ({ ...current, ...fields }));

  const trimmedQuery = query.trim();
  // Отработал ли поиск по текущему запросу. Пока нет – вводить вручную предлагать рано,
  // а результаты прошлого запроса остаются на экране, чтобы список не мигал между буквами.
  const searched = outcome?.query === trimmedQuery;
  const results = outcome?.results ?? [];

  const changeQuery = (value: string) => {
    setQuery(value);
    // Слишком короткий запрос ничего не ищет – прошлые результаты тоже не нужны.
    if (value.trim().length < MIN_QUERY_LENGTH) setOutcome(undefined);
  };

  useEffect(() => {
    if (trimmedQuery.length < MIN_QUERY_LENGTH) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      search(trimmedQuery, controller.signal)
        .then((found) => {
          if (controller.signal.aborted) return;
          setOutcome({ query: trimmedQuery, results: found, failed: false });
        })
        .catch(() => {
          // Отмену отличаем по сигналу, а не по имени ошибки: так же ведут себя и fetch, и подделки.
          if (controller.signal.aborted) return;
          setOutcome({ query: trimmedQuery, results: [], failed: true });
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmedQuery, search]);

  function goManual() {
    patch({ title: trimmedQuery });
    setManual(true);
    changeQuery("");
  }

  /** Назад к поиску: набранное руками название с собой не тащим — искать будут заново. */
  function backToSearch() {
    patch({ title: "" });
    setManual(false);
  }

  return (
    <Sheet
      open={open}
      onClose={close}
      // Родитель размонтирует нас только после анимации — иначе форма пропадала бы рывком,
      // не доехав вниз.
      onClosed={onClosed}
      // Заголовок только для скринридеров: и так видно, что за форма.
      title="Добавить"
      hideTitle
      closeFraction={CLOSE_THRESHOLD}
      // Фон отъезжает вглубь, как в iOS. Обёртка помечена в index.html.
      scaleBackground
      // Поиск и есть поле названия — прижат над скроллером и живёт вне <form>,
      // чтобы Enter не отправлял запись. Фокус в него ставит `openAddSheet` при открытии.
      header={
        manual ? undefined : (
          // Лупа кладётся на само поле, а не на колонку: иначе её уносит на середину шторки.
          <div className="relative pt-2 pb-2">
            <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              data-add-sheet-search=""
              value={query}
              onChange={(event) => changeQuery(event.target.value)}
              placeholder={searchPlaceholder}
              aria-label="Поиск"
              autoComplete="off"
              className={`${inputClass} pl-9`}
            />
          </div>
        )
      }
      footer={
        manual ? (
          // pb-3 сверх отступа шторки: кнопки прижимались к самому краю экрана.
          <div className="flex items-center gap-2 pt-4 pb-3">
            <Button
              type="button"
              className="ml-auto h-11 px-5"
              disabled={!draft.title.trim()}
              onClick={() =>
                finishWith(() => onCreate({ title: draft.title.trim(), kind: draft.kind }))
              }
            >
              Добавить
            </Button>
          </div>
        ) : undefined
      }
    >
      {!manual && trimmedQuery.length >= MIN_QUERY_LENGTH && (
        // Список во всю ширину шторки: рамка вокруг результатов только сжимала их.
        <ul className="-mx-4 divide-y">
          {results.map((result) => (
            <li key={result.id}>
              <ResultRow
                title={result.title}
                details={result.details}
                cover={<Poster url={result.posterUrl} />}
                onClick={() => finishWith(() => onPick(result))}
              />
            </li>
          ))}
          {searched && outcome.failed && (
            <li className="px-4 py-3 text-sm text-muted-foreground">Поиск не ответил</li>
          )}
          {searched ? (
            <li>
              {/* Без обложки: записи, которой нет в поиске, взять её неоткуда. */}
              <ResultRow title={trimmedQuery} details="Добавить вручную" onClick={goManual} />
            </li>
          ) : (
            <li className="px-4 py-3 text-sm text-muted-foreground">Ищу…</li>
          )}
        </ul>
      )}

      {manual && (
        // pb-4 — иначе скроллер шторки срезает тень нижнего поля.
        <div className="grid gap-4 pt-2 pb-4">
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor={manualTitleId}>Название</Label>
              <Button type="button" variant="ghost" size="xs" onClick={backToSearch}>
                Вернуться к поиску
              </Button>
            </div>
            <Input
              id={manualTitleId}
              value={draft.title}
              onChange={(event) => patch({ title: event.target.value })}
              className={inputClass}
              required
            />
          </div>
          <SegmentedControl
            name={manualKindName}
            label="Тип"
            value={draft.kind}
            options={kindOptions}
            onChange={(kind) => patch({ kind })}
          />
        </div>
      )}
    </Sheet>
  );
}

/**
 * Строка списка поиска: обложка (если есть), название и подпись. Высота – по обложке
 * (`h-16` и отступы `py-2` дают 5rem), поэтому строка без обложки не выпадает из ритма списка.
 */
function ResultRow({
  title,
  details,
  cover,
  onClick,
}: {
  title: string;
  details: string;
  cover?: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-20 w-full items-center gap-3 px-4 py-2 text-left hover:bg-accent"
    >
      {cover}
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium">{title}</span>
        <span className="block text-xs text-muted-foreground">{details}</span>
      </span>
    </button>
  );
}

function Poster({ url }: { url?: string }) {
  return url ? (
    <img src={url} alt="" loading="lazy" className="h-16 w-11 shrink-0 rounded object-cover" />
  ) : (
    <div className="h-16 w-11 shrink-0 rounded bg-muted" />
  );
}
