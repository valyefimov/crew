# HTTP & WebSocket API

Everything the web UI does goes through this API, so you can script Crew too. Base URL: `http://localhost:3000/api`.

## Agents

| Method | Path | |
| --- | --- | --- |
| `GET` | `/agents` | List (with `status`, `memoryCount`, `effectiveModel`) |
| `POST` | `/agents` | Create — `{ name, role?, personality?, systemPrompt?, model?, avatar? }` |
| `GET` | `/agents/:id` | Get by id **or name** |
| `PATCH` | `/agents/:id` | Update |
| `DELETE` | `/agents/:id` | Delete with memory |
| `GET` | `/agents/:id/export` | Export JSON |
| `POST` | `/agents/import` | Import JSON |

## Chat

| Method | Path | |
| --- | --- | --- |
| `POST` | `/agents/:id/chat` | `{ text }` → final assistant message (blocking) |
| `GET` | `/agents/:id/messages?channel=web` | History |
| `DELETE` | `/agents/:id/messages` | Clear the web chat |

```bash
curl -s localhost:3000/api/agents/Lena/chat \
  -H 'content-type: application/json' \
  -d '{"text":"Write a haiku about SQLite"}' | jq -r .content
```

## Memory & folders

| Method | Path | |
| --- | --- | --- |
| `GET` | `/agents/:id/memories?q=` | List or search |
| `POST` | `/agents/:id/memories` | `{ content, type?, importance? }` |
| `DELETE` | `/memories/:id` | |
| `GET` | `/agents/:id/folders` | |
| `POST` | `/agents/:id/folders` | `{ path, mode: "ro" \| "rw" }` |
| `DELETE` | `/folders/:id` | |

## System

`GET /health`, `GET /status`, `GET /settings`, `PUT /settings`, `GET /templates`, `GET /tasks`.

## WebSocket — `/ws`

Send:

```json
{ "type": "chat", "agentId": "…", "text": "hi!" }
```

Receive a stream of events (broadcast to every client):

```ts
{ type: "status",  agentId, status: "idle" | "thinking" | "working" | "remembering" }
{ type: "token",   agentId, replyId, delta }
{ type: "tool",    agentId, replyId, name, args, result? }
{ type: "message", agentId, conversationId, message }
{ type: "memory",  agentId, memory }
{ type: "agents" }   // list changed
```
