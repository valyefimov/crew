# Быстрый старт

Crew это одно Node.js-приложение. Всё лежит в одном файле SQLite, а с моделью оно общается через [Ollama](https://ollama.com) или любой OpenAI-совместимый сервер.

## Что нужно

Нужен Node.js 22.13 или новее. Crew использует встроенный `node:sqlite`, поэтому ничего компилировать не придётся.

Ещё нужна Ollama с чат-моделью и моделью эмбеддингов:

```bash
ollama pull qwen2.5:3b
ollama pull nomic-embed-text
```

Подойдёт любая модель с поддержкой tool calling. На ноутбуке разумно начать с `qwen2.5:3b` или `llama3.2:3b`. Если оперативки больше, попробуй `qwen2.5:7b` или `qwen3:8b`.

## Запуск

```bash
npx @vefimov/crew
```

Открой [http://localhost:3000](http://localhost:3000) и создай первого агента.

Чтобы появилась команда `crew`, поставь пакет глобально:

```bash
npm i -g @vefimov/crew
crew start --open
```

## Проверка окружения

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

## Первый агент

В веб-интерфейсе нажми «Новый коллега», выбери шаблон и нажми «Создать».

Из терминала:

```bash
crew agent create Artem --template backend --folder ~/code/my-api
crew chat Artem
```

Расскажи Артёму что-нибудь о себе или о проекте. Закрой чат и открой завтра: Артём всё помнит.

## Docker

```bash
docker compose -f docker/docker-compose.yml up
```

Поднимутся Crew и Ollama рядом. Данные лежат в volume `crew-data`.

## Из исходников

```bash
git clone https://github.com/valyefimov/crew
cd crew
pnpm install
pnpm dev        # API на :3001, веб-интерфейс с hot reload на :5173
```
