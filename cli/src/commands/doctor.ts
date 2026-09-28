import { Crew } from "@crew/core";
import { bold, dim, fail, ok, warn } from "../ui.ts";
import { withCrew } from "./agent.ts";

export const doctor = () =>
  withCrew(async (crew: Crew) => {
    const [major, minor] = process.versions.node.split(".").map(Number);
    if (major > 22 || (major === 22 && minor >= 13)) ok(`Node.js ${process.versions.node}`);
    else fail(`Node.js ${process.versions.node} — Crew needs 22.13+ (for built-in SQLite)`);

    ok(`Database ${dim(crew.store.file)}`);

    const { provider, model, embedModel, ollamaHost, openaiBaseUrl } = crew.config;
    const url = provider === "ollama" ? ollamaHost : openaiBaseUrl;
    if (!(await crew.provider.ping())) {
      fail(`${provider} is not reachable at ${url}`);
      if (provider === "ollama") console.log(dim("    install: https://ollama.com  ·  then run: ollama serve"));
      return;
    }
    ok(`${provider} is reachable at ${url}`);

    const models = (await crew.provider.models()).map((m) => m.name);
    const has = (m: string) => models.includes(m) || models.includes(`${m}:latest`);
    if (has(model)) ok(`Chat model ${bold(model)}`);
    else warn(`Chat model ${bold(model)} is missing — ${provider === "ollama" ? `ollama pull ${model}` : "check the model name"}`);
    if (has(embedModel)) ok(`Embedding model ${bold(embedModel)}`);
    else warn(`Embedding model ${bold(embedModel)} is missing — memory falls back to keyword search (ollama pull ${embedModel})`);

    if (crew.config.telegramToken) ok("Telegram token configured");
    else console.log(dim("  · Telegram not configured (crew config set telegramToken <token>)"));
  })();
