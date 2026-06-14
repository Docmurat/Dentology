-- ============================================================
-- Dentology — схема раздела «Команда» (Supabase)
-- Дополняет supabase/schema.sql. Запусти этот файл целиком
-- в Supabase → SQL Editor ПОСЛЕ основного schema.sql
-- (нужны функции public.is_staff() / public.is_admin()).
-- ============================================================

-- ---------- 1. Таблица сотрудников ----------
create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  position text not null default '',          -- «Главный врач», «Врач-имплантолог», ...
  role text not null default '',              -- расширенная подпись роли
  short_role text not null default '',        -- короткая подпись для компактных карточек
  excerpt text not null default '',           -- краткое описание для карточки
  description text not null default '',        -- полный текст для страницы сотрудника
  image text,
  category text not null default 'doctor'      -- 'doctor' | 'staff'
    check (category in ('doctor', 'staff')),
  is_chief boolean not null default false,     -- главный врач (всегда первый)
  is_lead boolean not null default false,      -- ведущий специалист направления
  lead_direction_slug text,                    -- какое направление ведёт (если is_lead)
  direction_slugs text[] not null default '{}',-- все направления, где участвует
  sort_order int not null default 0,           -- ручная сортировка внутри группы
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists team_members_sort_idx
  on public.team_members (sort_order asc, created_at asc);

-- Не больше одного ведущего специалиста на направление.
create unique index if not exists team_members_one_lead_per_direction
  on public.team_members (lead_direction_slug)
  where is_lead and lead_direction_slug is not null;

-- Не больше одного главного врача.
create unique index if not exists team_members_single_chief
  on public.team_members ((is_chief))
  where is_chief;

-- автообновление updated_at (функция touch_updated_at уже есть в основном schema.sql)
drop trigger if exists team_members_touch_updated_at on public.team_members;
create trigger team_members_touch_updated_at
  before update on public.team_members
  for each row execute function public.touch_updated_at();

-- ---------- 2. RLS ----------
alter table public.team_members enable row level security;

-- читают все (публичный сайт)
drop policy if exists "team_members_select_public" on public.team_members;
create policy "team_members_select_public" on public.team_members
  for select using (true);

-- создают/редактируют сотрудники, удаляет только админ
drop policy if exists "team_members_insert_staff" on public.team_members;
create policy "team_members_insert_staff" on public.team_members
  for insert with check (public.is_staff());

drop policy if exists "team_members_update_staff" on public.team_members;
create policy "team_members_update_staff" on public.team_members
  for update using (public.is_staff()) with check (public.is_staff());

drop policy if exists "team_members_delete_admin" on public.team_members;
create policy "team_members_delete_admin" on public.team_members
  for delete using (public.is_admin());

-- ---------- 3. Хранилище фотографий ----------
insert into storage.buckets (id, name, public)
values ('team-images', 'team-images', true)
on conflict (id) do nothing;

drop policy if exists "team_images_public_read" on storage.objects;
create policy "team_images_public_read" on storage.objects
  for select using (bucket_id = 'team-images');

drop policy if exists "team_images_staff_insert" on storage.objects;
create policy "team_images_staff_insert" on storage.objects
  for insert with check (bucket_id = 'team-images' and public.is_staff());

drop policy if exists "team_images_staff_update" on storage.objects;
create policy "team_images_staff_update" on storage.objects
  for update using (bucket_id = 'team-images' and public.is_staff());

drop policy if exists "team_images_staff_delete" on storage.objects;
create policy "team_images_staff_delete" on storage.objects
  for delete using (bucket_id = 'team-images' and public.is_admin());
