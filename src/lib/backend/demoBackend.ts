/**
 * Backend de démonstration 100 % local (AsyncStorage), utilisé quand Supabase
 * n'est pas configuré. Il reproduit fidèlement le contrat de `Backend` afin que
 * les écrans soient identiques dans les deux modes — aucune donnée ne quitte l'appareil.
 *
 * Les mots de passe ne sont volontairement PAS vérifiables côté serveur : ce mode
 * sert uniquement au développement et à la démonstration de l'UI.
 */
import type { Booking } from '@/features/booking/types';
import {
  canJoin,
  compareByKickoff,
  type Match,
  type MatchDraft,
  type MatchParticipant,
} from '@/features/matches/types';
import { emptyProfile, mergeDraft, type ProfileDraft, type UserProfile } from '@/features/profile/types';
import type {
  ActivityItem,
  ActivityKind,
  Friendship,
  PlayerSummary,
} from '@/features/social/types';
import type { TrainingSession } from '@/features/training/types';
import { getJSON, setJSON, STORAGE_KEYS } from '@/lib/storage';
import { isValidEmail, isValidPassword, randomId } from '@/lib/validation';
import type { AuthProvider, SessionUser } from '@/store/sessionStore';
import type { UserSettings } from '@/store/settingsStore';

import { demoMatchesFor, demoPlayersFor } from './demoData';
import { AuthError, type Backend, type BookingDraft, type SessionDraft, type SignUpResult } from './types';

interface DemoAccount {
  id: string;
  email: string | null;
  /** Stocké en clair : mode démo local uniquement (cf. en-tête de fichier). */
  password: string | null;
  providers: AuthProvider[];
}

/** Arête d'amitié, non orientée mais gardant la trace du demandeur. */
interface FriendEdge {
  a: string;
  b: string;
  requestedBy: string;
  status: 'pending' | 'accepted';
  since: string;
}

interface DemoDb {
  accounts: Record<string, DemoAccount>;
  profiles: Record<string, UserProfile>;
  settings: Record<string, Partial<UserSettings>>;
  matches: Match[];
  sessions: Record<string, TrainingSession[]>;
  bookings: Record<string, Booking[]>;
  friends: FriendEdge[];
  activities: ActivityItem[];
  /** Villes déjà peuplées de données de démonstration. */
  seededCities: string[];
  currentUserId: string | null;
}

const EMPTY_DB: DemoDb = {
  accounts: {},
  profiles: {},
  settings: {},
  matches: [],
  sessions: {},
  bookings: {},
  friends: [],
  activities: [],
  seededCities: [],
  currentUserId: null,
};

let cache: DemoDb | null = null;
const listeners = new Set<(user: SessionUser | null) => void>();

async function read(): Promise<DemoDb> {
  if (!cache) {
    const stored = await getJSON<Partial<DemoDb>>(STORAGE_KEYS.localBackend);
    // Fusion avec la forme vide : une base écrite par une version antérieure
    // n'a pas les nouvelles collections.
    cache = { ...EMPTY_DB, ...(stored ?? {}) };
  }
  return cache;
}

async function write(db: DemoDb): Promise<void> {
  cache = db;
  await setJSON(STORAGE_KEYS.localBackend, db);
}

function toSessionUser(account: DemoAccount): SessionUser {
  return { id: account.id, email: account.email, providers: account.providers };
}

function emit(user: SessionUser | null): void {
  listeners.forEach((listener) => listener(user));
}

function accountKey(email: string): string {
  return email.trim().toLowerCase();
}

/** Résumé d'un joueur : profil réel s'il existe, sinon profil fictif de la ville. */
function playerOf(db: DemoDb, userId: string, fallbackCity: string | null): PlayerSummary {
  const profile = db.profiles[userId];
  if (profile) {
    return {
      userId,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      favoriteTeamId: profile.favoriteTeamId,
      city: profile.city,
    };
  }
  const demo = demoPlayersFor(fallbackCity).find((player) => player.userId === userId);
  return demo ?? { userId, displayName: null, avatarUrl: null, favoriteTeamId: null, city: fallbackCity };
}

function pushActivity(
  db: DemoDb,
  kind: ActivityKind,
  actor: PlayerSummary,
  subject: string | null,
): void {
  db.activities.unshift({
    id: randomId('activity'),
    kind,
    actor,
    at: new Date().toISOString(),
    subject,
  });
  // Le fil local n'a pas vocation à croître indéfiniment.
  db.activities = db.activities.slice(0, 60);
}

