import { listFiles, readFileTool, writeFileTool } from "./files.ts";
import { recallTool, rememberTool } from "./memory.ts";
import type { Tool } from "./types.ts";

export * from "./types.ts";
export { resolveAllowed, AccessError } from "./files.ts";

export const memoryTools: Tool[] = [rememberTool, recallTool];
export const fileTools: Tool[] = [listFiles, readFileTool, writeFileTool];
