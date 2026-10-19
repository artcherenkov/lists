// Перевод копии на устройстве 1 -> 2: оценка 1–10 становится звёздами 1–5.
// Копия пишется прямо в ps_data__items, мимо представления: триггеры очереди не срабатывают.
export const toStars = (r: number | null) => (r == null ? null : Math.floor((r + 1) / 2));

export async function migrateIfNeeded(db: any, dv: number) {
  if (dv < 2) return;
  const stale = await db.getAll(
    "SELECT count(*) AS n FROM ps_data__items WHERE coalesce(json_extract(data,'$.dv'),1) < 2",
  );
  const queued = await db.getAll(
    "SELECT count(*) AS n FROM ps_crud WHERE coalesce(json_extract(data,'$.metadata.dv'),1) < 2",
  );
  if (!stale[0].n && !queued[0].n) return;
  await db.disconnect(); // пока перевод идёт, загрузка с сервера стоит
  await db.writeTransaction(async (tx: any) => {
    await tx.execute(
      `UPDATE ps_data__items SET data = json_set(data, '$.rating', CASE WHEN json_extract(data,'$.rating') IS NULL THEN NULL ELSE (json_extract(data,'$.rating') + 1) / 2 END, '$.dv', 2)
       WHERE coalesce(json_extract(data,'$.dv'),1) < 2`,
    );
    // очередь: правки старой версии переводятся до версии клиента, метка обновляется
    const ops = await tx.getAll("SELECT id, data FROM ps_crud ORDER BY id");
    for (const o of ops) {
      const d = JSON.parse(o.data);
      const mv = d.metadata ? JSON.parse(d.metadata).dv : 1;
      if (mv >= 2) continue;
      if (d.type === "items" && d.data && "rating" in d.data)
        d.data.rating = toStars(d.data.rating);
      if (d.type === "items" && d.op === "PUT" && d.data) d.data.dv = 2;
      d.metadata = JSON.stringify({ ...(d.metadata ? JSON.parse(d.metadata) : {}), dv: 2 });
      await tx.execute("UPDATE ps_crud SET data = ? WHERE id = ?", [JSON.stringify(d), o.id]);
    }
  });
}
