-- ============================================================
-- Lucenta — схема личного кабинета (Supabase)
-- Запусти этот файл целиком в Supabase → SQL Editor.
-- ============================================================

-- ---------- 1. Профили и роли ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role text not null default 'editor' check (role in ('admin', 'editor')),
  created_at timestamptz not null default now()
);

-- При регистрации нового пользователя автоматически создаём профиль (роль editor по умолчанию).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Хелперы для RLS.
create or replace function public.is_staff()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'editor')
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------- 2. Клинические кейсы ----------
create table if not exists public.cases (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text not null default '',
  category text,
  direction_slug text,
  status text,
  doctor_slug text,
  cover_image text,
  image_before text,
  image_after text,
  protocol_images text[] not null default '{}',
  situation text not null default '',
  diagnostics text,
  decision text,
  result text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cases_created_at_idx on public.cases (created_at desc);

-- автообновление updated_at
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists cases_touch_updated_at on public.cases;
create trigger cases_touch_updated_at
  before update on public.cases
  for each row execute function public.touch_updated_at();

-- ---------- 3. RLS ----------
alter table public.profiles enable row level security;
alter table public.cases enable row level security;

-- profiles: каждый видит свой профиль, админ видит все; роли меняет только админ.
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin" on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());

-- cases: читают все (публичный сайт), создают/редактируют сотрудники, удаляет только админ.
drop policy if exists "cases_select_public" on public.cases;
create policy "cases_select_public" on public.cases
  for select using (true);

drop policy if exists "cases_insert_staff" on public.cases;
create policy "cases_insert_staff" on public.cases
  for insert with check (public.is_staff());

drop policy if exists "cases_update_staff" on public.cases;
create policy "cases_update_staff" on public.cases
  for update using (public.is_staff()) with check (public.is_staff());

drop policy if exists "cases_delete_admin" on public.cases;
create policy "cases_delete_admin" on public.cases
  for delete using (public.is_admin());

-- ---------- 4. Хранилище картинок ----------
insert into storage.buckets (id, name, public)
values ('case-images', 'case-images', true)
on conflict (id) do nothing;

-- публичное чтение
drop policy if exists "case_images_public_read" on storage.objects;
create policy "case_images_public_read" on storage.objects
  for select using (bucket_id = 'case-images');

-- загрузка/изменение/удаление — только сотрудники
drop policy if exists "case_images_staff_insert" on storage.objects;
create policy "case_images_staff_insert" on storage.objects
  for insert with check (bucket_id = 'case-images' and public.is_staff());

drop policy if exists "case_images_staff_update" on storage.objects;
create policy "case_images_staff_update" on storage.objects
  for update using (bucket_id = 'case-images' and public.is_staff());

drop policy if exists "case_images_staff_delete" on storage.objects;
create policy "case_images_staff_delete" on storage.objects
  for delete using (bucket_id = 'case-images' and public.is_admin());

-- ============================================================
-- После выполнения: создай пользователя в Authentication → Users,
-- затем назначь ему роль админа:
--   update public.profiles set role = 'admin'
--   where id = (select id from auth.users where email = 'you@example.com');
-- ============================================================