/** Sème les matchs de démonstration d'une ville, une seule fois. */
function seedCity(db: DemoDb, city: string | null): void {
  const resolved = city?.trim() || '';
  if (!resolved || db.seededCities.includes(resolved)) return;
  db.seededCities.push(resolved);
  db.matches.push(...demoMatchesFor(resolved));
}

function edgeFor(db: DemoDb, a: string, b: string): FriendEdge | undefined {
  return db.friends.find(
    (edge) => (edge.a === a && edge.b === b) || (edge.a === b && edge.b === a),
  );
}

function friendshipsOf(db: DemoDb, userId: string, city: string | null): Friendship[] {
  return db.friends
    .filter((edge) => edge.a === userId || edge.b === userId)
    .map((edge) => {
      const otherId = edge.a === userId ? edge.b : edge.a;
      const summary = playerOf(db, otherId, city);
      return {
        ...summary,
        status: edge.status,
        direction:
          edge.status === 'accepted'
            ? ('mutual' as const)
            : edge.requestedBy === userId
              ? ('outgoing' as const)
              : ('incoming' as const),
        since: edge.since,
      };
    });
}

function cityOf(db: DemoDb, userId: string): string | null {
  return db.profiles[userId]?.city ?? null;
}

/** Recharge un match depuis la base, après modification. */
function requireMatch(db: DemoDb, matchId: string): Match {
  const match = db.matches.find((item) => item.id === matchId);
  if (!match) throw new Error(`Match introuvable : ${matchId}`);
  return match;
}

