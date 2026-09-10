import type { Tool } from "./types.ts";

export const rememberTool: Tool = {
  name: "remember",
  description:
    "Save an important long-term fact, decision or user preference so you remember it in future conversations. Use sparingly, only for durable information.",
  parameters: {
    type: "object",
    properties: {
      content: { type: "string", description: "A short self-contained statement, e.g. 'User's project uses Postgres 16'." },
      type: { type: "string", enum: ["fact", "decision", "preference"] },
      importance: { type: "number", description: "0..1, how important it is to remember" },
    },
    required: ["content"],
  },
  run: (args, ctx) => ctx.remember(String(args.content), args.type as string | undefined, args.importance as number | undefined),
};

export const recallTool: Tool = {
  name: "recall",
  description: "Search your long-term memory for things you were told before.",
  parameters: {
    type: "object",
    properties: { query: { type: "string" } },
    required: ["query"],
  },
  run: (args, ctx) => ctx.recall(String(args.query)),
};
