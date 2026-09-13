import { getLocales } from 'expo-localization';

export type Locale = 'fr' | 'en';

export const SUPPORTED_LOCALES: Locale[] = ['fr', 'en'];
export const DEFAULT_LOCALE: Locale = 'fr';

/** Langue de l'appareil si supportée, sinon français (défaut du cahier des charges). */
export function detectDeviceLocale(): Locale {
  try {
    const code = getLocales()[0]?.languageCode;
    return code === 'en' ? 'en' : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}
