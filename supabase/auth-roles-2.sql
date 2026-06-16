-- ============================================================
-- Dentology — доработки модерации.
-- Запусти в Supabase → SQL Editor после auth-roles.sql. Идемпотентно.
-- ============================================================

-- 1. Связь аккаунта врача с карточкой в команде:
--    по нему форма подставляет врача по умолчанию.
alter table public.profiles add column if not exists doctor_slug text;

-- 2. Врач может редактировать СВОЙ кейс, пока он на модерации (published = false).
--    После публикации правки доступны только сотрудникам.
drop policy if exists "cases_update_staff" on public.cases;
drop policy if exists "cases_update_authors" on public.cases;
create policy "cases_update_authors" on public.cases
  for update
  using (
    public.is_staff()
    or (public.is_doctor() and created_by = auth.uid() and published = false)
  )
  with check (
    public.is_staff()
    or (public.is_doctor() and created_by = auth.uid() and published = false)
  );

-- ============================================================
-- Привязать аккаунт врача к его карточке в команде (slug из team_members):
--   update public.profiles set doctor_slug = 'lead-doctor'
--   where id = (select id from auth.users where email = 'doc@example.com');
-- ============================================================
