import { lines } from "./ndjson.ts";
import type { ChatMessage, ChatRequest, ChatResponse, ModelInfo, Provider, ToolCall } from "./types.ts";

function toOpenAI(m: ChatMessage) {
  switch (m.role) {
    case "assistant":
      return {
        role: "assistant",
        content: m.content || null,
        ...(m.toolCalls?.length
          ? {
              tool_calls: m.toolCalls.map((c) => ({
                id: c.id,
                type: "function",
                function: { name: c.name, arguments: JSON.stringify(c.arguments) },
              })),
            }
          : {}),
      };
    case "tool":
      return { role: "tool", content: m.content, tool_call_id: m.toolCallId };
    default:
      return { role: m.role, content: m.content };
  }
}

/** Works with any OpenAI-compatible server: LM Studio, vLLM, llama.cpp server, OpenRouter, OpenAI. */
export class OpenAIProvider implements Provider {
  readonly name = "openai";
  readonly baseUrl: string;
  constructor(
    baseUrl = "http://127.0.0.1:1234/v1",
    private readonly apiKey = "",
  ) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
  }

  private headers() {
    return {
      "content-type": "application/json",
      ...(this.apiKey ? { authorization: `Bearer ${this.apiKey}` } : {}),
    };
  }

  async chat(req: ChatRequest): Promise<ChatResponse> {
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      signal: req.signal,
      headers: this.headers(),
      body: JSON.stringify({
        model: req.model,
        messages: req.messages.map(toOpenAI),
        tools: req.tools?.length ? req.tools.map((t) => ({ type: "function", function: t })) : undefined,
        stream: true,
        temperature: req.temperature ?? 0.7,
        response_format: req.json ? { type: "json_object" } : undefined,
      }),
    });
    if (!res.ok || !res.body) throw new Error(`OpenAI-compatible ${res.status}: ${await res.text().catch(() => "")}`);

    let content = "";
    const partial = new Map<number, { id: string; name: string; args: string }>();
    for await (const line of lines(res.body)) {
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (data === "[DONE]") break;
      const delta = JSON.parse(data).choices?.[0]?.delta ?? {};
      if (delta.content) {
        content += delta.content;
        req.onToken?.(delta.content);
      }
      for (const tc of delta.tool_calls ?? []) {
        const cur = partial.get(tc.index) ?? { id: tc.id ?? `call_${tc.index}`, name: "", args: "" };
        if (tc.function?.name) cur.name += tc.function.name;
        if (tc.function?.arguments) cur.args += tc.function.arguments;
        partial.set(tc.index, cur);
      }
    }
    const toolCalls: ToolCall[] = [...partial.values()].map((p) => ({
      id: p.id,
      name: p.name,
      arguments: p.args ? safeJson(p.args) : {},
    }));
    return { content, toolCalls };
  }

  async embed(model: string, input: string[]): Promise<number[][]> {
    const res = await fetch(`${this.baseUrl}/embeddings`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ model, input }),
    });
    if (!res.ok) throw new Error(`Embeddings ${res.status}: ${await res.text()}`);
    const data = (await res.json()) as { data: { embedding: number[] }[] };
    return data.data.map((d) => d.embedding);
  }

  async models(): Promise<ModelInfo[]> {
    const res = await fetch(`${this.baseUrl}/models`, { headers: this.headers() });
    if (!res.ok) throw new Error(`Models ${res.status}`);
    const data = (await res.json()) as { data: { id: string }[] };
    return data.data.map((m) => ({ name: m.id }));
  }

  async ping(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/models`, { headers: this.headers(), signal: AbortSignal.timeout(1500) });
      return res.ok;
    } catch {
      return false;
    }
  }
}

function safeJson(s: string): Record<string, unknown> {
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}
