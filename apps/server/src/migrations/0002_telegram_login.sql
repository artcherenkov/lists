-- Вход кодом из бота: username Telegram у пользователя и таблица кодов плагина
-- `auth/telegram-login.ts`. Вывод `pnpm --filter server auth:sql` без правок.
create schema if not exists "auth";

alter table "auth"."user" add column "telegramUsername" text;

create table "auth"."telegramCode" ("id" text not null primary key, "digest" text not null unique, "telegramId" text not null unique, "name" text not null, "username" text, "messageId" integer not null, "expiresAt" timestamptz not null);
