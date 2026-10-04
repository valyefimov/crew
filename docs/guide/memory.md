# Memory

Every agent has its own long-term memory. It is what makes a Crew agent a *colleague* rather than a chat window.

## What gets remembered

A memory is a short self-contained statement with a type and an importance from 0 to 1:

| Type | Example |
| --- | --- |
| `fact` | The project database is Postgres 16 |
| `decision` | We decided to keep one SQLite file per workspace |
| `preference` | Val prefers short answers with code |

Memories are created three ways:

- **By the agent** — it calls the `remember` tool when you tell it something worth keeping.
- **Automatically** — after each turn a background job asks the model to extract durable facts from the exchange.
- **By you** — in the Memory tab, with `crew memory add`, or via the API.

Near-duplicates are skipped (cosine similarity ≥ 0.9 with an existing memory).

## How recall works

Crew uses hybrid search inside SQLite:

1. **Full-text** — an FTS5 index with BM25 ranking.
2. **Vectors** — embeddings from your embedding model (`nomic-embed-text` by default), stored as blobs and compared with cosine similarity.
3. Both rankings are merged with reciprocal-rank fusion and nudged by importance and recency.

If no embedding model is available, Crew silently falls back to full-text search and backfills embeddings later.

Memories with importance ≥ 0.8 are *core* — they are always in the agent's context.

## Inspect and edit

```bash
crew memory Lena                     # list
crew memory Lena --search "stack"    # search
crew memory add Lena "Release is on Friday" --type decision
```

In the web UI, open an agent → **Memory**: search, add, and delete memories.

::: tip
Clearing a chat does not clear memory. That's the point.
:::
