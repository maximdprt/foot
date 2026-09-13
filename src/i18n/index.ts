/**
 * i18n : `fr.json` par défaut, `en.json`. La langue vient du store des réglages
 * (Paramètres > Langue) ; changement instantané dans toute l'app.
 */
import { I18n, type TranslateOptions } from 'i18n-js';
import { useMemo } from 'react';

import { useSettingsStore } from '@/store/settingsStore';

import en from './en.json';
import fr from './fr.json';
import { DEFAULT_LOCALE, type Locale } from './locale';

export type { Locale } from './locale';
export { SUPPORTED_LOCALES, detectDeviceLocale } from './locale';

const translations = { fr, en };

export function createI18n(locale: Locale): I18n {
  const instance = new I18n(translations);
  instance.defaultLocale = DEFAULT_LOCALE;
  instance.enableFallback = true;
  instance.locale = locale;
  return instance;
}

export type TFunction = (key: string, options?: TranslateOptions) => string;

const cache = new Map<Locale, I18n>();

function getInstance(locale: Locale): I18n {
  let instance = cache.get(locale);
  if (!instance) {
    instance = createI18n(locale);
    cache.set(locale, instance);
  }
  return instance;
}

/** Hook React : retourne `t` et la locale courante ; re-rend quand la langue change. */
export function useTranslation(): { t: TFunction; locale: Locale } {
  const locale = useSettingsStore((s) => s.locale);
  const t = useMemo<TFunction>(() => {
    const instance = getInstance(locale);
    return (key, options) => instance.t(key, options);
  }, [locale]);
  return { t, locale };
}

/** Traduction hors React (services, stores). */
export function translate(key: string, options?: TranslateOptions): string {
  const locale = useSettingsStore.getState().locale;
  return getInstance(locale).t(key, options);
}

/**
 * Traduction d'une valeur non textuelle (tableau ou objet), par exemple la FAQ
 * (`settings.help.faqItems`). i18n-js renvoie la structure telle quelle.
 */
export function useTranslatedList<T>(key: string): T[] {
  const locale = useSettingsStore((s) => s.locale);
  return useMemo(() => {
    const value = getInstance(locale).t(key) as unknown;
    return Array.isArray(value) ? (value as T[]) : [];
  }, [key, locale]);
}
