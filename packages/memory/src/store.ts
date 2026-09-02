import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";
import { migrations } from "./migrations.ts";
import { cosine, fromBlob, ftsQuery, toBlob } from "./vector.ts";
import type {
  Agent,
  Conversation,
  FolderAccess,
  Memory,
  MemoryType,
  Message,
  Role,
  ScoredMemory,
  Task,
  TaskStatus,
} from "./types.ts";

type Row = Record<string, SQLInputValue>;

const now = () => Date.now();
const id = () => randomUUID();

const AGENT_COLORS = ["#7c5cff", "#ff6b6b", "#20c997", "#fab005", "#4dabf7", "#e64980", "#82c91e", "#fd7e14"];

function toAgent(r: Row): Agent {
  return {
    id: r.id as string,
    name: r.name as string,
    role: r.role as string,
    personality: r.personality as string,
    systemPrompt: r.system_prompt as string,
    model: (r.model as string | null) ?? null,
    avatar: r.avatar as string,
    color: r.color as string,
    createdAt: Number(r.created_at),
    updatedAt: Number(r.updated_at),
  };
}

function toMemory(r: Row): Memory {
  return {
    id: r.id as string,
    agentId: r.agent_id as string,
    content: r.content as string,
    type: r.type as MemoryType,
    importance: Number(r.importance),
    source: r.source as string,
    createdAt: Number(r.created_at),
    lastUsedAt: r.last_used_at == null ? null : Number(r.last_used_at),
  };
}

function toMessage(r: Row): Message {
  return {
    id: r.id as string,
    conversationId: r.conversation_id as string,
    role: r.role as Role,
    content: r.content as string,
    meta: r.meta ? JSON.parse(r.meta as string) : null,
    createdAt: Number(r.created_at),
  };
}

function toTask(r: Row): Task {
  return {
    id: r.id as string,
    kind: r.kind as string,
    payload: JSON.parse(r.payload as string),
    status: r.status as TaskStatus,
    attempts: Number(r.attempts),
    error: (r.error as string | null) ?? null,
    runAt: Number(r.run_at),
    createdAt: Number(r.created_at),
    updatedAt: Number(r.updated_at),
  };
}

export interface NewAgent {
  name: string;
  role?: string;
  personality?: string;
  systemPrompt?: string;
  model?: string | null;
  avatar?: string;
  color?: string;
}

export interface NewMemory {
  agentId: string;
  content: string;
  type?: MemoryType;
  importance?: number;
  source?: string;
  embedding?: number[] | null;
}

export interface SearchOptions {
  limit?: number;
  embedding?: number[] | null;
}

export class Store {
  readonly db: DatabaseSync;

  constructor(readonly file: string) {
    if (file !== ":memory:") mkdirSync(dirname(file), { recursive: true });
    this.db = new DatabaseSync(file);
    this.db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;");
    this.migrate();
  }

  private migrate() {
    const { user_version } = this.db.prepare("PRAGMA user_version").get() as { user_version: number };
    for (let v = user_version; v < migrations.length; v++) {
      this.db.exec("BEGIN");
      try {
        this.db.exec(migrations[v]);
        this.db.exec(`PRAGMA user_version = ${v + 1}`);
        this.db.exec("COMMIT");
      } catch (err) {
        this.db.exec("ROLLBACK");
        throw err;
      }
    }
  }

  close() {
    this.db.close();
  }

  // ── agents ────────────────────────────────────────────────────────────

  listAgents(): Agent[] {
    return (this.db.prepare("SELECT * FROM agents ORDER BY created_at").all() as Row[]).map(toAgent);
  }

  getAgent(idOrName: string): Agent | null {
    const r = this.db
      .prepare("SELECT * FROM agents WHERE id = ? OR name = ? COLLATE NOCASE")
      .get(idOrName, idOrName) as Row | undefined;
    return r ? toAgent(r) : null;
  }

