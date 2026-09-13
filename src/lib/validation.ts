/** Règles de validation partagées (auth + onboarding). Pures, testées unitairement. */

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const PASSWORD_MIN_LENGTH = 8;
export const DISPLAY_NAME_MIN = 2;
export const DISPLAY_NAME_MAX = 24;

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

export function isValidPassword(value: string): boolean {
  return value.length >= PASSWORD_MIN_LENGTH;
}

export type DisplayNameError = 'empty' | 'too_short' | 'too_long' | null;

export function validateDisplayName(value: string): DisplayNameError {
  const trimmed = value.trim();
  if (trimmed.length === 0) return 'empty';
  if (trimmed.length < DISPLAY_NAME_MIN) return 'too_short';
  if (trimmed.length > DISPLAY_NAME_MAX) return 'too_long';
  return null;
}

/** Normalise une chaîne pour la recherche : minuscules, sans accents ni ponctuation. */
export function normalizeSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Génère un identifiant pseudo-unique (mode démo local). */
export function randomId(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}
