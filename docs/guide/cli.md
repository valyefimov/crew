# CLI

```bash
npm i -g @vefimov/crew   # or put this before each command: npx @vefimov/crew
```

## Server

| Command | What it does |
| --- | --- |
| `crew` or `crew start` | Starts the server and web UI on `127.0.0.1:3000`. |
| `crew start -p 8080 --host 0.0.0.0` | Uses another port or interface. |
| `crew start --no-telegram` | Doesn't start the bot. |
| `crew dev` | Starts Crew and opens the browser. |
| `crew doctor` | Checks Node, the database, the provider and the models. |

## Agents

| Command | What it does |
| --- | --- |
| `crew agent create <name> [-t template] [-r role] [--persona] [--prompt] [-m model] [-a emoji] [-f folder...] [--rw]` | Creates an agent. |
| `crew agent ls` | Lists agents with their memory counts. |
| `crew agent rm <name>` | Deletes an agent and all of its memory. |
| `crew agent grant <name> <folder> [--rw]` | Shares a folder. |
| `crew agent export <name> [-o file]` | Exports to JSON. |
| `crew agent import <file>` | Imports from JSON. |

## Chat and memory

```bash
crew chat Lena                      # interactive; /memory and /exit work inside
crew chat Lena -m "standup summary?" # one message, handy in scripts
crew memory Lena --search "deploy"
crew memory add Lena "Deploys are on Thursdays" -t decision
```

## Settings

```bash
crew config                       # show
crew config set model qwen2.5:7b
crew config set provider openai
crew config set openaiBaseUrl http://127.0.0.1:1234/v1
```
