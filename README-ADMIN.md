# Lucenta — техническая документация

Сайт стоматологической практики Lucenta: публичные страницы, админ-панель,
кабинет врача и личный кабинет пациента.

## Стек

| Слой | Технология |
|---|---|
| Приложение | Next.js 16 (App Router), React 19, TypeScript, Tailwind v4 |
| База данных | PostgreSQL (Yandex Managed Service for PostgreSQL) |
| Файлы (фото) | Yandex Object Storage (S3-совместимое) |
| Авторизация | Auth.js (NextAuth v5), вход по email + паролю, сессия в JWT-cookie |
| Почта | SMTP (nodemailer) |
| Уведомления | Telegram Bot API |
| Хостинг | Виртуальная машина Yandex Compute Cloud, Node + PM2 + Nginx |

## Структура

```
app/                 страницы и серверные экшены (App Router)
  admin/             админ-панель (роли admin, editor)
  doctor/            кабинет врача (роль doctor)
  cabinet/           личный кабинет пациента (роль patient)
  api/auth/          служебные роуты Auth.js
components/          React-компоненты
lib/                 доступ к данным и утилиты
  db.ts              пул подключений к PostgreSQL
  auth.ts            конфигурация Auth.js (сервер)
  auth.config.ts     лёгкая конфигурация для proxy.ts (Edge)
  auth-guards.ts     проверки прав: requireStaff / requireAdmin / requireDoctor
  storage.ts         загрузка файлов в Object Storage
  sql-helpers.ts     сборка INSERT/UPDATE, обработка jsonb
proxy.ts             защита закрытых разделов (в Next 16 вместо middleware.ts)
```

## Роли и права

Права проверяются **в коде** (в серверных экшенах и в `proxy.ts`), а не на уровне БД.

| Роль | Доступ |
|---|---|
| `admin` | всё, включая удаление и управление аккаунтами |
| `editor` | админ-панель без удаления и без управления аккаунтами |
| `doctor` | кабинет врача: свои кейсы (на модерацию), курсы — если отмечен «спикер» |
| `patient` | личный кабинет |

Аккаунты хранятся в таблице `profiles`: `email`, `password_hash` (bcrypt),
`role`, `doctor_slug` (привязка к карточке в команде).

## Таблицы

`profiles`, `team_members`, `directions`, `cases`, `courses`, `reviews`,
`review_contacts`, `homepage_blocks`, `homepage_content`.

Схема — в `db/schema.sql`.

## Переменные окружения

Локально — `.env.local`, на сервере — `.env`. В репозиторий не попадают.

```
# База данных
PGHOST=            # localhost при работе через SSH-туннель, FQDN на сервере
PGPORT=6432
PGDATABASE=lucenta
PGUSER=lucenta_app
PGPASSWORD=
PGSSLROOTCERT=     # путь к CA-сертификату (только на сервере)

# Хранилище файлов
S3_ENDPOINT=https://storage.yandexcloud.net
S3_REGION=ru-central1
S3_BUCKET=lucenta-media
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=

# Авторизация
AUTH_SECRET=       # случайная строка, openssl rand -base64 32
AUTH_URL=          # http://localhost:3000 локально, https://lucenta.ru на сервере
AUTH_TRUST_HOST=true

# Почта
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
CONTACT_TO_EMAIL=
CONTACT_FROM_EMAIL=

# Telegram
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

## Локальная разработка

База закрыта от интернета, поэтому подключаемся через SSH-туннель.

1. В отдельном окне терминала:

```
ssh -o ServerAliveInterval=30 -L 6432:<FQDN базы>:6432 ubuntu@<IP сервера>
```

2. В `.env.local` указать `PGHOST=localhost`.
3. Запустить:

```
npm install
npm run dev
```

Если появляется `Connection terminated due to connection timeout` — оборвался
туннель: поднять заново и перезапустить `npm run dev`.

## Деплой

```
git pull
npm ci
npm run build
pm2 restart lucenta
```

Nginx проксирует запросы на `localhost:3000`, HTTPS — сертификат Let's Encrypt.

## Загрузка изображений

Фото загружаются через серверный экшен `app/admin/upload-actions.ts`
(ключи хранилища в браузер не попадают). Права на папки:

- `admin` / `editor` — `case-images`, `team-images`, `review-images`
- `doctor` — `case-images`
- `doctor` со флагом «спикер» — плюс `team-images/courses`

Перед загрузкой изображения обрезаются и сжимаются на клиенте
(`lib/crop-image.ts`, `lib/image-compress.ts`).