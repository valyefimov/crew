# Настройки

Настройки берутся из трёх мест, по убыванию приоритета:

1. **Переменные окружения**
2. **Настройки в базе** (веб → Настройки или `crew config set`)
3. Значения по умолчанию

| Env | Настройка | По умолчанию |
| --- | --- | --- |
| `CREW_HOME` | — | `~/.crew` (база: `crew.db`) |
| `CREW_PORT` | — | `3000` |
| `CREW_HOST` | — | `127.0.0.1` |
| `CREW_PROVIDER` | `provider` | `ollama` |
| `OLLAMA_HOST` | `ollamaHost` | `http://127.0.0.1:11434` |
| `OPENAI_BASE_URL` | `openaiBaseUrl` | `https://api.openai.com/v1` |
| `OPENAI_API_KEY` | `openaiApiKey` | — |
| `CREW_MODEL` | `model` | `qwen2.5:3b` |
| `CREW_EMBED_MODEL` | `embedModel` | `nomic-embed-text` |
| `CREW_TELEGRAM_TOKEN` | `telegramToken` | — |

## Провайдеры

**Ollama** (по умолчанию) — если запущена локально, настраивать ничего не нужно.

**OpenAI-совместимый** — LM Studio, llama.cpp server, vLLM, OpenRouter, OpenAI:

```bash
CREW_PROVIDER=openai OPENAI_BASE_URL=http://127.0.0.1:1234/v1 crew start
```

## Безопасность

- По умолчанию Crew слушает только `127.0.0.1`. У API нет аутентификации — **не открывай его в интернет** без reverse proxy с авторизацией.
- Секреты в API настроек маскируются.
- Всё состояние — это `~/.crew/crew.db`. Бэкап — просто скопируй файл.
