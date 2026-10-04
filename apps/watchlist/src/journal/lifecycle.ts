import type { Log } from "./store.ts";

import { formatDuration, formatTime, yesNo } from "./format.ts";
import { type KeyValueStorage, readText, writeText } from "./storage.ts";

/** Что известно о странице: когда она ушла из виду и получила ли `pagehide`. */
export interface PageState {
  hiddenAt?: number;
  unloaded: boolean;
}

export const VISIBLE_PAGE: PageState = { unloaded: false };

/**
 * Сохраняет первый момент ухода из виду. На выгрузке страницы (перезагрузка, переход) `pagehide`
 * приходит раньше `hidden`, поэтому `hidden` не сбрасывает `unloaded`.
 */
export function pageHidden(state: PageState, now: number): PageState {
  return { ...state, hiddenAt: state.hiddenAt ?? now };
}

export function pageUnloaded(state: PageState, now: number): PageState {
  return { hiddenAt: state.hiddenAt ?? now, unloaded: true };
}

export function pageShown(state: PageState, now: number) {
  return {
    state: VISIBLE_PAGE,
    backgroundMs: state.hiddenAt === undefined ? undefined : now - state.hiddenAt,
  };
}

export function launchPageState(visibility: DocumentVisibilityState, now: number): PageState {
  return visibility === "hidden" ? { hiddenAt: now, unloaded: false } : VISIBLE_PAGE;
}

/**
 * Вид запуска по состоянию прежней страницы. `lastRecordAt` – время последней записи журнала до
 * запуска: по нему называется срок, если прежняя страница ухода не записала.
 */
export function describeLaunchKind(args: {
  previous: PageState | undefined;
  lastRecordAt: number | undefined;
  now: number;
}) {
  const { previous, lastRecordAt, now } = args;
  if (previous?.hiddenAt !== undefined) {
    const since = `${formatTime(previous.hiddenAt)}, прошло ${formatDuration(now - previous.hiddenAt)}`;
    return previous.unloaded
      ? `Запуск после закрытия или перезагрузки страницы (pagehide): прежняя страница ушла из виду ${since}`
      : `Холодный запуск: прежняя страница ушла в фон ${since}`;
  }
  if (lastRecordAt === undefined) {
    return previous
      ? "Запуск без записанного ухода в фон: записей прежней страницы нет"
      : "Первый запуск: прежнего состояния нет";
  }
  return `Запуск без записанного ухода в фон: прежняя страница ухода не записала, её последняя запись ${formatTime(lastRecordAt)}, прошло ${formatDuration(now - lastRecordAt)}`;
}

export interface LaunchInfo {
  version: string;
  timeOrigin: number;
  navigationType: string;
  visibility: DocumentVisibilityState;
  homeScreen: boolean;
}

export function describeLaunch(info: LaunchInfo) {
  return `Запуск: версия ${info.version}, timeOrigin ${formatTime(info.timeOrigin)}, навигация ${info.navigationType}, видимость ${info.visibility}, с экрана «Домой»: ${yesNo(info.homeScreen)}`;
}

export const PAGE_STATE_KEY = "app-journal-page";

export function readPageState(storage: KeyValueStorage | undefined): PageState | undefined {
  const raw = readText(storage, PAGE_STATE_KEY);
  if (!raw) return undefined;
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null) return undefined;
    const { hiddenAt, unloaded } = value as Record<string, unknown>;
    if (typeof unloaded !== "boolean") return undefined;
    if (hiddenAt !== undefined && typeof hiddenAt !== "number") return undefined;
    return hiddenAt === undefined ? { unloaded } : { hiddenAt, unloaded };
  } catch {
    return undefined;
  }
}

export function writePageState(storage: KeyValueStorage | undefined, state: PageState) {
  writeText(storage, PAGE_STATE_KEY, JSON.stringify(state));
}

export interface LifecycleDeps {
  doc: EventTarget & { visibilityState: DocumentVisibilityState };
  win: EventTarget;
  now: () => number;
  log: Log;
  initial: PageState;
  save: (state: PageState) => void;
}

/** Пишет уходы в фон и возвраты и передаёт `save` состояние, по которому следующий запуск назовёт свой вид. */
export function watchLifecycle(deps: LifecycleDeps) {
  const { doc, win, now, log, save } = deps;
  let state = deps.initial;
  const update = (next: PageState) => {
    state = next;
    save(next);
  };

  doc.addEventListener("visibilitychange", () => {
    if (doc.visibilityState === "hidden") {
      log("visibilitychange: страница скрыта");
      update(pageHidden(state, now()));
      return;
    }
    const shown = pageShown(state, now());
    log(
      shown.backgroundMs === undefined
        ? "visibilitychange: страница видна"
        : `visibilitychange: страница снова видна, тёплый возврат, в фоне ${formatDuration(shown.backgroundMs)}`,
    );
    update(shown.state);
  });

  win.addEventListener("pageshow", (event) => {
    const { persisted } = event as PageTransitionEvent;
    if (!persisted) {
      log("pageshow, persisted=false");
      return;
    }
    // Возврат из кеша переходов: страница та же, поэтому он тоже тёплый.
    const shown = pageShown(state, now());
    log(
      `pageshow, persisted=true${shown.backgroundMs === undefined ? "" : `, в фоне ${formatDuration(shown.backgroundMs)}`}`,
    );
    update(shown.state);
  });

  win.addEventListener("pagehide", (event) => {
    log(`pagehide, persisted=${(event as PageTransitionEvent).persisted}`);
    update(pageUnloaded(state, now()));
  });
}
