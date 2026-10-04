# HTTP и WebSocket API

Всё, что делает веб-интерфейс, идёт через этот API — так что Crew можно скриптовать. Базовый URL: `http://localhost:3000/api`.

## Агенты

| Метод | Путь | |
| --- | --- | --- |
| `GET` | `/agents` | Список (с `status`, `memoryCount`, `effectiveModel`) |
| `POST` | `/agents` | Создать — `{ name, role?, personality?, systemPrompt?, model?, avatar? }` |
| `GET` | `/agents/:id` | По id **или имени** |
| `PATCH` | `/agents/:id` | Изменить |
| `DELETE` | `/agents/:id` | Удалить вместе с памятью |
| `GET` | `/agents/:id/export` | Экспорт в JSON |
| `POST` | `/agents/import` | Импорт из JSON |

## Чат

| Метод | Путь | |
| --- | --- | --- |
| `POST` | `/agents/:id/chat` | `{ text }` → итоговый ответ (блокирующий) |
| `GET` | `/agents/:id/messages?channel=web` | История |
| `DELETE` | `/agents/:id/messages` | Очистить веб-чат |

```bash
curl -s localhost:3000/api/agents/Lena/chat \
  -H 'content-type: application/json' \
  -d '{"text":"Напиши хокку про SQLite"}' | jq -r .content
```

## Память и папки

| Метод | Путь | |
| --- | --- | --- |
| `GET` | `/agents/:id/memories?q=` | Список или поиск |
| `POST` | `/agents/:id/memories` | `{ content, type?, importance? }` |
| `DELETE` | `/memories/:id` | |
| `GET` | `/agents/:id/folders` | |
| `POST` | `/agents/:id/folders` | `{ path, mode: "ro" \| "rw" }` |
| `DELETE` | `/folders/:id` | |

## Система

`GET /health`, `GET /status`, `GET /settings`, `PUT /settings`, `GET /templates`, `GET /tasks`.

## WebSocket — `/ws`

Отправить:

```json
{ "type": "chat", "agentId": "…", "text": "привет!" }
```

Получать поток событий (рассылается всем клиентам):

```ts
{ type: "status",  agentId, status: "idle" | "thinking" | "working" | "remembering" }
{ type: "token",   agentId, replyId, delta }
{ type: "tool",    agentId, replyId, name, args, result? }
{ type: "message", agentId, conversationId, message }
{ type: "memory",  agentId, memory }
{ type: "agents" }   // список изменился
```
