# Agents

An agent is a persistent colleague: a name, a role, a personality, optional instructions, and its own memory and folders.

| Field | What it does |
| --- | --- |
| `name` | Unique, case-insensitive. Used everywhere: `crew chat Lena`, `/use Lena` in Telegram. |
| `role` | One line, e.g. *Senior backend engineer*. Goes into the system prompt. |
| `personality` | How they talk and behave. |
| `systemPrompt` | Extra instructions — what they should help with. |
| `model` | Optional per-agent model. Empty = the global default. |
| `avatar` | Any emoji. |

## Templates

| Template | Agent |
| --- | --- |
| `backend` | 🛠️ Artem — senior backend engineer |
| `frontend` | 🎨 Lena — frontend developer & designer |
| `pm` | 📋 Max — product manager |
| `writer` | ✍️ Sofia — writer & editor |
| `coach` | 🧭 Oleg — personal coach |

```bash
crew agent create Lena --template frontend
crew agent create Kate --role "Data analyst" --persona "Curious, loves charts" --model qwen2.5:7b
```

## How a turn works

1. Crew stores your message.
2. It recalls the most relevant memories (plus the most important ones) and builds the system prompt.
3. The model answers, possibly calling tools — `remember`, `recall`, and file tools if folders are shared. Up to 6 tool rounds per turn.
4. The reply is streamed to every connected client and saved.
5. A background job reads the exchange and extracts new long-term memories.

Turns of one agent are serialized, so messages from the web UI, the CLI and Telegram never interleave.

## Statuses

Agents report what they're doing in real time: `idle`, `thinking`, `working` (running a tool) and `remembering` (extracting memories). The dashboard shows it for the whole crew.

## Export & import

```bash
crew agent export Lena            # → Lena.crew.json, includes memories
crew agent import Lena.crew.json
```

The same works from the web UI (Profile → Export, New colleague → Import).
