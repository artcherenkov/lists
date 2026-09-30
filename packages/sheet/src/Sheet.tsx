import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import {
  alignAboveKeyboard,
  focusKeyboardInput,
  isKeyboardFocusInFlight,
  isTextField,
  lockBodyScroll,
  useVisualViewportVars,
} from "./viewport";

/*
 * Шторка для мобильного веба, собранная по итогам стенда bottom-sheet-lab
 * (разбор — в HANDOFF-CUSTOM-SHEET.md и README того репозитория):
 *
 * - жесты и пороги — как в vaul (совпадают с ощущением UIKit);
 * - шторка при клавиатуре стоит на месте, запас уходит в padding-bottom
 *   скроллера из конечной геометрии (--kb) — так делают react-modal-sheet
 *   (avoidKeyboard) и Base UI (alignFocusedKeyboardTarget), только они меряют
 *   overlap после фокуса, а мы ничего не меряем — потому и нечему промахиваться;
 * - портал монтируется синхронно с open, не через эффект: при автофокусе поле
 *   обязано оказаться в DOM внутри flushSync, в том же стеке клика — иначе
 *   iOS не поднимет клавиатуру (см. openSheetWithAutofocus);
 * - выезд и закрытие анимируются через bottom, а не transform: каретку WebKit
 *   рисует по нетрансформированной геометрии, и внутри transform-анимации она
 *   промахивается мимо поля. bottom — настоящая геометрия, каретка едет вместе
 *   с полем, поэтому автофокус совместим с анимацией выезда. Перетаскивание
 *   остаётся на transform: поле к этому моменту расфокусировано, каретки нет,
 *   а layout не гоняется за пальцем.
 */

/* Пороги как в vaul (совпадают с ощущением UIKit) */
const CLOSE_FRACTION = 0.25; // закрыть, если утащили ниже 25% высоты
const VELOCITY_THRESHOLD = 0.4; // px/ms — быстрый свайп закрывает с любой дистанции
const EASING = "cubic-bezier(0.32, 0.72, 0, 1)"; // кривая шторок UIKit
const DURATION = 500;

/*
 * Отъезд подложки вглубь, как в iOS (у vaul — shouldScaleBackground): масштаб
 * оставляет по 13px с боков, сверху зазор max(env(safe-area-inset-top), 14px),
 * в зазорах чёрная подложка — уменьшенная страница выглядит карточкой на
 * чёрном, кайма даёт ощущение глубины. Побочный эффект осознанный: Safari
 * рисует страницу от кромки до кромки, тон статус-зоны и стеклянных контролов
 * выводит из пикселей контента, поэтому на время эффекта они темнеют. Повлиять
 * на это иначе нельзя — meta theme-color стекляшки не слушают (проверено на
 * устройстве); светлый вариант без каймы пробовали — глубина теряется.
 *
 * Синглтон по образцу lockBodyScroll: пересоздание шторки (unmount + mount
 * в одном коммите, например смена key) и повторное открытие в окне
 * отложенного восстановления не должны затирать исходные стили обёртки.
 * Исходники (saved) снимаются один раз и живут, пока не доиграет
 * восстановление transition — его таймер отменяется при новом открытии.
 */
// ponytail: масштаб не ведётся за пальцем при перетаскивании (у vaul ведётся) —
// интерполировать по dragY, если разница станет заметна
let activeUnscale: (() => void) | null = null;
let scaleRestoreTimer: ReturnType<typeof setTimeout> | undefined;
let scaleSaved: {
  transition: string;
  transform: string;
  transformOrigin: string;
  clipPath: string;
} | null = null;
let scaleClipTop = 0;
let scaleUnderlay: HTMLElement | null = null;

