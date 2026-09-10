import type { Agent, Store } from "@crew/memory";
import type { ToolSpec } from "../llm/types.ts";

export interface ToolContext {
  agent: Agent;
  store: Store;
  remember: (content: string, type?: string, importance?: number) => Promise<string>;
  recall: (query: string) => Promise<string>;
}

export interface Tool extends ToolSpec {
  run(args: Record<string, unknown>, ctx: ToolContext): Promise<string>;
}
