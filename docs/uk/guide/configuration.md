# Налаштування

Crew бере налаштування з трьох місць. Перемагає перше, де є значення:

1. Змінні оточення
2. Налаштування, збережені в базі (розділ «Налаштування» у вебі або `crew config set`)
3. Значення за замовчуванням

| Env | Налаштування | За замовчуванням |
| --- | --- | --- |
| `CREW_HOME` | немає | `~/.crew` (база називається `crew.db`) |
| `CREW_PORT` | немає | `3000` |
| `CREW_HOST` | немає | `127.0.0.1` |
| `CREW_PROVIDER` | `provider` | `ollama` |
| `OLLAMA_HOST` | `ollamaHost` | `http://127.0.0.1:11434` |
| `OPENAI_BASE_URL` | `openaiBaseUrl` | `https://api.openai.com/v1` |
| `OPENAI_API_KEY` | `openaiApiKey` | порожньо |
| `CREW_MODEL` | `model` | `qwen2.5:3b` |
| `CREW_EMBED_MODEL` | `embedModel` | `nomic-embed-text` |
| `CREW_TELEGRAM_TOKEN` | `telegramToken` | порожньо |

## Провайдери

За замовчуванням використовується Ollama. Якщо вона запущена локально, налаштовувати нічого не треба.

Підійде й усе, що розуміє OpenAI API: LM Studio, llama.cpp server, vLLM, OpenRouter, OpenAI.

```bash
CREW_PROVIDER=openai OPENAI_BASE_URL=http://127.0.0.1:1234/v1 crew start
```

## Про безпеку

За замовчуванням Crew слухає лише `127.0.0.1`. В API немає автентифікації, тому не виставляй його в інтернет без reverse proxy, який її додасть.

Секрети в API налаштувань маскуються.

Увесь стан лежить у `~/.crew/crew.db`. Щоб зробити бекап, скопіюй цей файл.
