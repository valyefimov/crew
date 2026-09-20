export type AgentStatus = "idle" | "thinking" | "working" | "remembering";

export interface Agent {
  id: string;
  name: string;
  role: string;
  personality: string;
  systemPrompt: string;
  model: string | null;
  avatar: string;
  color: string;
  status: AgentStatus;
  memoryCount: number;
  effectiveModel: string;
}

export interface ToolRun {
  name: string;
  args: unknown;
  result?: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant" | "tool";
  content: string;
  meta: { tools?: ToolRun[]; model?: string } | null;
  createdAt: number;
}

export interface Memory {
  id: string;
  content: string;
  type: "fact" | "decision" | "preference" | "conversation";
  importance: number;
  source: string;
  createdAt: number;
}

export interface Folder {
  id: string;
  path: string;
  mode: "ro" | "rw";
}

export interface Status {
  version: string;
  provider: string;
  online: boolean;
  model: string;
  embedModel: string;
  modelInstalled: boolean;
  models: { name: string; size?: number }[];
  telegram: boolean;
}

export type NewAgent = Pick<Agent, "name" | "role" | "personality" | "systemPrompt" | "avatar"> & { model?: string | null };

async function req<T>(path: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: init?.json !== undefined ? { "content-type": "application/json" } : undefined,
    body: init?.json !== undefined ? JSON.stringify(init.json) : init?.body,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? res.statusText);
  return data as T;
}

export const api = {
  status: () => req<Status>("/status"),
  agents: () => req<Agent[]>("/agents"),
  createAgent: (a: NewAgent) => req<Agent>("/agents", { method: "POST", json: a }),
  updateAgent: (id: string, a: Partial<NewAgent>) => req<Agent>(`/agents/${id}`, { method: "PATCH", json: a }),
  deleteAgent: (id: string) => req(`/agents/${id}`, { method: "DELETE" }),
  importAgent: (dump: unknown) => req<Agent>("/agents/import", { method: "POST", json: dump }),
  exportUrl: (id: string) => `/api/agents/${id}/export`,
  templates: () => req<Record<string, NewAgent>>("/templates"),
  messages: (id: string) => req<{ messages: Message[] }>(`/agents/${id}/messages`),
  clearMessages: (id: string) => req(`/agents/${id}/messages`, { method: "DELETE" }),
  memories: (id: string, q?: string) => req<Memory[]>(`/agents/${id}/memories${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  addMemory: (id: string, content: string, type = "fact") =>
    req<Memory>(`/agents/${id}/memories`, { method: "POST", json: { content, type } }),
  deleteMemory: (id: string) => req(`/memories/${id}`, { method: "DELETE" }),
  folders: (id: string) => req<Folder[]>(`/agents/${id}/folders`),
  addFolder: (id: string, path: string, mode: "ro" | "rw") =>
    req<Folder>(`/agents/${id}/folders`, { method: "POST", json: { path, mode } }),
  removeFolder: (id: string) => req(`/folders/${id}`, { method: "DELETE" }),
  settings: () => req<Record<string, string>>("/settings"),
  saveSettings: (s: Record<string, string>) => req("/settings", { method: "PUT", json: s }),
};

export type ServerEvent =
  | { type: "status"; agentId: string; status: AgentStatus; detail?: string }
  | { type: "message"; agentId: string; conversationId: string; message: Message }
  | { type: "token"; agentId: string; replyId: string; delta: string }
  | { type: "tool"; agentId: string; replyId: string; name: string; args: unknown; result?: string }
  | { type: "memory"; agentId: string; memory: Memory }
  | { type: "agents" }
  | { type: "error"; agentId: string; message: string };

/** A self-reconnecting WebSocket to the Crew server. */
export function connect(onEvent: (e: ServerEvent) => void, onState: (open: boolean) => void) {
  let ws: WebSocket | null = null;
  let closed = false;
  let retry = 500;

  const open = () => {
    const url = `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws`;
    ws = new WebSocket(url);
    ws.onopen = () => {
      retry = 500;
      onState(true);
    };
    ws.onmessage = (m) => onEvent(JSON.parse(m.data));
    ws.onclose = () => {
      onState(false);
      if (!closed) setTimeout(open, (retry = Math.min(retry * 2, 8000)));
    };
  };
  open();

  return {
    send: (data: unknown) => ws?.readyState === WebSocket.OPEN && ws.send(JSON.stringify(data)),
    close: () => {
      closed = true;
      ws?.close();
    },
  };
}
