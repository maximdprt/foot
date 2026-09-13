/**
 * Implémentation Supabase du contrat `Backend` :
 * Auth (email/mot de passe, Google, Apple), table `user_profiles`, table
 * `user_settings`, Storage `avatars`. Les policies RLS (cf. `supabase/schema.sql`)
 * garantissent qu'un utilisateur ne lit et n'écrit que ses propres lignes.
 */
import * as AppleAuthentication from 'expo-apple-authentication';
import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import type { Booking } from '@/features/booking/types';
import { canJoin, compareByKickoff, type Match, type MatchDraft } from '@/features/matches/types';
import { draftToRow, rowToProfile } from '@/features/profile/mapping';
import { emptyProfile, type UserProfile } from '@/features/profile/types';
import type { ActivityItem, Friendship, PlayerSummary } from '@/features/social/types';
import type { TrainingSession } from '@/features/training/types';
import type {
  ActivityKindRow,
  BookingRow,
  EmbeddedProfile,
  FriendshipRow,
  MatchRow,
  TrainingSessionRow,
} from '@/lib/database.types';
import { AVATARS_BUCKET, supabase } from '@/lib/supabase';
import type { AuthProvider, SessionUser } from '@/store/sessionStore';
import type { UserSettings } from '@/store/settingsStore';

import {
  AuthError,
  type Backend,
  type BookingDraft,
  type SessionDraft,
  type SignUpResult,
} from './types';

WebBrowser.maybeCompleteAuthSession();

function client() {
  if (!supabase) throw new AuthError('generic');
  return supabase;
}

/** Traduit une erreur Supabase en code i18n `auth.errors.*`. */
function toAuthError(error: { message?: string; status?: number } | null): AuthError {
  const message = (error?.message ?? '').toLowerCase();
  if (message.includes('already registered') || message.includes('already been registered')) {
    return new AuthError('emailTaken');
  }
  if (message.includes('invalid login') || message.includes('invalid credentials')) {
    return new AuthError('invalidCredentials');
  }
  if (message.includes('not confirmed')) return new AuthError('confirmEmail');
  if (message.includes('password')) return new AuthError('passwordTooShort');
  if (message.includes('email')) return new AuthError('emailInvalid');
  return new AuthError('generic');
}

interface SupabaseIdentity {
  provider: string;
}

interface SupabaseUserLike {
  id: string;
  email?: string | null;
  identities?: SupabaseIdentity[] | null;
  app_metadata?: { providers?: string[]; provider?: string };
}

function toSessionUser(user: SupabaseUserLike | null | undefined): SessionUser | null {
  if (!user) return null;
  const raw = [
    ...(user.identities?.map((i) => i.provider) ?? []),
    ...(user.app_metadata?.providers ?? []),
    user.app_metadata?.provider ?? '',
  ];
  const providers = Array.from(
    new Set(raw.filter((p): p is AuthProvider => p === 'email' || p === 'google' || p === 'apple')),
  );
  return { id: user.id, email: user.email ?? null, providers: providers.length ? providers : ['email'] };
}

/** URL de retour OAuth : `pelouse://auth-callback` en natif, l'origine du site sur le web. */
function redirectUri(): string {
  return AuthSession.makeRedirectUri({ scheme: 'pelouse', path: 'auth-callback' });
}


// ---------------------------------------------------------------------------
// Conversion des lignes Postgres vers le modele de l'app
// ---------------------------------------------------------------------------

type ParticipantRow = { user_id: string; joined_at: string };

type MatchJoin = MatchRow & { match_participants: ParticipantRow[] | null };

type ActivityRowJoin = {
  id: string;
  user_id: string;
  kind: ActivityKindRow;
  subject: string | null;
  created_at: string;
};

/**
 * Vue ne contenant que les colonnes qu'un autre joueur a le droit de voir.
 * `user_profiles` garde la ville precise, les coordonnees GPS, le club et les
 * objectifs : les lire pour afficher un simple nom serait une fuite.
 */
const PUBLIC_PROFILE_VIEW = 'public_profiles';
const PUBLIC_PROFILE_COLUMNS = 'user_id, display_name, avatar_url, favorite_team_id, city';

function toPlayer(userId: string, profile: EmbeddedProfile): PlayerSummary {
  return {
    userId,
    displayName: profile?.display_name ?? null,
    avatarUrl: profile?.avatar_url ?? null,
    favoriteTeamId: profile?.favorite_team_id ?? null,
    city: profile?.city ?? null,
  };
}

