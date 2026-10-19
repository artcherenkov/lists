import { expect, test } from "@playwright/test";
import pg from "pg";
import { admin, api, edit, resetVersions, sql, token, uid, until } from "./helpers.ts";

test.afterEach(resetVersions);

const connect = async () => {
  const client = new pg.Client({ host: "127.0.0.1", port: 15435, user: "postgres", password: "postgres", database: "app" });
  await client.connect();
  return client;
};
const advisory = async (granted: boolean) =>
  Number((await sql("SELECT count(*)::int AS n FROM pg_locks WHERE locktype = 'advisory' AND granted = $1", [granted]))[0].n);

// Правило из data-model, «Перевод данных между версиями»: пока выкладка переводит записи, правка старой версии
// не должна лечь в старое поле – иначе она молча пропадёт. Ворота версии проверяют `cur` до блокировки номеров,
// поэтому правка, прошедшая ворота за миг до выкладки и ждавшая блокировку, применяется со старой версией.
// Условие задано блокировкой строки: выкладка стоит, держа блокировку номеров, пока правка проходит ворота.
test("правка старой версии, дошедшая до сервера во время выкладки, не оставляет в базе строку старой версии", async () => {
  const user = uid();
  await resetVersions();
  const t = await token(user);
  const old = uid("old");
  const created = await api("/api/push", {
    token: t, dv: 1, json: { edits: [edit(user, uid("k"), "items", old, { kind: "film", title: "До выкладки", rating: 8 })] },
  });
  expect(created.body.results[0].status).toBe("ok");

  const holder = await connect();
  try {
    await holder.query("BEGIN");
    await holder.query("SELECT 1 FROM items WHERE id = $1 FOR UPDATE", [old]);

    // Выкладка версии 2 берёт блокировку номеров и встаёт на строке, занятой holder.
    const deploy = admin("/admin/deploy", { to: 2 });
    await until(() => advisory(true), (n) => n >= 1, "выкладка держит блокировку номеров");

    // Старый клиент отправляет создание записи: ворота видят cur = 1 и пропускают, запись ждёт блокировку.
    const fresh = uid("new");
    const push = api("/api/push", {
      token: t, dv: 1, json: { edits: [edit(user, uid("k"), "items", fresh, { kind: "film", title: "Из старой версии", rating: 10 })] },
    });
    await until(() => advisory(false), (n) => n >= 1, "правка ждёт блокировку");

    await holder.query("COMMIT");
    await deploy;
    await push;

    const current = Number((await sql("SELECT value FROM settings WHERE key = 'cur_dv'"))[0].value);
    expect(current).toBe(2);
    // Допустимо отказать правке («подожди», «нужно обновление») или применить её в новой форме;
    // недопустимо оставить на сервере строку версии 1 после того, как версия 2 включена.
    const stale = await sql("SELECT id, dv, rating FROM items WHERE user_id = $1 AND dv < $2", [user, current]);
    expect(stale).toEqual([]);
  } finally {
    await holder.query("ROLLBACK").catch(() => {});
    await holder.end();
  }
});
