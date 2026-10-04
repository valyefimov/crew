# HTTP і WebSocket API

Усе, що робить веб-інтерфейс, іде через цей API — тож Crew можна скриптувати. Базовий URL: `http://localhost:3000/api`.

## Агенти

| Метод | Шлях | |
| --- | --- | --- |
| `GET` | `/agents` | Список (з `status`, `memoryCount`, `effectiveModel`) |
| `POST` | `/agents` | Створити — `{ name, role?, personality?, systemPrompt?, model?, avatar? }` |
| `GET` | `/agents/:id` | За id **або ім'ям** |
| `PATCH` | `/agents/:id` | Змінити |
| `DELETE` | `/agents/:id` | Видалити разом із пам'яттю |
| `GET` | `/agents/:id/export` | Експорт у JSON |
| `POST` | `/agents/import` | Імпорт з JSON |

## Чат

| Метод | Шлях | |
| --- | --- | --- |
| `POST` | `/agents/:id/chat` | `{ text }` → підсумкова відповідь (блокуючий) |
| `GET` | `/agents/:id/messages?channel=web` | Історія |
| `DELETE` | `/agents/:id/messages` | Очистити веб-чат |

```bash
curl -s localhost:3000/api/agents/Lena/chat \
  -H 'content-type: application/json' \
  -d '{"text":"Напиши хоку про SQLite"}' | jq -r .content
```

## Пам'ять і теки

| Метод | Шлях | |
| --- | --- | --- |
| `GET` | `/agents/:id/memories?q=` | Список або пошук |
| `POST` | `/agents/:id/memories` | `{ content, type?, importance? }` |
| `DELETE` | `/memories/:id` | |
| `GET` | `/agents/:id/folders` | |
| `POST` | `/agents/:id/folders` | `{ path, mode: "ro" \| "rw" }` |
| `DELETE` | `/folders/:id` | |

## Система

`GET /health`, `GET /status`, `GET /settings`, `PUT /settings`, `GET /templates`, `GET /tasks`.

## WebSocket — `/ws`

Надіслати:

```json
{ "type": "chat", "agentId": "…", "text": "привіт!" }
```

Отримувати потік подій (розсилається всім клієнтам):

```ts
{ type: "status",  agentId, status: "idle" | "thinking" | "working" | "remembering" }
{ type: "token",   agentId, replyId, delta }
{ type: "tool",    agentId, replyId, name, args, result? }
{ type: "message", agentId, conversationId, message }
{ type: "memory",  agentId, memory }
{ type: "agents" }   // список змінився
```
