-- ============================================================================
-- ОТКАТ скрипта 2026-10-cta-texts.sql: возвращает прежние тексты главной.
--
-- Нужен только при откате сайта на версию до 31.10.2026. Как и прямой
-- скрипт, меняет строку, только если в ней сейчас лежит НОВЫЙ стандартный
-- текст: заголовки, которые вы успели переписать в админке, не трогает.
--
-- Опечатку в цитате врача («кажды») обратно не возвращает.
--
-- Запуск на сервере:
--   node --env-file=.env scripts/run-sql.mjs db/migrations/2026-10-cta-texts-revert.sql
-- ============================================================================

update homepage_content
   set content = jsonb_set(
         content, '{title}',
         to_jsonb('Сохранение зубов в ситуациях, где часто рекомендуют удаление'::text))
 where block_key = 'hero'
   and content->>'title' = 'Вам сказали удалять зуб? Сначала проверим, можно ли его сохранить';

update homepage_content
   set content = jsonb_set(
         content, '{title}', to_jsonb('Система лечения, а не отдельные услуги'::text))
 where block_key = 'directions'
   and content->>'title' = 'Что мы лечим';

update homepage_content
   set content = jsonb_set(
         content, '{title}',
         to_jsonb('Реальные ситуации, в которых решение требует больше, чем стандартного подхода'::text))
 where block_key = 'cases'
   and content->>'title' = 'Зубы, которые удалось сохранить';

update homepage_content
   set content = jsonb_set(
         content, '{title}',
         to_jsonb('Сложные случаи требуют междисциплинарного подхода'::text))
 where block_key = 'team'
   and content->>'title' = 'Кто будет вас лечить';

update homepage_content
   set content = jsonb_set(
         content, '{primaryLabel}', to_jsonb('Записаться на консультацию'::text))
 where block_key = 'cta'
   and content->>'primaryLabel' = 'Отправить снимок на оценку';
