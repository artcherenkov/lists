import { rollback } from "./rollback.ts";
import { runCli } from "./run-cli.ts";

await runCli((cancel) => rollback(cancel));
