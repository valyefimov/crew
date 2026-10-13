# HTTP and WebSocket API

The web UI does everything through this API, so you can script Crew with it too. The base URL is `http://localhost:3000/api`.

## Agents

| Method | Path | What it does |
| --- | --- | --- |
| `GET` | `/agents` | Lists agents, with `status`, `memoryCount` and `effectiveModel`. |
| `POST` | `/agents` | Creates one: `{ name, role?, personality?, systemPrompt?, model?, avatar? }` |
| `GET` | `/agents/:id` | Gets one by id or by name. |
| `PATCH` | `/agents/:id` | Updates one. |
| `DELETE` | `/agents/:id` | Deletes one along with its memory. |
| `GET` | `/agents/:id/export` | Exports JSON. |
| `POST` | `/agents/import` | Imports JSON. |

## Chat

| Method | Path | What it does |
| --- | --- | --- |
| `POST` | `/agents/:id/chat` | Takes `{ text }` and returns the final assistant message. It blocks until the reply is done. |
| `GET` | `/agents/:id/messages?channel=web` | Returns the history. |
| `DELETE` | `/agents/:id/messages` | Clears the web chat. |

```bash
curl -s localhost:3000/api/agents/Lena/chat \
  -H 'content-type: application/json' \
  -d '{"text":"Write a haiku about SQLite"}' | jq -r .content
```

## Memory and folders

| Method | Path | What it does |
| --- | --- | --- |
| `GET` | `/agents/:id/memories?q=` | Lists memories, or searches them with `q`. |
| `POST` | `/agents/:id/memories` | Adds one: `{ content, type?, importance? }` |
| `DELETE` | `/memories/:id` | Deletes one. |
| `GET` | `/agents/:id/folders` | Lists shared folders. |
| `POST` | `/agents/:id/folders` | Shares one: `{ path, mode: "ro" \| "rw" }` |
| `DELETE` | `/folders/:id` | Stops sharing it. |

## System

`GET /health`, `GET /status`, `GET /settings`, `PUT /settings`, `GET /templates`, `GET /tasks`.

## WebSocket at `/ws`

To chat, send:

```json
{ "type": "chat", "agentId": "…", "text": "hi!" }
```

You receive a stream of events, and every connected client gets all of them:

```ts
{ type: "status",  agentId, status: "idle" | "thinking" | "working" | "remembering" }
{ type: "token",   agentId, replyId, delta }
{ type: "tool",    agentId, replyId, name, args, result? }
{ type: "message", agentId, conversationId, message }
{ type: "memory",  agentId, memory }
{ type: "agents" }   // list changed
```
