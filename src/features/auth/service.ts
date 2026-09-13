/**
 * Service d'authentification : orchestre le backend et les stores.
 *
 * Après une création de compte, le passage par l'onboarding est obligatoire.
 * Après une connexion, on reprend à l'étape sauvegardée si l'onboarding n'est
 * pas terminé (section 4.2).
 */
import { loadProfile, migrateGuestData } from '@/features/profile/service';
import { backend } from '@/lib/backend';
import { AuthError, type AuthErrorCode } from '@/lib/backend/types';
import { useProfileStore } from '@/store/profileStore';
import { useSessionStore, type AuthProvider, type SessionUser } from '@/store/sessionStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useThemeStore } from '@/store/themeStore';

export type { AuthErrorCode };
export { AuthError };

/** Clé i18n du message à afficher pour une erreur d'authentification. */
export function authErrorKey(error: unknown): string {
  const code: AuthErrorCode = error instanceof AuthError ? error.code : 'generic';
  return `auth.errors.${code}`;
}

/** Ce qu'il faut faire après une authentification réussie. */
export type PostAuthRoute = { kind: 'onboarding'; step: number } | { kind: 'app' };

function routeFor(onboardingCompleted: boolean, onboardingStep: number): PostAuthRoute {
  return onboardingCompleted ? { kind: 'app' } : { kind: 'onboarding', step: onboardingStep };
}

async function afterAuth(user: SessionUser): Promise<PostAuthRoute> {
  useSessionStore.getState().setUser(user);
  const profile = await migrateGuestData(user.id);
  return routeFor(profile?.onboardingCompleted ?? false, profile?.onboardingStep ?? 0);
}

export async function signUpWithEmail(email: string, password: string): Promise<PostAuthRoute> {
  const { user, needsEmailConfirmation } = await backend.signUpWithEmail(email, password);
  if (!user || needsEmailConfirmation) throw new AuthError('confirmEmail');
  // Création de compte : l'onboarding est obligatoire, on repart de l'étape 0.
  return afterAuth(user);
}

export async function signInWithEmail(email: string, password: string): Promise<PostAuthRoute> {
  const user = await backend.signInWithEmail(email, password);
  return afterAuth(user);
}

export async function signInWithProvider(
  provider: Exclude<AuthProvider, 'email'>,
): Promise<PostAuthRoute> {
  const user = await backend.signInWithProvider(provider);
  return afterAuth(user);
}

export async function sendPasswordReset(email: string): Promise<void> {
  await backend.sendPasswordReset(email);
}

export async function updatePassword(password: string): Promise<void> {
  await backend.updatePassword(password);
}

/** Déconnexion : la session et le profil sont vidés, l'équipe supportée reste (visiteur). */
export async function signOut(): Promise<void> {
  await backend.signOut();
  useSessionStore.getState().setUser(null);
  useProfileStore.getState().reset();
}

/** Suppression de compte (RGPD) : tout est effacé, y compris les réglages locaux. */
export async function deleteAccount(): Promise<void> {
  await backend.deleteAccount();
  useSessionStore.getState().setUser(null);
  useProfileStore.getState().reset();
  useSettingsStore.getState().reset();
  useThemeStore.getState().setFavoriteTeam('none');
}

/**
 * Restaure la session au démarrage et charge le profil.
 * Retourne la destination si l'onboarding doit être repris, sinon `null`.
 */
export async function bootstrapSession(): Promise<PostAuthRoute | null> {
  const user = await backend.getSession();
  useSessionStore.getState().setUser(user);
  if (!user) return null;
  const profile = await loadProfile(user.id);
  return routeFor(profile?.onboardingCompleted ?? false, profile?.onboardingStep ?? 0);
}

/** S'abonne aux changements de session du backend (retour OAuth, expiration du jeton). */
export function subscribeToSession(onChange: (user: SessionUser | null) => void): () => void {
  return backend.onSessionChange((user) => {
    useSessionStore.getState().setUser(user);
    onChange(user);
  });
}
