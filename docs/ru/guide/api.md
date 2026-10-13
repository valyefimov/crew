# HTTP и WebSocket API

Веб-интерфейс делает всё через этот API, так что Crew можно скриптовать. Базовый URL: `http://localhost:3000/api`.

## Агенты

| Метод | Путь | Что делает |
| --- | --- | --- |
| `GET` | `/agents` | Список агентов с полями `status`, `memoryCount` и `effectiveModel`. |
| `POST` | `/agents` | Создаёт агента: `{ name, role?, personality?, systemPrompt?, model?, avatar? }` |
| `GET` | `/agents/:id` | Возвращает агента по id или по имени. |
| `PATCH` | `/agents/:id` | Изменяет агента. |
| `DELETE` | `/agents/:id` | Удаляет агента вместе с памятью. |
| `GET` | `/agents/:id/export` | Экспорт в JSON. |
| `POST` | `/agents/import` | Импорт из JSON. |

## Чат

| Метод | Путь | Что делает |
| --- | --- | --- |
| `POST` | `/agents/:id/chat` | Принимает `{ text }` и возвращает итоговый ответ. Блокируется, пока ответ не готов. |
| `GET` | `/agents/:id/messages?channel=web` | Возвращает историю. |
| `DELETE` | `/agents/:id/messages` | Очищает веб-чат. |

```bash
curl -s localhost:3000/api/agents/Lena/chat \
  -H 'content-type: application/json' \
  -d '{"text":"Напиши хокку про SQLite"}' | jq -r .content
```

## Память и папки

| Метод | Путь | Что делает |
| --- | --- | --- |
| `GET` | `/agents/:id/memories?q=` | Список воспоминаний или поиск по `q`. |
| `POST` | `/agents/:id/memories` | Добавляет воспоминание: `{ content, type?, importance? }` |
| `DELETE` | `/memories/:id` | Удаляет воспоминание. |
| `GET` | `/agents/:id/folders` | Список открытых папок. |
| `POST` | `/agents/:id/folders` | Открывает папку: `{ path, mode: "ro" \| "rw" }` |
| `DELETE` | `/folders/:id` | Закрывает доступ к папке. |

## Система

`GET /health`, `GET /status`, `GET /settings`, `PUT /settings`, `GET /templates`, `GET /tasks`.

## WebSocket на `/ws`

Чтобы написать агенту, отправь:

```json
{ "type": "chat", "agentId": "…", "text": "привет!" }
```

В ответ идёт поток событий, и каждый подключённый клиент получает их все:

```ts
{ type: "status",  agentId, status: "idle" | "thinking" | "working" | "remembering" }
{ type: "token",   agentId, replyId, delta }
{ type: "tool",    agentId, replyId, name, args, result? }
{ type: "message", agentId, conversationId, message }
{ type: "memory",  agentId, memory }
{ type: "agents" }   // список изменился
```
