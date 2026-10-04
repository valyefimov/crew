# Getting started

Crew is a single Node.js app. It stores everything in one SQLite file and talks to a local model through [Ollama](https://ollama.com) (or any OpenAI-compatible server).

## Requirements

- **Node.js 22.13+** — Crew uses the built-in `node:sqlite`, so there are no native modules to compile.
- **Ollama** with a chat model and an embedding model:

```bash
ollama pull qwen2.5:3b
ollama pull nomic-embed-text
```

Any model with tool calling works. On a laptop `qwen2.5:3b` or `llama3.2:3b` is a good start; with more RAM try `qwen2.5:7b` or `qwen3:8b`.

## Run it

```bash
npx @vefimov/crew
```

Open [http://localhost:3000](http://localhost:3000) and create your first colleague.

Or install it globally to get the `crew` command:

```bash
npm i -g @vefimov/crew
crew start --open
```

## Check your setup

```bash
crew doctor
```

```
✔ Node.js 22.14.0
✔ Database ~/.crew/crew.db
✔ ollama is reachable at http://127.0.0.1:11434
✔ Chat model qwen2.5:3b
✔ Embedding model nomic-embed-text
```

## Your first agent

From the web UI: **New colleague → pick a template → Create**.

From the terminal:

```bash
crew agent create Artem --template backend --folder ~/code/my-api
crew chat Artem
```

Tell Artem something about yourself or your project. Close the chat, open it again tomorrow — he still knows.

## Docker

```bash
docker compose -f docker/docker-compose.yml up
```

This starts Crew and Ollama side by side. Data lives in the `crew-data` volume.

## From source

```bash
git clone https://github.com/valyefimov/crew
cd crew
pnpm install
pnpm dev        # API on :3001, web UI with hot reload on :5173
```
