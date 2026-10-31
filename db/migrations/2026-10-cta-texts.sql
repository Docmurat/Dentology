-- ============================================================================
-- Тексты с призывом к действию: заголовки главной и подпись главной кнопки.
--
-- Зачем скрипт, если тексты поменяны в коде: значения в коде — только
-- запасные. Как только блок хоть раз сохранили в админке, сайт берёт текст
-- из базы, и правка в коде на него не влияет.
--
-- Скрипт осторожный: каждую строку он меняет, только если в базе сейчас
-- лежит прежний стандартный текст. Если вы уже переписали заголовок
-- по-своему — он останется вашим. Повторный запуск безопасен.
--
-- Запуск на сервере:
--   node --env-file=.env scripts/run-sql.mjs db/migrations/2026-10-cta-texts.sql
-- ============================================================================

-- Главная, первый экран
update homepage_content
   set content = jsonb_set(
         content, '{title}',
         to_jsonb('Вам сказали удалять зуб? Сначала проверим, можно ли его сохранить'::text))
 where block_key = 'hero'
   and content->>'title' = 'Сохранение зубов в ситуациях, где часто рекомендуют удаление';

-- Блок направлений
update homepage_content
   set content = jsonb_set(content, '{title}', to_jsonb('Что мы лечим'::text))
 where block_key = 'directions'
   and content->>'title' = 'Система лечения, а не отдельные услуги';

-- Блок кейсов
update homepage_content
   set content = jsonb_set(
         content, '{title}', to_jsonb('Зубы, которые удалось сохранить'::text))
 where block_key = 'cases'
   and content->>'title' = 'Реальные ситуации, в которых решение требует больше, чем стандартного подхода';

-- Блок команды
update homepage_content
   set content = jsonb_set(content, '{title}', to_jsonb('Кто будет вас лечить'::text))
 where block_key = 'team'
   and content->>'title' = 'Сложные случаи требуют междисциплинарного подхода';

-- Главная кнопка в блоке «Призыв к действию»
update homepage_content
   set content = jsonb_set(
         content, '{primaryLabel}', to_jsonb('Отправить снимок на оценку'::text))
 where block_key = 'cta'
   and content->>'primaryLabel' = 'Записаться на консультацию';

-- Опечатка в цитате ведущего врача на странице направления
-- («кажды зуб» -> «каждый зуб»). Остальной текст цитаты не трогаем.
update team_members
   set lead_quote = replace(lead_quote, 'кажды зуб', 'каждый зуб')
 where lead_quote like '%кажды зуб%';
