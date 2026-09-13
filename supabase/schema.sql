-- =============================================================================
-- Pelouse — schéma Supabase (section 7 du cahier des charges)
--
-- À exécuter dans l'éditeur SQL du projet Supabase, ou avec la CLI :
--   supabase db push
--
-- Contenu :
--   1. Types énumérés du questionnaire d'onboarding
--   2. Tables : user_profiles, user_settings, teams
--   3. Déclencheurs : updated_at, création automatique du profil à l'inscription
--   4. Row Level Security : un utilisateur ne lit et n'écrit que ses propres lignes
--   5. Bucket Storage « avatars » et ses policies
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Types énumérés
-- -----------------------------------------------------------------------------

do $$ begin
  create type public.plays_football as enum ('regularly', 'sometimes', 'returning', 'beginner');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.player_level as enum ('beginner', 'leisure', 'confirmed', 'competition', 'high_level');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.player_position as enum ('goalkeeper', 'defender', 'midfielder', 'forward', 'anywhere');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.play_location as enum ('five_indoor', 'futsal', 'club_pitch', 'city_stadium', 'anywhere');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.play_frequency as enum ('lt_monthly', 'monthly_1_3', 'weekly_1', 'weekly_2_3', 'weekly_4_plus');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.player_goal as enum ('improve', 'fitness', 'find_matches', 'meet_players', 'compete', 'fun');
exception when duplicate_object then null; end $$;

-- -----------------------------------------------------------------------------
-- 2. Tables
-- -----------------------------------------------------------------------------

-- Miroir de src/theme/teams.json. Table publique en lecture : l'app embarque le
-- fichier, cette table sert aux jointures et aux futures fonctionnalités serveur.
create table if not exists public.teams (
  id            text primary key,
  name          text        not null,
  short_name    text        not null,
  city          text,
  country       text,
  league        text        not null,
  colors        jsonb       not null,
  theme_override jsonb,
  logo_url      text,
  data_version  text        not null,
  updated_at    timestamptz not null default now()
);

comment on table public.teams is 'Équipes et couleurs, miroir de src/theme/teams.json (généré par npm run teams:build).';

create table if not exists public.user_profiles (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid        not null unique references auth.users (id) on delete cascade,
  display_name         text,
  avatar_url           text,
  plays_football       public.plays_football,
  level                public.player_level,
  club_name            text,
  position             public.player_position,
  region               text,
  city                 text,
  lat                  double precision,
  lng                  double precision,
  play_locations       public.play_location[] not null default '{}',
  frequency            public.play_frequency,
  goals                public.player_goal[]   not null default '{}',
  favorite_team_id     text references public.teams (id) on delete set null,
  onboarding_step      integer     not null default 0,
  onboarding_completed boolean     not null default false,
  locale               text        not null default 'fr',
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),

  constraint user_profiles_display_name_len check (
    display_name is null or char_length(display_name) between 2 and 24
  ),
  constraint user_profiles_goals_max check (array_length(goals, 1) is null or array_length(goals, 1) <= 3),
  constraint user_profiles_step_range check (onboarding_step between 0 and 11),
  constraint user_profiles_locale check (locale in ('fr', 'en'))
);

comment on table public.user_profiles is 'Profil et réponses au questionnaire d''onboarding. Une ligne par utilisateur.';

create index if not exists user_profiles_user_id_idx on public.user_profiles (user_id);
create index if not exists user_profiles_favorite_team_idx on public.user_profiles (favorite_team_id);

create table if not exists public.user_settings (
  user_id       uuid primary key references auth.users (id) on delete cascade,
  notifications jsonb       not null default '{"push":true,"email":true,"trainingReminders":true,"messages":true,"bookings":true}'::jsonb,
  privacy       jsonb       not null default '{"profileVisibility":"public","locationVisible":true}'::jsonb,
  appearance    jsonb       not null default '{"darkMode":false}'::jsonb,
  updated_at    timestamptz not null default now()
);

comment on table public.user_settings is 'Réglages : notifications, confidentialité, apparence.';

-- -----------------------------------------------------------------------------
-- 3. Déclencheurs
-- -----------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_profiles_set_updated_at on public.user_profiles;
create trigger user_profiles_set_updated_at
  before update on public.user_profiles
  for each row execute function public.set_updated_at();

drop trigger if exists user_settings_set_updated_at on public.user_settings;
create trigger user_settings_set_updated_at
  before update on public.user_settings
  for each row execute function public.set_updated_at();

-- Profil et réglages créés automatiquement à l'inscription : l'app trouve
-- toujours une ligne, même si l'utilisateur quitte l'onboarding immédiatement.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 4. Row Level Security
-- -----------------------------------------------------------------------------

alter table public.user_profiles enable row level security;
alter table public.user_settings enable row level security;
alter table public.teams         enable row level security;

-- user_profiles : lecture / écriture strictement limitées au propriétaire.
drop policy if exists "profiles: select own" on public.user_profiles;
create policy "profiles: select own"
  on public.user_profiles for select
  using (auth.uid() = user_id);

drop policy if exists "profiles: insert own" on public.user_profiles;
create policy "profiles: insert own"
  on public.user_profiles for insert
  with check (auth.uid() = user_id);

drop policy if exists "profiles: update own" on public.user_profiles;
create policy "profiles: update own"
  on public.user_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "profiles: delete own" on public.user_profiles;
create policy "profiles: delete own"
  on public.user_profiles for delete
  using (auth.uid() = user_id);

-- user_settings : mêmes règles.
drop policy if exists "settings: select own" on public.user_settings;
create policy "settings: select own"
  on public.user_settings for select
  using (auth.uid() = user_id);

drop policy if exists "settings: insert own" on public.user_settings;
create policy "settings: insert own"
  on public.user_settings for insert
  with check (auth.uid() = user_id);

drop policy if exists "settings: update own" on public.user_settings;
create policy "settings: update own"
  on public.user_settings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "settings: delete own" on public.user_settings;
create policy "settings: delete own"
  on public.user_settings for delete
  using (auth.uid() = user_id);

-- teams : référentiel public en lecture seule (l'écriture passe par le script
-- de synchronisation avec la clé service_role, qui contourne la RLS).
drop policy if exists "teams: read all" on public.teams;
create policy "teams: read all"
  on public.teams for select
  using (true);

-- -----------------------------------------------------------------------------
-- 5. Storage : avatars
-- -----------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Chaque utilisateur écrit uniquement dans son propre dossier « <user_id>/… ».
drop policy if exists "avatars: public read" on storage.objects;
create policy "avatars: public read"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "avatars: insert own folder" on storage.objects;
create policy "avatars: insert own folder"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "avatars: update own folder" on storage.objects;
create policy "avatars: update own folder"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "avatars: delete own folder" on storage.objects;
create policy "avatars: delete own folder"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
