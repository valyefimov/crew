// Dev entry: `pnpm --filter @crew/server dev` (the web UI runs separately on Vite).
import { startServer } from "./index.ts";

const running = await startServer();
console.log(`crew api → ${running.url}`);

for (const sig of ["SIGINT", "SIGTERM"] as const) {
  process.once(sig, async () => {
    await running.close();
    process.exit(0);
  });
}
