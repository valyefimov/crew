import { Crew } from "@crew/core";
import { bold, dim, ok } from "../ui.ts";
import { withCrew } from "./agent.ts";

export const memoryList = (name: string, f: { search?: string; limit?: string }) =>
  withCrew(async (crew: Crew) => {
    const a = crew.requireAgent(name);
    const list = f.search ? await crew.recall(a.id, f.search, Number(f.limit ?? 20)) : crew.store.listMemories(a.id, Number(f.limit ?? 50));
    if (!list.length) return console.log(dim(`${a.name} doesn't remember anything yet.`));
    console.log(bold(`${a.avatar} ${a.name} remembers:\n`));
    for (const m of list) console.log(`  • ${m.content} ${dim(`[${m.type} · ${m.importance.toFixed(1)}]`)}`);
  })();

export const memoryAdd = (name: string, text: string, f: { type?: string }) =>
  withCrew(async (crew: Crew) => {
    const a = crew.requireAgent(name);
    await crew.remember(a.id, text, (f.type as "fact") ?? "fact", 0.8, "cli");
    ok(`${a.name} will remember that.`);
  })();
