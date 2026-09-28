import open from "open";
import { startServer } from "@crew/server";
import { bold, cyan, dim, logo, ok, warn } from "../ui.ts";
import { webDir } from "../web-dir.ts";

export interface StartFlags {
  port?: string;
  host?: string;
  open?: boolean;
  telegram?: boolean;
}

export async function start(flags: StartFlags) {
  console.log(`\n${logo()}\n`);
  const running = await startServer({
    port: flags.port ? Number(flags.port) : undefined,
    host: flags.host,
    webDir: webDir(),
    telegram: flags.telegram,
    log: (m) => console.log(dim(`  ${m}`)),
  });
  const { crew } = running;

  const online = await crew.provider.ping();
  const agents = crew.store.listAgents();
  ok(`Crew is running at ${bold(cyan(running.url))}`);
  console.log(dim(`  data      ${crew.store.file}`));
  console.log(dim(`  provider  ${crew.config.provider} · ${crew.config.model}`));
  console.log(dim(`  agents    ${agents.length ? agents.map((a) => a.name).join(", ") : "none yet"}`));
  if (!online) warn(`Model provider is offline. Start Ollama: ${bold("ollama serve")}`);
  if (running.telegram) ok(`Telegram bot online — send ${bold(`/pair ${running.telegram.pairingCode}`)} to it`);
  console.log();

  if (flags.open) open(running.url).catch(() => {});

  const shutdown = async () => {
    console.log(dim("\n  shutting down…"));
    await running.close();
    process.exit(0);
  };
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}
