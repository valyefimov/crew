import { describe, expect, it } from "vitest";
import { Crew, Store } from "@crew/core";
import { createApp } from "../src/app.ts";

const setup = () => {
  const crew = new Crew(new Store(":memory:"));
  const { app } = createApp(crew);
  const req = (path: string, init?: RequestInit & { json?: unknown }) =>
    app.request(`/api${path}`, {
      ...init,
      ...(init?.json ? { body: JSON.stringify(init.json), headers: { "content-type": "application/json" } } : {}),
    });
  return { crew, req };
};

describe("REST API", () => {
  it("creates, lists and deletes agents", async () => {
    const { req } = setup();
    const res = await req("/agents", { method: "POST", json: { name: "Lena", role: "frontend" } });
    expect(res.status).toBe(201);
    const agent = await res.json();
    expect(agent.status).toBe("idle");

    const dup = await req("/agents", { method: "POST", json: { name: "lena" } });
    expect(dup.status).toBe(409);

    expect(await (await req("/agents")).json()).toHaveLength(1);
    await req(`/agents/${agent.id}`, { method: "DELETE" });
    expect(await (await req("/agents")).json()).toHaveLength(0);
  });

  it("adds and searches memories", async () => {
    const { req } = setup();
    const agent = await (await req("/agents", { method: "POST", json: { name: "Artem" } })).json();
    await req(`/agents/${agent.id}/memories`, { method: "POST", json: { content: "Deploys happen on Thursdays" } });
    const hits = await (await req(`/agents/Artem/memories?q=${encodeURIComponent("when do deploys happen")}`)).json();
    expect(hits[0].content).toMatch(/Thursdays/);
  });

  it("exports and imports an agent with memories", async () => {
    const { req } = setup();
    await req("/agents", { method: "POST", json: { name: "Max", role: "PM" } });
    await req(`/agents/Max/memories`, { method: "POST", json: { content: "Q4 goal is v1.0" } });
    const dump = await (await req("/agents/Max/export")).json();
    const imported = await (await req("/agents/import", { method: "POST", json: dump })).json();
    expect(imported.name).toBe("Max (2)");
    expect(imported.memoryCount).toBe(1);
  });

  it("masks secrets in settings", async () => {
    const { req } = setup();
    await req("/settings", { method: "PUT", json: { telegramToken: "123:abc", model: "llama3.2" } });
    const s = await (await req("/settings")).json();
    expect(s.telegramToken).toBe("••••••");
  });
});
