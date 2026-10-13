# HTTP і WebSocket API

Веб-інтерфейс робить усе через цей API, тож Crew можна скриптувати. Базовий URL: `http://localhost:3000/api`.

## Агенти

| Метод | Шлях | Що робить |
| --- | --- | --- |
| `GET` | `/agents` | Список агентів з полями `status`, `memoryCount` і `effectiveModel`. |
| `POST` | `/agents` | Створює агента: `{ name, role?, personality?, systemPrompt?, model?, avatar? }` |
| `GET` | `/agents/:id` | Повертає агента за id або за іменем. |
| `PATCH` | `/agents/:id` | Змінює агента. |
| `DELETE` | `/agents/:id` | Видаляє агента разом із пам'яттю. |
| `GET` | `/agents/:id/export` | Експорт у JSON. |
| `POST` | `/agents/import` | Імпорт з JSON. |

## Чат

| Метод | Шлях | Що робить |
| --- | --- | --- |
| `POST` | `/agents/:id/chat` | Приймає `{ text }` і повертає підсумкову відповідь. Блокується, доки відповідь не готова. |
| `GET` | `/agents/:id/messages?channel=web` | Повертає історію. |
| `DELETE` | `/agents/:id/messages` | Очищає веб-чат. |

```bash
curl -s localhost:3000/api/agents/Lena/chat \
  -H 'content-type: application/json' \
  -d '{"text":"Напиши хоку про SQLite"}' | jq -r .content
```

## Пам'ять і теки

| Метод | Шлях | Що робить |
| --- | --- | --- |
| `GET` | `/agents/:id/memories?q=` | Список спогадів або пошук за `q`. |
| `POST` | `/agents/:id/memories` | Додає спогад: `{ content, type?, importance? }` |
| `DELETE` | `/memories/:id` | Видаляє спогад. |
| `GET` | `/agents/:id/folders` | Список відкритих тек. |
| `POST` | `/agents/:id/folders` | Відкриває теку: `{ path, mode: "ro" \| "rw" }` |
| `DELETE` | `/folders/:id` | Закриває доступ до теки. |

## Система

`GET /health`, `GET /status`, `GET /settings`, `PUT /settings`, `GET /templates`, `GET /tasks`.

## WebSocket на `/ws`

Щоб написати агентові, надішли:

```json
{ "type": "chat", "agentId": "…", "text": "привіт!" }
```

У відповідь іде потік подій, і кожен підключений клієнт отримує їх усі:

```ts
{ type: "status",  agentId, status: "idle" | "thinking" | "working" | "remembering" }
{ type: "token",   agentId, replyId, delta }
{ type: "tool",    agentId, replyId, name, args, result? }
{ type: "message", agentId, conversationId, message }
{ type: "memory",  agentId, memory }
{ type: "agents" }   // список змінився
```
