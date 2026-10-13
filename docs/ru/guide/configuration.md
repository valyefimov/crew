# Настройки

Crew берёт настройки из трёх мест. Побеждает первое, где есть значение:

1. Переменные окружения
2. Настройки, сохранённые в базе (раздел «Настройки» в вебе или `crew config set`)
3. Значения по умолчанию

| Env | Настройка | По умолчанию |
| --- | --- | --- |
| `CREW_HOME` | нет | `~/.crew` (база называется `crew.db`) |
| `CREW_PORT` | нет | `3000` |
| `CREW_HOST` | нет | `127.0.0.1` |
| `CREW_PROVIDER` | `provider` | `ollama` |
| `OLLAMA_HOST` | `ollamaHost` | `http://127.0.0.1:11434` |
| `OPENAI_BASE_URL` | `openaiBaseUrl` | `https://api.openai.com/v1` |
| `OPENAI_API_KEY` | `openaiApiKey` | пусто |
| `CREW_MODEL` | `model` | `qwen2.5:3b` |
| `CREW_EMBED_MODEL` | `embedModel` | `nomic-embed-text` |
| `CREW_TELEGRAM_TOKEN` | `telegramToken` | пусто |

## Провайдеры

По умолчанию используется Ollama. Если она запущена локально, настраивать ничего не нужно.

Подойдёт и всё, что понимает OpenAI API: LM Studio, llama.cpp server, vLLM, OpenRouter, OpenAI.

```bash
CREW_PROVIDER=openai OPENAI_BASE_URL=http://127.0.0.1:1234/v1 crew start
```

## О безопасности

По умолчанию Crew слушает только `127.0.0.1`. У API нет аутентификации, поэтому не выставляй его в интернет без reverse proxy, который её добавит.

Секреты в API настроек маскируются.

Всё состояние лежит в `~/.crew/crew.db`. Чтобы сделать бэкап, скопируй этот файл.
