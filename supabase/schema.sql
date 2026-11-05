-- =====================================================================
-- ASTRA — Supabase schema
-- Run in Supabase SQL Editor (or `supabase db push`).
-- Designed so new divination disciplines are DATA, not migrations:
-- add a row to `disciplines`, and readings/chat reference it by slug.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------- Disciplines (rooms) ----------
create table if not exists public.disciplines (
  slug          text primary key,               -- 'tarot', 'astrology', ...
  name          text not null,
  name_th       text not null,
  engine        text not null,                  -- calculation engine id (src/lib/engines)
  config        jsonb not null default '{}',     -- spreads, options, palette …
  is_active     boolean not null default true,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now()
);

insert into public.disciplines (slug, name, name_th, engine, sort_order) values
  ('tarot',             'The Tarot Sanctum',         'ห้องไพ่ทาโรต์',          'tarot',      1),
  ('astrology',         'The Celestial Observatory', 'ห้องโหราศาสตร์ตะวันตก',  'western',    2),
  ('thai-astrology',    'The Golden Pavilion',       'ห้องโหราศาสตร์ไทย',      'thai',       3),
  ('chinese-astrology', 'The Jade Hall',             'ห้องดวงจีน',             'bazi',       4),
  ('numerology',        'The Hall of Numbers',       'ห้องเลขศาสตร์',          'numerology', 5),
  ('dreams',            'The Dreaming Mist',         'ห้องทำนายฝัน',           'dreams',     6),
  ('palmistry',         'The Palm Atelier',          'ห้องดูลายมือ',           'palmistry',  7)
on conflict (slug) do nothing;

-- ---------- Personas ----------
create table if not exists public.personas (
  id            text primary key,               -- 'madame-luna'
  name          text not null,
  title_th      text,
  system_prompt text not null,
  specialties   text[] not null default '{}',
  is_active     boolean not null default true
);

insert into public.personas (id, name, title_th, system_prompt, specialties) values
  ('madame-luna',     'Madame Luna',     'ผู้เฝ้าแสงจันทร์',      'see src/lib/data/personas.ts', '{tarot,dreams}'),
  ('the-truth',       'The Truth',       'ผู้ไม่เคยอ้อมค้อม',     'see src/lib/data/personas.ts', '{chinese-astrology,tarot}'),
  ('aurora',          'Aurora',          'แสงอรุณแห่งหัวใจ',      'see src/lib/data/personas.ts', '{dreams,palmistry}'),
  ('professor-orion', 'Professor Orion', 'นักดาราศาสตร์แห่งเหตุผล', 'see src/lib/data/personas.ts', '{astrology,numerology}'),
  ('mystic-raven',    'Mystic Raven',    'เงาแห่งปัญญาโบราณ',     'see src/lib/data/personas.ts', '{thai-astrology,dreams}'),
  ('little-star',     'Little Star',     'ดาวน้อยช่างเล่า',        'see src/lib/data/personas.ts', '{palmistry,numerology}')
on conflict (id) do nothing;

-- ---------- Profiles (1:1 with auth.users) ----------
create table if not exists public.profiles (
  id                 uuid primary key references auth.users(id) on delete cascade,
  display_name       text,
  birth_date         date,
  birth_time         time,
  birth_place        text,
  birth_lat          double precision,
  birth_lng          double precision,
  birth_tz           text,
  favorite_persona   text references public.personas(id),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- ---------- Readings (history / saved results) ----------
create table if not exists public.readings (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  discipline_slug  text not null references public.disciplines(slug),
  persona_id       text references public.personas(id),
  title            text not null,
  summary          text,
  question         text,
  engine_result    jsonb not null default '{}',   -- deterministic calc output
  interpretation   text,                          -- AI interpretation
  is_favorite      boolean not null default false,
  created_at       timestamptz not null default now()
);
create index if not exists readings_user_created_idx on public.readings (user_id, created_at desc);

-- ---------- Chat sessions & messages ----------
create table if not exists public.chat_sessions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  discipline_slug  text not null references public.disciplines(slug),
  persona_id       text not null references public.personas(id),
  reading_id       uuid references public.readings(id) on delete set null,
  created_at       timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id          bigserial primary key,
  session_id  uuid not null references public.chat_sessions(id) on delete cascade,
  role        text not null check (role in ('user','assistant')),
  content     text not null,
  created_at  timestamptz not null default now()
);
create index if not exists chat_messages_session_idx on public.chat_messages (session_id, id);

-- ---------- Daily horoscopes (cache, generated server-side) ----------
create table if not exists public.daily_horoscopes (
  day         date not null,
  sign        text not null,          -- 'aries' … or 'all'
  persona_id  text references public.personas(id),
  content     jsonb not null,
  primary key (day, sign)
);

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table public.profiles        enable row level security;
alter table public.readings        enable row level security;
alter table public.chat_sessions   enable row level security;
alter table public.chat_messages   enable row level security;
alter table public.disciplines     enable row level security;
alter table public.personas        enable row level security;
alter table public.daily_horoscopes enable row level security;

-- public catalogue
create policy "disciplines readable" on public.disciplines for select using (true);
create policy "personas readable"    on public.personas    for select using (true);
create policy "horoscopes readable"  on public.daily_horoscopes for select using (true);

-- owner-only data
create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "own readings" on public.readings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own sessions" on public.chat_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own messages" on public.chat_messages
  for all using (exists (select 1 from public.chat_sessions s where s.id = session_id and s.user_id = auth.uid()))
  with check (exists (select 1 from public.chat_sessions s where s.id = session_id and s.user_id = auth.uid()));

-- keep updated_at fresh
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
