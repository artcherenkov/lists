DROP TABLE IF EXISTS applied_keys, marks, items, shows CASCADE;

CREATE TABLE items (
  id uuid PRIMARY KEY,
  user_id text NOT NULL,
  kind text NOT NULL,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'want',
  rating int,
  stars int,
  watched_month text,
  note text,
  tmdb_id int,
  year int,
  poster text,
  added_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  deleted_at timestamptz,
  fmt int NOT NULL DEFAULT 1,
  future_flag text
);
CREATE INDEX items_user ON items (user_id);

CREATE TABLE marks (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  item_id uuid NOT NULL,
  season int NOT NULL,
  state text NOT NULL,
  updated_at timestamptz NOT NULL
);
CREATE INDEX marks_user ON marks (user_id);

CREATE TABLE shows (
  id int PRIMARY KEY,
  title text NOT NULL,
  seasons jsonb NOT NULL DEFAULT '[]',
  continuing boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE applied_keys (key text PRIMARY KEY, at timestamptz NOT NULL DEFAULT now());

ALTER TABLE items REPLICA IDENTITY FULL;
ALTER TABLE marks REPLICA IDENTITY FULL;
ALTER TABLE shows REPLICA IDENTITY FULL;
