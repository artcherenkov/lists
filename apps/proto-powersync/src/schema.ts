import { column, Schema, Table } from "@powersync/web";

export const items = new Table(
  {
    kind: column.text,
    title: column.text,
    year: column.integer,
    tmdb_id: column.text,
    poster_path: column.text,
    status: column.text,
    rating: column.integer,
    watched_month: column.text,
    note: column.text,
    added_at: column.text,
    updated_at: column.text,
    deleted_at: column.text,
    dv: column.integer,
  },
  { trackMetadata: true, ignoreEmptyUpdate: true },
);

export const seasons = new Table(
  {
    item_id: column.text,
    season: column.integer,
    state: column.text,
    updated_at: column.text,
  },
  { trackMetadata: true, ignoreEmptyUpdate: true },
);

export const shows = new Table({
  title: column.text,
  seasons_json: column.text,
  continuing: column.integer,
  updated_at: column.text,
});

export const rejections = new Table(
  {
    table_name: column.text,
    row_id: column.text,
    op: column.text,
    error: column.text,
    at: column.text,
  },
  { localOnly: true },
);

export const AppSchema = new Schema({ items, seasons, shows, rejections });
