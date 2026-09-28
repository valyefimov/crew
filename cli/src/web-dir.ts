import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

/** The built web UI: next to the bundle when installed, or apps/web/dist in the monorepo. */
export function webDir(): string | undefined {
  const candidates = [
    new URL("./web", import.meta.url),
    new URL("../../apps/web/dist", import.meta.url),
  ].map((u) => fileURLToPath(u));
  return candidates.find((p) => existsSync(`${p}/index.html`));
}
