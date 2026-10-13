# CLI

```bash
npm i -g @vefimov/crew   # або пиши перед командою: npx @vefimov/crew
```

## Сервер

| Команда | Що робить |
| --- | --- |
| `crew` або `crew start` | Запускає сервер і веб-інтерфейс на `127.0.0.1:3000`. |
| `crew start -p 8080 --host 0.0.0.0` | Використовує інший порт чи інтерфейс. |
| `crew start --no-telegram` | Не запускає бота. |
| `crew dev` | Запускає Crew і відкриває браузер. |
| `crew doctor` | Перевіряє Node, базу, провайдера й моделі. |

## Агенти

| Команда | Що робить |
| --- | --- |
| `crew agent create <name> [-t шаблон] [-r роль] [--persona] [--prompt] [-m модель] [-a емодзі] [-f тека...] [--rw]` | Створює агента. |
| `crew agent ls` | Показує агентів і кількість спогадів. |
| `crew agent rm <name>` | Видаляє агента разом із усією пам'яттю. |
| `crew agent grant <name> <folder> [--rw]` | Відкриває теку. |
| `crew agent export <name> [-o файл]` | Експортує в JSON. |
| `crew agent import <file>` | Імпортує з JSON. |

## Чат і пам'ять

```bash
crew chat Lena                         # інтерактивно; усередині працюють /memory і /exit
crew chat Lena -m "підсумки стендапу?" # одне повідомлення, зручно в скриптах
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