function toMatch(row: MatchJoin, players: Map<string, PlayerSummary>): Match {
  return {
    id: row.id,
    organizerId: row.organizer_id,
    organizerName: players.get(row.organizer_id)?.displayName ?? null,
    format: row.format,
    level: row.level,
    kickoffAt: row.kickoff_at,
    durationMinutes: row.duration_minutes,
    venueName: row.venue_name,
    city: row.city,
    maxPlayers: row.max_players,
    notes: row.notes,
    status: row.status,
    participants: (row.match_participants ?? []).map((participant) => {
      const player = players.get(participant.user_id);
      return {
        userId: participant.user_id,
        displayName: player?.displayName ?? null,
        avatarUrl: player?.avatarUrl ?? null,
        favoriteTeamId: player?.favoriteTeamId ?? null,
        joinedAt: participant.joined_at,
      };
    }),
    createdAt: row.created_at,
  };
}

function toSession(row: TrainingSessionRow): TrainingSession {
  return {
    id: row.id,
    programId: row.program_id,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    completedExercises: row.completed_exercises,
    totalExercises: row.total_exercises,
    durationSeconds: row.duration_seconds,
  };
}

function toBooking(row: BookingRow): Booking {
  return {
    id: row.id,
    venueId: row.venue_id,
    venueKind: row.venue_kind,
    city: row.city,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    price: row.price,
    status: row.status,
    createdAt: row.created_at,
  };
}

/** Selection d'un match avec ses participations (sans les profils). */
const MATCH_SELECT = '*, match_participants(user_id, joined_at)';

