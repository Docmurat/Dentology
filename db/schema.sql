-- ============================================================================
-- Lucenta — схема БД для PostgreSQL (Yandex Managed PostgreSQL)
-- Собрана 1:1 по дампу Supabase, но БЕЗ RLS и без auth.users.
-- Отличия от Supabase-версии:
--   * profiles дополнена email + password_hash (вход через Auth.js);
--   * внешние ключи на auth.users убраны; created_by остаётся как uuid без FK;
--   * добавлены триггеры updated_at.
-- Структура таблиц, PK, уникальные ключи и индексы — как в оригинале.
-- ============================================================================

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ----------------------------------------------------------------------------
-- profiles (пользователи входа: админ/редактор/врач/пациент)
-- Дополнена email + password_hash для Auth.js (в Supabase они жили в auth.users)
-- ----------------------------------------------------------------------------
create table profiles (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique,
  password_hash text not null,
  full_name     text,
  role          text not null default 'editor'
                check (role in ('admin','editor','doctor','patient')),
  doctor_slug   text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index profiles_role_idx on profiles (role);
create trigger profiles_updated before update on profiles
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- team_members
-- ----------------------------------------------------------------------------
create table team_members (
  id                  uuid primary key default gen_random_uuid(),
  slug                text not null unique,
  name                text not null,
  "position"          text not null default '',
  role                text not null default '',
  short_role          text not null default '',
  excerpt             text not null default '',
  description         text not null default '',
  image               text,
  category            text not null default 'doctor'
                      check (category in ('doctor','staff')),
  is_chief            boolean not null default false,
  is_lead             boolean not null default false,
  lead_direction_slug text,
  direction_slugs     text[] not null default '{}',
  sort_order          integer not null default 0,
  created_by          uuid,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  stats               jsonb default '[]'::jsonb,
  approach            text,
  focus_points        text[] default '{}'::text[],
  visit_points        text[] default '{}'::text[],
  quote               text,
  courses             text[] default '{}'::text[],
  diploma_image       text,
  name_genitive       text,
  show_on_homepage    boolean not null default true,
  lead_image          text,
  lead_quote          text,
  home_image          text,
  home_quote          text,
  doctor_quote        text,
  is_speaker          boolean not null default false
);
-- один ведущий на направление и только один главный врач
create unique index team_members_one_lead_per_direction
  on team_members (lead_direction_slug)
  where (is_lead and lead_direction_slug is not null);
create unique index team_members_single_chief
  on team_members (is_chief) where (is_chief);
create index team_members_sort_idx on team_members (sort_order, created_at);
create trigger team_members_updated before update on team_members
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- directions (PK = slug)
-- ----------------------------------------------------------------------------
create table directions (
  slug             text primary key,
  title            text not null,
  short            text not null default '',
  description      text not null default '',
  hero_description text not null default '',
  featured         boolean not null default false,
  collage_role     text not null default 'small'
                   check (collage_role in ('featured','large','small')),
  sort_order       integer not null default 0,
  problems         text[] not null default '{}',
  fears            text[] not null default '{}',
  approach         text[] not null default '{}',
  insight_title    text,
  insight_text     text[] not null default '{}',
  faq              jsonb not null default '[]',
  archived         boolean not null default false,
  created_at       timestamptz not null default now()
);
create index directions_sort_idx on directions (sort_order);

-- ----------------------------------------------------------------------------
-- cases (PK = id, slug unique)
-- ----------------------------------------------------------------------------
create table cases (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  title           text not null,
  excerpt         text not null default '',
  category        text,
  direction_slug  text,
  status          text,
  doctor_slug     text,
  cover_image     text,
  image_before    text,
  image_after     text,
  protocol_images text[] not null default '{}',
  situation       text not null default '',
  diagnostics     text,
  decision        text,
  result          text,
  created_by      uuid,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  doctor_words    text,
  content_blocks  jsonb not null default '[]',
  published       boolean not null default false
);
create index cases_created_at_idx on cases (created_at desc);
create index cases_published_idx on cases (published);
create trigger cases_updated before update on cases
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- courses (PK = slug)
-- ----------------------------------------------------------------------------
create table courses (
  slug                text primary key,
  title               text not null,
  description         text not null default '',
  doctor_slug         text,
  formats             text not null default '',
  published           boolean not null default true,
  sort_order          integer not null default 0,
  created_at          timestamptz not null default now(),
  metric_treated      text,
  metric_radical      integer,
  direction_slugs     text[] default '{}'::text[],
  metrics             jsonb default '[]'::jsonb,
  effectiveness_percent integer,
  effectiveness_text  text,
  quote               text,
  quote_image         text,
  learning_types      text[] default '{}'::text[],
  audience_title      text,
  audience_text       text,
  outcomes_title      text,
  outcomes_text       text,
  instructor_bio      text,
  cta_note            text,
  faq                 jsonb default '[]'::jsonb,
  program             jsonb default '[]'::jsonb,
  learning_formats    jsonb default '[]'::jsonb,
  archived            boolean default false,
  show_metrics        boolean default true,
  show_audience       boolean default true,
  show_outcomes       boolean default true,
  show_quote          boolean default true,
  show_program        boolean default true,
  show_faq            boolean default true,
  show_effectiveness  boolean default true,
  show_bio            boolean default true,
  show_cta            boolean default true,
  created_by          uuid
);
create index courses_published_idx on courses (published);

-- ----------------------------------------------------------------------------
-- reviews (PK = id)
-- ----------------------------------------------------------------------------
create table reviews (
  id              uuid primary key default gen_random_uuid(),
  author          text not null,
  city            text,
  text            text not null,
  direction_slug  text,
  rating          integer,
  status          text not null default 'pending'
                  check (status in ('pending','approved','rejected')),
  verified        boolean not null default false,
  created_at      timestamptz not null default now(),
  instagram       text,
  doctor_slug     text,
  image           text,
  review_date     date default now(),
  direction_slugs text[] default '{}'::text[],
  sort_order      integer,
  course_slug     text,
  course_title    text,
  pros            text,
  cons            text,
  wishes          text
);
create index reviews_status_idx on reviews (status);
create index reviews_doctor_idx on reviews (doctor_slug);
create index reviews_course_idx on reviews (course_slug);

-- телефоны к отзывам (PK = review_id)
create table review_contacts (
  review_id uuid primary key references reviews (id) on delete cascade,
  phone     text
);

-- ----------------------------------------------------------------------------
-- homepage_blocks (какие блоки показывать и в каком порядке; PK = block_key)
-- ----------------------------------------------------------------------------
create table homepage_blocks (
  block_key  text primary key,
  enabled    boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);
create trigger homepage_blocks_updated before update on homepage_blocks
  for each row execute function set_updated_at();

-- homepage_content (контент блоков и заголовки страниц; PK = block_key)
create table homepage_content (
  block_key  text primary key,
  content    jsonb not null default '{}',
  updated_at timestamptz not null default now()
);
create trigger homepage_content_updated before update on homepage_content
  for each row execute function set_updated_at();