  createAgent(input: NewAgent): Agent {
    const count = (this.db.prepare("SELECT COUNT(*) AS n FROM agents").get() as { n: number }).n;
    const t = now();
    const agentId = id();
    this.db
      .prepare(
        `INSERT INTO agents (id, name, role, personality, system_prompt, model, avatar, color, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        agentId,
        input.name.trim(),
        input.role ?? "",
        input.personality ?? "",
        input.systemPrompt ?? "",
        input.model ?? null,
        input.avatar ?? "🤖",
        input.color ?? AGENT_COLORS[count % AGENT_COLORS.length],
        t,
        t,
      );
    return this.getAgent(agentId)!;
  }

  updateAgent(agentId: string, patch: Partial<NewAgent>): Agent {
    const cur = this.getAgent(agentId);
    if (!cur) throw new Error(`Agent not found: ${agentId}`);
    const next = { ...cur, ...patch };
    this.db
      .prepare(
        `UPDATE agents SET name = ?, role = ?, personality = ?, system_prompt = ?, model = ?, avatar = ?, color = ?, updated_at = ?
         WHERE id = ?`,
      )
      .run(next.name, next.role, next.personality, next.systemPrompt, next.model ?? null, next.avatar, next.color, now(), cur.id);
    return this.getAgent(cur.id)!;
  }

  deleteAgent(agentId: string) {
    this.db.prepare("DELETE FROM agents WHERE id = ?").run(agentId);
  }

  // ── conversations & messages ─────────────────────────────────────────

  conversation(agentId: string, channel = "web", channelRef = "default"): Conversation {
    const found = this.db
      .prepare("SELECT * FROM conversations WHERE agent_id = ? AND channel = ? AND channel_ref = ?")
      .get(agentId, channel, channelRef) as Row | undefined;
    if (found) {
      return {
        id: found.id as string,
        agentId,
        channel,
        channelRef,
        createdAt: Number(found.created_at),
      };
    }
    const conv: Conversation = { id: id(), agentId, channel, channelRef, createdAt: now() };
    this.db
      .prepare("INSERT INTO conversations (id, agent_id, channel, channel_ref, created_at) VALUES (?, ?, ?, ?, ?)")
      .run(conv.id, agentId, channel, channelRef, conv.createdAt);
    return conv;
  }

  listConversations(agentId: string): Conversation[] {
    return (this.db.prepare("SELECT * FROM conversations WHERE agent_id = ? ORDER BY created_at").all(agentId) as Row[]).map(
      (r) => ({
        id: r.id as string,
        agentId,
        channel: r.channel as string,
        channelRef: r.channel_ref as string,
        createdAt: Number(r.created_at),
      }),
    );
  }

  addMessage(conversationId: string, role: Role, content: string, meta?: Record<string, unknown> | null): Message {
    const msg: Message = { id: id(), conversationId, role, content, meta: meta ?? null, createdAt: now() };
    this.db
      .prepare("INSERT INTO messages (id, conversation_id, role, content, meta, created_at) VALUES (?, ?, ?, ?, ?, ?)")
      .run(msg.id, conversationId, role, content, meta ? JSON.stringify(meta) : null, msg.createdAt);
    return msg;
  }

  /** Last `limit` messages of a conversation, oldest first. */
  messages(conversationId: string, limit = 50): Message[] {
    const rows = this.db
      .prepare("SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at DESC, rowid DESC LIMIT ?")
      .all(conversationId, limit) as Row[];
    return rows.reverse().map(toMessage);
  }

  clearConversation(conversationId: string) {
    this.db.prepare("DELETE FROM messages WHERE conversation_id = ?").run(conversationId);
  }

  // ── memories ─────────────────────────────────────────────────────────

  addMemory(input: NewMemory): Memory {
    const memId = id();
    this.db
      .prepare(
        `INSERT INTO memories (id, agent_id, content, type, importance, source, embedding, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        memId,
        input.agentId,
        input.content.trim(),
        input.type ?? "fact",
        Math.min(1, Math.max(0, input.importance ?? 0.5)),
        input.source ?? "manual",
        input.embedding?.length ? toBlob(input.embedding) : null,
        now(),
      );
    return this.getMemory(memId)!;
  }

  getMemory(memId: string): Memory | null {
    const r = this.db.prepare("SELECT * FROM memories WHERE id = ?").get(memId) as Row | undefined;
    return r ? toMemory(r) : null;
  }

  listMemories(agentId: string, limit = 200): Memory[] {
    return (
      this.db
        .prepare("SELECT * FROM memories WHERE agent_id = ? ORDER BY created_at DESC LIMIT ?")
        .all(agentId, limit) as Row[]
    ).map(toMemory);
  }

  countMemories(agentId: string): number {
    return (this.db.prepare("SELECT COUNT(*) AS n FROM memories WHERE agent_id = ?").get(agentId) as { n: number }).n;
  }

  deleteMemory(memId: string) {
    this.db.prepare("DELETE FROM memories WHERE id = ?").run(memId);
  }

  setMemoryEmbedding(memId: string, embedding: number[]) {
    this.db.prepare("UPDATE memories SET embedding = ? WHERE id = ?").run(toBlob(embedding), memId);
  }

  /** Memories that still lack an embedding (e.g. created while the embed model was offline). */
  memoriesWithoutEmbedding(limit = 50): Memory[] {
    return (this.db.prepare("SELECT * FROM memories WHERE embedding IS NULL LIMIT ?").all(limit) as Row[]).map(toMemory);
  }

  /**
   * Hybrid recall: full-text (BM25) and vector similarity are merged with
   * reciprocal-rank fusion, then nudged by importance and recency.
   */
  searchMemories(agentId: string, query: string, opts: SearchOptions = {}): ScoredMemory[] {
    const limit = opts.limit ?? 6;
    const ranks = new Map<string, number>();
    const rows = new Map<string, Row>();
    const K = 60;

    const fts = ftsQuery(query);
    if (fts) {
      const hits = this.db
        .prepare(
          `SELECT m.* FROM memories_fts f JOIN memories m ON m.rowid = f.rowid
           WHERE memories_fts MATCH ? AND m.agent_id = ? ORDER BY bm25(memories_fts) LIMIT 30`,
        )
        .all(fts, agentId) as Row[];
      hits.forEach((r, i) => {
        rows.set(r.id as string, r);
        ranks.set(r.id as string, (ranks.get(r.id as string) ?? 0) + 1 / (K + i));
      });
    }

    if (opts.embedding?.length) {
      const all = this.db
        .prepare("SELECT * FROM memories WHERE agent_id = ? AND embedding IS NOT NULL")
        .all(agentId) as Row[];
      all
        .map((r) => ({ r, s: cosine(opts.embedding!, fromBlob(r.embedding as Uint8Array)) }))
        .filter((x) => x.s > 0.35)
        .sort((a, b) => b.s - a.s)
        .slice(0, 30)
        .forEach(({ r }, i) => {
          rows.set(r.id as string, r);
          ranks.set(r.id as string, (ranks.get(r.id as string) ?? 0) + 1 / (K + i));
        });
    }

    const t = now();
    const scored = [...ranks.entries()].map(([memId, rrf]) => {
      const m = toMemory(rows.get(memId)!);
      const ageDays = (t - m.createdAt) / 86_400_000;
      const score = rrf * (1 + m.importance) * (1 + 0.25 * Math.exp(-ageDays / 30));
      return { ...m, score };
    });
    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, limit);

    if (top.length) {
      const touch = this.db.prepare("UPDATE memories SET last_used_at = ? WHERE id = ?");
      for (const m of top) touch.run(t, m.id);
    }
    return top;
  }

