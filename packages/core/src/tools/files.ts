import { mkdir, readdir, readFile, realpath, stat, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import type { FolderAccess } from "@crew/memory";
import type { Tool } from "./types.ts";

const MAX_READ = 64 * 1024;

export class AccessError extends Error {}

/** Realpath of the deepest existing ancestor, plus the not-yet-existing remainder. */
async function realish(p: string): Promise<string> {
  let cur = p;
  for (;;) {
    try {
      return join(await realpath(cur), relative(cur, p));
    } catch {
      const parent = dirname(cur);
      if (parent === cur) throw new AccessError(`Path does not exist: ${p}`);
      cur = parent;
    }
  }
}

function inside(child: string, parent: string) {
  const rel = relative(parent, child);
  return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
}

/**
 * Resolve a path an agent asked for against its granted folders.
 * Symlinks are resolved first so they can't be used to escape a folder.
 */
export async function resolveAllowed(
  folders: FolderAccess[],
  requested: string,
  need: "ro" | "rw",
): Promise<{ path: string; folder: FolderAccess }> {
  if (!folders.length) throw new AccessError("No folders are shared with you. Ask the user to grant access in Crew.");
  const raw = String(requested || ".");
  const candidates = isAbsolute(raw) ? [resolve(raw)] : folders.map((f) => resolve(f.path, raw));

  for (const target of candidates) {
    const finalPath = await realish(target);
    for (const folder of folders) {
      const root = await realpath(folder.path).catch(() => null);
      if (!root || !inside(finalPath, root)) continue;
      if (need === "rw" && folder.mode !== "rw") {
        throw new AccessError(`Folder ${folder.path} is read-only for you.`);
      }
      return { path: finalPath, folder };
    }
  }
  throw new AccessError(`Access denied: ${raw} is outside of your shared folders.`);
}

export const listFiles: Tool = {
  name: "list_files",
  description: "List files and folders in a directory you have access to.",
  parameters: {
    type: "object",
    properties: { path: { type: "string", description: "Directory path. Relative paths resolve against your shared folders." } },
  },
  async run(args, { agent, store }) {
    const { path } = await resolveAllowed(store.listFolders(agent.id), String(args.path ?? "."), "ro");
    const entries = await readdir(path, { withFileTypes: true });
    const shown = entries
      .filter((e) => !e.name.startsWith(".") && e.name !== "node_modules")
      .slice(0, 200)
      .map((e) => (e.isDirectory() ? `${e.name}/` : e.name));
    return `${path}\n${shown.join("\n") || "(empty)"}`;
  },
};

export const readFileTool: Tool = {
  name: "read_file",
  description: "Read a text file you have access to.",
  parameters: {
    type: "object",
    properties: { path: { type: "string" } },
    required: ["path"],
  },
  async run(args, { agent, store }) {
    const { path } = await resolveAllowed(store.listFolders(agent.id), String(args.path), "ro");
    const info = await stat(path);
    if (info.isDirectory()) return `${path} is a directory — use list_files.`;
    const buf = await readFile(path);
    if (buf.subarray(0, 8000).includes(0)) return `${path} looks like a binary file (${info.size} bytes).`;
    const text = buf.subarray(0, MAX_READ).toString("utf8");
    return info.size > MAX_READ ? `${text}\n\n…truncated (${info.size} bytes total)` : text;
  },
};

export const writeFileTool: Tool = {
  name: "write_file",
  description: "Create or overwrite a text file inside a folder shared with you in read-write mode.",
  parameters: {
    type: "object",
    properties: { path: { type: "string" }, content: { type: "string" } },
    required: ["path", "content"],
  },
  async run(args, { agent, store }) {
    const { path } = await resolveAllowed(store.listFolders(agent.id), String(args.path), "rw");
    await mkdir(dirname(path), { recursive: true });
    const content = String(args.content ?? "");
    await writeFile(path, content);
    return `Wrote ${Buffer.byteLength(content)} bytes to ${path}`;
  },
};

