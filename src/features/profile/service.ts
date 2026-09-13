/**
 * Service profil : synchronise le store Zustand et le backend.
 *
 * Règle centrale : un visiteur travaille uniquement sur `profileStore.draft`
 * (persisté localement) ; dès qu'un compte existe, chaque modification est
 * écrite dans `user_profiles`. La progression de l'onboarding est donc
 * sauvegardée à chaque étape, ce qui permet de reprendre exactement où on
 * s'était arrêté (section 4.2 du cahier des charges).
 */
import { backend } from '@/lib/backend';
import { useProfileStore } from '@/store/profileStore';
import { useSessionStore } from '@/store/sessionStore';
import { selectSettings, useSettingsStore } from '@/store/settingsStore';
import { useThemeStore } from '@/store/themeStore';

import { mergeDraft, type ProfileDraft, type UserProfile } from './types';

/** Utilisateur connecté, ou `null` pour un visiteur. */
function currentUserId(): string | null {
  return useSessionStore.getState().user?.id ?? null;
}

/**
 * Applique un patch au profil : brouillon local toujours, base si connecté.
 * Retourne le profil à jour (ou `null` en mode visiteur).
 */
export async function patchProfile(patch: ProfileDraft): Promise<UserProfile | null> {
  useProfileStore.getState().patchDraft(patch);
  if (patch.favoriteTeamId !== undefined) {
    useThemeStore.getState().setFavoriteTeam(patch.favoriteTeamId ?? 'none');
  }
  const userId = currentUserId();
  if (!userId) return null;
  const saved = await backend.saveProfile(userId, patch);
  useProfileStore.getState().setProfile(saved);
  return saved;
}

/** Charge le profil et les réglages depuis le backend et hydrate les stores. */
export async function loadProfile(userId: string): Promise<UserProfile | null> {
  const [profile, settings] = await Promise.all([
    backend.fetchProfile(userId),
    backend.fetchSettings(userId),
  ]);
  if (profile) {
    useProfileStore.getState().setProfile(profile);
    // Le brouillon reflète le profil distant pour que les écrans d'édition partent du bon état.
    useProfileStore.getState().setDraft(toDraft(profile));
    if (profile.favoriteTeamId) {
      useThemeStore.getState().setFavoriteTeam(profile.favoriteTeamId);
    }
    if (profile.locale) useSettingsStore.getState().setLocale(profile.locale);
  }
  if (settings) useSettingsStore.getState().replaceAll(settings);
  return profile;
}

/** Projette un profil complet en brouillon éditable. */
export function toDraft(profile: UserProfile): ProfileDraft {
  const { id: _id, userId: _userId, createdAt: _createdAt, updatedAt: _updatedAt, ...draft } = profile;
  return draft;
}

/**
 * Migre les réponses saisies en mode visiteur (brouillon + équipe supportée)
 * vers le compte fraîchement créé ou connecté.
 */
export async function migrateGuestData(userId: string): Promise<UserProfile | null> {
  const { draft } = useProfileStore.getState();
  const favoriteTeamId = useThemeStore.getState().favoriteTeamId;
  const locale = useSettingsStore.getState().locale;
  const existing = await backend.fetchProfile(userId);

  // Un profil existant (reconnexion) fait autorité : on ne l'écrase pas avec un brouillon local.
  if (existing?.onboardingCompleted) {
    useProfileStore.getState().setProfile(existing);
    useProfileStore.getState().setDraft(toDraft(existing));
    if (existing.favoriteTeamId) useThemeStore.getState().setFavoriteTeam(existing.favoriteTeamId);
    return existing;
  }

  const patch: ProfileDraft = {
    ...(existing ? toDraft(existing) : {}),
    ...draft,
    locale,
    ...(favoriteTeamId && favoriteTeamId !== 'none' ? { favoriteTeamId } : {}),
  };
  const saved = await backend.saveProfile(userId, patch);
  useProfileStore.getState().setProfile(saved);
  useProfileStore.getState().setDraft(toDraft(saved));
  return saved;
}

/** Enregistre les réglages courants (appelé après chaque changement dans Paramètres). */
export async function persistSettings(): Promise<void> {
  const userId = currentUserId();
  if (!userId) return;
  await backend.saveSettings(userId, selectSettings(useSettingsStore.getState()));
}

/** Envoie la photo de profil puis met à jour `avatar_url`. */
export async function setAvatar(localUri: string): Promise<string> {
  const userId = currentUserId();
  if (!userId) {
    useProfileStore.getState().patchDraft({ avatarUrl: localUri });
    return localUri;
  }
  const url = await backend.uploadAvatar(userId, localUri);
  await patchProfile({ avatarUrl: url });
  return url;
}

/** Profil « effectif » affiché par l'UI : le profil distant complété par le brouillon local. */
export function effectiveProfile(): ProfileDraft {
  const { profile, draft } = useProfileStore.getState();
  return profile ? { ...toDraft(profile), ...draft } : draft;
}

/** Fusionne un brouillon dans un profil existant (ré-export pratique pour les écrans). */
export { mergeDraft };
