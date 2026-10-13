---
layout: home

hero:
  name: Crew
  text: Your AI colleagues, at home
  tagline: A local-first workspace for AI agents that stick around. Each one remembers what you tell it, can work in folders you share, and answers in the browser, the terminal or Telegram. It starts with one command.
  image:
    src: /logo.svg
    alt: Crew
  actions:
    - theme: brand
      text: Get started
      link: /guide/getting-started
    - theme: alt
      text: GitHub
      link: https://github.com/valyefimov/crew

features:
  - title: Runs on your machine
    details: Uses Ollama or any OpenAI-compatible server and stores everything in one SQLite file. There is no cloud account and no telemetry.
  - title: Memory that lasts
    details: Every agent keeps the facts, decisions and preferences from past chats and finds them again with full-text and vector search.
  - title: Agents with a character
    details: Give each one a name, a role and a personality, or start from a template such as backend developer, designer, product manager, writer or coach.
  - title: Your files, your rules
    details: Share a folder as read-only or read-write. Agents can list, read and write files there, and they can't get out of it.
  - title: Telegram
    details: Paste a bot token and pair your chat with a one-time code. Memory is shared with the web UI.
  - title: One command
    details: "npx @vefimov/crew starts the web UI, a REST and WebSocket API and a background worker. The same package gives you the crew CLI."
---

<div style="max-width: 1152px; margin: 48px auto 0; padding: 0 24px">

## Demo

<Demo lang="en" />

</div>
