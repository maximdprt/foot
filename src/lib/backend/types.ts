/**
 * Contrat commun aux deux backends (Supabase et démo local).
 * Les écrans et services ne parlent jamais directement à Supabase : ils passent
 * par `backend` (cf. `./index.ts`), ce qui garde l'app exécutable sans configuration.
 */
import type { Booking } from '@/features/booking/types';
import type { Match, MatchDraft } from '@/features/matches/types';
import type { ProfileDraft, UserProfile } from '@/features/profile/types';
import type { ActivityItem, Friendship, PlayerSummary } from '@/features/social/types';
import type { TrainingSession } from '@/features/training/types';
import type { AuthProvider, SessionUser } from '@/store/sessionStore';
import type { UserSettings } from '@/store/settingsStore';

/** Codes d'erreur mappés sur les clés i18n `auth.errors.*`. */
export type AuthErrorCode =
  | 'emailInvalid'
  | 'passwordTooShort'
  | 'emailTaken'
  | 'invalidCredentials'
  | 'providerUnavailable'
  | 'confirmEmail'
  | 'generic';

export class AuthError extends Error {
  constructor(readonly code: AuthErrorCode) {
    super(code);
    this.name = 'AuthError';
  }
}

export interface SignUpResult {
  user: SessionUser | null;
  /** Supabase peut exiger une confirmation par email avant d'ouvrir la session. */
  needsEmailConfirmation: boolean;
}

/** Nouvelle réservation, avant enregistrement. */
export interface BookingDraft {
  venueId: string;
  venueKind: Booking['venueKind'];
  city: string;
  startsAt: string;
  endsAt: string;
  price: number | null;
}

/** Séance terminée, avant enregistrement. */
export type SessionDraft = Omit<TrainingSession, 'id'>;

export interface Backend {
  /** `true` pour le backend de démonstration local (aucune donnée n'est envoyée). */
  readonly isDemo: boolean;

  // --- Session -------------------------------------------------------------
  getSession(): Promise<SessionUser | null>;
  onSessionChange(listener: (user: SessionUser | null) => void): () => void;

  signUpWithEmail(email: string, password: string): Promise<SignUpResult>;
  signInWithEmail(email: string, password: string): Promise<SessionUser>;
  signInWithProvider(provider: Exclude<AuthProvider, 'email'>): Promise<SessionUser>;
  sendPasswordReset(email: string): Promise<void>;
  updatePassword(password: string): Promise<void>;
  signOut(): Promise<void>;
  deleteAccount(): Promise<void>;

  // --- Profil et réglages --------------------------------------------------
  fetchProfile(userId: string): Promise<UserProfile | null>;
  saveProfile(userId: string, patch: ProfileDraft): Promise<UserProfile>;
  uploadAvatar(userId: string, localUri: string): Promise<string>;

  fetchSettings(userId: string): Promise<Partial<UserSettings> | null>;
  saveSettings(userId: string, settings: UserSettings): Promise<void>;

  // --- Matchs --------------------------------------------------------------
  /** Matchs visibles : ceux de l'utilisateur, plus les matchs ouverts de sa ville. */
  listMatches(userId: string | null, city: string | null): Promise<Match[]>;
  createMatch(userId: string, draft: MatchDraft): Promise<Match>;
  joinMatch(userId: string, matchId: string): Promise<Match>;
  leaveMatch(userId: string, matchId: string): Promise<Match>;
  /** Annulation par l'organisateur ; les autres participants ne peuvent qu'en sortir. */
  cancelMatch(userId: string, matchId: string): Promise<Match>;

  // --- Entraînement --------------------------------------------------------
  listSessions(userId: string): Promise<TrainingSession[]>;
  recordSession(userId: string, session: SessionDraft): Promise<TrainingSession>;

  // --- Réservation ---------------------------------------------------------
  listBookings(userId: string): Promise<Booking[]>;
  createBooking(userId: string, draft: BookingDraft): Promise<Booking>;
  cancelBooking(userId: string, bookingId: string): Promise<Booking>;

  // --- Social --------------------------------------------------------------
  listFriends(userId: string): Promise<Friendship[]>;
  /** Joueurs suggérés : même ville, pas encore en relation. */
  suggestPlayers(userId: string, city: string | null): Promise<PlayerSummary[]>;
  requestFriend(userId: string, targetId: string): Promise<Friendship[]>;
  respondToFriend(userId: string, targetId: string, accept: boolean): Promise<Friendship[]>;
  removeFriend(userId: string, targetId: string): Promise<Friendship[]>;
  /** Fil d'activité de l'utilisateur et de ses amis, du plus récent au plus ancien. */
  listActivity(userId: string): Promise<ActivityItem[]>;

  // --- RGPD ----------------------------------------------------------------
  /** Export RGPD : toutes les données de l'utilisateur au format JSON. */
  exportData(userId: string): Promise<Record<string, unknown>>;
}
