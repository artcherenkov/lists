-- Один номер изменения на все таблицы. Триггер берёт общую блокировку до nextval и держит её до конца
-- транзакции, поэтому номера выдаются в порядке коммитов: читатель, увидевший номер N, видит и все меньшие.
CREATE SEQUENCE change_seq;

CREATE FUNCTION bump_seq() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(1);
  NEW.seq := nextval('change_seq');
  PERFORM pg_notify('changes', coalesce(to_jsonb(NEW)->>'user_id', '*'));
  RETURN NEW;
END $$;

CREATE TABLE items (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  seq bigint NOT NULL,
  kind text NOT NULL,
  title text NOT NULL,
  year integer,
  tmdb_id text,
  poster_path text,
  status text NOT NULL,
  rating integer,
  watched_month text,
  note text,
  added_at text NOT NULL,
  updated_at text NOT NULL,
  deleted_at text,
  dv integer NOT NULL,
  future_field text
);
CREATE INDEX items_user_seq ON items (user_id, seq);
CREATE INDEX items_user_tmdb ON items (user_id, tmdb_id);

CREATE TABLE seasons (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  seq bigint NOT NULL,
  item_id text NOT NULL,
  season integer NOT NULL,
  state text NOT NULL,
  updated_at text NOT NULL,
  deleted boolean NOT NULL DEFAULT false
);
CREATE INDEX seasons_user_seq ON seasons (user_id, seq);

CREATE TABLE shows (
  id text PRIMARY KEY,
  seq bigint NOT NULL,
  title text NOT NULL,
  seasons_json text NOT NULL,
  continuing boolean NOT NULL DEFAULT false,
  updated_at text NOT NULL
);
CREATE INDEX shows_seq ON shows (seq);

CREATE TRIGGER items_seq BEFORE INSERT OR UPDATE ON items FOR EACH ROW EXECUTE FUNCTION bump_seq();
CREATE TRIGGER seasons_seq BEFORE INSERT OR UPDATE ON seasons FOR EACH ROW EXECUTE FUNCTION bump_seq();
CREATE TRIGGER shows_seq BEFORE INSERT OR UPDATE ON shows FOR EACH ROW EXECUTE FUNCTION bump_seq();

CREATE TABLE settings (key text PRIMARY KEY, value text NOT NULL);
INSERT INTO settings VALUES ('min_dv', '1'), ('cur_dv', '1'), ('epoch', gen_random_uuid()::text);

-- Ключи уже применённых правок: повтор после потерянного ответа не накладывается второй раз.
CREATE TABLE applied_pushes (
  key text PRIMARY KEY,
  at timestamptz NOT NULL DEFAULT now()
);
