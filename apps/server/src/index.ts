import { serve, type ServerType } from "@hono/node-server";
import { Crew, envConfig } from "@crew/core";
import { TelegramChannel } from "@crew/channels";
import { createApp } from "./app.ts";

export { createApp } from "./app.ts";
export { VERSION } from "./version.ts";

export interface StartOptions {
  port?: number;
  host?: string;
  webDir?: string;
  dbFile?: string;
  telegram?: boolean;
  log?: (msg: string) => void;
}

export interface RunningCrew {
  crew: Crew;
  server: ServerType;
  url: string;
  telegram: TelegramChannel | null;
  close(): Promise<void>;
}

export async function startServer(opts: StartOptions = {}): Promise<RunningCrew> {
  const log = opts.log ?? ((m: string) => console.log(m));
  const env = envConfig();
  const crew = Crew.open(opts.dbFile ?? env.dbFile);
  crew.start();

  const { app, injectWebSocket } = createApp(crew, { webDir: opts.webDir });
  const port = opts.port ?? env.port;
  const host = opts.host ?? process.env.CREW_HOST ?? "127.0.0.1";

  const server = await new Promise<ServerType>((resolve, reject) => {
    const s = serve({ fetch: app.fetch, port, hostname: host }, () => resolve(s));
    s.once("error", reject);
  });
  injectWebSocket(server);

  let telegram: TelegramChannel | null = null;
  if (opts.telegram !== false && crew.config.telegramToken) {
    telegram = new TelegramChannel(crew, { token: crew.config.telegramToken, log });
    await telegram.start().catch((err) => {
      log(`telegram: failed to start — ${err.message}`);
      telegram = null;
    });
  }

  const shownHost = host === "0.0.0.0" || host === "127.0.0.1" ? "localhost" : host;
  return {
    crew,
    server,
    url: `http://${shownHost}:${port}`,
    telegram,
    async close() {
      await telegram?.stop();
      await crew.stop();
      await new Promise((r) => server.close(r));
      crew.store.close();
    },
  };
}
