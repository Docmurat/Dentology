-- ============================================================================
-- Замена домена картинок: Supabase Storage -> Yandex Object Storage
-- Старый префикс: https://dkjlcdnrtrxrikxvgpxl.supabase.co/storage/v1/object/public/
-- Новый префикс:  https://storage.yandexcloud.net/lucenta-media/
-- Пути внутри (case-images/..., team-images/..., review-images/...) сохранены.
-- Безопасно запускать повторно.
-- ============================================================================

\set old 'https://dkjlcdnrtrxrikxvgpxl.supabase.co/storage/v1/object/public/'
\set new 'https://storage.yandexcloud.net/lucenta-media/'

begin;

-- cases: обложка, до/после, массив протокола, блоки (jsonb)
update cases set
  cover_image  = replace(cover_image,  :'old', :'new'),
  image_before = replace(image_before, :'old', :'new'),
  image_after  = replace(image_after,  :'old', :'new');

update cases set protocol_images = (
  select array_agg(replace(x, :'old', :'new')) from unnest(protocol_images) as x
) where protocol_images is not null and array_length(protocol_images, 1) > 0;

update cases
   set content_blocks = replace(content_blocks::text, :'old', :'new')::jsonb
 where content_blocks::text like '%' || :'old' || '%';

-- team_members: фото, диплом, фото ведущего и на главной
update team_members set
  image         = replace(image,         :'old', :'new'),
  diploma_image = replace(diploma_image, :'old', :'new'),
  lead_image    = replace(lead_image,    :'old', :'new'),
  home_image    = replace(home_image,    :'old', :'new');

-- courses: картинка цитаты
update courses set quote_image = replace(quote_image, :'old', :'new');

-- reviews: фото автора
update reviews set image = replace(image, :'old', :'new');

-- homepage_content: фото в блоках главной (jsonb)
update homepage_content
   set content = replace(content::text, :'old', :'new')::jsonb
 where content::text like '%' || :'old' || '%';

commit;

-- Проверка: не осталось ли где-то старого домена
select 'cases' as t, count(*) from cases
  where coalesce(cover_image,'') || coalesce(image_before,'') || coalesce(image_after,'')
        || coalesce(content_blocks::text,'') like '%supabase.co%'
union all
select 'team_members', count(*) from team_members
  where coalesce(image,'') || coalesce(diploma_image,'') || coalesce(lead_image,'')
        || coalesce(home_image,'') like '%supabase.co%'
union all
select 'reviews', count(*) from reviews where coalesce(image,'') like '%supabase.co%'
union all
select 'courses', count(*) from courses where coalesce(quote_image,'') like '%supabase.co%'
union all
select 'homepage_content', count(*) from homepage_content
  where content::text like '%supabase.co%';