  /** The single most similar memory by embedding, used to avoid storing near-duplicates. */
  nearest(agentId: string, embedding: number[]): { memory: Memory; similarity: number } | null {
    let best: { row: Row; similarity: number } | null = null;
    const rows = this.db.prepare("SELECT * FROM memories WHERE agent_id = ? AND embedding IS NOT NULL").all(agentId) as Row[];
    for (const row of rows) {
      const similarity = cosine(embedding, fromBlob(row.embedding as Uint8Array));
      if (!best || similarity > best.similarity) best = { row, similarity };
    }
    return best ? { memory: toMemory(best.row), similarity: best.similarity } : null;
  }

  /** The most important memories — always included in the agent's context. */
  coreMemories(agentId: string, limit = 5): Memory[] {
    return (
      this.db
        .prepare("SELECT * FROM memories WHERE agent_id = ? AND importance >= 0.8 ORDER BY importance DESC, created_at DESC LIMIT ?")
        .all(agentId, limit) as Row[]
    ).map(toMemory);
  }

  // ── folders ──────────────────────────────────────────────────────────

  listFolders(agentId: string): FolderAccess[] {
    return (this.db.prepare("SELECT * FROM files_access WHERE agent_id = ? ORDER BY path").all(agentId) as Row[]).map((r) => ({
      id: r.id as string,
      agentId,
      path: r.path as string,
      mode: r.mode as "ro" | "rw",
    }));
  }

