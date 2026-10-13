<div align="center">

<img src="apps/web/public/logo.svg" width="96" alt="Crew logo" />

# Crew

Your AI colleagues, at home.

A local-first workspace for AI agents that stick around. They remember what you tell them, can work with files in folders you share, and answer in the browser, the terminal or Telegram.

[![npm](https://img.shields.io/npm/v/@vefimov/crew?color=8b5cf6&label=npm)](https://www.npmjs.com/package/@vefimov/crew)
[![CI](https://img.shields.io/github/actions/workflow/status/valyefimov/crew/ci.yml?branch=main&label=ci)](https://github.com/valyefimov/crew/actions)
[![License: MIT](https://img.shields.io/badge/license-MIT-22d3ee)](LICENSE)
[![Node](https://img.shields.io/badge/node-%E2%89%A522.13-8b5cf6)](.nvmrc)

[Docs](https://valyefimov.github.io/crew/) ·
[Русский](https://valyefimov.github.io/crew/ru/) ·
[Українська](https://valyefimov.github.io/crew/uk/) ·
[Roadmap](https://valyefimov.github.io/crew/guide/roadmap)

```bash
npx @vefimov/crew
```

<br />

<a href="https://valyefimov.github.io/crew/media/demo.mp4">
  <img src="media/demo.gif" alt="Crew demo" width="860" />
</a>

The full 90-second demo with voice-over:
[English](https://valyefimov.github.io/crew/media/demo.mp4) ·
[Русский](https://valyefimov.github.io/crew/media/demo-ru.mp4) ·
[Українська](https://valyefimov.github.io/crew/media/demo-uk.mp4)

</div>

---

## What it is

Most AI assistants forget you when you close the tab. Crew keeps a small team of agents on your own machine instead. Each one has a name, a role, a personality and its own long-term memory, so a conversation can pick up where it stopped last week.

It runs on [Ollama](https://ollama.com) or any OpenAI-compatible server. State lives in one SQLite file, and nothing is sent anywhere unless you use Telegram or point Crew at a remote provider.

What you get:

- Agents with a role, a personality, instructions and, if you want, their own model. Five templates to start from: backend developer, frontend developer, product manager, writer, coach.
- Long-term memory for each agent. It is stored in SQLite, searched with full text and vectors, and filled in automatically after every chat.
- Shared folders, read-only or read-write. An agent can list, read and write files inside them and nowhere else.
- A web UI, a CLI and a Telegram bot. All three talk to the same agents and share the same memory.
- A REST and WebSocket API and a background task queue.
- An interface and docs in English, Russian and Ukrainian.

## Screenshots

<table>
  <tr>
    <td width="50%"><img src="media/dashboard.png" alt="Dashboard" /><br /><sub>The dashboard shows what each agent is doing right now.</sub></td>
    <td width="50%"><img src="media/chat-memory.png" alt="Chat with memory panel" /><br /><sub>A chat with the memory panel open. You can search, add and delete memories.</sub></td>
  </tr>
  <tr>
    <td width="50%"><img src="media/files.png" alt="Agent reading files" /><br /><sub>An agent reading a file from a shared folder. Tool calls show up in the chat.</sub></td>
    <td width="50%"><img src="media/new-agent.png" alt="New colleague dialog" /><br /><sub>Creating an agent from a template.</sub></td>
  </tr>
  <tr>
    <td width="50%"><img src="media/dashboard-ru.png" alt="Russian UI" /><br /><sub>Russian interface</sub></td>
    <td width="50%"><img src="media/dashboard-uk.png" alt="Ukrainian UI" /><br /><sub>Ukrainian interface</sub></td>
  </tr>
</table>

<p align="center"><img src="media/cli.png" width="760" alt="Crew CLI" /></p>

## Quick start

You need Node.js 22.13 or newer and Ollama:

```bash
ollama pull qwen2.5:3b
ollama pull nomic-embed-text

npx @vefimov/crew
```

Open <http://localhost:3000>, create an agent and say hi. Close the tab and come back tomorrow. The agent still knows who you are.

The same thing from the terminal:

```bash
npm i -g @vefimov/crew
crew agent create Artem --template backend --folder ~/code/my-api
crew chat Artem
crew doctor               # check your setup
```

<details>
<summary>Docker</summary>

```bash
docker compose -f docker/docker-compose.yml up
docker compose -f docker/docker-compose.yml exec ollama ollama pull qwen2.5:3b
docker compose -f docker/docker-compose.yml exec ollama ollama pull nomic-embed-text
```

</details>

<details>
<summary>Telegram</summary>

Create a bot with @BotFather, then:

```bash
crew config set telegramToken 123456:ABC...
crew start
# ✔ Telegram bot online — send /pair 482913 to it
```

The bot understands `/agents`, `/use <name>`, `/memory` and `/forget`. You can also address an agent by name in a message: "Lena, how does this look?"

</details>

<details>
<summary>Another model provider</summary>

LM Studio, llama.cpp, vLLM, OpenRouter and OpenAI all work, since they speak the same API:

```bash
CREW_PROVIDER=openai OPENAI_BASE_URL=http://127.0.0.1:1234/v1 crew start
```

</details>

## How it works

```
 Web UI ─┐
 CLI ────┼──▶ Crew runtime ──▶ Ollama / OpenAI-compatible
 Telegram┘        │  ▲
                  ▼  │ tools: remember · recall · list/read/write files
              SQLite (one file: chats, memories, vectors, queue)
                  │
                  ▼
          background worker ──▶ memory extraction, embeddings
```

Crew uses Node's built-in `node:sqlite`, so there is nothing to compile and `npx` works anywhere Node 22.13 does.

Memory search combines SQLite FTS5 (BM25) with cosine similarity over embeddings. The two rankings are merged with reciprocal-rank fusion and adjusted a little for importance and age. A new memory that is nearly identical to an existing one is skipped.

Providers sit behind a small interface with streaming and tool calls, so adding another one is a short file.

For files, Crew resolves every path with `realpath` before checking permissions, which stops `../` and symlink escapes. Writing needs an explicit `rw` grant.

More in the [architecture docs](https://valyefimov.github.io/crew/guide/architecture).

## Repository

```
apps/server        Hono: REST + WebSocket
apps/web           React 19, Vite, Tailwind v4
packages/core      agent runtime, providers, tools, worker
packages/memory    SQLite store, FTS5 + vectors, task queue
packages/channels  Telegram (grammY)
cli                the `crew` command, published as @vefimov/crew
docs               VitePress site in English, Russian and Ukrainian
```

```bash
git clone https://github.com/valyefimov/crew && cd crew
pnpm install
pnpm dev      # API on :3001, web UI on :5173
pnpm test
```

## Roadmap

- [x] v1.0: agents, memory, web UI, files, Ollama, CLI, Telegram, background tasks
- [ ] v1.1: local voice (Whisper.cpp and Piper or Kokoro), scheduled tasks, sandboxed commands
- [ ] v1.2: Slack, multiple workspaces, agents talking to each other
- [ ] v2.0: team mode, a marketplace of characters and skills, PWA, plugins

## Security

Crew listens on `127.0.0.1` by default, and its API has no authentication. If you expose it beyond your machine, put a reverse proxy with auth in front of it.

## License

[MIT](LICENSE), © Valentyn Yefimov
