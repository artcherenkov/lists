import { Subject } from "rxjs";

export class ServerError extends Error {
  constructor(public status: number) {
    super(`server ${status}`);
  }
}

export type Gate = "ok" | "update-required";

export class Api {
  gate: Gate = "ok";
  waiting = false;
  onUpdateRequired = () => {};
  private tok?: { token: string; exp: number };
  readonly resync$ = new Subject<"RESYNC">();

  constructor(
    readonly base: string,
    readonly user: string,
    readonly dv: number,
    readonly ttl?: number,
  ) {}

  private async token() {
    if (this.tok && this.tok.exp * 1000 - Date.now() > Math.min(10_000, (this.ttl ?? 300) * 300)) return this.tok.token;
    const r = await fetch(`${this.base}/dev/token`, { method: "POST", body: JSON.stringify({ user: this.user, ttl: this.ttl }) });
    this.tok = await r.json();
    return this.tok!.token;
  }

  private headers = async () => ({ authorization: `Bearer ${await this.token()}`, "x-data-version": String(this.dv) });

  // 426: клиент младше минимальной версии – ничего не пишем и не читаем; 503: сервер ещё на старой версии – ждём, RxDB повторит.
  private check(r: Response) {
    if (r.status === 426) {
      this.gate = "update-required";
      this.onUpdateRequired();
    }
    this.waiting = r.status === 503;
    if (r.status === 401) this.tok = undefined;
    if (!r.ok) throw new ServerError(r.status);
  }

  async get(path: string) {
    const r = await fetch(this.base + path, { headers: await this.headers() });
    this.check(r);
    return r.json();
  }

  async post(path: string, body: unknown) {
    const r = await fetch(this.base + path, { method: "POST", headers: { ...(await this.headers()), "content-type": "application/json" }, body: JSON.stringify(body) });
    this.check(r);
    return r.json();
  }

  // Живые обновления: SSE «забери изменения». Читаем fetch-потоком, чтобы передать токен заголовком.
  listen(signal: AbortSignal) {
    void (async () => {
      while (!signal.aborted && this.gate === "ok") {
        try {
          const r = await fetch(`${this.base}/events`, { headers: await this.headers(), signal });
          this.check(r);
          const reader = r.body!.getReader();
          const dec = new TextDecoder();
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            if (dec.decode(value).includes("data: sync")) this.resync$.next("RESYNC");
          }
        } catch {}
        await new Promise((ok) => setTimeout(ok, 1000));
      }
    })();
  }
}
