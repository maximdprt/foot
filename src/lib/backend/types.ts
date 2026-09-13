/**
 * Contrat commun aux deux backends (Supabase et démo local).
 * Les écrans et services ne parlent jamais directement à Supabase : ils passent
 * par `backend` (cf. `./index.ts`), ce qui garde l'app exécutable sans configuration.
 */
import type { ProfileDraft, UserProfile } from '@/features/profile/types';
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

export interface Backend {
  /** `true` pour le backend de démonstration local (aucune donnée n'est envoyée). */
  readonly isDemo: boolean;

  getSession(): Promise<SessionUser | null>;
  onSessionChange(listener: (user: SessionUser | null) => void): () => void;

  signUpWithEmail(email: string, password: string): Promise<SignUpResult>;
  signInWithEmail(email: string, password: string): Promise<SessionUser>;
  signInWithProvider(provider: Exclude<AuthProvider, 'email'>): Promise<SessionUser>;
  sendPasswordReset(email: string): Promise<void>;
  updatePassword(password: string): Promise<void>;
  signOut(): Promise<void>;
  deleteAccount(): Promise<void>;

  fetchProfile(userId: string): Promise<UserProfile | null>;
  saveProfile(userId: string, patch: ProfileDraft): Promise<UserProfile>;
  uploadAvatar(userId: string, localUri: string): Promise<string>;

  fetchSettings(userId: string): Promise<Partial<UserSettings> | null>;
  saveSettings(userId: string, settings: UserSettings): Promise<void>;

  /** Export RGPD : toutes les données de l'utilisateur au format JSON. */
  exportData(userId: string): Promise<Record<string, unknown>>;
}
