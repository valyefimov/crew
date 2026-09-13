import { EventEmitter } from "node:events";
import { Store, type Agent, type Memory, type MemoryType, type Message } from "@crew/memory";
import { envConfig, resolveConfig, type CrewConfig } from "./config.ts";
import { OllamaProvider } from "./llm/ollama.ts";
import { OpenAIProvider } from "./llm/openai.ts";
import type { ChatMessage, Provider } from "./llm/types.ts";
import { buildSystemPrompt, EXTRACT_PROMPT } from "./prompt.ts";
import { fileTools, memoryTools, type Tool, type ToolContext } from "./tools/index.ts";
import { Worker } from "./worker.ts";

export type AgentStatus = "idle" | "thinking" | "working" | "remembering";

export type CrewEvent =
  | { type: "status"; agentId: string; status: AgentStatus; detail?: string }
  | { type: "message"; agentId: string; conversationId: string; message: Message }
  | { type: "token"; agentId: string; conversationId: string; replyId: string; delta: string }
  | { type: "tool"; agentId: string; conversationId: string; replyId: string; name: string; args: unknown; result?: string }
  | { type: "memory"; agentId: string; memory: Memory }
  | { type: "agents" };

export interface ChatInput {
  agent: string;
  text: string;
  channel?: string;
  channelRef?: string;
  signal?: AbortSignal;
}

const MAX_TOOL_ROUNDS = 6;
const HISTORY = 20;
/** Memories this close (cosine) to an existing one are treated as duplicates. */
const DUPLICATE_SIMILARITY = 0.9;

export class Crew extends EventEmitter<{ event: [CrewEvent] }> {
  config: CrewConfig;
  provider: Provider;
  readonly worker: Worker;
  private locks = new Map<string, Promise<unknown>>();
  private statuses = new Map<string, AgentStatus>();
  private embedOk: boolean | null = null;

  constructor(readonly store: Store) {
    super();
    this.config = resolveConfig(store);
    this.provider = makeProvider(this.config);
    this.worker = new Worker(store);
    this.worker.handle("memory.extract", (p) => this.extractMemories(p as unknown as ExtractPayload));
    this.worker.handle("memory.embed", () => this.backfillEmbeddings());
  }

  static open(file?: string) {
    return new Crew(new Store(file ?? envConfig().dbFile));
  }

  /** Re-read settings (after they were changed from the UI or CLI). */
  reload() {
    this.config = resolveConfig(this.store);
    this.provider = makeProvider(this.config);
    this.embedOk = null;
  }

  emitEvent(e: CrewEvent) {
    this.emit("event", e);
  }

  status(agentId: string): AgentStatus {
    return this.statuses.get(agentId) ?? "idle";
  }

  private setStatus(agentId: string, status: AgentStatus, detail?: string) {
    this.statuses.set(agentId, status);
    this.emitEvent({ type: "status", agentId, status, detail });
  }

  modelFor(agent: Agent) {
    return agent.model || this.config.model;
  }

  requireAgent(idOrName: string): Agent {
    const agent = this.store.getAgent(idOrName);
    if (!agent) throw new Error(`No agent named "${idOrName}"`);
    return agent;
  }

  // ── memory ───────────────────────────────────────────────────────────

  async embed(text: string): Promise<number[] | null> {
    if (this.embedOk === false) return null;
    try {
      const [vec] = await this.provider.embed(this.config.embedModel, [text]);
      this.embedOk = true;
      return vec ?? null;
    } catch {
      // No embedding model available — full-text search still works.
      this.embedOk = false;
      return null;
    }
  }

  async remember(agentId: string, content: string, type: MemoryType = "fact", importance = 0.6, source = "manual") {
    const text = content.trim();
    if (!text) throw new Error("Memory is empty");
    const embedding = await this.embed(text);
    const near = embedding ? this.store.nearest(agentId, embedding) : null;
    if (near && near.similarity >= DUPLICATE_SIMILARITY) return near.memory;
    const [same] = this.store.searchMemories(agentId, text, { limit: 1 });
    if (same && normalize(same.content) === normalize(text)) return same;
    const memory = this.store.addMemory({ agentId, content: text, type, importance, source, embedding });
    this.emitEvent({ type: "memory", agentId, memory });
    return memory;
  }

  async recall(agentId: string, query: string, limit = 6) {
    const embedding = await this.embed(query);
    return this.store.searchMemories(agentId, query, { limit, embedding });
  }

  // ── chat ─────────────────────────────────────────────────────────────

  /** Run one turn: user message → (tools)* → assistant reply. Turns of one agent are serialized. */
  async chat(input: ChatInput): Promise<Message> {
    const agent = this.requireAgent(input.agent);
    const prev = this.locks.get(agent.id) ?? Promise.resolve();
    const run = prev.catch(() => {}).then(() => this.turn(agent, input));
    this.locks.set(agent.id, run);
    try {
      return await run;
    } finally {
      if (this.locks.get(agent.id) === run) this.locks.delete(agent.id);
    }
  }