export const supabaseBackend: Backend = {
  isDemo: false,

  async getSession() {
    const { data } = await client().auth.getSession();
    return toSessionUser(data.session?.user as SupabaseUserLike | undefined);
  },

  onSessionChange(listener) {
    const { data } = client().auth.onAuthStateChange((_event, session) => {
      listener(toSessionUser(session?.user as SupabaseUserLike | undefined));
    });
    return () => data.subscription.unsubscribe();
  },

  async signUpWithEmail(email, password): Promise<SignUpResult> {
    const { data, error } = await client().auth.signUp({ email: email.trim(), password });
    if (error) throw toAuthError(error);
    const user = toSessionUser(data.user as SupabaseUserLike | null);
    return { user, needsEmailConfirmation: !data.session };
  },

  async signInWithEmail(email, password) {
    const { data, error } = await client().auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw toAuthError(error);
    const user = toSessionUser(data.user as SupabaseUserLike | null);
    if (!user) throw new AuthError('generic');
    return user;
  },

  async signInWithProvider(provider) {
    if (provider === 'apple' && Platform.OS === 'ios') {
      return signInWithAppleNative();
    }
    const redirectTo = redirectUri();
    const { data, error } = await client().auth.signInWithOAuth({
      provider,
      options: { redirectTo, skipBrowserRedirect: Platform.OS !== 'web' },
    });
    if (error) throw toAuthError(error);
    if (Platform.OS === 'web') {
      // Le navigateur prend le relais ; la session est détectée au retour sur la page.
      return new Promise<SessionUser>(() => undefined);
    }
    if (!data.url) throw new AuthError('providerUnavailable');
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== 'success') throw new AuthError('providerUnavailable');
    const params = new URL(result.url.replace('#', '?')).searchParams;
    const code = params.get('code');
    if (code) {
      const exchange = await client().auth.exchangeCodeForSession(code);
      if (exchange.error) throw toAuthError(exchange.error);
      const user = toSessionUser(exchange.data.user as SupabaseUserLike | null);
      if (user) return user;
    }
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    if (accessToken && refreshToken) {
      const session = await client().auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (session.error) throw toAuthError(session.error);
      const user = toSessionUser(session.data.user as SupabaseUserLike | null);
      if (user) return user;
    }
    throw new AuthError('providerUnavailable');
  },

  async sendPasswordReset(email) {
    const { error } = await client().auth.resetPasswordForEmail(email.trim(), {
      redirectTo: redirectUri(),
    });
    if (error) throw toAuthError(error);
  },

  async updatePassword(password) {
    const { error } = await client().auth.updateUser({ password });
    if (error) throw toAuthError(error);
  },

  async signOut() {
    const { error } = await client().auth.signOut();
    if (error) throw toAuthError(error);
  },

  async deleteAccount() {
    // La suppression d'un compte exige la clé service_role : elle passe par une
    // Edge Function « delete-account » déployée avec le projet (cf. supabase/README.md).
    const { error } = await client().functions.invoke('delete-account');
    if (error) throw new AuthError('generic');
    await client().auth.signOut();
  },

  async fetchProfile(userId) {
    const { data, error } = await client()
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? rowToProfile(data) : null;
  },

  async saveProfile(userId, patch): Promise<UserProfile> {
    const payload = { ...draftToRow(patch), user_id: userId, updated_at: new Date().toISOString() };
    const { data, error } = await client()
      .from('user_profiles')
      .upsert(payload, { onConflict: 'user_id' })
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return data ? rowToProfile(data) : emptyProfile(userId);
  },

  async uploadAvatar(userId, localUri) {
    const response = await fetch(localUri);
    const blob = await response.blob();
    const extension = (blob.type.split('/')[1] ?? 'jpg').replace('jpeg', 'jpg');
    const path = `${userId}/avatar-${Date.now()}.${extension}`;
    const { error } = await client()
      .storage.from(AVATARS_BUCKET)
      .upload(path, blob, { upsert: true, contentType: blob.type });
    if (error) throw new Error(error.message);
    return client().storage.from(AVATARS_BUCKET).getPublicUrl(path).data.publicUrl;
  },

  async fetchSettings(userId) {
    const { data, error } = await client()
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    return {
      notifications: data.notifications as unknown as UserSettings['notifications'],
      privacy: data.privacy as unknown as UserSettings['privacy'],
      appearance: data.appearance as unknown as UserSettings['appearance'],
    };
  },

  async saveSettings(userId, settings) {
    const { error } = await client()
      .from('user_settings')
      .upsert(
        {
          user_id: userId,
          notifications: settings.notifications as unknown as Record<string, unknown>,
          privacy: settings.privacy as unknown as Record<string, unknown>,
          appearance: settings.appearance as unknown as Record<string, unknown>,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );
    if (error) throw new Error(error.message);
  },


  // --- Matchs --------------------------------------------------------------

  async listMatches(userId, city) {
    const now = new Date().toISOString();
    // Deux requetes plutot qu'un `or` : « mes matchs » et « les matchs ouverts
    // pres de moi » n'ont pas les memes criteres, et PostgREST ne sait pas
    // filtrer sur une table jointe a l'interieur d'un `or`.
    const openQuery = client()
      .from('matches')
      .select(MATCH_SELECT)
      .eq('status', 'open')
      .gte('kickoff_at', now);
    if (city) openQuery.eq('city', city);

    const [open, mine] = await Promise.all([
      openQuery,
      userId
        ? client()
            .from('matches')
            .select(MATCH_SELECT + ', match_participants!inner(user_id)')
            .eq('match_participants.user_id', userId)
        : Promise.resolve({ data: [], error: null }),
    ]);
    if (open.error) throw new Error(open.error.message);
    if (mine.error) throw new Error(mine.error.message);

    const rows = new Map<string, MatchJoin>();
    for (const row of [...(open.data ?? []), ...(mine.data ?? [])] as unknown as MatchJoin[]) {
      rows.set(row.id, row);
    }

    // Organisateurs et participants, en une seule requete sur la vue publique.
    const ids = [...rows.values()].flatMap((row) => [
      row.organizer_id,
      ...(row.match_participants ?? []).map((participant) => participant.user_id),
    ]);
    const players = await loadPublicProfiles(ids);

    return [...rows.values()].map((row) => toMatch(row, players)).sort(compareByKickoff);
  },

  async createMatch(userId, draft: MatchDraft) {
    const { data, error } = await client()
      .from('matches')
      .insert({
        organizer_id: userId,
        format: draft.format,
        level: draft.level,
        kickoff_at: draft.kickoffAt,
        duration_minutes: draft.durationMinutes,
        venue_name: draft.venueName,
        city: draft.city,
        max_players: draft.maxPlayers,
        notes: draft.notes,
        status: 'open',
      })
      .select('id')
      .single();
    if (error) throw new Error(error.message);
    // L'organisateur est le premier inscrit.
    await client()
      .from('match_participants')
      .insert({ match_id: data.id, user_id: userId, joined_at: new Date().toISOString() });
    await recordActivity(userId, 'match_created', draft.venueName);
    return reloadMatch(data.id);
  },

  async joinMatch(userId, matchId) {
    const match = await reloadMatch(matchId);
    // Controle cote client ; la contrainte d'unicite en base fait le reste.
    if (!canJoin(match, userId)) return match;
    const { error } = await client()
      .from('match_participants')
      .insert({ match_id: matchId, user_id: userId, joined_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    await recordActivity(userId, 'match_joined', match.venueName);
    return reloadMatch(matchId);
  },

  async leaveMatch(userId, matchId) {
    const { error } = await client()
      .from('match_participants')
      .delete()
      .eq('match_id', matchId)
      .eq('user_id', userId);
    if (error) throw new Error(error.message);
    return reloadMatch(matchId);
  },

  async cancelMatch(userId, matchId) {
    // La policy RLS limite deja la mise a jour a l'organisateur ; le filtre
    // explicite evite une requete qui ne modifierait rien.
    const { error } = await client()
      .from('matches')
      .update({ status: 'cancelled' })
      .eq('id', matchId)
      .eq('organizer_id', userId);
    if (error) throw new Error(error.message);
    return reloadMatch(matchId);
  },

  // --- Entrainement --------------------------------------------------------

  async listSessions(userId) {
    const { data, error } = await client()
      .from('training_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(toSession);
  },

  async recordSession(userId, draft: SessionDraft) {
    const { data, error } = await client()
      .from('training_sessions')
      .insert({
        user_id: userId,
        program_id: draft.programId,
        started_at: draft.startedAt,
        completed_at: draft.completedAt,
        completed_exercises: draft.completedExercises,
        total_exercises: draft.totalExercises,
        duration_seconds: draft.durationSeconds,
      })
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    await recordActivity(userId, 'session_completed', draft.programId);
    return toSession(data);
  },

  // --- Reservation ---------------------------------------------------------

  async listBookings(userId) {
    const { data, error } = await client()
      .from('bookings')
      .select('*')
      .eq('user_id', userId)
      .order('starts_at', { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []).map(toBooking);
  },

  async createBooking(userId, draft: BookingDraft) {
    const { data, error } = await client()
      .from('bookings')
      .insert({
        user_id: userId,
        venue_id: draft.venueId,
        venue_kind: draft.venueKind,
        city: draft.city,
        starts_at: draft.startsAt,
        ends_at: draft.endsAt,
        price: draft.price,
        status: 'confirmed',
      })
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    await recordActivity(userId, 'booking_created', 'booking.venues.' + draft.venueKind);
    return toBooking(data);
  },

  async cancelBooking(userId, bookingId) {
    const { data, error } = await client()
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId)
      .eq('user_id', userId)
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return toBooking(data);
  },

  // --- Social --------------------------------------------------------------

  async listFriends(userId) {
    return loadFriendships(userId);
  },

  async suggestPlayers(userId, city) {
    const known = await friendIds(userId);
    const query = client()
      .from(PUBLIC_PROFILE_VIEW)
      .select(PUBLIC_PROFILE_COLUMNS)
      .neq('user_id', userId)
      .limit(20);
    if (city) query.eq('city', city);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return ((data ?? []) as unknown as ({ user_id: string } & NonNullable<EmbeddedProfile>)[])
      .filter((profile) => !known.has(profile.user_id))
      .map((profile) => toPlayer(profile.user_id, profile));
  },

  async requestFriend(userId, targetId) {
    const { error } = await client()
      .from('friendships')
      .insert({ requester_id: userId, addressee_id: targetId, status: 'pending' });
    if (error) throw new Error(error.message);
    return loadFriendships(userId);
  },

  async respondToFriend(userId, targetId, accept) {
    // La demande a ete emise par l'autre : c'est donc lui le demandeur.
    const { error } = accept
      ? await client()
          .from('friendships')
          .update({ status: 'accepted' })
          .eq('requester_id', targetId)
          .eq('addressee_id', userId)
      : await client()
          .from('friendships')
          .delete()
          .eq('requester_id', targetId)
          .eq('addressee_id', userId);
    if (error) throw new Error(error.message);
    if (accept) await recordActivity(userId, 'friend_added', null);
    return loadFriendships(userId);
  },

  async removeFriend(userId, targetId) {
    const pair = [
      'and(requester_id.eq.' + userId + ',addressee_id.eq.' + targetId + ')',
      'and(requester_id.eq.' + targetId + ',addressee_id.eq.' + userId + ')',
    ].join(',');
    const { error } = await client().from('friendships').delete().or(pair);
    if (error) throw new Error(error.message);
    return loadFriendships(userId);
  },

  async listActivity(userId) {
    const known = await friendIds(userId);
    const authors = [userId, ...known];
    const { data, error } = await client()
      .from('activities')
      .select('*')
      .in('user_id', authors)
      .order('created_at', { ascending: false })
      .limit(60);
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as unknown as ActivityRowJoin[];
    const players = await loadPublicProfiles(rows.map((row) => row.user_id));
    return rows.map(
      (row) =>
        ({
          id: row.id,
          kind: row.kind,
          actor: players.get(row.user_id) ?? toPlayer(row.user_id, null),
          at: row.created_at,
          subject: row.subject,
        }) satisfies ActivityItem,
    );
  },

  async exportData(userId) {
    const [profile, settings, matches, sessions, bookings, friends] = await Promise.all([
      supabaseBackend.fetchProfile(userId),
      supabaseBackend.fetchSettings(userId),
      supabaseBackend.listMatches(userId, null),
      supabaseBackend.listSessions(userId),
      supabaseBackend.listBookings(userId),
      supabaseBackend.listFriends(userId),
    ]);
    const { data } = await client().auth.getUser();
    return {
      exportedAt: new Date().toISOString(),
      account: { id: data.user?.id ?? userId, email: data.user?.email ?? null },
      profile,
      settings,
      matches,
      sessions,
      bookings,
      friends,
    };
  },
};

/** « Se connecter avec Apple » natif (iOS) : jeton d'identité + nonce, puis échange Supabase. */
async function signInWithAppleNative(): Promise<SessionUser> {
  const rawNonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);
  let credential: AppleAuthentication.AppleAuthenticationCredential;
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });
  } catch {
    throw new AuthError('providerUnavailable');
  }
  if (!credential.identityToken) throw new AuthError('providerUnavailable');
  const { data, error } = await client().auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
    nonce: rawNonce,
  });
  if (error) throw toAuthError(error);
  const user = toSessionUser(data.user as SupabaseUserLike | null);
  if (!user) throw new AuthError('generic');
  return user;
}


