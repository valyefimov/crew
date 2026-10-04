# Швидкий старт

Crew — це один Node.js-застосунок. Усе зберігається в одному файлі SQLite, а з моделлю він спілкується через [Ollama](https://ollama.com) (або будь-який OpenAI-сумісний сервер).

## Що потрібно

- **Node.js 22.13+** — Crew використовує вбудований `node:sqlite`, тож нічого компілювати не треба.
- **Ollama** з чат-моделлю та моделлю ембедингів:

```bash
ollama pull qwen2.5:3b
ollama pull nomic-embed-text
```

Підійде будь-яка модель з підтримкою tool calling. На ноутбуці добре почати з `qwen2.5:3b` або `llama3.2:3b`; якщо пам'яті більше — спробуй `qwen2.5:7b` чи `qwen3:8b`.

## Запуск

```bash
npx @vefimov/crew
```

Відкрий [http://localhost:3000](http://localhost:3000) і створи першого колегу.

Або встанови глобально, щоб з'явилася команда `crew`:

```bash
npm i -g @vefimov/crew
crew start --open
```

## Перевірка оточення

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

## Перший агент

У веб-інтерфейсі: **Новий колега → обери шаблон → Створити**.

З термінала:

```bash
crew agent create Artem --template backend --folder ~/code/my-api
crew chat Artem
```

Розкажи Артему щось про себе чи про проєкт. Закрий чат, відкрий завтра — він досі пам'ятає.

## Docker

```bash
docker compose -f docker/docker-compose.yml up
```

Підніме Crew і Ollama поруч. Дані лежать у volume `crew-data`.

## З вихідних кодів

```bash
git clone https://github.com/valyefimov/crew
cd crew
pnpm install
pnpm dev        # API на :3001, веб-інтерфейс з hot reload на :5173
```
