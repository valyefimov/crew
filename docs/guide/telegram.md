# Telegram

You can talk to your crew from your phone.

## Setup

1. Create a bot with [@BotFather](https://t.me/BotFather) and copy the token.
2. Give the token to Crew, either in Settings (Telegram bot token) or like this:

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

| Command | What it does |
| --- | --- |
| `/agents` | Lists the agents. ▶️ marks the current one. |
| `/use Lena` | Switches who you're talking to. |
| `/memory` | Shows what the current agent remembers. |
| `/forget` | Clears this chat's history. Memory stays. |

You can also address an agent inside a message: `Lena, how does this button look?`

Each Telegram chat has its own conversation history, but memory is shared with the web UI. Tell Lena something in Telegram and she knows it in the browser too.
