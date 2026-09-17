import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { stat } from "node:fs/promises";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { serveStatic } from "@hono/node-server/serve-static";
import { createNodeWebSocket } from "@hono/node-ws";
import type { WSContext } from "hono/ws";
import { SETTING_KEYS, templates, type Crew, type CrewEvent, type MemoryType } from "@crew/core";
import { VERSION } from "./version.ts";

export interface AppOptions {
  /** Directory with the built web UI. */
  webDir?: string;
}

const SECRET_KEYS = new Set(["openaiApiKey", "telegramToken"]);

export function createApp(crew: Crew, opts: AppOptions = {}) {
  const app = new Hono();
  const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });
  const sockets = new Set<WSContext>();

  const broadcast = (e: CrewEvent) => {
    const data = JSON.stringify(e);
    for (const ws of sockets) ws.send(data);
  };
  crew.on("event", broadcast);

  const agentOr404 = (id: string) => {
    const agent = crew.store.getAgent(id);
    if (!agent) throw new HTTPException(404, { message: "Agent not found" });
    return agent;
  };

  const withStats = (a: ReturnType<typeof agentOr404>) => ({
    ...a,
    status: crew.status(a.id),
    memoryCount: crew.store.countMemories(a.id),
    effectiveModel: crew.modelFor(a),
  });

  app.onError((err, c) => {
    if (err instanceof HTTPException) return c.json({ error: err.message }, err.status);
    console.error(err);
    return c.json({ error: err.message }, 500);
  });

  const api = new Hono();

  api.get("/health", (c) => c.json({ ok: true, version: VERSION }));

  api.get("/status", async (c) => {
    const online = await crew.provider.ping();
    const models = online ? await crew.provider.models().catch(() => []) : [];
    return c.json({
      version: VERSION,
      provider: crew.config.provider,
      online,
      model: crew.config.model,
      embedModel: crew.config.embedModel,
      modelInstalled: models.some((m) => m.name === crew.config.model || m.name === `${crew.config.model}:latest`),
      models,
      telegram: Boolean(crew.config.telegramToken),
    });
  });

  // ── settings ──
  api.get("/settings", (c) => {
    const cfg = crew.config;
    const out: Record<string, unknown> = {};
    for (const k of SETTING_KEYS) {
      const v = cfg[k];
      out[k] = SECRET_KEYS.has(k) ? (v ? "••••••" : "") : v;
    }
    return c.json(out);
  });

  api.put("/settings", async (c) => {
    const body = await c.req.json<Record<string, string>>();
    for (const k of SETTING_KEYS) {
      if (!(k in body)) continue;
      if (SECRET_KEYS.has(k) && body[k] === "••••••") continue;
      crew.store.setSetting(k, String(body[k] ?? ""));
    }
    crew.reload();
    return c.json({ ok: true });
  });

  api.get("/templates", (c) => c.json(templates));

  // ── agents ──
  api.get("/agents", (c) => c.json(crew.store.listAgents().map(withStats)));

  api.post("/agents", async (c) => {
    const body = await c.req.json();
    if (!body?.name?.trim()) throw new HTTPException(400, { message: "Name is required" });
    if (crew.store.getAgent(body.name)) throw new HTTPException(409, { message: "An agent with this name already exists" });
    const agent = crew.store.createAgent(body);
    crew.emitEvent({ type: "agents" });
    return c.json(withStats(agent), 201);
  });

  api.post("/agents/import", async (c) => {
    const body = await c.req.json();
    const name = crew.store.getAgent(body.agent?.name) ? `${body.agent.name} (2)` : body.agent?.name;
    if (!name) throw new HTTPException(400, { message: "Not a Crew export" });
    const agent = crew.store.createAgent({ ...body.agent, name });
    for (const m of body.memories ?? []) {
      await crew.remember(agent.id, m.content, m.type, m.importance, "import");
    }
    crew.emitEvent({ type: "agents" });
    return c.json(withStats(agent), 201);
  });

  api.get("/agents/:id", (c) => c.json(withStats(agentOr404(c.req.param("id")))));

  api.patch("/agents/:id", async (c) => {
    const agent = agentOr404(c.req.param("id"));
    const updated = crew.store.updateAgent(agent.id, await c.req.json());
    crew.emitEvent({ type: "agents" });
    return c.json(withStats(updated));
  });

  api.delete("/agents/:id", (c) => {
    const agent = agentOr404(c.req.param("id"));
    crew.store.deleteAgent(agent.id);
    crew.emitEvent({ type: "agents" });
    return c.json({ ok: true });
  });

  api.get("/agents/:id/export", (c) => {
    const agent = agentOr404(c.req.param("id"));
    const { name, role, personality, systemPrompt, model, avatar, color } = agent;
    return c.json({
      crew: 1,
      agent: { name, role, personality, systemPrompt, model, avatar, color },
      memories: crew.store.listMemories(agent.id, 10_000).map(({ content, type, importance }) => ({ content, type, importance })),
    });
  });

  // ── conversation ──
  api.get("/agents/:id/messages", (c) => {
    const agent = agentOr404(c.req.param("id"));
    const conv = crew.store.conversation(agent.id, c.req.query("channel") ?? "web", c.req.query("ref") ?? "default");
    return c.json({ conversationId: conv.id, messages: crew.store.messages(conv.id, Number(c.req.query("limit") ?? 100)) });
  });

  api.get("/agents/:id/conversations", (c) => c.json(crew.store.listConversations(agentOr404(c.req.param("id")).id)));

  api.delete("/agents/:id/messages", (c) => {
    const agent = agentOr404(c.req.param("id"));
    crew.store.clearConversation(crew.store.conversation(agent.id, "web").id);
    return c.json({ ok: true });
  });

  /** Non-streaming chat, handy for scripts: curl -d '{"text":"hi"}' /api/agents/Lena/chat */
  api.post("/agents/:id/chat", async (c) => {
    const agent = agentOr404(c.req.param("id"));
    const { text, channel, ref } = await c.req.json();
    if (!text?.trim()) throw new HTTPException(400, { message: "text is required" });
    const reply = await crew.chat({ agent: agent.id, text, channel: channel ?? "api", channelRef: ref ?? "default" });
    return c.json(reply);
  });

  // ── memory ──
  api.get("/agents/:id/memories", async (c) => {
    const agent = agentOr404(c.req.param("id"));
    const q = c.req.query("q");
    return c.json(q ? await crew.recall(agent.id, q, 20) : crew.store.listMemories(agent.id));
  });

  api.post("/agents/:id/memories", async (c) => {
    const agent = agentOr404(c.req.param("id"));
    const { content, type, importance } = await c.req.json();
    if (!content?.trim()) throw new HTTPException(400, { message: "content is required" });
    return c.json(await crew.remember(agent.id, content, (type as MemoryType) ?? "fact", importance ?? 0.7, "manual"), 201);
  });

  api.delete("/memories/:id", (c) => {
    crew.store.deleteMemory(c.req.param("id"));
    return c.json({ ok: true });
  });

  // ── folders ──
  api.get("/agents/:id/folders", (c) => c.json(crew.store.listFolders(agentOr404(c.req.param("id")).id)));

  api.post("/agents/:id/folders", async (c) => {
    const agent = agentOr404(c.req.param("id"));
    const { path, mode } = await c.req.json();
    const info = await stat(path).catch(() => null);
    if (!info?.isDirectory()) throw new HTTPException(400, { message: `Not a directory: ${path}` });
    return c.json(crew.store.grantFolder(agent.id, path, mode === "rw" ? "rw" : "ro"), 201);
  });

  api.delete("/folders/:id", (c) => {
    crew.store.revokeFolder(c.req.param("id"));
    return c.json({ ok: true });
  });

  api.get("/tasks", (c) => c.json(crew.store.listTasks()));

  app.route("/api", api);

  // ── realtime ──
  app.get(
    "/ws",
    upgradeWebSocket(() => ({
      onOpen(_e, ws) {
        sockets.add(ws);
      },
      onClose(_e, ws) {
        sockets.delete(ws);
      },
      async onMessage(e, ws) {
        let msg: { type: string; agentId?: string; text?: string };
        try {
          msg = JSON.parse(String(e.data));
        } catch {
          return;
        }
        if (msg.type === "chat" && msg.agentId && msg.text?.trim()) {
          crew.chat({ agent: msg.agentId, text: msg.text, channel: "web" }).catch((err: Error) =>
            ws.send(JSON.stringify({ type: "error", agentId: msg.agentId, message: err.message })),
          );
        }
      },
    })),
  );

  // ── web UI ──
  const webDir = opts.webDir;
  if (webDir && existsSync(join(webDir, "index.html"))) {
    const index = readFileSync(join(webDir, "index.html"), "utf8");
    app.use("/*", serveStatic({ root: webDir }));
    app.get("*", (c) => c.html(index));
  } else {
    app.get("/", (c) =>
      c.text("Crew API is running. Start the web UI with `pnpm dev` or build it with `pnpm build`."),
    );
  }

  return { app, injectWebSocket };
}
