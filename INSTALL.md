# Lucenta — раздел «Команда»

Распакуй этот архив поверх КОРНЯ проекта (там, где лежат package.json, app/, lib/).
Папки app, components, lib, scripts, supabase нужно СЛИТЬ с существующими,
файлы — ЗАМЕНИТЬ при запросе.

## Что внутри

Новые файлы:
  lib/team.ts
  components/team/team-card.tsx
  app/team/page.tsx                      -> страница /team (список)
  app/team/[slug]/page.tsx               -> страница /team/<врач>
  supabase/team-schema.sql
  scripts/seed-team.ts
  app/admin/team/actions.ts
  app/admin/team/page.tsx
  app/admin/team/new/page.tsx
  app/admin/team/[slug]/edit/page.tsx
  components/admin/team-form.tsx

Заменяют существующие файлы:
  lib/team-data.ts                       -> расширенный тип (ОБЯЗАТЕЛЬНО заменить)
  components/home/team-preview.tsx       -> чтение из БД (Шаг 3a)
  app/directions/[slug]/page.tsx         -> ведущий из БД (Шаг 3b)

## НЕ входит в архив (правится вручную, Шаг 1 и ссылки админки)

  components/layout/header.tsx           -> ссылки навигации
  lib/constants.ts                       -> навигация мобильного меню
  app/globals.css                        -> плавный скролл к якорю
  app/admin/layout.tsx                   -> ссылка «Команда» в шапке кабинета
  app/admin/page.tsx                     -> карточка «Добавить сотрудника»

## После распаковки

1. Supabase -> SQL Editor -> выполнить supabase/team-schema.sql
2. npx tsx scripts/seed-team.ts
3. Открыть /team