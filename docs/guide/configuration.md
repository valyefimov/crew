# Configuration

Crew reads settings from three places. The first one that has a value wins:

1. Environment variables
2. Settings saved in the database (web UI Settings, or `crew config set`)
3. Defaults

| Env | Setting | Default |
| --- | --- | --- |
| `CREW_HOME` | none | `~/.crew` (the database is `crew.db`) |
| `CREW_PORT` | none | `3000` |
| `CREW_HOST` | none | `127.0.0.1` |
| `CREW_PROVIDER` | `provider` | `ollama` |
| `OLLAMA_HOST` | `ollamaHost` | `http://127.0.0.1:11434` |
| `OPENAI_BASE_URL` | `openaiBaseUrl` | `https://api.openai.com/v1` |
| `OPENAI_API_KEY` | `openaiApiKey` | empty |
| `CREW_MODEL` | `model` | `qwen2.5:3b` |
| `CREW_EMBED_MODEL` | `embedModel` | `nomic-embed-text` |
| `CREW_TELEGRAM_TOKEN` | `telegramToken` | empty |

## Providers

Ollama is the default. If it runs locally, there is nothing to configure.

Anything that speaks the OpenAI API also works: LM Studio, llama.cpp server, vLLM, OpenRouter, OpenAI.

```bash
CREW_PROVIDER=openai OPENAI_BASE_URL=http://127.0.0.1:1234/v1 crew start
```

## Security notes

Crew binds to `127.0.0.1` by default. The API has no authentication, so don't expose it to the internet without a reverse proxy that adds it.

Secrets are masked in the settings API.

All state is in `~/.crew/crew.db`. To back it up, copy the file.
