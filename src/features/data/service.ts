/**
 * Actions métier : tout ce que les écrans déclenchent passe par ici.
 *
 * Chaque action appelle le backend puis met à jour `dataStore`. Les écrans
 * n'appellent jamais `backend` directement — c'est ce qui permet de garder le
 * même code en mode démo local et avec Supabase.
 */
import type { Slot, Venue } from '@/features/booking/venues';
import type { Booking } from '@/features/booking/types';
import type { Match, MatchDraft } from '@/features/matches/types';
import type { TrainingSession } from '@/features/training/types';
import { backend } from '@/lib/backend';
import type { SessionDraft } from '@/lib/backend/types';
import { useDataStore } from '@/store/dataStore';
import { useProfileStore } from '@/store/profileStore';
import { useSessionStore } from '@/store/sessionStore';

function currentUserId(): string | null {
  return useSessionStore.getState().user?.id ?? null;
}

/** Ville de l'utilisateur : sert à filtrer les matchs et à générer les terrains. */
export function currentCity(): string | null {
  const { profile, draft } = useProfileStore.getState();
  return draft.city ?? profile?.city ?? null;
}

/** Utilisateur connecté, ou erreur : les actions d'écriture l'exigent. */
function requireUser(): string {
  const userId = currentUserId();
  if (!userId) throw new Error('Action réservée aux utilisateurs connectés.');
  return userId;
}

/**
 * Numéro du chargement en cours. Au démarrage, la session est restaurée juste
 * après le premier rendu : un chargement « visiteur » est déjà parti quand le
 * compte arrive. Sans ce jeton, sa réponse écrasait celle du chargement
 * authentifié, et l'app restait sans amis, séances ni réservations jusqu'au
 * prochain « tirer pour rafraîchir ».
 */
let refreshToken = 0;

/**
 * Recharge toutes les collections.
 * Un visiteur n'a pas de compte : seuls les matchs ouverts de sa ville sont
 * chargés, le reste reste vide.
 */
export async function refreshAll(): Promise<void> {
  const token = ++refreshToken;
  const userId = currentUserId();
  const city = currentCity();
  const store = useDataStore.getState();
  store.setLoading(true);

  try {
    if (!userId) {
      const matches = await backend.listMatches(null, city);
      if (token !== refreshToken) return;
      store.setAll({
        matches,
        sessions: [],
        bookings: [],
        friends: [],
        suggestions: [],
        activity: [],
        loadedFor: null,
      });
      return;
    }

    const [matches, sessions, bookings, friends, suggestions, activity] = await Promise.all([
      backend.listMatches(userId, city),
      backend.listSessions(userId),
      backend.listBookings(userId),
      backend.listFriends(userId),
      backend.suggestPlayers(userId, city),
      backend.listActivity(userId),
    ]);
    if (token !== refreshToken) return;
    store.setAll({ matches, sessions, bookings, friends, suggestions, activity, loadedFor: userId });
  } catch {
    // Le réseau peut tomber : on garde ce qui est déjà affiché plutôt que de vider l'écran.
    if (token === refreshToken) store.setLoading(false);
  }
}

// --- Matchs ----------------------------------------------------------------

export async function createMatch(draft: MatchDraft): Promise<Match> {
  const match = await backend.createMatch(requireUser(), draft);
  useDataStore.getState().upsertMatch(match);
  return match;
}

export async function joinMatch(matchId: string): Promise<Match> {
  const match = await backend.joinMatch(requireUser(), matchId);
  useDataStore.getState().upsertMatch(match);
  return match;
}

export async function leaveMatch(matchId: string): Promise<Match> {
  const match = await backend.leaveMatch(requireUser(), matchId);
  useDataStore.getState().upsertMatch(match);
  return match;
}

export async function cancelMatch(matchId: string): Promise<Match> {
  const match = await backend.cancelMatch(requireUser(), matchId);
  useDataStore.getState().upsertMatch(match);
  return match;
}

// --- Entraînement ----------------------------------------------------------

export async function recordSession(draft: SessionDraft): Promise<TrainingSession> {
  const session = await backend.recordSession(requireUser(), draft);
  const store = useDataStore.getState();
  store.setSessions([session, ...store.sessions]);
  return session;
}

// --- Réservation -----------------------------------------------------------

export async function bookSlot(venue: Venue, slot: Slot): Promise<Booking> {
  const booking = await backend.createBooking(requireUser(), {
    venueId: venue.id,
    venueKind: venue.kind,
    city: venue.city,
    startsAt: slot.startsAt,
    endsAt: slot.endsAt,
    price: slot.price,
  });
  const store = useDataStore.getState();
  store.setBookings(
    [...store.bookings, booking].sort(
      (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
    ),
  );
  return booking;
}

export async function cancelBooking(bookingId: string): Promise<Booking> {
  const booking = await backend.cancelBooking(requireUser(), bookingId);
  const store = useDataStore.getState();
  store.setBookings(store.bookings.map((item) => (item.id === booking.id ? booking : item)));
  return booking;
}

// --- Social ----------------------------------------------------------------

export async function addFriend(targetId: string): Promise<void> {
  const userId = requireUser();
  const friends = await backend.requestFriend(userId, targetId);
  const store = useDataStore.getState();
  store.setFriends(friends);
  // Le joueur sort des suggestions dès la demande envoyée.
  store.setSuggestions(store.suggestions.filter((player) => player.userId !== targetId));
  store.setActivity(await backend.listActivity(userId));
}

export async function respondToFriend(targetId: string, accept: boolean): Promise<void> {
  const userId = requireUser();
  useDataStore.getState().setFriends(await backend.respondToFriend(userId, targetId, accept));
  if (accept) useDataStore.getState().setActivity(await backend.listActivity(userId));
}

export async function removeFriend(targetId: string): Promise<void> {
  useDataStore.getState().setFriends(await backend.removeFriend(requireUser(), targetId));
}
