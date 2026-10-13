# Memory

Every agent has its own long-term memory. It is what lets an agent pick a conversation back up after you close the chat.

## What gets remembered

A memory is a short, self-contained statement with a type and an importance from 0 to 1:

| Type | Example |
| --- | --- |
| `fact` | The project database is Postgres 16 |
| `decision` | We decided to keep one SQLite file per workspace |
| `preference` | Val prefers short answers with code |

Memories get created in three ways:

- The agent calls the `remember` tool when you tell it something worth keeping.
- After each turn, a background job asks the model to pull out durable facts from the exchange.
- You add them yourself in the Memory tab, with `crew memory add`, or through the API.

If a new memory is nearly identical to an existing one (cosine similarity of 0.9 or more), it is skipped.

## How recall works

Search runs inside SQLite and combines two methods:

1. A full-text index (FTS5) ranked with BM25.
2. Embeddings from your embedding model (`nomic-embed-text` by default), stored as blobs and compared by cosine similarity.

The two rankings are merged with reciprocal-rank fusion, then adjusted a little for importance and age.

If no embedding model is available, Crew falls back to full-text search and fills in the embeddings later.

Memories with an importance of 0.8 or more are treated as core and always go into the agent's context.

## Inspect and edit

```bash
crew memory Lena                     # list
crew memory Lena --search "stack"    # search
crew memory add Lena "Release is on Friday" --type decision
```

In the web UI, open an agent and go to Memory to search, add and delete.

::: tip
Clearing a chat does not clear memory.
:::
