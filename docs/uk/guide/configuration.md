# Налаштування

Налаштування беруться з трьох місць, за спаданням пріоритету:

1. **Змінні оточення**
2. **Налаштування в базі** (веб → Налаштування або `crew config set`)
3. Значення за замовчуванням

| Env | Налаштування | За замовчуванням |
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

## Провайдери

**Ollama** (за замовчуванням) — якщо запущена локально, нічого налаштовувати не треба.

**OpenAI-сумісний** — LM Studio, llama.cpp server, vLLM, OpenRouter, OpenAI:

```bash
CREW_PROVIDER=openai OPENAI_BASE_URL=http://127.0.0.1:1234/v1 crew start
```

## Безпека

- За замовчуванням Crew слухає лише `127.0.0.1`. В API немає автентифікації — **не відкривай його в інтернет** без reverse proxy з авторизацією.
- Секрети в API налаштувань маскуються.
- Увесь стан — це `~/.crew/crew.db`. Бекап — просто скопіюй файл.