function scaleBackgroundWrapper(): (() => void) | undefined {
  if (activeUnscale) return activeUnscale;
  const el = document.querySelector<HTMLElement>("[data-sheet-wrapper]");
  if (!el) return undefined;
  clearTimeout(scaleRestoreTimer);
  const fresh = scaleSaved === null;
  scaleSaved ??= {
    transition: el.style.transition,
    transform: el.style.transform,
    transformOrigin: el.style.transformOrigin,
    clipPath: el.style.clipPath,
  };
  // Якорь масштаба — точка обёртки у верхней кромки вьюпорта, а не её верх:
  // при проскролленной странице верх обёртки далеко за экраном, и масштабирование
  // вокруг него утягивает контент вверх, обнажая фон страницы снизу.
  // Скругления — по той же причине вырезом видимой области (clip-path), а не
  // border-radius: настоящие углы обёртки при прокрутке тоже за экраном.
  // Стартовый радиус 0 фиксируем принудительным пересчётом стилей, иначе
  // переход к 10px не анимируется.
  // При повторном открытии в окно возврата origin и вырез ещё стоят с прошлого
  // раза, а rect в середине transition врёт — не трогаем.
  if (fresh) {
    scaleClipTop = -el.getBoundingClientRect().top;
    el.style.transformOrigin = `50% ${scaleClipTop}px`;
    el.style.clipPath = `inset(${scaleClipTop}px 0 0 round 0px)`;
    void el.offsetWidth;
  }
  const scale = (window.innerWidth - 26) / window.innerWidth;
  /*
   * Подложка не должна касаться нижней кромки вьюпорта: тон своих стеклянных
   * контролов Safari 26 берёт сэмплированием background-color элементов у
   * кромки — даже визуально скрытых (theme-color игнорируется, см.
   * https://1ar.io/updates/safari-26-liquid-glass-web/). Fixed-подложка на весь
   * экран красила низ чёрным, хотя её пикселей там не видно. Отступ 20px
   * оставляет кромку «хвосту» панели, а боковые зазоры эффекта чёрные по всей
   * высоте, не обрываясь на половине.
   */
  if (!scaleUnderlay) {
    scaleUnderlay = document.createElement("div");
    scaleUnderlay.style.cssText =
      "position:fixed;top:0;left:0;right:0;bottom:20px;background:#000;z-index:-1;pointer-events:none";
    document.body.appendChild(scaleUnderlay);
  }
  el.style.transition = `transform ${DURATION}ms ${EASING}, clip-path ${DURATION}ms ${EASING}`;
  el.style.transform = `scale(${scale}) translate3d(0, max(env(safe-area-inset-top), 14px), 0)`;
  el.style.clipPath = `inset(${scaleClipTop}px 0 0 round 10px)`;
  const unscale = () => {
    if (activeUnscale !== unscale) return;
    activeUnscale = null;
    const saved = scaleSaved;
    if (!saved) return;
    // Лок уже снят, страницу можно скроллить, а вырез посчитан от прокрутки на
    // момент открытия — всё выше него отсечено, при скролле вверх в кадр въезжала
    // бы чёрная подложка. Поэтому вырез не просто теряет радиус, а быстро
    // раскрывается до целой обёртки, опережая самый резкий флик вверх.
    el.style.transition = `transform ${DURATION}ms ${EASING}, clip-path 150ms ${EASING}`;
    el.style.transform = saved.transform;
    el.style.clipPath = "inset(0 0 0 round 0px)";
    // origin и transition возвращаем после того, как доиграет возврат к
    // масштабу 1: мгновенная смена origin top → центр сдвигает ещё уменьшенный
    // элемент вниз, и возврат выглядит рывком.
    scaleRestoreTimer = setTimeout(() => {
      el.style.transformOrigin = saved.transformOrigin;
      el.style.transition = saved.transition;
      el.style.clipPath = saved.clipPath;
      scaleUnderlay?.remove();
      scaleUnderlay = null;
      scaleSaved = null;
    }, DURATION);
  };
  activeUnscale = unscale;
  return unscale;
}

/*
 * «Хвост» панели у нижней кромки нужен только мобильному Safari со стеклянными
 * контролами: там тон стекла сэмплируется у кромки вьюпорта, и без полосы низ
 * на время выезда живёт контентом страницы. В PWA (standalone) и остальных
 * браузерах стекла нет, а полоса видна как лишний белый кант. Стеклянный тулбар
 * по фичам не определяется (env(safe-area-inset-*) в Safari 26 равны нулю,
 * как и в Chrome) — поэтому UA-детект: Safari без CriOS/FxiOS/…, iPhone/iPod
 * или iPad (iPadOS прикидывается Macintosh — отличаем по touch).
 */
