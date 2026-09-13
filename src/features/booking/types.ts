/** Réservation d'un créneau (miroir de la table `bookings`). */
import type { VenueKind } from './venues';

export type BookingStatus = 'confirmed' | 'cancelled';

export interface Booking {
  id: string;
  venueId: string;
  venueKind: VenueKind;
  city: string;
  /** ISO 8601. */
  startsAt: string;
  endsAt: string;
  /** Prix payé, en euros ; `null` pour un terrain en accès libre. */
  price: number | null;
  status: BookingStatus;
  createdAt: string;
}

/** Une réservation à venir : confirmée et pas encore commencée. */
export function isUpcoming(booking: Booking, now = Date.now()): boolean {
  return booking.status === 'confirmed' && new Date(booking.startsAt).getTime() > now;
}

/** Tri d'affichage : la plus proche d'abord. */
export function compareByStart(a: Booking, b: Booking): number {
  return new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
}
