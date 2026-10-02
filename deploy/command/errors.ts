/**
 * Причина остановки, заданная при `abort(reason)` (`StoppedError`, `LockLostError`). Безымянное
 * прерывание (`abort()` без причины) причиной не считается: его `reason` – `AbortError`.
 */
export function stopReason(signal: AbortSignal | undefined): Error | undefined {
  // У неостановленного сигнала `reason` – `undefined`.
  const reason: unknown = signal?.reason;
  return reason instanceof Error && reason.name !== "AbortError" ? reason : undefined;
}

/**
 * Если команду прервал сигнал с причиной, возвращает её: причина главнее сообщения «команда
 * прервана» и называет, что произошло. Иначе `undefined`.
 */
export function stopReasonOfAbort(
  error: unknown,
  signal: AbortSignal | undefined,
): Error | undefined {
  return error instanceof Error && error.name === "AbortError" ? stopReason(signal) : undefined;
}
