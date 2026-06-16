-- ============================================================
-- Dentology — роли (doctor, patient) + модерация кейсов.
-- Запусти целиком в Supabase → SQL Editor ПОСЛЕ schema.sql.
-- Идемпотентно: можно прогонять повторно.
-- ============================================================

-- ---------- 1. Расширяем роли ----------
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('admin', 'editor', 'doctor', 'patient'));

-- хелпер: текущий пользователь — врач
create or replace function public.is_doctor()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'doctor'
  );
$$;

-- ---------- 2. Модерация кейсов ----------
alter table public.cases
  add column if not exists published boolean not null default false;

-- существующие кейсы считаем опубликованными, чтобы не пропали
update public.cases set published = true where published is distinct from true;

-- ---------- 3. RLS для cases ----------
-- читают: опубликованные — все; сотрудники видят всё; автор видит свои (на модерации)
drop policy if exists "cases_select_public" on public.cases;
create policy "cases_select_public" on public.cases
  for select using (
    published or public.is_staff() or created_by = auth.uid()
  );

-- вставка: сотрудники и врачи; не-сотрудник может вставлять только неопубликованное
drop policy if exists "cases_insert_staff" on public.cases;
drop policy if exists "cases_insert_authors" on public.cases;
create policy "cases_insert_authors" on public.cases
  for insert with check (
    (public.is_staff() or public.is_doctor())
    and (public.is_staff() or published = false)
  );

-- редактирование: только сотрудники (врач не редактирует после отправки)
drop policy if exists "cases_update_staff" on public.cases;
create policy "cases_update_staff" on public.cases
  for update using (public.is_staff()) with check (public.is_staff());

-- удаление: только админ
drop policy if exists "cases_delete_admin" on public.cases;
create policy "cases_delete_admin" on public.cases
  for delete using (public.is_admin());

-- ---------- 4. Storage: врачи тоже грузят картинки кейсов ----------
drop policy if exists "case_images_staff_insert" on storage.objects;
drop policy if exists "case_images_authors_insert" on storage.objects;
create policy "case_images_authors_insert" on storage.objects
  for insert with check (
    bucket_id = 'case-images' and (public.is_staff() or public.is_doctor())
  );

-- ============================================================
-- Аккаунты заводит админ:
--   Authentication → Users → Add user (email + пароль),
--   затем назначить роль:
--   update public.profiles set role = 'doctor'   -- или 'patient' / 'admin'
--   where id = (select id from auth.users where email = 'doc@example.com');
-- ============================================================