const needsBottomTail = (() => {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const iOS = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  const safari = /Safari\//.test(ua) && !/CriOS|FxiOS|EdgiOS|Chrome|Android/.test(ua);
  const standalone =
    (navigator as { standalone?: boolean }).standalone === true ||
    matchMedia("(display-mode: standalone)").matches;
  return iOS && safari && !standalone;
})();

/* тап по подписи <label> должен вести себя как тап по самому полю */
function resolveTextField(t: EventTarget | null): HTMLElement | null {
  if (isTextField(t)) return t;
  if (t instanceof HTMLElement) {
    const control = t.closest("label")?.control;
    if (isTextField(control)) return control;
  }
  return null;
}

export type SheetProps = {
  open: boolean;
  onClose: () => void;
  /** Шторка доехала вниз и размонтирована — момент убрать её из дерева */
  onClosed?: () => void;
  /** Название для aria-label и видимой строки заголовка */
  title: string;
  /** Заголовок только для скринридеров, без видимой строки */
  hideTitle?: boolean;
  /** Доля высоты, ниже которой отпущенная шторка закрывается */
  closeFraction?: number;
  /** Подложка [data-sheet-wrapper] отъезжает вглубь, как в iOS */
  scaleBackground?: boolean;
  /** Прижатая зона между заголовком и скроллером (например, поле поиска) */
  header?: ReactNode;
  /** Прижатая зона под скроллером (например, кнопки). При открытой клавиатуре
   * оказывается под ней — шторка на месте, вверх ничего не едет */
  footer?: ReactNode;
  children: ReactNode;
};

