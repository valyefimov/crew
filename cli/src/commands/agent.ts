import { resolve } from "node:path";
import { readFileSync, writeFileSync } from "node:fs";
import { Crew, templates } from "@crew/core";
import { bold, dim, fail, ok } from "../ui.ts";

export function withCrew<T>(fn: (crew: Crew) => T | Promise<T>) {
  return async () => {
    const crew = Crew.open();
    try {
      return await fn(crew);
    } finally {
      await crew.stop();
      crew.store.close();
    }
  };
}

export interface CreateFlags {
  role?: string;
  persona?: string;
  prompt?: string;
  model?: string;
  avatar?: string;
  template?: string;
  folder?: string[];
  rw?: boolean;
}

export const agentCreate = (name: string, f: CreateFlags) =>
  withCrew((crew) => {
    const base = f.template ? templates[f.template] : undefined;
    if (f.template && !base) {
      fail(`Unknown template "${f.template}". Available: ${Object.keys(templates).join(", ")}`);
      process.exitCode = 1;
      return;
    }
    if (crew.store.getAgent(name)) {
      fail(`Agent "${name}" already exists`);
      process.exitCode = 1;
      return;
    }
    const agent = crew.store.createAgent({
      ...base,
      name,
      role: f.role ?? base?.role,
      personality: f.persona ?? base?.personality,
      systemPrompt: f.prompt ?? base?.systemPrompt,
      model: f.model ?? null,
      avatar: f.avatar ?? base?.avatar,
    });
    for (const folder of f.folder ?? []) crew.store.grantFolder(agent.id, resolve(folder), f.rw ? "rw" : "ro");
    ok(`${agent.avatar} ${bold(agent.name)} joined the crew${agent.role ? dim(` — ${agent.role}`) : ""}`);
  })();

export const agentList = () =>
  withCrew((crew) => {
    const agents = crew.store.listAgents();
    if (!agents.length) return console.log(dim("No agents yet. Try: crew agent create Artem --template backend"));
    for (const a of agents) {
      const mem = crew.store.countMemories(a.id);
      console.log(`${a.avatar}  ${bold(a.name.padEnd(14))} ${(a.role || "—").padEnd(32)} ${dim(`${mem} memories · ${crew.modelFor(a)}`)}`);
    }
  })();

export const agentRemove = (name: string) =>
  withCrew((crew) => {
    const a = crew.requireAgent(name);
    crew.store.deleteAgent(a.id);
    ok(`Removed ${a.name}`);
  })();

export const agentGrant = (name: string, folder: string, f: { rw?: boolean }) =>
  withCrew((crew) => {
    const a = crew.requireAgent(name);
    const g = crew.store.grantFolder(a.id, resolve(folder), f.rw ? "rw" : "ro");
    ok(`${a.name} can now ${g.mode === "rw" ? "read and write" : "read"} ${g.path}`);
  })();

export const agentExport = (name: string, f: { out?: string }) =>
  withCrew((crew) => {
    const a = crew.requireAgent(name);
    const dump = {
      crew: 1,
      agent: { name: a.name, role: a.role, personality: a.personality, systemPrompt: a.systemPrompt, model: a.model, avatar: a.avatar, color: a.color },
      memories: crew.store.listMemories(a.id, 10_000).map(({ content, type, importance }) => ({ content, type, importance })),
    };
    const out = f.out ?? `${a.name}.crew.json`;
    writeFileSync(out, JSON.stringify(dump, null, 2));
    ok(`Exported ${a.name} with ${dump.memories.length} memories → ${out}`);
  })();

export const agentImport = (file: string) =>
  withCrew(async (crew) => {
    const dump = JSON.parse(readFileSync(file, "utf8"));
    const name = crew.store.getAgent(dump.agent.name) ? `${dump.agent.name} (2)` : dump.agent.name;
    const a = crew.store.createAgent({ ...dump.agent, name });
    for (const m of dump.memories ?? []) await crew.remember(a.id, m.content, m.type, m.importance, "import");
    ok(`Imported ${a.avatar} ${bold(a.name)} with ${dump.memories?.length ?? 0} memories`);
  })();
