# DiscordHub — Landing Page

Одностраничный сайт Discord-сообщества с подписками и рассылкой.
Чистый HTML + CSS + JavaScript, без сборки и зависимостей.

## Как запустить

**Вариант 1 — просто открыть**
Дважды кликните `index.html` — откроется в браузере.

**Вариант 2 — локальный сервер (рекомендуется)**
```bash
# Python 3
python3 -m http.server 8000
# затем откройте http://localhost:8000

# или Node.js
npx serve
```

## Структура

```
index.html        разметка
css/style.css     стили
js/main.js        логика (форма, карусель, анимации)
assets/           иконки
```

## Настройка перед публикацией

Откройте `js/main.js`, вверху — объект `CONFIG`:

- `SUBSCRIBE_ENDPOINT` — ссылка Formspree/Mailchimp для приёма email
  (пока пусто — форма работает в демо-режиме).
- `GUILD_ID` — ID Discord-сервера с включённым Server Widget
  (для живого счётчика онлайн).

Invite-ссылку на Discord поставьте в кнопки «Join the Community».
