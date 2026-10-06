// Собирает релиз макета: страница PowerSync (dist-ps) кладётся в dist/ps после основной сборки,
// чтобы предкеш основного service worker её не захватил.
import { cpSync, existsSync, rmSync } from "node:fs";

if (!existsSync("dist/index.html")) throw new Error("нет dist/index.html: сначала основная сборка");
rmSync("dist/ps", { recursive: true, force: true });
cpSync("dist-ps", "dist/ps", { recursive: true });
