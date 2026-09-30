/** Выбранный диапазон оценок строкой: «6–9», а когда края совпали – одно число, «7». */
export function formatRatingRange([min, max]: readonly [min: number, max: number]): string {
  return min === max ? String(min) : `${min}–${max}`;
}
