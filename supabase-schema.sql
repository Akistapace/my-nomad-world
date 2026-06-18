-- Run this in Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → paste & run

-- Users (extends auth.users)
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null,
  level int not null default 1,
  xp int not null default 0,
  xp_to_next int not null default 1000,
  rank int not null default 9999,
  total_pins int not null default 0,
  character jsonb not null default '{"skin":"adventurer","color":"blue","hat":false,"backpack":false}',
  joined_at date not null default now(),
  created_at timestamptz not null default now(),
  is_admin boolean not null default false,
  is_banned boolean not null default false
);

-- Countries visited by user
create table public.countries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  code text not null,           -- "BRA", "THA"
  name text not null,
  flag_emoji text not null default '🌍',
  continent text not null default '',
  visited boolean not null default true,
  visited_at date,
  created_at timestamptz not null default now(),
  unique(user_id, code)
);

-- Pins on map
create table public.pins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  country_code text not null,
  type text not null,           -- travel/hotel/cafe/restaurant/activity/home
  name text not null,
  lat float not null,
  lng float not null,
  note text,
  created_at timestamptz not null default now()
);

-- Friendships (bidirectional pair)
create table public.friends (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  friend_id uuid references public.users(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  unique(user_id, friend_id)
);

-- Stories / posts
create table public.stories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  country_code text not null,
  country_name text not null,
  caption text not null default '',
  likes int not null default 0,
  created_at timestamptz not null default now()
);

-- Challenges per user
create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  title text not null,
  description text not null,
  type text not null,
  difficulty text not null default 'easy',
  icon text not null default '⚡',
  progress int not null default 0,
  total int not null default 1,
  xp_reward int not null default 100,
  coin_reward int not null default 10,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

-- ── Row Level Security ──────────────────────────────

alter table public.users      enable row level security;
alter table public.countries  enable row level security;
alter table public.pins       enable row level security;
alter table public.friends    enable row level security;
alter table public.stories    enable row level security;
alter table public.challenges enable row level security;

-- users: any authenticated user can read any profile (needed for ranking/friends/stories)
create policy "users_select_all" on public.users
  for select using (auth.uid() IS NOT NULL);
create policy "users_insert_own" on public.users
  for insert with check (auth.uid() = id);
create policy "users_update_own" on public.users
  for update using (auth.uid() = id);

-- countries: own only
create policy "countries_all_own" on public.countries
  for all using (auth.uid() = user_id);

-- pins: own only
create policy "pins_all_own" on public.pins
  for all using (auth.uid() = user_id);

-- friends: own records
create policy "friends_all_own" on public.friends
  for all using (auth.uid() = user_id);

-- stories: everyone can read, own can write
create policy "stories_select_all" on public.stories
  for select using (true);
create policy "stories_insert_own" on public.stories
  for insert with check (auth.uid() = user_id);
create policy "stories_update_own" on public.stories
  for update using (auth.uid() = user_id);
create policy "stories_delete_own" on public.stories
  for delete using (auth.uid() = user_id);

-- challenges: own only
create policy "challenges_all_own" on public.challenges
  for all using (auth.uid() = user_id);

-- ── Trigger: create user profile on signup ──────────

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Rank recalculation (call via RPC after XP changes) ──

create or replace function public.recalculate_ranks()
returns void language plpgsql security definer as $$
begin
  update public.users u
  set rank = r.new_rank
  from (
    select id, row_number() over (order by xp desc, created_at asc) as new_rank
    from public.users
  ) r
  where u.id = r.id;
end;
$$;

grant execute on function public.recalculate_ranks() to authenticated;

-- ── Etapa 7: Stories photo + comments ───────────────

alter table public.stories add column if not exists photo_url text;

create table if not exists public.story_comments (
  id uuid primary key default gen_random_uuid(),
  story_id uuid references public.stories(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  text text not null,
  created_at timestamptz not null default now()
);

alter table public.story_comments enable row level security;

create policy "comments_select_all" on public.story_comments
  for select using (true);
create policy "comments_insert_own" on public.story_comments
  for insert with check (auth.uid() = user_id);
create policy "comments_delete_own" on public.story_comments
  for delete using (auth.uid() = user_id);

-- ── Etapa 8: Admin panel — run in Supabase SQL Editor ──

alter table public.users add column if not exists is_admin boolean not null default false;
alter table public.users add column if not exists is_banned boolean not null default false;

-- To make yourself admin (replace with your user UUID from auth.users):
-- update public.users set is_admin = true where id = 'YOUR-USER-UUID-HERE';
