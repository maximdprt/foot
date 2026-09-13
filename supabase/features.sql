-- =============================================================================
-- Pelouse — schéma des fonctionnalités (matchs, entraînement, réservation, social)
--
-- À exécuter APRÈS `schema.sql`, qui crée `user_profiles` et `user_settings`.
--   supabase db push
--
-- Contenu :
--   1. Vue `public_profiles` — ce qu'un joueur peut voir d'un autre
--   2. Types énumérés
--   3. Tables : matches, match_participants, training_sessions, bookings,
--      friendships, activities
--   4. Fonctions d'aide (SECURITY DEFINER) pour des policies non récursives
--   5. Row Level Security
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Fonctions d'aide
--
-- Elles sont `security definer` : elles contournent la RLS, ce qui évite qu'une
-- policy de `matches` interroge `match_participants` dont la policy interroge
-- `matches`… et boucle.
-- -----------------------------------------------------------------------------

create or replace function public.are_friends(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.friendships f
    where f.status = 'accepted'
      and ((f.requester_id = a and f.addressee_id = b)
        or (f.requester_id = b and f.addressee_id = a))
  );
$$;

comment on function public.are_friends is 'Deux utilisateurs sont-ils amis ? Utilisé par les policies et par la vue public_profiles.';

-- -----------------------------------------------------------------------------
-- 2. Types énumérés
-- -----------------------------------------------------------------------------

do $$ begin
  create type public.match_format as enum ('five', 'futsal', 'seven', 'eleven');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.match_level as enum ('all', 'leisure', 'confirmed', 'competition');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.match_status as enum ('open', 'cancelled', 'played');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.venue_kind as enum ('five_indoor', 'futsal', 'club_pitch', 'city_stadium');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.booking_status as enum ('confirmed', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.friendship_status as enum ('pending', 'accepted');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.activity_kind as enum (
    'match_created', 'match_joined', 'session_completed',
    'booking_created', 'friend_added', 'badge_earned'
  );
exception when duplicate_object then null; end $$;

-- -----------------------------------------------------------------------------
-- 3. Tables
-- -----------------------------------------------------------------------------

create table if not exists public.matches (
  id               uuid primary key default gen_random_uuid(),
  organizer_id     uuid not null references public.user_profiles (user_id) on delete cascade,
  format           public.match_format not null,
  level            public.match_level  not null default 'all',
  kickoff_at       timestamptz not null,
  duration_minutes integer     not null default 60,
  venue_name       text        not null,
  city             text        not null,
  max_players      integer     not null,
  notes            text,
  status           public.match_status not null default 'open',
  created_at       timestamptz not null default now(),

  constraint matches_duration check (duration_minutes between 20 and 180),
  constraint matches_players  check (max_players between 2 and 30)
);

comment on table public.matches is 'Matchs amateurs organisés par les utilisateurs.';

create index if not exists matches_city_kickoff_idx on public.matches (city, kickoff_at);
create index if not exists matches_organizer_idx    on public.matches (organizer_id);

create table if not exists public.match_participants (
  match_id  uuid not null references public.matches (id) on delete cascade,
  user_id   uuid not null references public.user_profiles (user_id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (match_id, user_id)
);

comment on table public.match_participants is 'Inscriptions à un match. La clé primaire empêche de s''inscrire deux fois.';

create index if not exists match_participants_user_idx on public.match_participants (user_id);

create table if not exists public.training_sessions (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.user_profiles (user_id) on delete cascade,
  program_id          text not null,
  started_at          timestamptz not null,
  completed_at        timestamptz not null default now(),
  completed_exercises integer not null default 0,
  total_exercises     integer not null,
  duration_seconds    integer not null default 0,

  constraint training_sessions_counts check (completed_exercises between 0 and total_exercises)
);

comment on table public.training_sessions is 'Historique des séances réalisées. Le catalogue de programmes est embarqué dans l''app.';

create index if not exists training_sessions_user_idx on public.training_sessions (user_id, completed_at desc);

create table if not exists public.bookings (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.user_profiles (user_id) on delete cascade,
  venue_id   text not null,
  venue_kind public.venue_kind not null,
  city       text not null,
  starts_at  timestamptz not null,
  ends_at    timestamptz not null,
  price      numeric(6, 2),
  status     public.booking_status not null default 'confirmed',
  created_at timestamptz not null default now(),

  constraint bookings_range check (ends_at > starts_at),
  -- Un même créneau ne peut pas être réservé deux fois par la même personne.
  constraint bookings_unique_slot unique (user_id, venue_id, starts_at)
);

comment on table public.bookings is 'Créneaux réservés. Les terrains sont générés côté app (aucun annuaire ouvert n''existe).';

create index if not exists bookings_user_idx on public.bookings (user_id, starts_at);

create table if not exists public.friendships (
  id           uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.user_profiles (user_id) on delete cascade,
  addressee_id uuid not null references public.user_profiles (user_id) on delete cascade,
  status       public.friendship_status not null default 'pending',
  created_at   timestamptz not null default now(),

  constraint friendships_distinct check (requester_id <> addressee_id),
  constraint friendships_unique unique (requester_id, addressee_id)
);

comment on table public.friendships is 'Relations entre joueurs. Une ligne par demande, dans le sens où elle a été émise.';

create index if not exists friendships_addressee_idx on public.friendships (addressee_id, status);

create table if not exists public.activities (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.user_profiles (user_id) on delete cascade,
  kind       public.activity_kind not null,
  /** Complément affiché : nom de terrain, identifiant de programme, badge… */
  subject    text,
  created_at timestamptz not null default now()
);

comment on table public.activities is 'Fil d''activité. Purement informatif : sa perte n''affecte aucune autre donnée.';

create index if not exists activities_user_idx on public.activities (user_id, created_at desc);

-- -----------------------------------------------------------------------------
-- 4. Vue `public_profiles`
--
-- `user_profiles` contient la position GPS, le club, le niveau et les objectifs :
-- rien de tout cela ne doit fuir parce qu'on affiche le nom d'un participant.
-- Cette vue n'expose que le strict nécessaire, et respecte les réglages de
-- Paramètres > Confidentialité.
--
-- `security_invoker = off` : la vue s'exécute avec les droits de son
-- propriétaire, donc au-dessus de la RLS de `user_profiles` — c'est elle, et
-- elle seule, qui décide de ce qui est visible.
-- -----------------------------------------------------------------------------

create or replace view public.public_profiles
with (security_invoker = off) as
select
  p.user_id,
  p.display_name,
  p.avatar_url,
  p.favorite_team_id,
  -- La ville n'est montrée que si l'utilisateur a laissé sa position visible.
  case
    when coalesce(s.privacy ->> 'locationVisible', 'true') = 'true' then p.city
    else null
  end as city
from public.user_profiles p
left join public.user_settings s on s.user_id = p.user_id
where
  p.user_id = auth.uid()
  or coalesce(s.privacy ->> 'profileVisibility', 'public') = 'public'
  or (
    coalesce(s.privacy ->> 'profileVisibility', 'public') = 'friends'
    and public.are_friends(auth.uid(), p.user_id)
  );

comment on view public.public_profiles is 'Colonnes d''un profil visibles par les autres joueurs, selon leurs réglages de confidentialité.';

revoke all on public.public_profiles from anon;
grant select on public.public_profiles to authenticated;

-- -----------------------------------------------------------------------------
-- 5. Visibilité d'un match (sans récursion)
-- -----------------------------------------------------------------------------

create or replace function public.can_see_match(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.matches m
    where m.id = target
      and (
        -- Un match ouvert et à venir est public : c'est ce qui permet de le rejoindre.
        (m.status = 'open' and m.kickoff_at > now())
        or m.organizer_id = auth.uid()
        or exists (
          select 1 from public.match_participants p
          where p.match_id = m.id and p.user_id = auth.uid()
        )
      )
  );
$$;

comment on function public.can_see_match is 'Match visible par l''utilisateur courant : ouvert et à venir, ou bien le sien.';

-- -----------------------------------------------------------------------------
-- 6. Row Level Security
-- -----------------------------------------------------------------------------

alter table public.matches            enable row level security;
alter table public.match_participants enable row level security;
alter table public.training_sessions  enable row level security;
alter table public.bookings           enable row level security;
alter table public.friendships        enable row level security;
alter table public.activities         enable row level security;

-- matches ---------------------------------------------------------------------

drop policy if exists "matches: select visible" on public.matches;
create policy "matches: select visible"
  on public.matches for select
  using (public.can_see_match(id));

drop policy if exists "matches: insert own" on public.matches;
create policy "matches: insert own"
  on public.matches for insert
  with check (auth.uid() = organizer_id);

drop policy if exists "matches: update own" on public.matches;
create policy "matches: update own"
  on public.matches for update
  using (auth.uid() = organizer_id)
  with check (auth.uid() = organizer_id);

drop policy if exists "matches: delete own" on public.matches;
create policy "matches: delete own"
  on public.matches for delete
  using (auth.uid() = organizer_id);

-- match_participants ----------------------------------------------------------

drop policy if exists "participants: select visible" on public.match_participants;
create policy "participants: select visible"
  on public.match_participants for select
  using (public.can_see_match(match_id));

-- On ne s'inscrit que soi-même, et seulement à un match qu'on peut voir.
drop policy if exists "participants: join self" on public.match_participants;
create policy "participants: join self"
  on public.match_participants for insert
  with check (auth.uid() = user_id and public.can_see_match(match_id));

-- Sortir d'un match : soi-même, ou l'organisateur qui retire un joueur.
drop policy if exists "participants: leave" on public.match_participants;
create policy "participants: leave"
  on public.match_participants for delete
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.matches m
      where m.id = match_id and m.organizer_id = auth.uid()
    )
  );

