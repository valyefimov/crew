# CLI

```bash
npm i -g @vefimov/crew   # or prefix commands with: npx @vefimov/crew
```

## Server

| Command | |
| --- | --- |
| `crew` / `crew start` | Start the server + web UI on `127.0.0.1:3000` |
| `crew start -p 8080 --host 0.0.0.0` | Custom port / interface |
| `crew start --no-telegram` | Don't start the bot |
| `crew dev` | Start and open the browser |
| `crew doctor` | Check Node, database, provider and models |

## Agents

| Command | |
| --- | --- |
| `crew agent create <name> [-t template] [-r role] [--persona] [--prompt] [-m model] [-a emoji] [-f folder...] [--rw]` | Create |
| `crew agent ls` | List with memory counts |
| `crew agent rm <name>` | Delete with all memory |
| `crew agent grant <name> <folder> [--rw]` | Share a folder |
| `crew agent export <name> [-o file]` | Export to JSON |
| `crew agent import <file>` | Import from JSON |

## Chat & memory

```bash
crew chat Lena                      # interactive; /memory, /exit
crew chat Lena -m "standup summary?" # one-shot, good for scripts
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
