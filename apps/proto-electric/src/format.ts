declare const __DATA_VERSION__: number;
// Pure translation chain shared by device and server: data version N -> N+1.
export const CURRENT = __DATA_VERSION__;

type Row = Record<string, any>;

// v1 -> v2: rating 1..10 becomes stars 1..5
export const steps: Record<number, { entity: (e: Row) => Row; patch: (p: Row) => Row }> = {
  1: {
    entity: (e) => ({
      ...e,
      stars: e.rating == null ? null : Math.ceil(e.rating / 2),
      rating: null,
      fmt: 2,
    }),
    patch: (p) => {
      if (!("rating" in p)) return p;
      const { rating, ...rest } = p;
      return { ...rest, stars: rating == null ? null : Math.ceil(rating / 2) };
    },
  },
};

export function translateEntity(table: string, row: Row, to = CURRENT): Row {
  if (table !== "items") return row;
  let v = row.fmt ?? 1;
  while (v < to) {
    row = steps[v].entity(row);
    v++;
  }
  return row;
}
export function translatePatch(table: string, patch: Row, from: number, to = CURRENT): Row {
  if (table !== "items") return patch;
  for (let v = from; v < to; v++) patch = steps[v].patch(patch);
  return patch;
}