  private async turn(agent: Agent, input: ChatInput): Promise<Message> {
    const channel = input.channel ?? "web";
    const conv = this.store.conversation(agent.id, channel, input.channelRef ?? "default");
    const history = this.store.messages(conv.id, HISTORY);
    const userMsg = this.store.addMessage(conv.id, "user", input.text);
    this.emitEvent({ type: "message", agentId: agent.id, conversationId: conv.id, message: userMsg });
    this.setStatus(agent.id, "thinking");

    const replyId = crypto.randomUUID();
    const toolLog: { name: string; args: unknown; result: string }[] = [];
    let answer = "";

    try {
      const relevant = await this.recall(agent.id, input.text, 6);
      const core = this.store.coreMemories(agent.id, 4).filter((m) => !relevant.some((r) => r.id === m.id));
      const folders = this.store.listFolders(agent.id);
      const tools: Tool[] = [...memoryTools, ...(folders.length ? fileTools : [])];

      const messages: ChatMessage[] = [
        { role: "system", content: buildSystemPrompt({ agent, memories: [...core, ...relevant], folders, channel }) },
        ...history
          .filter((m) => m.role === "user" || m.role === "assistant")
          .map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
        { role: "user", content: input.text },
      ];

      const ctx: ToolContext = {
        agent,
        store: this.store,
        remember: async (content, type, importance) => {
          const m = await this.remember(agent.id, content, asType(type), importance ?? 0.7, "agent");
          return `Saved to memory: ${m.content}`;
        },
        recall: async (query) => {
          const hits = await this.recall(agent.id, query, 8);
          return hits.length ? hits.map((h) => `- ${h.content}`).join("\n") : "Nothing found in memory.";
        },
      };

      for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
        const request = {
          model: this.modelFor(agent),
          messages,
          signal: input.signal,
          onToken: (delta: string) => this.emitEvent({ type: "token", agentId: agent.id, conversationId: conv.id, replyId, delta }),
        };
        let res = await this.provider.chat({ ...request, tools: round < MAX_TOOL_ROUNDS ? tools : undefined });
        // Small local models sometimes emit a malformed tool call that the server drops,
        // leaving an empty reply. Ask again without tools — the background extractor still saves memories.
        if (!res.content.trim() && !res.toolCalls.length) res = await this.provider.chat(request);
        answer += res.content;
        if (!res.toolCalls.length) break;

        messages.push({ role: "assistant", content: res.content, toolCalls: res.toolCalls });
        this.setStatus(agent.id, "working", res.toolCalls.map((c) => c.name).join(", "));
        for (const call of res.toolCalls) {
          const tool = tools.find((t) => t.name === call.name);
          this.emitEvent({ type: "tool", agentId: agent.id, conversationId: conv.id, replyId, name: call.name, args: call.arguments });
          let result: string;
          try {
            result = tool ? await tool.run(call.arguments, ctx) : `Unknown tool: ${call.name}`;
          } catch (err) {
            result = `Error: ${(err as Error).message}`;
          }
          toolLog.push({ name: call.name, args: call.arguments, result: result.slice(0, 2000) });
          this.emitEvent({
            type: "tool",
            agentId: agent.id,
            conversationId: conv.id,
            replyId,
            name: call.name,
            args: call.arguments,
            result: result.slice(0, 2000),
          });
          messages.push({ role: "tool", content: result, toolCallId: call.id, name: call.name });
        }
        this.setStatus(agent.id, "thinking");
      }
    } catch (err) {
      this.setStatus(agent.id, "idle");
      throw err;
    }

    const reply = this.store.addMessage(conv.id, "assistant", answer.trim() || "…", {
      replyId,
      model: this.modelFor(agent),
      ...(toolLog.length ? { tools: toolLog } : {}),
    });
    this.emitEvent({ type: "message", agentId: agent.id, conversationId: conv.id, message: reply });
    this.setStatus(agent.id, "idle");

    this.store.enqueue("memory.extract", {
      agentId: agent.id,
      user: input.text,
      assistant: reply.content,
    } satisfies ExtractPayload);
    return reply;
  }

  // ── background jobs ──────────────────────────────────────────────────

  private async extractMemories(p: ExtractPayload) {
    const agent = this.store.getAgent(p.agentId);
    if (!agent || p.user.trim().length < 12) return;
    this.setStatus(agent.id, "remembering");
    try {
      const known = await this.recall(agent.id, p.user, 8);
      const res = await this.provider.chat({
        model: this.modelFor(agent),
        json: true,
        temperature: 0,
        messages: [
          { role: "system", content: EXTRACT_PROMPT },
          {
            role: "user",
            content:
              (known.length ? `Already known:\n${known.map((k) => `- ${k.content}`).join("\n")}\n\n` : "") +
              `User: ${p.user}\n\nAssistant: ${p.assistant}`,
          },
        ],
      });
      const parsed = safeParse(res.content);
      for (const m of parsed.slice(0, 5)) {
        if (typeof m.content !== "string" || m.content.length < 6) continue;
        await this.remember(agent.id, m.content, asType(m.type), clamp(Number(m.importance) || 0.5), "auto");
      }
    } finally {
      if (this.status(agent.id) === "remembering") this.setStatus(agent.id, "idle");
    }
  }

  private async backfillEmbeddings() {
    for (const m of this.store.memoriesWithoutEmbedding(100)) {
      const vec = await this.embed(m.content);
      if (!vec) return;
      this.store.setMemoryEmbedding(m.id, vec);
    }
  }

  start() {
    this.worker.start();
    this.store.enqueue("memory.embed", {});
  }

  async stop() {
    await this.worker.stop();
  }
}

type ExtractPayload = {
  agentId: string;
  user: string;
  assistant: string;
};

export function makeProvider(config: CrewConfig): Provider {
  return config.provider === "openai"
    ? new OpenAIProvider(config.openaiBaseUrl, config.openaiApiKey)
    : new OllamaProvider(config.ollamaHost);
}

function asType(t: unknown): MemoryType {
  return t === "decision" || t === "preference" || t === "conversation" ? t : "fact";
}

function clamp(n: number) {
  return Math.min(1, Math.max(0, n));
}

function normalize(s: string) {
  return s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

function safeParse(s: string): { content?: unknown; type?: unknown; importance?: unknown }[] {
  try {
    const data = JSON.parse(s);
    const list = Array.isArray(data) ? data : data?.memories;
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}
