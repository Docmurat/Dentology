-- ============================================================================
-- Файлы к заявкам (снимки пациентов из формы «Отправить снимок на оценку»).
--
-- Сами файлы лежат в Object Storage закрытыми объектами (без публичной
-- ссылки), здесь — только ключ и описание. Отдаёт их сервер сотруднику
-- после проверки прав.
--
-- lead_id хранится текстом и без внешнего ключа сознательно: таблица leads
-- создавалась вне schema.sql, и тип её id здесь не зафиксирован. Удаление
-- файлов вместе с заявкой делает код (app/admin/leads/actions.ts).
--
-- Запуск на сервере:
--   node --env-file=.env scripts/run-sql.mjs db/migrations/2026-10-lead-files.sql
-- Повторный запуск безопасен.
-- ============================================================================

create table if not exists lead_files (
  id           uuid primary key,
  lead_id      text not null,
  -- Номер места файла в заявке: 1, 2, 3. Вместе с lead_id уникален —
  -- так лимит файлов держит сама база, даже при одновременных запросах.
  slot         smallint not null,
  storage_key  text not null,
  file_name    text not null default '',
  content_type text not null,
  size_bytes   integer not null,
  created_at   timestamptz not null default now()
);

create unique index if not exists lead_files_lead_slot_idx
  on lead_files (lead_id, slot);
