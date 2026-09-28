import { Command } from "commander";
import { templates } from "@crew/core";
import { VERSION } from "@crew/server";
import { start } from "./commands/start.ts";
import { agentCreate, agentExport, agentGrant, agentImport, agentList, agentRemove } from "./commands/agent.ts";
import { chat } from "./commands/chat.ts";
import { memoryAdd, memoryList } from "./commands/memory.ts";
import { doctor } from "./commands/doctor.ts";
import { configList, configSet } from "./commands/config.ts";
import { fail } from "./ui.ts";

const program = new Command()
  .name("crew")
  .description("A lightweight local-first workspace for your persistent AI colleagues")
  .version(VERSION);

program
  .command("start", { isDefault: true })
  .description("start the Crew server and web UI")
  .option("-p, --port <port>", "port to listen on (default 3000)")
  .option("--host <host>", "interface to bind (default 127.0.0.1)")
  .option("-o, --open", "open the browser")
  .option("--no-telegram", "don't start the Telegram bot")
  .action(start);

program
  .command("dev")
  .description("start Crew and open it in the browser")
  .option("-p, --port <port>", "port to listen on")
  .action((f) => start({ ...f, open: true }));

const agent = program.command("agent").description("manage your colleagues");

agent
  .command("create <name>")
  .description("create a new agent")
  .option("-r, --role <role>", "role, e.g. 'backend engineer'")
  .option("--persona <text>", "personality / character")
  .option("--prompt <text>", "extra instructions")
  .option("-m, --model <model>", "model for this agent (default: global)")
  .option("-a, --avatar <emoji>", "avatar emoji")
  .option("-t, --template <name>", `start from a template: ${Object.keys(templates).join(", ")}`)
  .option("-f, --folder <path...>", "share folder(s) with the agent")
  .option("--rw", "give write access to shared folders")
  .action(agentCreate);

agent.command("list").alias("ls").description("list agents").action(agentList);
agent.command("rm <name>").description("delete an agent and its memory").action(agentRemove);
agent
  .command("grant <name> <folder>")
  .description("share a folder with an agent")
  .option("--rw", "allow writing")
  .action(agentGrant);
agent.command("export <name>").option("-o, --out <file>").description("export agent + memories to JSON").action(agentExport);
agent.command("import <file>").description("import an agent from JSON").action(agentImport);

program
  .command("chat <agent>")
  .description("chat with an agent in the terminal")
  .option("-m, --message <text>", "send one message and exit")
  .action(chat);

const memory = program.command("memory").description("inspect long-term memory");
memory
  .command("list <agent>", { isDefault: true })
  .option("-s, --search <query>", "semantic search")
  .option("-n, --limit <n>")
  .action(memoryList);
memory.command("add <agent> <text>").option("-t, --type <type>", "fact | decision | preference").action(memoryAdd);

const config = program.command("config").description("view or change settings");
config.command("list", { isDefault: true }).action(configList);
config.command("set <key> <value>").action(configSet);

program.command("doctor").description("check your setup").action(doctor);

program.parseAsync().catch((err) => {
  fail(err.message);
  process.exit(1);
});
