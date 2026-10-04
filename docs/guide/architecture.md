# Architecture

```
crew/
├── apps/
│   ├── server/        Hono — REST + WebSocket, serves the web UI
│   └── web/           React 19 + Vite + Tailwind v4
├── packages/
│   ├── core/          Agent runtime, LLM providers, tools, prompt, worker
│   ├── memory/        SQLite store: agents, messages, memories (FTS5 + vectors), tasks
│   └── channels/      Telegram (grammY)
├── cli/               `crew` — published as @vefimov/crew
├── docs/              This site (VitePress)
└── docker/
```

## Data flow

```
 Web UI ─┐
 CLI ────┼──▶ Crew runtime ──▶ Provider (Ollama / OpenAI-compatible)
 Telegram┘        │  ▲
                  ▼  │ tools: remember · recall · list/read/write files
               SQLite (one file)
                  │
                  ▼
           Task queue ──▶ memory extraction, embedding backfill
```

## Design choices

- **No native dependencies.** `node:sqlite` ships with Node 22, so `npx` works everywhere without compiling anything.
- **One file of state.** Agents, chats, memories, vectors, settings and the job queue live in `~/.crew/crew.db` (WAL mode).
- **Hybrid memory without a vector DB.** FTS5 + brute-force cosine is plenty for thousands of memories per agent, with zero extra services.
- **Provider-agnostic.** A tiny `Provider` interface (`chat`, `embed`, `models`, `ping`) with streaming and tool calls. Ollama and OpenAI-compatible adapters are ~150 lines each.
- **Events everywhere.** The runtime is an `EventEmitter`; the server just forwards events to WebSocket clients, so every UI sees every agent live.
- **Serialized turns.** Each agent processes one turn at a time, no matter which channel the message came from.
