import { homedir } from "node:os";
import { join, resolve } from "node:path";
import type { Store } from "@crew/memory";

export interface CrewConfig {
  home: string;
  dbFile: string;
  port: number;
  provider: "ollama" | "openai";
  ollamaHost: string;
  openaiBaseUrl: string;
  openaiApiKey: string;
  model: string;
  embedModel: string;
  telegramToken: string;
}

export const DEFAULT_MODEL = "qwen2.5:3b";
export const DEFAULT_EMBED_MODEL = "nomic-embed-text";

function expand(p: string) {
  return p.startsWith("~") ? join(homedir(), p.slice(1)) : resolve(p);
}

/** Static config from the environment — enough to open the database. */
export function envConfig(env: NodeJS.ProcessEnv = process.env): CrewConfig {
  const home = expand(env.CREW_HOME || "~/.crew");
  return {
    home,
    dbFile: join(home, "crew.db"),
    port: Number(env.CREW_PORT || env.PORT || 3000),
    provider: env.CREW_PROVIDER === "openai" ? "openai" : "ollama",
    ollamaHost: env.OLLAMA_HOST ? normalizeHost(env.OLLAMA_HOST) : "http://127.0.0.1:11434",
    openaiBaseUrl: env.OPENAI_BASE_URL || "https://api.openai.com/v1",
    openaiApiKey: env.OPENAI_API_KEY || "",
    model: env.CREW_MODEL || "",
    embedModel: env.CREW_EMBED_MODEL || "",
    telegramToken: env.CREW_TELEGRAM_TOKEN || "",
  };
}

/** OLLAMA_HOST is often set as "0.0.0.0:11434" — make it a usable URL. */
function normalizeHost(h: string) {
  let url = /^https?:\/\//.test(h) ? h : `http://${h}`;
  url = url.replace("://0.0.0.0", "://127.0.0.1");
  return url;
}

export const SETTING_KEYS = [
  "provider",
  "ollamaHost",
  "openaiBaseUrl",
  "openaiApiKey",
  "model",
  "embedModel",
  "telegramToken",
] as const;
export type SettingKey = (typeof SETTING_KEYS)[number];

/** Env wins over settings saved from the UI; settings win over defaults. */
export function resolveConfig(store: Store, env: NodeJS.ProcessEnv = process.env): CrewConfig {
  const base = envConfig(env);
  const s = store.allSettings() as Partial<Record<SettingKey, string>>;
  return {
    ...base,
    provider: env.CREW_PROVIDER ? base.provider : s.provider === "openai" ? "openai" : "ollama",
    ollamaHost: env.OLLAMA_HOST ? base.ollamaHost : s.ollamaHost || base.ollamaHost,
    openaiBaseUrl: env.OPENAI_BASE_URL ? base.openaiBaseUrl : s.openaiBaseUrl || base.openaiBaseUrl,
    openaiApiKey: base.openaiApiKey || s.openaiApiKey || "",
    model: base.model || s.model || DEFAULT_MODEL,
    embedModel: base.embedModel || s.embedModel || DEFAULT_EMBED_MODEL,
    telegramToken: base.telegramToken || s.telegramToken || "",
  };
}
