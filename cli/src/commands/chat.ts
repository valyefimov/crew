import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { Crew } from "@crew/core";
import { bold, cyan, dim, fail, magenta } from "../ui.ts";

/** Talk to an agent right in the terminal. Same memory as the web UI. */
export async function chat(name: string, f: { message?: string }) {
  const crew = Crew.open();
  crew.start();
  const agent = crew.store.getAgent(name);
  if (!agent) {
    fail(`No agent named "${name}". Create one: crew agent create ${name}`);
    process.exit(1);
  }

  crew.on("event", (e) => {
    if (!("agentId" in e) || e.agentId !== agent.id) return;
    if (e.type === "token") stdout.write(e.delta);
    if (e.type === "tool" && e.result === undefined) stdout.write(dim(`\n  ↳ ${e.name} ${JSON.stringify(e.args).slice(0, 80)}\n`));
  });

  const ask = async (text: string) => {
    stdout.write(`\n${agent.avatar} ${bold(magenta(agent.name))}  `);
    try {
      await crew.chat({ agent: agent.id, text, channel: "cli" });
    } catch (err) {
      fail((err as Error).message);
    }
    stdout.write("\n");
  };

  if (f.message) {
    await ask(f.message);
  } else {
    console.log(dim(`Chatting with ${agent.name}. /memory — show memories, /exit — quit.\n`));
    const rl = createInterface({ input: stdin, output: stdout });
    for (;;) {
      const text = (await rl.question(cyan("\nyou › "))).trim();
      if (!text) continue;
      if (text === "/exit" || text === "/quit") break;
      if (text === "/memory") {
        for (const m of crew.store.listMemories(agent.id, 20)) console.log(dim(`  • [${m.type}] ${m.content}`));
        continue;
      }
      await ask(text);
    }
    rl.close();
  }

  await crew.worker.drain(); // let background memory extraction finish
  await crew.stop();
  crew.store.close();
}
