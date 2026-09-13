/**
 * Terrains et créneaux.
 *
 * Il n'existe pas d'annuaire ouvert des terrains amateurs en France. Plutôt que
 * d'inventer des noms d'établissements — qui donneraient l'illusion de vraies
 * adresses — le catalogue est bâti sur des **archétypes génériques** déclinés
 * dans la ville de l'utilisateur : « Five indoor · Rennes », « City stade ·
 * Rennes ». C'est honnête, ça marche partout, et brancher un vrai annuaire plus
 * tard ne touchera que ce fichier.
 *
 * Les créneaux sont générés de façon déterministe : même ville, même jour,
 * mêmes disponibilités d'une ouverture de l'app à l'autre.
 */
import { normalizeSearch } from '@/lib/validation';

export type VenueKind = 'five_indoor' | 'futsal' | 'club_pitch' | 'city_stadium';

export const VENUE_KINDS: VenueKind[] = ['five_indoor', 'futsal', 'club_pitch', 'city_stadium'];

export interface Venue {
  id: string;
  kind: VenueKind;
  /** Clé i18n du type de terrain ; le nom affiché y ajoute la ville. */
  nameKey: string;
  city: string;
  covered: boolean;
  /** Prix indicatif du créneau d'une heure, en euros. `null` = accès libre. */
  pricePerHour: number | null;
  /** Plage d'ouverture, en heures locales. */
  openingHour: number;
  closingHour: number;
  /** Durée d'un créneau, en minutes. */
  slotMinutes: number;
}

interface Archetype {
  kind: VenueKind;
  covered: boolean;
  pricePerHour: number | null;
  openingHour: number;
  closingHour: number;
  slotMinutes: number;
}

const ARCHETYPES: Archetype[] = [
  { kind: 'five_indoor', covered: true, pricePerHour: 90, openingHour: 10, closingHour: 23, slotMinutes: 60 },
  { kind: 'futsal', covered: true, pricePerHour: 70, openingHour: 9, closingHour: 22, slotMinutes: 60 },
  { kind: 'club_pitch', covered: false, pricePerHour: 120, openingHour: 9, closingHour: 21, slotMinutes: 90 },
  { kind: 'city_stadium', covered: false, pricePerHour: null, openingHour: 8, closingHour: 22, slotMinutes: 60 },
];

/** Identifiant stable : même ville, même identifiant, sur tous les appareils. */
function venueId(kind: VenueKind, city: string): string {
  return `${kind}--${normalizeSearch(city).replace(/\s+/g, '-') || 'sans-ville'}`;
}

/** Les quatre terrains disponibles dans une ville. */
export function venuesForCity(city: string | null | undefined): Venue[] {
  const resolved = city?.trim() || '';
  return ARCHETYPES.map((archetype) => ({
    ...archetype,
    id: venueId(archetype.kind, resolved),
    nameKey: `booking.venues.${archetype.kind}`,
    city: resolved,
  }));
}

export function findVenue(id: string, city: string | null | undefined): Venue | null {
  return venuesForCity(city).find((venue) => venue.id === id) ?? null;
}

export interface Slot {
  venueId: string;
  /** ISO 8601. */
  startsAt: string;
  endsAt: string;
  available: boolean;
  /** Prix du créneau, calculé depuis le tarif horaire et sa durée. */
  price: number | null;
}

/** Flottant déterministe : la disponibilité d'un créneau ne change pas au rechargement. */
function seeded(seed: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  // Ramené dans [0, 1[.
  return ((hash >>> 0) % 10000) / 10000;
}

/** Début de journée locale, pour un décalage en jours depuis aujourd'hui. */
export function dayStart(dayOffset: number, now = new Date()): Date {
  const date = new Date(now);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + dayOffset);
  return date;
}

/**
 * Créneaux d'un terrain pour un jour donné.
 * Les créneaux déjà passés sont marqués indisponibles, comme dans un vrai
 * système de réservation.
 */
export function slotsFor(venue: Venue, dayOffset: number, now = new Date()): Slot[] {
  const start = dayStart(dayOffset, now);
  const slots: Slot[] = [];
  const stepHours = venue.slotMinutes / 60;

  for (let hour = venue.openingHour; hour + stepHours <= venue.closingHour; hour += stepHours) {
    const startsAt = new Date(start);
    startsAt.setMinutes(Math.round(hour * 60));
    const endsAt = new Date(startsAt.getTime() + venue.slotMinutes * 60_000);

    // Les soirées de semaine sont plus demandées : moins de créneaux libres.
    const isEvening = hour >= 18;
    const occupancy = seeded(`${venue.id}|${startsAt.toISOString()}`);
    const threshold = isEvening ? 0.55 : 0.25;

    slots.push({
      venueId: venue.id,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      available: startsAt.getTime() > now.getTime() && occupancy > threshold,
      price: venue.pricePerHour === null ? null : Math.round(venue.pricePerHour * stepHours),
    });
  }
  return slots;
}

/** Nombre de jours proposés à la réservation. */
export const BOOKABLE_DAYS = 7;
