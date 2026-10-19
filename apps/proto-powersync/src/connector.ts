import type {
  AbstractPowerSyncDatabase,
  PowerSyncBackendConnector,
  PowerSyncCredentials,
} from "@powersync/web";

export const status = {
  updateRequired: false,
  waiting: false,
  lastUploadError: "" as string,
  uploads: 0,
};

export class Connector implements PowerSyncBackendConnector {
  private cached: { token: string; expiresAt: number } | null = null;
  constructor(
    private user: string,
    private dataVersion: number,
    private dev: string,
  ) {}

  private async token() {
    if (this.cached && this.cached.expiresAt - Date.now() > 10_000) return this.cached.token;
    const r = await fetch(`/api/d/${this.dev}/token`, {
      method: "POST",
      body: JSON.stringify({ user: this.user, dv: this.dataVersion }),
    });
    status.updateRequired = r.status === 426;
    status.waiting = r.status === 503;
    if (!r.ok) throw new Error(`token ${r.status}`);
    this.cached = await r.json();
    return this.cached!.token;
  }

  async fetchCredentials(): Promise<PowerSyncCredentials> {
    return { endpoint: `${location.origin}/ps/d/${this.dev}`, token: await this.token() };
  }

  async uploadData(db: AbstractPowerSyncDatabase) {
    const tx = await db.getNextCrudTransaction();
    if (!tx) return;
    const ops = tx.crud.map((c) => ({
      op: c.op,
      table: c.table,
      id: c.id,
      data: c.opData,
      metadata: c.metadata,
    }));
    // правка новее клиента: не отправляем, показываем «Нужно обновление»
    for (const o of ops) {
      const dv = o.metadata ? JSON.parse(o.metadata).dv : this.dataVersion;
      if (dv > this.dataVersion) {
        status.updateRequired = true;
        throw new Error("queued edit is newer than client");
      }
    }
    let res: Response;
    try {
      res = await fetch(`/api/d/${this.dev}/upload`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${await this.token()}`,
          "x-data-version": String(this.dataVersion),
        },
        body: JSON.stringify({ ops }),
      });
    } catch (e) {
      status.lastUploadError = "network";
      throw e;
    }
    status.updateRequired = res.status === 426;
    status.waiting = res.status === 503;
    if (!res.ok) {
      status.lastUploadError = `http ${res.status}`;
      throw new Error(`upload ${res.status}`); // очередь остаётся, SDK повторит
    }
    status.lastUploadError = "";
    const { results } = await res.json();
    for (const r of results) {
      if (r.status === "rejected") {
        await db.execute(
          "INSERT INTO rejections (id, table_name, row_id, op, error, at) VALUES (uuid(), ?, ?, ?, ?, ?)",
          [r.table, r.id, r.op, r.error, new Date().toISOString()],
        );
      }
    }
    status.uploads++;
    await tx.complete();
  }
}
