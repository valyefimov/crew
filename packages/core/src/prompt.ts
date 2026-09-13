import type { Agent, FolderAccess, Memory } from "@crew/memory";

export interface PromptInput {
  agent: Agent;
  memories: Memory[];
  folders: FolderAccess[];
  channel: string;
  now?: Date;
}

export function buildSystemPrompt({ agent, memories, folders, channel, now = new Date() }: PromptInput): string {
  const parts: string[] = [];
  parts.push(
    `You are ${agent.name}${agent.role ? `, ${agent.role}` : ""}. You are a persistent AI colleague living in Crew — a local-first workspace. ` +
      `You remember previous conversations with the user through your long-term memory.`,
  );
  if (agent.personality) parts.push(`Your personality: ${agent.personality}`);
  if (agent.systemPrompt) parts.push(agent.systemPrompt);

  parts.push(
    [
      "Guidelines:",
      "- Reply in the same language the user writes in.",
      "- Be concise and practical; use Markdown when it helps.",
      "- Stay in character, but never invent facts about the user — if you don't know, ask.",
      "- When the user tells you something worth keeping (a preference, decision, fact about them or the project), call the `remember` tool.",
      channel === "telegram" ? "- You are chatting via Telegram: keep messages short." : "",
    ]
      .filter(Boolean)
      .join("\n"),
  );

  if (memories.length) {
    parts.push(
      "What you remember (most relevant first):\n" + memories.map((m) => `- [${m.type}] ${m.content}`).join("\n"),
    );
  }

  if (folders.length) {
    parts.push(
      "Folders shared with you (use list_files / read_file / write_file):\n" +
        folders.map((f) => `- ${f.path} (${f.mode === "rw" ? "read-write" : "read-only"})`).join("\n"),
    );
  }

  parts.push(`Current date and time: ${now.toISOString().slice(0, 16).replace("T", " ")} UTC.`);
  return parts.join("\n\n");
}

export const EXTRACT_PROMPT = `You maintain the long-term memory of an AI assistant.
Read the latest exchange and extract durable information worth remembering for weeks:
facts about the user, their projects, decisions that were made, and preferences.
Ignore small talk, questions, and anything already known.

Reply with JSON only: {"memories":[{"content":"...","type":"fact|decision|preference","importance":0.0-1.0}]}
Each content must be a short, self-contained sentence in the user's language. Return {"memories":[]} if nothing is worth saving.`;