export function Sheet({
  open,
  onClose,
  onClosed,
  title,
  hideTitle = false,
  closeFraction = CLOSE_FRACTION,
  scaleBackground = false,
  header,
  footer,
  children,
}: SheetProps) {
  // --vvh/--kb ставит сама шторка: потребителю ничего подключать не нужно
  useVisualViewportVars();

  const [mounted, setMounted] = useState(false);
  const [entered, setEntered] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const gesture = useRef({
    startY: 0,
    active: false,
    rejected: false,
    inScroller: false,
    lastY: 0,
    lastT: 0,
    velocity: 0,
  });

  /*
   * present, а не mounted: при open портал появляется в этом же рендере,
   * синхронно (нужно для flushSync + автофокуса), а mounted-состояние
   * держит его в DOM после open=false, пока играет анимация закрытия.
   */
  const present = open || mounted;
  const shown = open && entered;

  // ref, а не зависимость эффекта: новый onClosed на каждый рендер не должен
  // перезапускать анимацию закрытия
  const onClosedRef = useRef(onClosed);
  onClosedRef.current = onClosed;
  const everOpened = useRef(false);

  useEffect(() => {
    if (open) {
      everOpened.current = true;
      setMounted(true);
      setDragY(0);
      // при автофокусе лок уже стоит из обработчика клика — вернётся тот же unlock
      const unlock = lockBodyScroll();
      const unscale = scaleBackground ? scaleBackgroundWrapper() : undefined;
      // два rAF: сначала кадр за нижней границей экрана, потом переход к bottom: 0
      const raf = requestAnimationFrame(() => requestAnimationFrame(() => setEntered(true)));
      return () => {
        cancelAnimationFrame(raf);
        unlock();
        unscale?.();
      };
    } else {
      // холодный рендер с open=false — закрывать нечего, onClosed не зовём
      if (!everOpened.current) return;
      setEntered(false);
      const t = setTimeout(() => {
        setMounted(false);
        setDragY(0);
        onClosedRef.current?.();
      }, DURATION);
      return () => clearTimeout(t);
    }
    // scaleBackground читается только в момент открытия, смена на лету не поддержана
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  /*
   * touchmove с passive:false — единственный способ убить нативный rubber-band.
   * Глушим его с первого же движения вниз при scrollTop <= 0, иначе iOS заберёт
   * жест под скролл и пришлёт pointercancel раньше, чем начнётся перетаскивание.
   */
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel || !present) return;
    let touchStartX = 0;
    let touchStartY = 0;
    // У touchstart и touchmove в touches всегда есть касание, у touchend – в changedTouches:
    // событие не приходит без пальца, поэтому `!` не меняет поведения.
    const onTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]!;
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (gesture.current.active) {
        e.preventDefault();
        return;
      }
      const dy = e.touches[0]!.clientY - touchStartY;
      const canDrag = !gesture.current.inScroller || (scrollRef.current?.scrollTop ?? 0) <= 0;
      if (dy > 0 && canDrag) e.preventDefault();
    };
    /*
     * Перехват фокуса полей — приём react-aria (preventScrollMobileSafari),
     * тот же живёт в Base UI VirtualKeyboardProvider. Нативный focus по тапу
     * запускает reveal-скролл WebKit: тот скроллит контейнер по своим
     * представлениям и панорамирует visual viewport — шторка уезжает вверх,
     * а поле оказывается под клавиатурой. Поэтому фокус ставим сами рецептом
     * Base UI, а поле доводим alignAboveKeyboard.
     */
    const onTouchEnd = (e: TouchEvent) => {
      const t = e.changedTouches[0]!;
      // цель touchend в iOS — элемент точки НАЧАЛА касания: скролл, начатый
      // с пальцем на поле, без этого порога давал бы ложный фокус — баг
      // vaul #574, у react-aria перехват не защищён
      if (Math.hypot(t.clientX - touchStartX, t.clientY - touchStartY) > 10) return;
      const field = resolveTextField(e.target);
      if (!field || field === document.activeElement) return;
      e.preventDefault(); // гасит нативный focus и его reveal
      focusKeyboardInput(field);
      alignAboveKeyboard(field, scrollRef.current);
    };
    const onFocusIn = (e: FocusEvent) => {
      if (isKeyboardFocusInFlight()) return;
      const field = e.target;
      if (!isTextField(field)) return;
      /*
       * Фокус не тапом: стрелки след./пред. поля на клавиатуре iOS или
       * программный. Reveal ещё впереди — подмены геометрии в focus-событии
       * достаточно, но снятие здесь обязано быть отложенным до следующего
       * кадра (так в react-aria, у них это отдельный обработчик focus).
       */
      const prev = {
        opacity: field.style.opacity,
        transform: field.style.transform,
        transition: field.style.transition,
      };
      field.style.transition = "none";
      field.style.opacity = "0";
      field.style.transform = "translateY(-2000px)";
      requestAnimationFrame(() => {
        Object.assign(field.style, prev);
        alignAboveKeyboard(field, scrollRef.current);
      });
    };
    // ponytail: перехват только на тач-устройствах; десктоп живёт нативным фокусом
    const touchDevice = navigator.maxTouchPoints > 0;

    panel.addEventListener("touchstart", onTouchStart, { passive: true });
    panel.addEventListener("touchmove", onTouchMove, { passive: false });
    if (touchDevice) {
      panel.addEventListener("touchend", onTouchEnd, { passive: false });
      panel.addEventListener("focusin", onFocusIn);
    }
    return () => {
      panel.removeEventListener("touchstart", onTouchStart);
      panel.removeEventListener("touchmove", onTouchMove);
      panel.removeEventListener("touchend", onTouchEnd);
      panel.removeEventListener("focusin", onFocusIn);
    };
  }, [present]);

  const onPointerDown = (e: ReactPointerEvent) => {
    const g = gesture.current;
    g.startY = e.clientY;
    g.lastY = e.clientY;
    g.lastT = e.timeStamp;
    g.active = false;
    g.rejected = false;
    // жест с язычка или заголовка соревнуется не со скроллом, а только с
    // самой шторкой — правило «scrollTop = 0» для него не действует (vaul
    // так же смотрит на скроллируемых предков точки касания)
    g.inScroller = !!scrollRef.current?.contains(e.target as Node);
  };

  const onPointerMove = (e: ReactPointerEvent) => {
    const g = gesture.current;
    if (g.rejected) return;
    const dy = e.clientY - g.startY;

    if (!g.active) {
      // жест вверх — скролл; жест из скроллера не у верхней границы — тоже скролл
      if (dy < 0 || (g.inScroller && (scrollRef.current?.scrollTop ?? 0) > 0)) {
        g.rejected = true;
        return;
      }
      if (dy > 6) {
        g.active = true;
        setDragging(true);
        panelRef.current?.setPointerCapture(e.pointerId);
        // клавиатуру прячем сразу — перетаскивать шторку с клавиатурой нельзя
        (document.activeElement as HTMLElement | null)?.blur?.();
      }
      return;
    }

    const dt = Math.max(1, e.timeStamp - g.lastT);
    g.velocity = (e.clientY - g.lastY) / dt;
    g.lastY = e.clientY;
    g.lastT = e.timeStamp;
    // вверх выше исходной позиции — с сопротивлением, как резинка UIKit
    setDragY(dy > 0 ? dy : dy / 6);
  };

  const onPointerUp = () => {
    const g = gesture.current;
    if (!g.active) return;
    g.active = false;
    setDragging(false);
    const height = panelRef.current?.getBoundingClientRect().height ?? 1;
    if (dragY > height * closeFraction || g.velocity > VELOCITY_THRESHOLD) {
      onClose();
    } else {
      setDragY(0);
    }
  };

  if (!present) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      style={{ position: "fixed", inset: 0, zIndex: 50 }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "var(--sheet-backdrop, rgba(0, 0, 0, 0.4))",
          opacity: shown ? 1 : 0,
          transition: `opacity ${DURATION}ms ease`,
        }}
        onClick={onClose}
      />
      {/* «Хвост» панели у нижней кромки с первого кадра открытия (только
          мобильный Safari, см. needsBottomTail). Прячется сразу по open=false,
          не дожидаясь выезда панели. pointerEvents: none — чтобы тап по низу
          подложки закрывал шторку. */}
      {open && needsBottomTail && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 20,
            background: "var(--sheet-bg, #fff)",
            pointerEvents: "none",
          }}
        />
      )}
      <div
        ref={panelRef}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          background: "var(--sheet-bg, #fff)",
          color: "var(--sheet-fg, inherit)",
          borderRadius: "16px 16px 0 0",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          // 90% layout viewport: клавиатура его не меняет, шторка стоит на месте
          height: "90dvh",
          // скрытое положение — с запасом на safe-area, иначе верхний край
          // шторки торчит над home indicator
          bottom: shown ? 0 : "calc(-90dvh - env(safe-area-inset-bottom))",
          transform: `translateY(${dragY}px)`,
          transition: dragging
            ? "none"
            : `bottom ${DURATION}ms ${EASING}, transform ${DURATION}ms ${EASING}`,
          willChange: "transform",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div
          style={{
            display: "flex",
            flexShrink: 0,
            justifyContent: "center",
            padding: "8px 0 4px",
            cursor: "grab",
            userSelect: "none",
            touchAction: "none",
          }}
        >
          <div
            style={{
              height: 6,
              width: 40,
              borderRadius: 9999,
              background: "var(--sheet-handle, #d1d5db)",
            }}
          />
        </div>
        {!hideTitle && (
          <div
            style={{
              flexShrink: 0,
              padding: "0 16px 8px",
              textAlign: "center",
              fontSize: 16,
              fontWeight: 600,
              userSelect: "none",
            }}
          >
            {title}
          </div>
        )}
        {header !== undefined && <div style={{ flexShrink: 0, padding: "0 16px" }}>{header}</div>}
        <div
          ref={scrollRef}
          // метка для событийного лока: жесты внутри скроллера арбитрирует шторка
          data-sheet-scroller
          style={{
            minHeight: 0,
            flexGrow: 1,
            overflowY: "auto",
            padding: "0 16px",
            touchAction: "pan-y",
            overscrollBehaviorY: "contain",
            // Запас под клавиатуру из конечной геометрии, без измерений: предел
            // прокрутки растёт ровно на --kb, и любое поле доводится выше
            // клавиатуры. Шторку при этом не поднимаем — иначе смещение удвоится.
            paddingBottom: "calc(var(--kb, 0px) + max(env(safe-area-inset-bottom), 16px))",
          }}
        >
          {children}
        </div>
        {footer !== undefined && (
          <div
            style={{
              flexShrink: 0,
              padding: "0 16px",
              paddingBottom: "max(env(safe-area-inset-bottom), 16px)",
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
