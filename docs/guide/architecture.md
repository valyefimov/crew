# Architecture

```
crew/
├── apps/
│   ├── server/        Hono: REST + WebSocket, serves the web UI
│   └── web/           React 19 + Vite + Tailwind v4
├── packages/
│   ├── core/          Agent runtime, LLM providers, tools, prompt, worker
│   ├── memory/        SQLite store: agents, messages, memories (FTS5 + vectors), tasks
│   └── channels/      Telegram (grammY)
├── cli/               `crew`, published as @vefimov/crew
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

Crew has no native dependencies. `node:sqlite` ships with Node 22, so `npx` works without compiling anything.

All state sits in one file, `~/.crew/crew.db`, in WAL mode. That covers agents, chats, memories, vectors, settings and the job queue.

Memory search uses FTS5 plus a brute-force cosine scan instead of a vector database. That is plenty for thousands of memories per agent and needs no extra service.

Providers sit behind a small `Provider` interface (`chat`, `embed`, `models`, `ping`) with streaming and tool calls. The Ollama and OpenAI-compatible adapters are one short file each.

The runtime is an `EventEmitter`. The server forwards its events to WebSocket clients, so every UI sees every agent live.

Each agent handles one turn at a time, whichever channel the message came from.
