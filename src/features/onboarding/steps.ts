/**
 * Déclaration du questionnaire d'onboarding (section 4.3) : ordre des écrans,
 * caractère obligatoire ou facultatif, et règle de validation de chaque étape.
 *
 * `index` est l'entier stocké dans `user_profiles.onboarding_step` : il permet de
 * reprendre exactement là où l'utilisateur s'était arrêté.
 */
import { GOALS_MAX, GOALS_MIN, type ProfileDraft } from '@/features/profile/types';
import { validateDisplayName } from '@/lib/validation';

export type OnboardingStepKey =
  | 'welcome'
  | 'identity'
  | 'plays'
  | 'level'
  | 'club'
  | 'position'
  | 'location'
  | 'play-locations'
  | 'frequency'
  | 'goals'
  | 'team'
  | 'summary';

export interface OnboardingStep {
  key: OnboardingStepKey;
  /** Route Expo Router (le groupe `(onboarding)` n'apparaît pas dans l'URL). */
  path: string;
  /** Écran d'information sans réponse à fournir (bienvenue, récapitulatif). */
  info: boolean;
  /** Affiche le bouton texte « Passer ». */
  optional: boolean;
  /** Clé i18n du titre (`onboarding.<key>.title`). */
  i18nKey: string;
}

export const ONBOARDING_STEPS: readonly OnboardingStep[] = [
  { key: 'welcome', path: '/welcome', info: true, optional: false, i18nKey: 'welcome' },
  { key: 'identity', path: '/identity', info: false, optional: false, i18nKey: 'identity' },
  { key: 'plays', path: '/plays', info: false, optional: false, i18nKey: 'plays' },
  { key: 'level', path: '/level', info: false, optional: false, i18nKey: 'level' },
  { key: 'club', path: '/club', info: false, optional: true, i18nKey: 'club' },
  { key: 'position', path: '/position', info: false, optional: false, i18nKey: 'position' },
  { key: 'location', path: '/location', info: false, optional: false, i18nKey: 'location' },
  {
    key: 'play-locations',
    path: '/play-locations',
    info: false,
    optional: false,
    i18nKey: 'playLocations',
  },
  { key: 'frequency', path: '/frequency', info: false, optional: false, i18nKey: 'frequency' },
  { key: 'goals', path: '/goals', info: false, optional: false, i18nKey: 'goals' },
  { key: 'team', path: '/team', info: false, optional: true, i18nKey: 'team' },
  { key: 'summary', path: '/summary', info: true, optional: false, i18nKey: 'summary' },
] as const;

export const FIRST_STEP = ONBOARDING_STEPS[0];
export const LAST_STEP_INDEX = ONBOARDING_STEPS.length - 1;

/** Nombre d'étapes affichées dans « Étape X sur Y » (l'écran de bienvenue ne compte pas). */
export const COUNTED_STEPS = ONBOARDING_STEPS.length - 1;

export function stepIndex(key: OnboardingStepKey): number {
  return ONBOARDING_STEPS.findIndex((s) => s.key === key);
}

export function stepAt(index: number): OnboardingStep {
  const clamped = Math.max(0, Math.min(LAST_STEP_INDEX, Math.trunc(index)));
  return ONBOARDING_STEPS[clamped];
}

/** Progression de la barre en haut d'écran (0 à 1). */
export function stepProgress(index: number): number {
  return Math.max(0, Math.min(1, index / LAST_STEP_INDEX));
}

/**
 * L'étape est-elle satisfaite par le brouillon courant ?
 * Détermine l'activation du bouton « Continuer ». Les étapes facultatives sont
 * toujours valides (le bouton « Passer » reste disponible).
 */
export function isStepValid(key: OnboardingStepKey, draft: ProfileDraft): boolean {
  switch (key) {
    case 'welcome':
    case 'summary':
      return true;
    case 'identity':
      return validateDisplayName(draft.displayName ?? '') === null;
    case 'plays':
      return Boolean(draft.playsFootball);
    case 'level':
      return Boolean(draft.level);
    case 'club':
      return true; // facultatif
    case 'position':
      return Boolean(draft.position);
    case 'location':
      return Boolean(draft.region) && Boolean(draft.city);
    case 'play-locations':
      return (draft.playLocations?.length ?? 0) > 0;
    case 'frequency':
      return Boolean(draft.frequency);
    case 'goals': {
      const count = draft.goals?.length ?? 0;
      return count >= GOALS_MIN && count <= GOALS_MAX;
    }
    case 'team':
      return true; // « Aucune / plus tard » est une réponse valide
    default:
      return false;
  }
}

/** Toutes les étapes obligatoires sont-elles remplies ? (bouton « Valider mon profil »). */
export function isOnboardingComplete(draft: ProfileDraft): boolean {
  return ONBOARDING_STEPS.every((step) => step.optional || isStepValid(step.key, draft));
}

/** Première étape non satisfaite : point de reprise après une connexion. */
export function firstIncompleteStep(draft: ProfileDraft): number {
  const index = ONBOARDING_STEPS.findIndex(
    (step) => !step.info && !step.optional && !isStepValid(step.key, draft),
  );
  return index === -1 ? LAST_STEP_INDEX : index;
}
