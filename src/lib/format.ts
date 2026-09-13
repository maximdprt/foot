/**
 * Formatage des dates, durées et prix.
 *
 * Tout passe par `Intl`, présent dans Hermes comme sur le web : les mois, les
 * jours et le séparateur décimal suivent donc la langue choisie dans les
 * réglages, pas celle de l'appareil.
 */
import type { Locale } from '@/i18n/locale';

const localeTag: Record<Locale, string> = { fr: 'fr-FR', en: 'en-GB' };

function tag(locale: Locale): string {
  return localeTag[locale] ?? 'fr-FR';
}

/** « 19:00 ». */
export function formatTime(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(tag(locale), {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

/** « sam. 20 sept. ». */
export function formatDate(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(tag(locale), {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date(iso));
}

/** « sam. 20 sept. · 19:00 ». */
export function formatDateTime(iso: string, locale: Locale): string {
  return `${formatDate(iso, locale)} · ${formatTime(iso, locale)}`;
}

/** Nombre de jours calendaires entre aujourd'hui et une date (0 = aujourd'hui). */
export function daysFromToday(iso: string, now = new Date()): number {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const target = new Date(iso);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - start.getTime()) / 86_400_000);
}

/**
 * Libellé court d'un jour pour un sélecteur : « Auj. », « Dem. », puis le jour
 * abrégé. Les deux premiers viennent de l'i18n, d'où le paramètre `labels`.
 */
export function formatDayChip(
  iso: string,
  locale: Locale,
  labels: { today: string; tomorrow: string },
  now = new Date(),
): string {
  const delta = daysFromToday(iso, now);
  if (delta === 0) return labels.today;
  if (delta === 1) return labels.tomorrow;
  return new Intl.DateTimeFormat(tag(locale), { weekday: 'short', day: 'numeric' }).format(
    new Date(iso),
  );
}

/** Durée en minutes → « 1 h 30 » ou « 45 min ». */
export function formatMinutes(minutes: number, locale: Locale): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const hourUnit = locale === 'fr' ? 'h' : 'h';
  const minuteUnit = locale === 'fr' ? 'min' : 'min';
  if (hours === 0) return `${rest} ${minuteUnit}`;
  if (rest === 0) return `${hours} ${hourUnit}`;
  return `${hours} ${hourUnit} ${String(rest).padStart(2, '0')}`;
}

/** Durée en secondes → « 12:30 » (minutes:secondes), pour un minuteur. */
export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/** Prix en euros, ou le libellé « gratuit » fourni par l'appelant. */
export function formatPrice(price: number | null, locale: Locale, freeLabel: string): string {
  if (price === null) return freeLabel;
  return new Intl.NumberFormat(tag(locale), {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(price);
}

/** « il y a 2 h », « hier ». Retombe sur une date absolue au-delà d'une semaine. */
export function formatRelative(iso: string, locale: Locale, now = new Date()): string {
  const deltaSeconds = (new Date(iso).getTime() - now.getTime()) / 1000;
  const absolute = Math.abs(deltaSeconds);
  if (absolute > 7 * 86_400) return formatDate(iso, locale);

  const relative = new Intl.RelativeTimeFormat(tag(locale), { numeric: 'auto' });
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['day', 86_400],
    ['hour', 3_600],
    ['minute', 60],
  ];
  for (const [unit, seconds] of units) {
    if (absolute >= seconds) return relative.format(Math.round(deltaSeconds / seconds), unit);
  }
  return relative.format(Math.round(deltaSeconds), 'second');
}
