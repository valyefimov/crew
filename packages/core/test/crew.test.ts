import { describe, expect, it } from "vitest";
import { Crew, Store, type ChatRequest, type ChatResponse, type Provider } from "../src/index.ts";

/** A scripted provider: first asks to `remember`, then answers. */
class FakeProvider implements Provider {
  readonly name = "fake";
  calls: ChatRequest[] = [];
  constructor(private script: ChatResponse[]) {}
  async chat(req: ChatRequest) {
    this.calls.push(req);
    const next = this.script.shift() ?? { content: "{}", toolCalls: [] };
    req.onToken?.(next.content);
    return next;
  }
  async embed(): Promise<number[][]> {
    throw new Error("no embeddings");
  }
  async models() {
    return [];
  }
  async ping() {
    return true;
  }
}

describe("Crew", () => {
  it("runs a tool loop, stores messages and memories", async () => {
    const crew = new Crew(new Store(":memory:"));
    crew.provider = new FakeProvider([
      { content: "", toolCalls: [{ id: "1", name: "remember", arguments: { content: "User's cat is called Bublik" } }] },
      { content: "Got it — Bublik!", toolCalls: [] },
    ]);
    const agent = crew.store.createAgent({ name: "Lena" });

    const tokens: string[] = [];
    crew.on("event", (e) => e.type === "token" && tokens.push(e.delta));
    const reply = await crew.chat({ agent: "lena", text: "my cat is called Bublik" });

    expect(reply.content).toBe("Got it — Bublik!");
    expect(tokens.join("")).toContain("Bublik");
    expect(crew.store.listMemories(agent.id)[0].content).toMatch(/Bublik/);

    const conv = crew.store.conversation(agent.id);
    expect(crew.store.messages(conv.id).map((m) => m.role)).toEqual(["user", "assistant"]);
  });

  it("injects relevant memories into the system prompt", async () => {
    const crew = new Crew(new Store(":memory:"));
    const fake = new FakeProvider([{ content: "Postgres.", toolCalls: [] }]);
    crew.provider = fake;
    const agent = crew.store.createAgent({ name: "Artem", role: "backend" });
    crew.store.addMemory({ agentId: agent.id, content: "The project database is Postgres 16" });

    await crew.chat({ agent: agent.id, text: "what database do we use?" });
    const system = fake.calls[0].messages[0].content;
    expect(system).toContain("Postgres 16");
    expect(system).toContain("You are Artem, backend");
  });

  it("extracts memories in the background", async () => {
    const crew = new Crew(new Store(":memory:"));
    crew.provider = new FakeProvider([
      { content: "Nice to meet you, Val!", toolCalls: [] },
      { content: '{"memories":[{"content":"User\'s name is Val","type":"fact","importance":0.9}]}', toolCalls: [] },
    ]);
    const agent = crew.store.createAgent({ name: "Max" });
    await crew.chat({ agent: "Max", text: "Hi! My name is Val, I build Crew." });
    await crew.worker.drain();
    expect(crew.store.listMemories(agent.id).map((m) => m.content)).toContain("User's name is Val");
  });
});