-- training_sessions, bookings : strictement personnels ------------------------

drop policy if exists "sessions: own" on public.training_sessions;
create policy "sessions: own"
  on public.training_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "bookings: own" on public.bookings;
create policy "bookings: own"
  on public.bookings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- friendships -----------------------------------------------------------------

drop policy if exists "friendships: select mine" on public.friendships;
create policy "friendships: select mine"
  on public.friendships for select
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- On émet une demande en son propre nom.
drop policy if exists "friendships: request" on public.friendships;
create policy "friendships: request"
  on public.friendships for insert
  with check (auth.uid() = requester_id);

-- Seul le destinataire accepte : l'émetteur ne peut pas valider sa propre demande.
drop policy if exists "friendships: accept" on public.friendships;
create policy "friendships: accept"
  on public.friendships for update
  using (auth.uid() = addressee_id)
  with check (auth.uid() = addressee_id);

drop policy if exists "friendships: remove" on public.friendships;
create policy "friendships: remove"
  on public.friendships for delete
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- activities ------------------------------------------------------------------

drop policy if exists "activities: select friends" on public.activities;
create policy "activities: select friends"
  on public.activities for select
  using (auth.uid() = user_id or public.are_friends(auth.uid(), user_id));

drop policy if exists "activities: insert own" on public.activities;
create policy "activities: insert own"
  on public.activities for insert
  with check (auth.uid() = user_id);