  grantFolder(agentId: string, path: string, mode: "ro" | "rw" = "ro"): FolderAccess {
    this.db
      .prepare(
        `INSERT INTO files_access (id, agent_id, path, mode) VALUES (?, ?, ?, ?)
         ON CONFLICT (agent_id, path) DO UPDATE SET mode = excluded.mode`,
      )
      .run(id(), agentId, path, mode);
    return this.listFolders(agentId).find((f) => f.path === path)!;
  }

  revokeFolder(folderId: string) {
    this.db.prepare("DELETE FROM files_access WHERE id = ?").run(folderId);
  }

  // ── settings ─────────────────────────────────────────────────────────

  getSetting<T = string>(key: string): T | null {
    const r = this.db.prepare("SELECT value FROM settings WHERE key = ?").get(key) as { value: string } | undefined;
    return r ? (JSON.parse(r.value) as T) : null;
  }

  setSetting(key: string, value: unknown) {
    this.db
      .prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value")
      .run(key, JSON.stringify(value));
  }

  allSettings(): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const r of this.db.prepare("SELECT key, value FROM settings").all() as { key: string; value: string }[]) {
      out[r.key] = JSON.parse(r.value);
    }
    return out;
  }

  // ── tasks (a tiny SQLite-backed queue) ────────────────────────────────

  enqueue(kind: string, payload: Record<string, unknown>, delayMs = 0): Task {
    const t = now();
    const taskId = id();
    this.db
      .prepare(
        "INSERT INTO tasks (id, kind, payload, status, run_at, created_at, updated_at) VALUES (?, ?, ?, 'queued', ?, ?, ?)",
      )
      .run(taskId, kind, JSON.stringify(payload), t + delayMs, t, t);
    return this.getTask(taskId)!;
  }

  getTask(taskId: string): Task | null {
    const r = this.db.prepare("SELECT * FROM tasks WHERE id = ?").get(taskId) as Row | undefined;
    return r ? toTask(r) : null;
  }

  /** Atomically claim the next due task. */
  claimTask(): Task | null {
    const t = now();
    const r = this.db
      .prepare(
        `UPDATE tasks SET status = 'running', attempts = attempts + 1, updated_at = ?
         WHERE id = (SELECT id FROM tasks WHERE status = 'queued' AND run_at <= ? ORDER BY run_at LIMIT 1)
         RETURNING *`,
      )
      .get(t, t) as Row | undefined;
    return r ? toTask(r) : null;
  }

  finishTask(taskId: string, error?: string, retryInMs?: number) {
    const t = now();
    if (!error) {
      this.db.prepare("UPDATE tasks SET status = 'done', error = NULL, updated_at = ? WHERE id = ?").run(t, taskId);
    } else if (retryInMs != null) {
      this.db
        .prepare("UPDATE tasks SET status = 'queued', error = ?, run_at = ?, updated_at = ? WHERE id = ?")
        .run(error, t + retryInMs, t, taskId);
    } else {
      this.db.prepare("UPDATE tasks SET status = 'failed', error = ?, updated_at = ? WHERE id = ?").run(error, t, taskId);
    }
  }

  listTasks(limit = 50): Task[] {
    return (this.db.prepare("SELECT * FROM tasks ORDER BY created_at DESC LIMIT ?").all(limit) as Row[]).map(toTask);
  }

  /** Re-queue tasks left in `running` by a crashed process. */
  recoverTasks() {
    this.db.prepare("UPDATE tasks SET status = 'queued' WHERE status = 'running'").run();
  }

  pruneTasks(olderThanMs = 7 * 86_400_000) {
    this.db.prepare("DELETE FROM tasks WHERE status IN ('done', 'failed') AND updated_at < ?").run(now() - olderThanMs);
  }
}