/** Recharge un match complet apres modification. */
async function reloadMatch(matchId: string): Promise<Match> {
  const { data, error } = await client()
    .from('matches')
    .select(MATCH_SELECT)
    .eq('id', matchId)
    .single();
  if (error) throw new Error(error.message);
  const row = data as unknown as MatchJoin;
  const players = await loadPublicProfiles([
    row.organizer_id,
    ...(row.match_participants ?? []).map((participant) => participant.user_id),
  ]);
  return toMatch(row, players);
}

/**
 * Toutes les relations de l'utilisateur, quel que soit le sens de la demande.
 * Les deux profils sont joints par leur contrainte de cle etrangere, sans quoi
 * PostgREST ne saurait pas laquelle des deux suivre.
 */
async function loadFriendships(userId: string): Promise<Friendship[]> {
  const { data, error } = await client()
    .from('friendships')
    .select('*')
    .or('requester_id.eq.' + userId + ',addressee_id.eq.' + userId);
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as FriendshipRow[];
  const players = await loadPublicProfiles(
    rows.map((row) => (row.requester_id === userId ? row.addressee_id : row.requester_id)),
  );

  return rows.map((row) => {
    const outgoing = row.requester_id === userId;
    const otherId = outgoing ? row.addressee_id : row.requester_id;
    const player = players.get(otherId);
    return {
      userId: otherId,
      displayName: player?.displayName ?? null,
      avatarUrl: player?.avatarUrl ?? null,
      favoriteTeamId: player?.favoriteTeamId ?? null,
      city: player?.city ?? null,
      status: row.status,
      direction: row.status === 'accepted' ? 'mutual' : outgoing ? 'outgoing' : 'incoming',
      since: row.created_at,
    } satisfies Friendship;
  });
}

