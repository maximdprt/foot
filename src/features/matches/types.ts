/** Modèle d'un match amateur (miroir des tables `matches` et `match_participants`). */

export type MatchFormat = 'five' | 'futsal' | 'seven' | 'eleven';
export type MatchLevel = 'all' | 'leisure' | 'confirmed' | 'competition';
export type MatchStatus = 'open' | 'cancelled' | 'played';

export const MATCH_FORMATS: MatchFormat[] = ['five', 'futsal', 'seven', 'eleven'];
export const MATCH_LEVELS: MatchLevel[] = ['all', 'leisure', 'confirmed', 'competition'];

/** Nombre de joueurs par défaut pour chaque format (deux équipes complètes). */
export const FORMAT_PLAYERS: Record<MatchFormat, number> = {
  five: 10,
  futsal: 10,
  seven: 14,
  eleven: 22,
};

export interface MatchParticipant {
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
  favoriteTeamId: string | null;
  joinedAt: string;
}

export interface Match {
  id: string;
  organizerId: string;
  organizerName: string | null;
  format: MatchFormat;
  level: MatchLevel;
  /** Coup d'envoi, au format ISO 8601. */
  kickoffAt: string;
  durationMinutes: number;
  venueName: string;
  city: string;
  maxPlayers: number;
  notes: string | null;
  status: MatchStatus;
  participants: MatchParticipant[];
  createdAt: string;
}

/** Brouillon de création : tout ce que l'organisateur saisit. */
export interface MatchDraft {
  format: MatchFormat;
  level: MatchLevel;
  kickoffAt: string;
  durationMinutes: number;
  venueName: string;
  city: string;
  maxPlayers: number;
  notes: string | null;
}

export function spotsLeft(match: Match): number {
  return Math.max(0, match.maxPlayers - match.participants.length);
}

export function isFull(match: Match): boolean {
  return spotsLeft(match) === 0;
}

export function hasJoined(match: Match, userId: string | null | undefined): boolean {
  return Boolean(userId) && match.participants.some((p) => p.userId === userId);
}

/** Un match passé ne peut plus être rejoint, quel que soit son statut enregistré. */
export function isPast(match: Match, now = Date.now()): boolean {
  return new Date(match.kickoffAt).getTime() + match.durationMinutes * 60_000 < now;
}

export function canJoin(match: Match, userId: string | null | undefined): boolean {
  return (
    match.status === 'open' && !isPast(match) && !isFull(match) && !hasJoined(match, userId)
  );
}

/** Tri d'affichage : les matchs à venir d'abord, du plus proche au plus lointain. */
export function compareByKickoff(a: Match, b: Match): number {
  return new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime();
}

/** Prochain match à venir auquel l'utilisateur participe. */
export function nextMatchFor(matches: Match[], userId: string | null | undefined): Match | null {
  const now = Date.now();
  return (
    matches
      .filter((m) => m.status === 'open' && hasJoined(m, userId) && !isPast(m, now))
      .sort(compareByKickoff)[0] ?? null
  );
}
