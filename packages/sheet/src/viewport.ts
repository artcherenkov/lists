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
 * Лок без position:fixed на body. Стандартный приём (usePositionFixed в vaul,
 * position:fixed + top:-scrollY) переводит поддерево body в другой режим
 * тайлинга WebKit, и transform по такому поддереву (scale-эффект) мелькает
 * канвасом. На устройстве воспроизводилось только комбинацией «лок +
 * transform»: по отдельности оба чистые, разнос по кадрам не помогает. У vaul
 * тот же лок и та же болячка (issue #365, закрыт без исправления). Поэтому
 * документ не трогаем вовсе, а гасим сами жесты, как react-remove-scroll
 * у Radix: touchmove/wheel вне скроллера шторки — preventDefault, внутри —
 * арбитрирует шторка (drag против скролла, rubber-band она уже глушит).
 * overflow:hidden не альтернатива: на body iOS его игнорирует, на html —
 * сбрасывает прокрутку в ноль.
 *
 * Синглтон: при автофокусе лок обязан встать синхронно в обработчике клика,
 * до reveal-скролла WebKit (лок Base UI через setTimeout(0) опаздывал — отсюда
 * был мелькающий скроллбар подложки). Эффект шторки, пришедший позже, получает
 * тот же лок и владеет снятием. Повторный вызов unlock — no-op. Прокрутка
 * никуда не переезжает — и восстанавливать нечего.
 */
// ponytail: один лок на страницу, стек вложенных шторок не поддержан;
// перетаскивание скроллбара мышью и клавиатурная прокрутка на десктопе
// не блокируются — событийного лока хватает для тач-веба
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
  // страница под локом, он бессмыслен — прячем. Работает с Safari 18.2,
  // где scrollbar-width не поддержан — просто останется индикатор.
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

/* Типы input, не открывающие клавиатуру, — список react-aria (isInput) */
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
 * Свой довод поля выше клавиатуры — замена reveal-скроллу WebKit, который мы
 * гасим при фокусе (см. focusKeyboardInput): кроме скролла контейнера, нативный
 * reveal панорамирует visual viewport, и position:fixed-шторка уезжает вверх —
 * комментарий react-aria: «may cause even fixed position elements to scroll
 * off the screen». Логика ожидания — их же scrollIntoView: клавиатура уже
 * видна — мерить можно следующим кадром, ещё нет — только после её появления
 * (resize у visualViewport), иначе граница видимой области неизвестна.
 * Скроллим на overlap, как alignFocusedKeyboardTarget из Base UI; запас 24px —
 * KEYBOARD_BUFFER react-aria.
 */
export function alignAboveKeyboard(el: HTMLElement, scroller: HTMLElement | null, slack = 24) {
  const vv = window.visualViewport;
  if (!vv || !scroller) return;
  const align = () => {
    // низ видимой области (над клавиатурой) в координатах layout viewport
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
 * Дословный повтор приватной focusKeyboardInputWithoutPageScroll из
 * DrawerVirtualKeyboardProvider (Base UI 1.7). На стенде проверено, что важна
 * каждая деталь: transition:none и opacity:0 прячут кадр с подменённой
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
