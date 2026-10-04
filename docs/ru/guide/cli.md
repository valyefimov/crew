# CLI

```bash
npm i -g @vefimov/crew   # или добавляй перед командами: npx @vefimov/crew
```

## Сервер

| Команда | |
| --- | --- |
| `crew` / `crew start` | Запустить сервер и веб-интерфейс на `127.0.0.1:3000` |
| `crew start -p 8080 --host 0.0.0.0` | Свой порт / интерфейс |
| `crew start --no-telegram` | Не запускать бота |
| `crew dev` | Запустить и открыть браузер |
| `crew doctor` | Проверить Node, базу, провайдера и модели |

## Агенты

| Команда | |
| --- | --- |
| `crew agent create <name> [-t шаблон] [-r роль] [--persona] [--prompt] [-m модель] [-a эмодзи] [-f папка...] [--rw]` | Создать |
| `crew agent ls` | Список с количеством воспоминаний |
| `crew agent rm <name>` | Удалить вместе с памятью |
| `crew agent grant <name> <folder> [--rw]` | Открыть папку |
| `crew agent export <name> [-o файл]` | Экспорт в JSON |
| `crew agent import <file>` | Импорт из JSON |

## Чат и память

```bash
crew chat Lena                         # интерактивно; /memory, /exit
crew chat Lena -m "итоги стендапа?"    # одно сообщение — удобно для скриптов
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
