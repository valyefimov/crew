import { SETTING_KEYS, type SettingKey } from "@crew/core";
import { dim, fail, ok } from "../ui.ts";
import { withCrew } from "./agent.ts";

const SECRET = new Set<SettingKey>(["openaiApiKey", "telegramToken"]);

export const configList = () =>
  withCrew((crew) => {
    for (const k of SETTING_KEYS) {
      const v = crew.config[k];
      console.log(`${k.padEnd(16)} ${SECRET.has(k) ? (v ? "••••••" : dim("—")) : v || dim("—")}`);
    }
  })();

export const configSet = (key: string, value: string) =>
  withCrew((crew) => {
    if (!SETTING_KEYS.includes(key as SettingKey)) {
      fail(`Unknown key. One of: ${SETTING_KEYS.join(", ")}`);
      process.exitCode = 1;
      return;
    }
    crew.store.setSetting(key, value);
    ok(`${key} saved`);
  })();
