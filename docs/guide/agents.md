# Agents

An agent is a persistent colleague. It has a name, a role, a personality, optional instructions, and its own memory and folders.

| Field | What it does |
| --- | --- |
| `name` | Unique and case-insensitive. You use it everywhere: `crew chat Lena`, `/use Lena` in Telegram. |
| `role` | One line, for example "Senior backend engineer". It goes into the system prompt. |
| `personality` | How the agent talks and behaves. |
| `systemPrompt` | Extra instructions about what it should help with. |
| `model` | An optional model for this agent. Empty means the global default. |
| `avatar` | Any emoji. |

## Templates

| Template | Agent |
| --- | --- |
| `backend` | Artem, a senior backend engineer |
| `frontend` | Lena, a frontend developer and designer |
| `pm` | Max, a product manager |
| `writer` | Sofia, a writer and editor |
| `coach` | Oleg, a personal coach |

```bash
crew agent create Lena --template frontend
crew agent create Kate --role "Data analyst" --persona "Curious, loves charts" --model qwen2.5:7b
```

## How a turn works

1. Crew stores your message.
2. It looks up the most relevant memories, adds the most important ones, and builds the system prompt.
3. The model answers. It may call tools along the way: `remember`, `recall`, and the file tools if a folder is shared. A turn allows up to 6 rounds of tool calls.
4. The reply streams to every connected client and is saved.
5. A background job reads the exchange and extracts new long-term memories.

Turns of one agent run one at a time, so messages from the web UI, the CLI and Telegram don't interleave.

## Statuses

Agents report what they are doing as it happens: `idle`, `thinking`, `working` (running a tool) and `remembering` (extracting memories). The dashboard shows the whole crew at once.

## Export and import

```bash
crew agent export Lena            # → Lena.crew.json, includes memories
crew agent import Lena.crew.json
```

The web UI does the same: Profile has an Export button, and the New colleague dialog has Import.
