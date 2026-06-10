# Личный кабинет Dentology — настройка

Подсистема: вход по логину, раздел `/admin` с ролями (админ/редактор), добавление
клинических кейсов с загрузкой фото (обложка, до/после, протокол) и выбором врача из
существующей базы. Кейсы хранятся в Supabase, публичные страницы читают из неё.

## Структура файлов

```
supabase/schema.sql                 — схема БД, роли, RLS, бакет хранилища
utils/supabase/client.ts            — Supabase для Client Components
utils/supabase/server.ts            — Supabase для Server Components/Actions
utils/supabase/middleware.ts        — обновление сессии + защита /admin
middleware.ts                       — корневой middleware
lib/supabase-public.ts              — клиент для публичного чтения (SSG/ISR)
lib/cases.ts                        — чтение кейсов из БД (getAllCases/getCaseBySlug/getCaseSlugs)
lib/slugify.ts                      — генерация slug (кириллица → латиница)
app/admin/layout.tsx                — защищённый каркас кабинета + проверка роли
app/admin/page.tsx                  — дашборд
app/admin/actions.ts                — выход
app/admin/login/page.tsx            — страница входа
app/admin/login/actions.ts          — вход
app/admin/cases/page.tsx            — список кейсов (открыть/удалить)
app/admin/cases/actions.ts          — создание/удаление кейса + загрузка картинок
app/admin/cases/new/page.tsx        — страница «новый кейс»
app/admin/cases/new/case-form.tsx   — форма создания
app/cases/[slug]/page.tsx           — публичная страница кейса (теперь читает из БД)
scripts/seed.ts                     — разовый перенос существующих 7 кейсов в БД
```

## Шаги настройки

1. **Установить пакеты**

   ```bash
   npm install @supabase/supabase-js @supabase/ssr
   npm install -D tsx        # только для сид-скрипта
   ```

2. **Создать проект Supabase** на supabase.com. В разделе Project → Connect (или
   Settings → API) взять `Project URL` и публичный ключ (`anon` / `publishable`).

3. **Переменные окружения.** Скопировать `.env.local.example` → `.env.local` и заполнить
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Service role-ключ нужен
   только для сид-скрипта.

4. **Схема БД.** Открыть Supabase → SQL Editor, вставить и выполнить `supabase/schema.sql`.
   Он создаёт таблицы `profiles` и `cases`, роли, RLS-политики и публичный бакет
   `case-images`.

5. **Создать первого пользователя.** Supabase → Authentication → Users → Add user
   (email + пароль). Затем в SQL Editor назначить роль администратора:

   ```sql
   update public.profiles set role = 'admin'
   where id = (select id from auth.users where email = 'you@example.com');
   ```

   Редакторам после создания оставляйте роль `editor` (она по умолчанию) либо назначайте
   её так же через `update`.

6. **Закрыть публичную регистрацию.** Authentication → Providers/Sign In → выключить
   «Allow new users to sign up», чтобы аккаунты заводил только админ.

7. **Разрешить домен картинок для next/image.** В `next.config.js` добавить хост Storage:

   ```js
   // next.config.js
   const nextConfig = {
     images: {
       remotePatterns: [
         { protocol: "https", hostname: "<project-ref>.supabase.co", pathname: "/storage/v1/object/public/**" },
       ],
     },
   };
   module.exports = nextConfig;
   ```

8. **Перенести существующие кейсы** (один раз). Добавить в `.env.local`
   `SUPABASE_SERVICE_ROLE_KEY` и выполнить:

   ```bash
   npx tsx scripts/seed.ts
   ```

   Картинки уже перенесённых кейсов остаются в `/public/cases/...` и работают по
   относительным путям. Новые кейсы из кабинета будут грузиться в Supabase Storage.

## Ещё один файл, который нужно поправить вручную

Страница списка `app/cases/page.tsx` (или её контент-компонент) сейчас импортирует
статический `casesData`. Переключите её на БД:

```ts
import { getAllCases } from "@/lib/cases";
// ...
const cases = await getAllCases();
```

Я не трогал этот файл, потому что его точного содержимого у меня нет — но изменение
сводится к замене источника данных, разметка остаётся прежней.

## Как пользоваться

- Вход: `/admin/login`.
- Добавить кейс: `/admin/cases/new` — выбрать врача, направление, заполнить тексты,
  загрузить фото. Пустые поля не показываются на странице кейса.
- Список и удаление: `/admin/cases` (удаление доступно администратору).

## Роли

- **admin** — полный доступ, включая удаление кейсов и смену ролей.
- **editor** — создание и редактирование кейсов, без удаления.

Разграничение задано в RLS-политиках (`supabase/schema.sql`), поэтому работает даже при
прямом обращении к API, а не только в интерфейсе.
