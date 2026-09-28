import { cpSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const from = fileURLToPath(new URL("../../apps/web/dist", import.meta.url));
const to = fileURLToPath(new URL("../dist/web", import.meta.url));

if (!existsSync(from)) {
  console.error("apps/web/dist not found — run `pnpm --filter @crew/web build` first");
  process.exit(1);
}
cpSync(from, to, { recursive: true });
console.log("copied web UI → dist/web");
