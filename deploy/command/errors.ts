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

/** Ошибка и цепочка её причин, по строке на каждую. */
export function formatError(error: unknown): string {
  const lines: string[] = [];
  for (let current = error; current !== undefined;) {
    const message = current instanceof Error ? current.message : String(current);
    lines.push(message);
    current = current instanceof Error ? current.cause : undefined;
  }
  return lines.join("\n  причина: ");
}
