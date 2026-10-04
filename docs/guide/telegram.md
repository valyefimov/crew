# Telegram

Talk to your crew from your phone.

## Setup

1. Create a bot with [@BotFather](https://t.me/BotFather) and copy the token.
2. Give it to Crew — in **Settings → Telegram bot token**, or:

```bash
crew config set telegramToken 123456:ABC-DEF...
# or: CREW_TELEGRAM_TOKEN=... crew start
```

3. Restart Crew. The terminal prints a pairing code:

```
✔ Telegram bot online — send /pair 482913 to it
```

4. Send `/pair 482913` to your bot. Only paired chats can talk to your crew.

## Commands

| Command | |
| --- | --- |
| `/agents` | List colleagues, ▶️ marks the current one |
| `/use Lena` | Switch who you're talking to |
| `/memory` | What the current agent remembers |
| `/forget` | Clear this chat's history (memory stays) |

You can also address someone inline: `Lena, how does this button look?`

Telegram has its own conversation per chat, but **memory is shared** — tell Lena something in Telegram, and she knows it in the web UI too.
