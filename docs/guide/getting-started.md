# Getting started

Crew is a single Node.js app. It keeps everything in one SQLite file and talks to a model through [Ollama](https://ollama.com) or any OpenAI-compatible server.

## Requirements

You need Node.js 22.13 or newer. Crew uses the built-in `node:sqlite`, so nothing has to be compiled.

You also need Ollama with a chat model and an embedding model:

```bash
ollama pull qwen2.5:3b
ollama pull nomic-embed-text
```

Any model that supports tool calling will work. On a laptop, `qwen2.5:3b` or `llama3.2:3b` is a reasonable start. If you have more RAM, try `qwen2.5:7b` or `qwen3:8b`.

## Run it

```bash
npx @vefimov/crew
```

Open [http://localhost:3000](http://localhost:3000) and create your first agent.

To get the `crew` command, install the package globally:

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

In the web UI, click New colleague, pick a template and press Create.

From the terminal:

```bash
crew agent create Artem --template backend --folder ~/code/my-api
crew chat Artem
```

Tell Artem something about yourself or your project. Close the chat and open it again tomorrow. Artem still knows.

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
