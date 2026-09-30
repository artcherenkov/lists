import { useEffect } from "react";

/*
 * iOS Safari при открытии клавиатуры сжимает только visual viewport,
 * layout viewport (а значит 100vh/100dvh и position:fixed) не меняется.
 * interactive-widget=resizes-content в iOS не поддержан (WebKit bug 259770),
 * VirtualKeyboard API отсутствует, поэтому единственный рабочий примитив —
 * visualViewport → CSS-переменные.
 */
export function useVisualViewportVars() {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      const kb = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      const root = document.documentElement;
      root.style.setProperty("--vvh", `${vv.height}px`);
      root.style.setProperty("--kb", `${kb}px`);
    };

    update();
    vv.addEventListener("resize", update);
    // scroll тоже обязателен: Safari панорамирует visual viewport к сфокусированному полю
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);
}

/*
 * Лок без position:fixed на body: position:fixed + top:-scrollY (usePositionFixed в vaul)
 * переводит поддерево body в другой режим тайлинга WebKit, и transform по нему
 * (scale-эффект) мелькает канвасом; у vaul та же проблема (issue #365). overflow:hidden
 * не подходит: на body iOS его игнорирует, на html сбрасывает прокрутку. Поэтому гасим сами
 * жесты, как react-remove-scroll у Radix: touchmove/wheel вне скроллера шторки –
 * preventDefault, внутри арбитрирует шторка.
 *
 * Синглтон: при автофокусе лок обязан встать синхронно в обработчике клика, до reveal-скролла
 * WebKit; эффект шторки, пришедший позже, получает тот же лок и владеет снятием. Повторный
 * unlock – no-op.
 *
 * Один лок на страницу: стек вложенных шторок не поддержан. Перетаскивание скроллбара мышью
 * и клавиатурная прокрутка на десктопе не блокируются: событийного лока хватает для тач-веба.
 */
let activeUnlock: (() => void) | null = null;

export function lockBodyScroll() {
  if (activeUnlock) return activeUnlock;
  const block = (e: Event) => {
    const scroller = document.querySelector<HTMLElement>("[data-sheet-scroller]");
    // Жест отдаём скроллеру, только если ему есть куда скроллить: элемент без
    // переполнения — не scroll container, overscroll-behavior на нём не
    // действует, и пропущенный жест цепочкой прокручивал страницу под шторкой
    // (а раз начатый скролл iOS продолжает неотменяемыми событиями, пока не
    // погаснет индикатор, — preventDefault на них уже бессилен).
    if (
      scroller &&
      e.target instanceof Node &&
      scroller.contains(e.target) &&
      scroller.scrollHeight > scroller.clientHeight
    )
      return;
    if (e.cancelable) e.preventDefault();
  };
  document.addEventListener("touchmove", block, { passive: false, capture: true });
  document.addEventListener("wheel", block, { passive: false, capture: true });
  // Индикатор прокрутки страницы iOS рисует поверх шторки при любом сдвиге
  // (панорама visual viewport под клавиатуру, хвост жеста открытия). Пока
  // страница под локом, он бессмыслен – прячем. Где scrollbar-width не поддержан
  // (iOS Safari до 26.2, по caniuse), индикатор остаётся.
  const root = document.documentElement;
  const prevScrollbarWidth = root.style.scrollbarWidth;
  root.style.scrollbarWidth = "none";
  const unlock = () => {
    if (activeUnlock !== unlock) return;
    activeUnlock = null;
    document.removeEventListener("touchmove", block, true);
    document.removeEventListener("wheel", block, true);
    root.style.scrollbarWidth = prevScrollbarWidth;
  };
  activeUnlock = unlock;
  return unlock;
}

/* Список из react-aria (`isInput`). */
const NON_TEXT_INPUT_TYPES = new Set([
  "checkbox",
  "radio",
  "range",
  "color",
  "file",
  "image",
  "button",
  "submit",
  "reset",
  "hidden",
]);

export function isTextField(el: unknown): el is HTMLElement {
  return (
    (el instanceof HTMLInputElement && !NON_TEXT_INPUT_TYPES.has(el.type)) ||
    el instanceof HTMLTextAreaElement ||
    (el instanceof HTMLElement && el.isContentEditable)
  );
}

/*
 * Замена reveal-скроллу WebKit, который мы гасим при фокусе (см. focusKeyboardInput):
 * нативный reveal панорамирует visual viewport, и fixed-шторка уезжает вверх.
 * Ожидание – как в scrollIntoView из react-aria: клавиатура уже видна – меряем следующим
 * кадром; ещё нет – после её появления (resize у visualViewport), иначе граница видимой
 * области неизвестна. Скроллим на величину перекрытия, как alignFocusedKeyboardTarget
 * из Base UI; запас `slack` – как KEYBOARD_BUFFER в react-aria.
 */
export function alignAboveKeyboard(el: HTMLElement, scroller: HTMLElement | null, slack = 24) {
  const vv = window.visualViewport;
  if (!vv || !scroller) return;
  const align = () => {
    const visibleBottom = vv.offsetTop + vv.height;
    const overlap = el.getBoundingClientRect().bottom + slack - visibleBottom;
    if (overlap > 0) scroller.scrollTop += overlap;
  };
  if (vv.height < window.innerHeight) {
    // кадр ожидания — чтобы с поля успел сняться transform фокус-рецепта
    requestAnimationFrame(align);
  } else {
    vv.addEventListener("resize", align, { once: true });
    // страховка: фокус мог не поднять клавиатуру — не держим слушатель вечно
    setTimeout(() => vv.removeEventListener("resize", align), 1000);
  }
}

/*
 * Повтор приватной focusKeyboardInputWithoutPageScroll из DrawerVirtualKeyboardProvider
 * (Base UI 1.7); важна каждая деталь: transition:none и opacity:0 прячут кадр с подменённой
 * геометрией (иначе виден промах каретки), transform уводит поле за экран,
 * чтобы reveal-скроллу WebKit было нечего доводить, preventScroll держит
 * внутренние скроллеры (иначе они погонятся за прямоугольником на -2000px),
 * а восстановление обязано быть синхронным — до ближайшей отрисовки.
 * Вызывать синхронно в стеке обработчика жеста, иначе iOS не поднимет клавиатуру.
 *
 * Флаг inFlight: focus() внутри рецепта синхронно порождает focusin, и чужой
 * обработчик focusin, реагирующий на «фокус не тапом», принял бы подменённые
 * стили за прежние и восстановил бы их — поле осталось бы невидимым на -2000px.
 */
let recipeInFlight = false;

export function isKeyboardFocusInFlight() {
  return recipeInFlight;
}

export function focusKeyboardInput(el: HTMLElement | null) {
  if (!el) return;
  const prev = {
    opacity: el.style.opacity,
    transform: el.style.transform,
    transition: el.style.transition,
  };
  el.style.transition = "none";
  el.style.opacity = "0";
  el.style.transform = "translateY(-2000px)";
  recipeInFlight = true;
  try {
    el.focus({ preventScroll: true });
  } finally {
    recipeInFlight = false;
    Object.assign(el.style, prev);
  }
}
