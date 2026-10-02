import { deploy } from "./deploy.ts";
import { runCli } from "./run-cli.ts";

await runCli((cancel) => deploy(process.argv[2] ?? "HEAD", cancel));
