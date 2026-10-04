# CLI

```bash
npm i -g @vefimov/crew   # або додавай перед командами: npx @vefimov/crew
```

## Сервер

| Команда | |
| --- | --- |
| `crew` / `crew start` | Запустити сервер і веб-інтерфейс на `127.0.0.1:3000` |
| `crew start -p 8080 --host 0.0.0.0` | Свій порт / інтерфейс |
| `crew start --no-telegram` | Не запускати бота |
| `crew dev` | Запустити й відкрити браузер |
| `crew doctor` | Перевірити Node, базу, провайдера й моделі |

## Агенти

| Команда | |
| --- | --- |
| `crew agent create <name> [-t шаблон] [-r роль] [--persona] [--prompt] [-m модель] [-a емодзі] [-f тека...] [--rw]` | Створити |
| `crew agent ls` | Список з кількістю спогадів |
| `crew agent rm <name>` | Видалити разом із пам'яттю |
| `crew agent grant <name> <folder> [--rw]` | Відкрити теку |
| `crew agent export <name> [-o файл]` | Експорт у JSON |
| `crew agent import <file>` | Імпорт з JSON |

## Чат і пам'ять

```bash
crew chat Lena                         # інтерактивно; /memory, /exit
crew chat Lena -m "підсумки стендапу?" # одне повідомлення — зручно для скриптів
crew memory Lena --search "деплой"
crew memory add Lena "Деплой по четвергах" -t decision
```

## Налаштування

```bash
crew config                       # показати
crew config set model qwen2.5:7b
crew config set provider openai
crew config set openaiBaseUrl http://127.0.0.1:1234/v1
```
