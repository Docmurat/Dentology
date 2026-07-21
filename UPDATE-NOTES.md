# Lucenta — сводка изменений (перенести поверх репозитория)

Распакуй содержимое поверх корня проекта, сливая папки и заменяя файлы.
Пути в архиве 1:1 совпадают с путями в репозитории.

## 1. SQL (Supabase → SQL Editor), порядок выполнения
Запускать по очереди. То, что уже выполнял раньше, повторно можно не трогать
(скрипты идемпотентны).
1. schema.sql            — базовая схема (выполнена давно)
2. cases-blocks.sql      — блоки описания + doctor_words (выполнена)
3. team-schema.sql       — команда (выполнена, если используешь раздел «Команда»)
4. auth-roles.sql        — роли doctor/patient + флаг published + RLS (ВЫПОЛНЕНА)
5. auth-roles-2.sql      — profiles.doctor_slug + право врача править свой черновик (ВЫПОЛНИТЬ)

## 2. npm
- react-easy-crop  (для кропа картинок в админке)

## 3. Роли и вход
- lib/role-home.ts                     (новый) — куда вести после входа
- app/admin/login/actions.ts           — вход теперь редиректит по роли
- app/admin/actions.ts                 — выход на главную сайта

## 4. Врач и пациент
- app/doctor/layout.tsx                (новый)
- app/doctor/page.tsx                  (новый) — свои кейсы + статусы
- app/doctor/actions.ts                (новый) — создание/правка на модерации
- app/doctor/cases/new/page.tsx        (новый) — новый кейс, врач = он сам
- app/doctor/cases/[slug]/edit/page.tsx(новый) — правка своего черновика
- app/cabinet/layout.tsx               (новый) — кабинет пациента
- app/cabinet/page.tsx                 (новый) — заглушка

## 5. Модерация кейсов (админ)
- app/admin/cases/page.tsx             — секции «На модерации» / «Опубликованные»
- app/admin/cases/actions.ts           — создание сразу публикует; approveCase
- app/admin/cases/[slug]/edit/page.tsx (новый) — правки админа
- app/cases/[slug]/preview/page.tsx    (новый) — предпросмотр «как на сайте»
- components/cases/case-view.tsx       (новый) — общая вёрстка кейса
- app/cases/[slug]/page.tsx            — публичная страница на CaseView
- lib/cases.ts                         — + getCaseBySlugAuthed
- components/admin/case-form.tsx       — проп lockedDoctorSlug + гибкий экшен

## 6. Убраны category и status у кейсов (классификация — по направлению)
- lib/cases-data.ts, lib/directions.ts (новый), lib/cases.ts,
  app/admin/cases/actions.ts, components/admin/case-form.tsx,
  components/home/cases-preview.tsx, components/cases/cases-page-content.tsx,
  app/directions/[slug]/page.tsx

## Привязка аккаунта врача к карточке (для автоподстановки врача)
update public.profiles set doctor_slug = 'lead-doctor'
where id = (select id from auth.users where email = 'doc@example.com');

## ПОКА НЕ СДЕЛАНО
- Кнопка «Войти» в шапке сайта — нужен ваш текущий components/layout/header.tsx.
  Файл header.tsx в архиве — версия с навигацией БЕЗ кнопки входа (как раньше).
