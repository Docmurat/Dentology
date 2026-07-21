-- ============================================================
-- Lucenta — миграция кейсов: гибкие блоки описания
-- Запусти в Supabase → SQL Editor ПОСЛЕ основного schema.sql.
-- Безопасна к повторному запуску.
-- ============================================================

-- ---------- 1. Новые колонки ----------
alter table public.cases
  add column if not exists doctor_words text,
  add column if not exists content_blocks jsonb not null default '[]'::jsonb;

-- ---------- 2. Перенос старых полей в блоки ----------
-- Для кейсов, где блоки ещё пустые, собираем content_blocks из
-- situation / diagnostics / decision / result (+ старые protocol_images).
-- Порядок сохраняется. Старые колонки НЕ удаляются.
update public.cases c
set content_blocks = sub.blocks
from (
  select x.id, coalesce(jsonb_agg(b.block order by b.ord), '[]'::jsonb) as blocks
  from public.cases x
  cross join lateral (
    values
      (1, case when coalesce(x.situation, '') <> '' then
        jsonb_build_object('title', 'Клиническая ситуация', 'body', x.situation, 'images', '[]'::jsonb, 'float', 'none') end),
      (2, case when coalesce(x.diagnostics, '') <> '' then
        jsonb_build_object('title', 'Диагностика', 'body', x.diagnostics, 'images', '[]'::jsonb, 'float', 'none') end),
      (3, case when coalesce(x.decision, '') <> '' then
        jsonb_build_object('title', 'Принятое решение', 'body', x.decision, 'images', '[]'::jsonb, 'float', 'none') end),
      (4, case when coalesce(x.result, '') <> '' then
        jsonb_build_object('title', 'Результат', 'body', x.result, 'images', '[]'::jsonb, 'float', 'none') end),
      (5, case when coalesce(array_length(x.protocol_images, 1), 0) > 0 then
        jsonb_build_object('title', 'Фото этапов и протокола', 'body', '', 'images', to_jsonb(x.protocol_images), 'float', 'none') end)
  ) as b(ord, block)
  where b.block is not null
  group by x.id
) sub
where c.id = sub.id
  and (c.content_blocks is null or c.content_blocks = '[]'::jsonb);
