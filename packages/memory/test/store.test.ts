import { describe, expect, it } from "vitest";
import { Store } from "../src/index.ts";

const store = () => new Store(":memory:");

describe("Store", () => {
  it("creates and finds agents by name, case-insensitively", () => {
    const s = store();
    const a = s.createAgent({ name: "Artem", role: "backend" });
    expect(s.getAgent("artem")?.id).toBe(a.id);
    expect(s.listAgents()).toHaveLength(1);
  });

  it("keeps one conversation per agent + channel + ref", () => {
    const s = store();
    const a = s.createAgent({ name: "Lena" });
    const c1 = s.conversation(a.id, "web");
    const c2 = s.conversation(a.id, "web");
    const c3 = s.conversation(a.id, "telegram", "42");
    expect(c1.id).toBe(c2.id);
    expect(c3.id).not.toBe(c1.id);
    s.addMessage(c1.id, "user", "hi");
    s.addMessage(c1.id, "assistant", "hello!");
    expect(s.messages(c1.id).map((m) => m.role)).toEqual(["user", "assistant"]);
  });

  it("recalls memories with full-text search", () => {
    const s = store();
    const a = s.createAgent({ name: "Max" });
    s.addMemory({ agentId: a.id, content: "The project database is Postgres 16", type: "fact" });
    s.addMemory({ agentId: a.id, content: "User prefers tabs over spaces", type: "preference" });
    const hits = s.searchMemories(a.id, "which database do we use?");
    expect(hits[0].content).toMatch(/Postgres/);
  });

  it("ranks by vector similarity when embeddings exist", () => {
    const s = store();
    const a = s.createAgent({ name: "Vec" });
    s.addMemory({ agentId: a.id, content: "alpha", embedding: [1, 0, 0] });
    s.addMemory({ agentId: a.id, content: "beta", embedding: [0, 1, 0] });
    const hits = s.searchMemories(a.id, "zzz", { embedding: [0.1, 0.9, 0] });
    expect(hits[0].content).toBe("beta");
  });

  it("isolates memories between agents", () => {
    const s = store();
    const a = s.createAgent({ name: "A" });
    const b = s.createAgent({ name: "B" });
    s.addMemory({ agentId: a.id, content: "secret launch date is friday" });
    expect(s.searchMemories(b.id, "launch date")).toHaveLength(0);
  });

  it("runs a simple task queue", () => {
    const s = store();
    s.enqueue("ping", { n: 1 });
    const t = s.claimTask();
    expect(t?.kind).toBe("ping");
    expect(s.claimTask()).toBeNull();
    s.finishTask(t!.id, "boom", 0);
    expect(s.claimTask()?.attempts).toBe(2);
  });
});
