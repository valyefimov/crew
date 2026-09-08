import { randomUUID } from "node:crypto";
import { lines } from "./ndjson.ts";
import type { ChatMessage, ChatRequest, ChatResponse, ModelInfo, Provider, ToolCall } from "./types.ts";

function toOllama(m: ChatMessage) {
  switch (m.role) {
    case "assistant":
      return {
        role: "assistant",
        content: m.content,
        ...(m.toolCalls?.length
          ? { tool_calls: m.toolCalls.map((c) => ({ function: { name: c.name, arguments: c.arguments } })) }
          : {}),
      };
    case "tool":
      return { role: "tool", content: m.content, tool_name: m.name };
    default:
      return { role: m.role, content: m.content };
  }
}

export class OllamaProvider implements Provider {
  readonly name = "ollama";
  readonly host: string;
  constructor(host = "http://127.0.0.1:11434") {
    this.host = host.replace(/\/+$/, "");
  }

  async chat(req: ChatRequest): Promise<ChatResponse> {
    const res = await fetch(`${this.host}/api/chat`, {
      method: "POST",
      signal: req.signal,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model: req.model,
        messages: req.messages.map(toOllama),
        tools: req.tools?.length ? req.tools.map((t) => ({ type: "function", function: t })) : undefined,
        stream: true,
        format: req.json ? "json" : undefined,
        options: { temperature: req.temperature ?? 0.7 },
      }),
    });
    if (!res.ok || !res.body) {
      const text = await res.text().catch(() => "");
      throw new Error(`Ollama ${res.status}: ${text || res.statusText}`);
    }

    let content = "";
    const toolCalls: ToolCall[] = [];
    for await (const line of lines(res.body)) {
      const chunk = JSON.parse(line);
      if (chunk.error) throw new Error(`Ollama: ${chunk.error}`);
      const delta: string = chunk.message?.content ?? "";
      if (delta) {
        content += delta;
        req.onToken?.(delta);
      }
      for (const c of chunk.message?.tool_calls ?? []) {
        toolCalls.push({ id: randomUUID(), name: c.function.name, arguments: c.function.arguments ?? {} });
      }
    }
    return { content, toolCalls };
  }

  async embed(model: string, input: string[]): Promise<number[][]> {
    const res = await fetch(`${this.host}/api/embed`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ model, input }),
    });
    if (!res.ok) throw new Error(`Ollama embed ${res.status}: ${await res.text()}`);
    const data = (await res.json()) as { embeddings: number[][] };
    return data.embeddings;
  }

  async models(): Promise<ModelInfo[]> {
    const res = await fetch(`${this.host}/api/tags`);
    if (!res.ok) throw new Error(`Ollama ${res.status}`);
    const data = (await res.json()) as { models: { name: string; size: number; details?: { family?: string } }[] };
    return data.models.map((m) => ({ name: m.name, size: m.size, family: m.details?.family }));
  }

  async ping(): Promise<boolean> {
    try {
      const res = await fetch(`${this.host}/api/version`, { signal: AbortSignal.timeout(1500) });
      return res.ok;
    } catch {
      return false;
    }
  }
}
