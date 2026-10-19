import { test, expect } from "@playwright/test";
import { admin, browserOf, Device, opsLog, pg, queueEmpty, uid, until } from "./helpers.ts";

test.afterEach(async () => { await admin("/dev/settings", { min_dv: 3, cur_dv: 3 }); });

// Решение 21: упавший шаг перевода одной записи. Её правки и правки её отметок ждут исправления, остальные идут.
const variants = [
  { name: "шаг 2 падает на копии и на последнем состоянии сервера", fail: (id: string) => `fail=${id}`, boom: false },
  { name: "шаг 3 падает после успешного шага 2", fail: (id: string) => `fail=${id}&failTo=3`, boom: false },
  { name: "падает только копия с правкой, состояние сервера переводится", fail: () => "boom=1", boom: true },
];

for (const v of variants) {
  test(`q4. цепочка 1→2→3, упавший шаг: ${v.name}`, async ({}, info) => {
    const user = uid();
    const rid = uid("R");
    await admin("/dev/settings", { min_dv: 1, cur_dv: 1 });
    const A = Device.create(browserOf(info), "A", { user, dv: 1 });
    await A.start();
    await A.p("addItem", { id: rid, kind: "series", title: "Stuck series", rating: 8 });
    await A.p("setSeason", rid, 1, "watching");
    const s = await A.p("addItem", { kind: "film", title: "Fine film", rating: 7 });
    await queueEmpty(A);
    await until(() => pg("select count(*)::int n from items where user_id=$1", [user]), (r) => r[0].n === 2);
    await until(() => pg("select 1 from seasons where item_id=$1", [rid]), (r) => r.length === 1);

    await A.offline();
    await A.p("updateItem", rid, { rating: 6, ...(v.boom ? { note: "boom" } : { note: "n1" }) });
    await A.p("setSeason", rid, 2, "watching");
    await A.p("updateItem", s, { rating: 4 });

    await A.kill();
    await A.start({ dv: 3, extra: v.fail(rid) });
    expect(await A.p("waiting")).toEqual([rid]);
    expect((await A.p("items")).map((d: any) => d.id)).toEqual([s]);
    expect((await A.item(s)).rating).toBe(2);
    console.log(`[${info.project.name}] «${v.name}»: скрыта, ждёт: ${(await A.p("waiting")).length}; список: ${(await A.p("items")).length}`);

    // выкладка сервера прошла (на сервере шаги не падают), сеть вернулась
    await admin("/dev/migrate", { to: 3 });
    await opsLog();
    await A.online();
    await until(() => pg("select rating from items where id=$1", [s]), (r) => r[0].rating === 2, 20_000, "other edit goes on");
    await until(() => A.p("deferred"), (d) => d.length === 2, 20_000, "edits of stuck record parked");
    expect((await A.p("deferred")).map((d: any) => d.id).sort()).toEqual([`items:${rid}`, `seasons:${rid}:2`].sort());
    expect(await pg("select rating, note from items where id=$1", [rid])).toEqual([{ rating: 4, note: null }]); // сервер без правок
    expect(await pg("select 1 from seasons where id=$1", [`${rid}:2`])).toHaveLength(0);
    // пока ждёт, запись видна как на сервере, правка пользователя поверх неё тоже ждёт
    await until(() => A.item(rid), (d) => d?.dv === 3, 10_000, "copy from server");
    await A.p("updateItem", rid, { note: "n2" });
    await until(() => A.p("deferred"), (d) => JSON.parse(d.find((x: any) => x.id === `items:${rid}`)?.edits_json ?? "[]").length === 2, 10_000, "later edit parked");
    expect((await pg("select note from items where id=$1", [rid]))[0].note).toBeNull();

    // исправленная версия
    await A.restart({ extra: "" });
    await until(() => A.p("deferred"), (d) => d.length === 0, 20_000, "replayed");
    await queueEmpty(A);
    await until(() => pg("select rating, note from items where id=$1", [rid]), (r) => r[0].note === "n2", 20_000, "edits reached server");
    expect(await pg("select rating, note, dv from items where id=$1", [rid])).toEqual([{ rating: 3, note: "n2", dv: 3 }]);
    expect(await pg("select state from seasons where id=$1", [`${rid}:2`])).toEqual([{ state: "watching" }]);
    const ops = (await opsLog()).filter((o) => o.id === rid);
    console.log(`[${info.project.name}] после исправления на сервер: ${JSON.stringify(ops.map((o) => o.fields))}`);
    expect((await A.item(rid)).rating).toBe(3);
    await A.kill();
  });
}

test("q4б. исправленная версия поставлена без сети: правка ждёт сети, потом применяется сама", async ({}, info) => {
  const user = uid();
  const rid = uid("R");
  await admin("/dev/settings", { min_dv: 1, cur_dv: 1 });
  const A = Device.create(browserOf(info), "A", { user, dv: 1 });
  await A.start();
  await A.p("addItem", { id: rid, kind: "film", title: "Stuck", rating: 8 });
  await queueEmpty(A);
  await until(() => pg("select 1 from items where id=$1", [rid]), (r) => r.length === 1);
  await A.offline();
  await A.p("updateItem", rid, { rating: 6 });
  await A.kill();
  await A.start({ dv: 3, extra: `fail=${rid}` });
  expect(await A.p("waiting")).toEqual([rid]);
  await A.kill();
  await A.start({ extra: "" }); // исправленная версия, схема та же: перевод не запускается заново
  expect(await A.p("waiting")).toEqual([rid]);
  await admin("/dev/migrate", { to: 3 });
  await A.online();
  await until(() => pg("select rating from items where id=$1", [rid]), (r) => r[0].rating === 3, 20_000, "replayed in session");
  await queueEmpty(A);
  expect((await A.item(rid)).rating).toBe(3);
  await A.kill();
});
