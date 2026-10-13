# CLI

```bash
npm i -g @vefimov/crew   # или пиши перед командой: npx @vefimov/crew
```

## Сервер

| Команда | Что делает |
| --- | --- |
| `crew` или `crew start` | Запускает сервер и веб-интерфейс на `127.0.0.1:3000`. |
| `crew start -p 8080 --host 0.0.0.0` | Использует другой порт или интерфейс. |
| `crew start --no-telegram` | Не запускает бота. |
| `crew dev` | Запускает Crew и открывает браузер. |
| `crew doctor` | Проверяет Node, базу, провайдера и модели. |

## Агенты

| Команда | Что делает |
| --- | --- |
| `crew agent create <name> [-t шаблон] [-r роль] [--persona] [--prompt] [-m модель] [-a эмодзи] [-f папка...] [--rw]` | Создаёт агента. |
| `crew agent ls` | Показывает агентов и число воспоминаний. |
| `crew agent rm <name>` | Удаляет агента вместе со всей памятью. |
| `crew agent grant <name> <folder> [--rw]` | Открывает папку. |
| `crew agent export <name> [-o файл]` | Экспортирует в JSON. |
| `crew agent import <file>` | Импортирует из JSON. |

## Чат и память

```bash
crew chat Lena                         # интерактивно; внутри работают /memory и /exit
crew chat Lena -m "итоги стендапа?"    # одно сообщение, удобно в скриптах
crew memory Lena --search "деплой"
crew memory add Lena "Деплой по четвергам" -t decision
```

## Настройки

```bash
crew config                       # показать
crew config set model qwen2.5:7b
crew config set provider openai
crew config set openaiBaseUrl http://127.0.0.1:1234/v1
```
