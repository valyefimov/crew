# Configuration

Settings come from three places, in order of priority:

1. **Environment variables**
2. **Settings saved in the database** (web UI → Settings, or `crew config set`)
3. Defaults

| Env | Setting | Default |
| --- | --- | --- |
| `CREW_HOME` | — | `~/.crew` (database: `crew.db`) |
| `CREW_PORT` | — | `3000` |
| `CREW_HOST` | — | `127.0.0.1` |
| `CREW_PROVIDER` | `provider` | `ollama` |
| `OLLAMA_HOST` | `ollamaHost` | `http://127.0.0.1:11434` |
| `OPENAI_BASE_URL` | `openaiBaseUrl` | `https://api.openai.com/v1` |
| `OPENAI_API_KEY` | `openaiApiKey` | — |
| `CREW_MODEL` | `model` | `qwen2.5:3b` |
| `CREW_EMBED_MODEL` | `embedModel` | `nomic-embed-text` |
| `CREW_TELEGRAM_TOKEN` | `telegramToken` | — |

## Providers

**Ollama** (default) — nothing to configure if it runs locally.

**OpenAI-compatible** — LM Studio, llama.cpp server, vLLM, OpenRouter, OpenAI:

```bash
CREW_PROVIDER=openai OPENAI_BASE_URL=http://127.0.0.1:1234/v1 crew start
```

## Security notes

- Crew binds to `127.0.0.1` by default. The API has no authentication — **don't expose it to the internet** without a reverse proxy that adds auth.
- Secrets are masked in the settings API.
- The whole state is `~/.crew/crew.db`. Back it up by copying the file.
