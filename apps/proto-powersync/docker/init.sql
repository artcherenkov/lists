CREATE DATABASE psstorage;
CREATE ROLE powersync_role WITH REPLICATION BYPASSRLS LOGIN PASSWORD 'powersync_pw';
CREATE ROLE powersync_storage WITH LOGIN PASSWORD 'storage_pw';
GRANT ALL ON DATABASE psstorage TO powersync_storage;
\c psstorage
GRANT ALL ON SCHEMA public TO powersync_storage;
\c app

CREATE TABLE items (
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
  dv integer NOT NULL DEFAULT 1,
  future_field text
);
CREATE INDEX items_user ON items (user_id);

CREATE TABLE seasons (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  item_id text NOT NULL,
  season integer NOT NULL,
  state text NOT NULL,
  updated_at text
);
CREATE INDEX seasons_user ON seasons (user_id);

CREATE TABLE shows (
  id text PRIMARY KEY,
  title text NOT NULL,
  seasons_json text,
  continuing integer NOT NULL DEFAULT 0,
  updated_at text
);

CREATE TABLE settings (
  key text PRIMARY KEY,
  value integer NOT NULL
);
INSERT INTO settings VALUES ('min_dv', 1), ('cur_dv', 1);

GRANT SELECT ON ALL TABLES IN SCHEMA public TO powersync_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO powersync_role;
CREATE PUBLICATION powersync FOR TABLE items, seasons, shows;
