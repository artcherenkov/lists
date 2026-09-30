export function formatRatingRange([min, max]: readonly [min: number, max: number]): string {
  return min === max ? String(min) : `${min}–${max}`;
}
