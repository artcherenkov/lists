-- Номер изменения: один на все таблицы. Его выдаёт триггер под блокировкой, которая держится до
-- конца транзакции, поэтому номера совпадают с порядком коммитов (см. server/pull.ts).
CREATE SEQUENCE IF NOT EXISTS change_seq;

CREATE OR REPLACE FUNCTION stamp_change() RETURNS trigger AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(1);
  NEW.seq := nextval('change_seq');
  PERFORM pg_notify('changed', '');
  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS items (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  kind text NOT NULL,
  title text NOT NULL,
  year integer,
  tmdb_id text,
  poster_path text,
  status text NOT NULL DEFAULT 'want',
  rating integer,
  watched_month text,
  note text,
  added_at text,
  updated_at text,
  deleted_at text,
  dv integer NOT NULL,
  future_field text,
  seq bigint NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS items_user_seq ON items (user_id, seq);
CREATE INDEX IF NOT EXISTS items_user_tmdb ON items (user_id, tmdb_id);

-- Снятая отметка – строка со state = NULL: «снятие – такая же правка».
CREATE TABLE IF NOT EXISTS seasons (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  item_id text NOT NULL,
  season integer NOT NULL,
  state text,
  updated_at text,
  dv integer NOT NULL,
  seq bigint NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS seasons_user_seq ON seasons (user_id, seq);

-- Каталог: общий для всех, id = tmdb id. Пишет только сервер.
CREATE TABLE IF NOT EXISTS shows (
  id text PRIMARY KEY,
  title text NOT NULL,
  seasons jsonb NOT NULL DEFAULT '[]',
  continuing boolean NOT NULL DEFAULT false,
  updated_at text,
  seq bigint NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS shows_seq ON shows (seq);

-- Ключ повтора: правка, уже применённая, второй раз не применяется.
CREATE TABLE IF NOT EXISTS applied_edits (
  key text PRIMARY KEY,
  user_id text NOT NULL,
  status text NOT NULL,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS settings (
  key text PRIMARY KEY,
  value text NOT NULL
);
INSERT INTO settings VALUES ('min_dv', '1'), ('cur_dv', '1'), ('epoch', gen_random_uuid()::text)
  ON CONFLICT DO NOTHING;

DROP TRIGGER IF EXISTS items_stamp ON items;
CREATE TRIGGER items_stamp BEFORE INSERT OR UPDATE ON items FOR EACH ROW EXECUTE FUNCTION stamp_change();
DROP TRIGGER IF EXISTS seasons_stamp ON seasons;
CREATE TRIGGER seasons_stamp BEFORE INSERT OR UPDATE ON seasons FOR EACH ROW EXECUTE FUNCTION stamp_change();
DROP TRIGGER IF EXISTS shows_stamp ON shows;
CREATE TRIGGER shows_stamp BEFORE INSERT OR UPDATE ON shows FOR EACH ROW EXECUTE FUNCTION stamp_change();
