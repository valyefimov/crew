---
layout: home

hero:
  name: Crew
  text: Your AI colleagues, at home
  tagline: A lightweight local-first workspace where persistent AI agents live. They remember everything, work with your files, and chat with you in the browser, the terminal and Telegram. One command to start.
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
  - icon: 🏠
    title: Local-first
    details: Runs on your machine with Ollama or any OpenAI-compatible server. One SQLite file, no cloud, no telemetry.
  - icon: 🧠
    title: Long-term memory
    details: Every agent remembers facts, decisions and preferences. Hybrid full-text + vector search, all in SQLite.
  - icon: 🎭
    title: Real characters
    details: Give each colleague a name, a role and a personality. Start from templates — backend dev, designer, PM, writer, coach.
  - icon: 📁
    title: Works with your files
    details: Share a folder read-only or read-write. Agents can list, read and write files — and never escape that folder.
  - icon: ✈️
    title: Telegram built in
    details: Paste a bot token and talk to your crew from your phone. Pairing codes keep strangers out.
  - icon: ⚡
    title: One command
    details: "npx @vefimov/crew — and you have a web UI, a CLI, a REST + WebSocket API and a background worker."
---

<div style="max-width: 1152px; margin: 48px auto 0; padding: 0 24px">

## See it in action

<Demo lang="en" />

</div>