/**
 * Charge les profils publics d'une liste d'identifiants, dedupliquee.
 * Une seule requete, quelle que soit la taille de la liste.
 */
async function loadPublicProfiles(userIds: string[]): Promise<Map<string, PlayerSummary>> {
  const unique = Array.from(new Set(userIds.filter(Boolean)));
  const players = new Map<string, PlayerSummary>();
  if (unique.length === 0) return players;
  const { data } = await client()
    .from(PUBLIC_PROFILE_VIEW)
    .select(PUBLIC_PROFILE_COLUMNS)
    .in('user_id', unique);
  for (const raw of data ?? []) {
    const profile = raw as unknown as { user_id: string } & NonNullable<EmbeddedProfile>;
    players.set(profile.user_id, toPlayer(profile.user_id, profile));
  }
  return players;
}

/** Identifiants des relations acceptees. */
async function friendIds(userId: string): Promise<Set<string>> {
  const friends = await loadFriendships(userId);
  return new Set(friends.filter((friend) => friend.status === 'accepted').map((f) => f.userId));
}

/**
 * Ecrit une ligne dans le fil d'activite.
 * Le fil est une commodite d'affichage : un echec ne doit jamais faire echouer
 * l'action qui vient de reussir.
 */
async function recordActivity(
  userId: string,
  kind: ActivityKindRow,
  subject: string | null,
): Promise<void> {
  try {
    await client().from('activities').insert({ user_id: userId, kind, subject });
  } catch {
    // Sans consequence pour l'utilisateur.
  }
}
