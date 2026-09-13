/**
 * Données métier de l'utilisateur : matchs, séances, réservations, relations,
 * fil d'activité.
 *
 * Un seul store plutôt qu'un par domaine : ces collections sont chargées
 * ensemble, invalidées ensemble à la connexion, et les écrans en croisent
 * plusieurs (le tableau de bord, les statistiques, les badges).
 *
 * Volontairement non persisté : le backend fait autorité. Ce qui doit survivre
 * à une fermeture d'app est déjà dans `profileStore` (le brouillon) ou en base.
 */
import { create } from 'zustand';

import type { Booking } from '@/features/booking/types';
import type { Match } from '@/features/matches/types';
import type { ActivityItem, Friendship, PlayerSummary } from '@/features/social/types';
import type { TrainingSession } from '@/features/training/types';

interface DataState {
  matches: Match[];
  sessions: TrainingSession[];
  bookings: Booking[];
  friends: Friendship[];
  suggestions: PlayerSummary[];
  activity: ActivityItem[];

  /** Un chargement est en cours (premier affichage ou rafraîchissement). */
  loading: boolean;
  /** Identifiant de l'utilisateur dont les données sont en mémoire. */
  loadedFor: string | null;
  /** Horodatage du dernier chargement réussi, en ms. */
  loadedAt: number | null;

  setLoading: (loading: boolean) => void;
  setAll: (data: Partial<Omit<DataState, 'setAll'>> & { loadedFor: string | null }) => void;
  setMatches: (matches: Match[]) => void;
  /** Insère ou remplace un match, en conservant l'ordre par coup d'envoi. */
  upsertMatch: (match: Match) => void;
  setSessions: (sessions: TrainingSession[]) => void;
  setBookings: (bookings: Booking[]) => void;
  setFriends: (friends: Friendship[]) => void;
  setSuggestions: (suggestions: PlayerSummary[]) => void;
  setActivity: (activity: ActivityItem[]) => void;
  reset: () => void;
}

const EMPTY = {
  matches: [] as Match[],
  sessions: [] as TrainingSession[],
  bookings: [] as Booking[],
  friends: [] as Friendship[],
  suggestions: [] as PlayerSummary[],
  activity: [] as ActivityItem[],
  loading: false,
  loadedFor: null as string | null,
  loadedAt: null as number | null,
};

export const useDataStore = create<DataState>()((set) => ({
  ...EMPTY,

  setLoading: (loading) => set({ loading }),
  setAll: (data) => set({ ...data, loading: false, loadedAt: Date.now() }),
  setMatches: (matches) => set({ matches }),
  upsertMatch: (match) =>
    set((state) => {
      const others = state.matches.filter((item) => item.id !== match.id);
      return {
        matches: [...others, match].sort(
          (a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime(),
        ),
      };
    }),
  setSessions: (sessions) => set({ sessions }),
  setBookings: (bookings) => set({ bookings }),
  setFriends: (friends) => set({ friends }),
  setSuggestions: (suggestions) => set({ suggestions }),
  setActivity: (activity) => set({ activity }),
  reset: () => set({ ...EMPTY }),
}));

/** Les données en mémoire correspondent-elles à l'utilisateur demandé ? */
export function isLoadedFor(state: DataState, userId: string | null): boolean {
  return state.loadedFor === userId && state.loadedAt !== null;
}