export const demoBackend: Backend = {
  isDemo: true,

  // --- Session -------------------------------------------------------------

  async getSession() {
    const db = await read();
    const account = db.currentUserId ? Object.values(db.accounts).find((a) => a.id === db.currentUserId) : null;
    return account ? toSessionUser(account) : null;
  },

  onSessionChange(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  async signUpWithEmail(email, password): Promise<SignUpResult> {
    if (!isValidEmail(email)) throw new AuthError('emailInvalid');
    if (!isValidPassword(password)) throw new AuthError('passwordTooShort');
    const db = await read();
    const key = accountKey(email);
    if (db.accounts[key]) throw new AuthError('emailTaken');
    const account: DemoAccount = { id: randomId('user'), email: key, password, providers: ['email'] };
    db.accounts[key] = account;
    db.currentUserId = account.id;
    await write(db);
    const user = toSessionUser(account);
    emit(user);
    return { user, needsEmailConfirmation: false };
  },

  async signInWithEmail(email, password) {
    if (!isValidEmail(email)) throw new AuthError('emailInvalid');
    const db = await read();
    const account = db.accounts[accountKey(email)];
    if (!account || account.password !== password) throw new AuthError('invalidCredentials');
    db.currentUserId = account.id;
    await write(db);
    const user = toSessionUser(account);
    emit(user);
    return user;
  },

  async signInWithProvider(provider) {
    const db = await read();
    const key = `${provider}@demo.local`;
    const account: DemoAccount = db.accounts[key] ?? {
      id: randomId('user'),
      email: key,
      password: null,
      providers: [provider],
    };
    if (!account.providers.includes(provider)) account.providers.push(provider);
    db.accounts[key] = account;
    db.currentUserId = account.id;
    await write(db);
    const user = toSessionUser(account);
    emit(user);
    return user;
  },

  async sendPasswordReset(email) {
    if (!isValidEmail(email)) throw new AuthError('emailInvalid');
    // Mode démo : aucun email n'est envoyé, on ne révèle pas si le compte existe.
  },

  async updatePassword(password) {
    if (!isValidPassword(password)) throw new AuthError('passwordTooShort');
    const db = await read();
    const entry = Object.entries(db.accounts).find(([, a]) => a.id === db.currentUserId);
    if (!entry) throw new AuthError('generic');
    db.accounts[entry[0]] = { ...entry[1], password };
    await write(db);
  },

  async signOut() {
    const db = await read();
    db.currentUserId = null;
    await write(db);
    emit(null);
  },

  async deleteAccount() {
    const db = await read();
    const id = db.currentUserId;
    if (id) {
      const entry = Object.entries(db.accounts).find(([, a]) => a.id === id);
      if (entry) delete db.accounts[entry[0]];
      delete db.profiles[id];
      delete db.settings[id];
      delete db.sessions[id];
      delete db.bookings[id];
      db.friends = db.friends.filter((edge) => edge.a !== id && edge.b !== id);
      db.activities = db.activities.filter((item) => item.actor.userId !== id);
      // Les matchs organisés par l'utilisateur disparaissent, sa participation aux autres aussi.
      db.matches = db.matches
        .filter((match) => match.organizerId !== id)
        .map((match) => ({
          ...match,
          participants: match.participants.filter((p) => p.userId !== id),
        }));
    }
    db.currentUserId = null;
    await write(db);
    emit(null);
  },

  // --- Profil et réglages --------------------------------------------------

  async fetchProfile(userId) {
    const db = await read();
    return db.profiles[userId] ?? null;
  },

  async saveProfile(userId, patch: ProfileDraft) {
    const db = await read();
    const base = db.profiles[userId] ?? emptyProfile(userId);
    const next = mergeDraft(base, patch);
    next.id = base.id ?? randomId('profile');
    next.updatedAt = new Date().toISOString();
    next.createdAt = base.createdAt ?? next.updatedAt;
    db.profiles[userId] = next;
    // La ville vient d'être renseignée : on peuple les matchs ouverts alentour.
    seedCity(db, next.city);
    await write(db);
    return next;
  },

  async uploadAvatar(_userId, localUri) {
    // Mode démo : on conserve l'URI locale telle quelle.
    return localUri;
  },

  async fetchSettings(userId) {
    const db = await read();
    return db.settings[userId] ?? null;
  },

  async saveSettings(userId, settings) {
    const db = await read();
    db.settings[userId] = settings;
    await write(db);
  },

  // --- Matchs --------------------------------------------------------------

  async listMatches(userId, city) {
    const db = await read();
    seedCity(db, city);
    await write(db);
    const now = Date.now();
    return db.matches
      .filter((match) => {
        const mine = Boolean(userId) && match.participants.some((p) => p.userId === userId);
        if (mine) return true;
        if (match.status !== 'open') return false;
        if (new Date(match.kickoffAt).getTime() < now) return false;
        return !city || match.city === city;
      })
      .sort(compareByKickoff);
  },

  async createMatch(userId, draft: MatchDraft) {
    const db = await read();
    const player = playerOf(db, userId, draft.city);
    const match: Match = {
      id: randomId('match'),
      organizerId: userId,
      organizerName: player.displayName,
      ...draft,
      status: 'open',
      participants: [
        {
          userId,
          displayName: player.displayName,
          avatarUrl: player.avatarUrl,
          favoriteTeamId: player.favoriteTeamId,
          joinedAt: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
    };
    db.matches.unshift(match);
    pushActivity(db, 'match_created', player, draft.venueName);
    await write(db);
    return match;
  },

  async joinMatch(userId, matchId) {
    const db = await read();
    const match = requireMatch(db, matchId);
    if (!canJoin(match, userId)) return match;
    const player = playerOf(db, userId, match.city);
    const participant: MatchParticipant = {
      userId,
      displayName: player.displayName,
      avatarUrl: player.avatarUrl,
      favoriteTeamId: player.favoriteTeamId,
      joinedAt: new Date().toISOString(),
    };
    match.participants = [...match.participants, participant];
    pushActivity(db, 'match_joined', player, match.venueName);
    await write(db);
    return match;
  },

  async leaveMatch(userId, matchId) {
    const db = await read();
    const match = requireMatch(db, matchId);
    match.participants = match.participants.filter((p) => p.userId !== userId);
    await write(db);
    return match;
  },

  async cancelMatch(userId, matchId) {
    const db = await read();
    const match = requireMatch(db, matchId);
    // Seul l'organisateur annule ; les autres ne peuvent que quitter le match.
    if (match.organizerId !== userId) return match;
    match.status = 'cancelled';
    await write(db);
    return match;
  },

  // --- Entraînement --------------------------------------------------------

  async listSessions(userId) {
    const db = await read();
    return [...(db.sessions[userId] ?? [])].sort(
      (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
    );
  },

  async recordSession(userId, draft: SessionDraft) {
    const db = await read();
    const session: TrainingSession = { ...draft, id: randomId('session') };
    db.sessions[userId] = [...(db.sessions[userId] ?? []), session];
    pushActivity(db, 'session_completed', playerOf(db, userId, cityOf(db, userId)), draft.programId);
    await write(db);
    return session;
  },

  // --- Réservation ---------------------------------------------------------

  async listBookings(userId) {
    const db = await read();
    return [...(db.bookings[userId] ?? [])].sort(
      (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
    );
  },

  async createBooking(userId, draft: BookingDraft) {
    const db = await read();
    const booking: Booking = {
      ...draft,
      id: randomId('booking'),
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };
    db.bookings[userId] = [...(db.bookings[userId] ?? []), booking];
    pushActivity(db, 'booking_created', playerOf(db, userId, draft.city), `booking.venues.${draft.venueKind}`);
    await write(db);
    return booking;
  },

  async cancelBooking(userId, bookingId) {
    const db = await read();
    const list = db.bookings[userId] ?? [];
    const booking = list.find((item) => item.id === bookingId);
    if (!booking) throw new Error(`Réservation introuvable : ${bookingId}`);
    booking.status = 'cancelled';
    await write(db);
    return booking;
  },

  // --- Social --------------------------------------------------------------

  async listFriends(userId) {
    const db = await read();
    return friendshipsOf(db, userId, cityOf(db, userId));
  },

  async suggestPlayers(userId, city) {
    const db = await read();
    const known = new Set(
      db.friends
        .filter((edge) => edge.a === userId || edge.b === userId)
        .map((edge) => (edge.a === userId ? edge.b : edge.a)),
    );
    return demoPlayersFor(city).filter(
      (player) => player.userId !== userId && !known.has(player.userId),
    );
  },

  async requestFriend(userId, targetId) {
    const db = await read();
    const city = cityOf(db, userId);
    if (!edgeFor(db, userId, targetId)) {
      db.friends.push({
        a: userId,
        b: targetId,
        requestedBy: userId,
        // Mode démo : les profils fictifs acceptent aussitôt, sinon rien ne se passerait jamais.
        status: targetId.startsWith('demo-') ? 'accepted' : 'pending',
        since: new Date().toISOString(),
      });
      if (targetId.startsWith('demo-')) {
        pushActivity(db, 'friend_added', playerOf(db, targetId, city), null);
      }
    }
    await write(db);
    return friendshipsOf(db, userId, city);
  },

  async respondToFriend(userId, targetId, accept) {
    const db = await read();
    const city = cityOf(db, userId);
    const edge = edgeFor(db, userId, targetId);
    if (edge) {
      if (accept) {
        edge.status = 'accepted';
        edge.since = new Date().toISOString();
        pushActivity(db, 'friend_added', playerOf(db, targetId, city), null);
      } else {
        db.friends = db.friends.filter((item) => item !== edge);
      }
    }
    await write(db);
    return friendshipsOf(db, userId, city);
  },

  async removeFriend(userId, targetId) {
    const db = await read();
    const edge = edgeFor(db, userId, targetId);
    if (edge) db.friends = db.friends.filter((item) => item !== edge);
    await write(db);
    return friendshipsOf(db, userId, cityOf(db, userId));
  },

  async listActivity(userId) {
    const db = await read();
    const friendIds = new Set(
      db.friends
        .filter((edge) => edge.status === 'accepted' && (edge.a === userId || edge.b === userId))
        .map((edge) => (edge.a === userId ? edge.b : edge.a)),
    );
    return db.activities.filter(
      (item) => item.actor.userId === userId || friendIds.has(item.actor.userId),
    );
  },

  // --- RGPD ----------------------------------------------------------------

  async exportData(userId) {
    const db = await read();
    const entry = Object.values(db.accounts).find((a) => a.id === userId);
    return {
      exportedAt: new Date().toISOString(),
      mode: 'demo-local',
      account: entry ? { id: entry.id, email: entry.email, providers: entry.providers } : null,
      profile: db.profiles[userId] ?? null,
      settings: db.settings[userId] ?? null,
      matches: db.matches.filter((match) => match.participants.some((p) => p.userId === userId)),
      sessions: db.sessions[userId] ?? [],
      bookings: db.bookings[userId] ?? [],
      friends: friendshipsOf(db, userId, cityOf(db, userId)),
    };
  },
};
