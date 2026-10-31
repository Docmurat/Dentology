# Lucenta — сайт стоматологической практики

Боевой сайт: **https://lucenta.ru**
Админ-панель: **https://lucenta.ru/admin/login**

---

## Быстрый старт (каждый раз при начале работы)

### 1. Поднять туннель к базе данных

База закрыта от интернета и доступна только с сервера, поэтому подключаемся
через SSH-туннель. Открой **PowerShell** и выполни:

```
ssh -i $env:USERPROFILE\.ssh\lucenta -o ServerAliveInterval=30 -L 6432:rc1a-kicoc4psaq9sd2vm.mdb.yandexcloud.net:6432 ubuntu@46.21.246.139
```

Окажешься на сервере. **Это окно не закрывать** — оно держит туннель.
Свернуть можно.

### 2. Запустить проект

Открыть VS Code → File → Open Folder → `C:\dev\dentology`
Terminal → New Terminal, затем:

```
npm run dev
```

Открыть в браузере: http://localhost:3000

### 3. Завершение работы

- В окне с `npm run dev` — `Ctrl+C`
- В окне с туннелем — `exit`

---

## ⚠️ Важно: база данных общая

Локальный сайт и боевой работают с **одной и той же базой**.

- **Код** изолирован: правки не попадают на сайт, пока не выкатишь вручную.
- **Данные** общие: если создать или удалить кейс в локальной админке,
  это сразу отразится на lucenta.ru.

Правь код спокойно, но с данными в админке будь осторожен.

---

## Сохранение изменений в GitHub

```
git add -A
git status --short      # проверить, что уходит
git commit -m "Что изменено"
git push
```

На боевой сайт это **не влияет** — там продолжает работать прежняя версия.

---

## Выкатка на боевой сайт

Только когда локально всё проверено. Открыть **новое** окно PowerShell
(окно с туннелем не трогать):

```
ssh -i $env:USERPROFILE\.ssh\lucenta ubuntu@46.21.246.139
```

Затем одной командой:

```
cd ~/lucenta && git pull && npm ci && npm run build && pm2 restart lucenta
```

Занимает 3–5 минут. После — проверить https://lucenta.ru

---

## Команды на сервере

```
pm2 status              # работает ли сайт
pm2 logs lucenta        # логи (Ctrl+C — выйти)
pm2 restart lucenta     # перезапустить
sudo systemctl reload nginx     # перечитать конфиг Nginx
sudo certbot renew --dry-run    # проверить продление HTTPS
```

Подключение к базе с сервера:

```
export PGPASSWORD='пароль'
psql "host=rc1a-kicoc4psaq9sd2vm.mdb.yandexcloud.net port=6432 sslmode=verify-full dbname=lucenta user=lucenta_app"
```

---

## Если что-то пошло не так

| Симптом | Причина | Что делать |
|---|---|---|
| `getaddrinfo ENOTFOUND rc1a-...` | туннель не поднят | выполнить шаг 1, перезапустить `npm run dev` |
| `Connection terminated due to connection timeout` | туннель отвалился | поднять заново + перезапустить `npm run dev` |
| `FATAL: Turbopack error` / `Persisting failed` | битый кэш dev-сборки | `Ctrl+C`, `Remove-Item -Recurse -Force .next`, `npm run dev` |
| Сайт не обновился после деплоя | не перезапущен процесс | `pm2 restart lucenta` |
| Сайт не открывается | упал процесс | `pm2 status`, затем `pm2 logs lucenta --lines 50` |
| Картинка 404 | файла нет в `public/` на сервере | загрузить фото через админку |

---

## Инфраструктура

| Что | Где |
|---|---|
| Сервер | Yandex Compute Cloud, `46.21.246.139`, Ubuntu 24.04 |
| База данных | Yandex Managed PostgreSQL, `lucenta`, порт 6432 |
| Файлы (фото) | Yandex Object Storage, бакет `lucenta-media` |
| Домен | lucenta.ru (регистратор Руцентр, DNS — Yandex Cloud DNS) |
| HTTPS | Let's Encrypt, продлевается автоматически |
| Процесс | PM2, имя `lucenta`, автозапуск после перезагрузки |
| Веб-сервер | Nginx, проксирует на localhost:3000 |

Бэкапы базы делает Yandex автоматически, хранение 7 дней.

---

## Структура проекта

```
app/            страницы и серверные экшены (Next.js App Router)
  admin/        админ-панель (роли admin, editor)
  doctor/       кабинет врача (роль doctor)
  cabinet/      личный кабинет пациента (роль patient)
components/     React-компоненты
lib/            доступ к данным и утилиты
db/             схема базы и миграции
public/         статические файлы (логотип, og-image)
proxy.ts        защита закрытых разделов
```

Подробности о стеке, ролях и переменных окружения — в `README-ADMIN.md`.

---

## Доступы

Хранятся отдельно (не в репозитории):

- `.env.local` — локальные переменные (в корне проекта, в Git не попадает)
- `.env` на сервере — `~/lucenta/.env`
- Пароль базы, ключи Object Storage, SMTP, Telegram — в личных записях

Вход в админку: `murat.kurdzhiev@yandex.ru`