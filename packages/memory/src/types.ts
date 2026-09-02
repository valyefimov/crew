export type MemoryType = "fact" | "decision" | "preference" | "conversation";

export interface Agent {
  id: string;
  name: string;
  role: string;
  personality: string;
  systemPrompt: string;
  model: string | null;
  avatar: string;
  color: string;
  createdAt: number;
  updatedAt: number;
}

export interface Memory {
  id: string;
  agentId: string;
  content: string;
  type: MemoryType;
  importance: number;
  source: string;
  createdAt: number;
  lastUsedAt: number | null;
}

export interface ScoredMemory extends Memory {
  score: number;
}

export interface Conversation {
  id: string;
  agentId: string;
  channel: string;
  channelRef: string;
  createdAt: number;
}

export type Role = "user" | "assistant" | "tool";

export interface Message {
  id: string;
  conversationId: string;
  role: Role;
  content: string;
  meta: Record<string, unknown> | null;
  createdAt: number;
}

export interface FolderAccess {
  id: string;
  agentId: string;
  path: string;
  mode: "ro" | "rw";
}

export type TaskStatus = "queued" | "running" | "done" | "failed";

export interface Task {
  id: string;
  kind: string;
  payload: Record<string, unknown>;
  status: TaskStatus;
  attempts: number;
  error: string | null;
  runAt: number;
  createdAt: number;
  updatedAt: number;
}
