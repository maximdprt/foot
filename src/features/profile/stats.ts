/**
 * Statistiques du joueur et badges.
 *
 * Rien n'est stocké : tout se **calcule** à partir des matchs, des séances, des
 * réservations et des amis. Une donnée dérivée qu'on stocke finit toujours par
 * diverger de la réalité.
 */
import type { Booking } from '@/features/booking/types';
import { hasJoined, isPast, type Match } from '@/features/matches/types';
import type { Friendship } from '@/features/social/types';
import { isSessionComplete, type TrainingSession } from '@/features/training/types';

export interface PlayerStats {
  /** Matchs joués : terminés, et auxquels l'utilisateur participait. */
  matchesPlayed: number;
  matchesUpcoming: number;
  matchesOrganized: number;
  sessionsCompleted: number;
  /** Temps d'entraînement cumulé, en minutes. */
  trainingMinutes: number;
  bookings: number;
  friends: number;
  /** Jours consécutifs avec au moins une séance, en comptant aujourd'hui ou hier. */
  currentStreakDays: number;
  bestStreakDays: number;
}

export const EMPTY_STATS: PlayerStats = {
  matchesPlayed: 0,
  matchesUpcoming: 0,
  matchesOrganized: 0,
  sessionsCompleted: 0,
  trainingMinutes: 0,
  bookings: 0,
  friends: 0,
  currentStreakDays: 0,
  bestStreakDays: 0,
};

export interface StatsInput {
  userId: string | null;
  matches: Match[];
  sessions: TrainingSession[];
  bookings: Booking[];
  friends: Friendship[];
}

/** Clé de jour local (`2026-09-13`) : deux séances le même jour ne comptent qu'une fois. */
function dayKey(iso: string): string {
  const date = new Date(iso);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function addDays(key: string, delta: number): string {
  const [year, month, day] = key.split('-').map(Number);
  const date = new Date(year, month - 1, day + delta);
  return dayKey(date.toISOString());
}

/**
 * Séries de jours consécutifs d'entraînement.
 * La série courante n'est rompue qu'au bout de deux jours sans séance : s'être
 * entraîné hier mais pas encore aujourd'hui ne doit pas remettre le compteur à zéro.
 */
export function computeStreaks(
  sessions: TrainingSession[],
  now = new Date(),
): { current: number; best: number } {
  const days = Array.from(
    new Set(sessions.filter(isSessionComplete).map((session) => dayKey(session.completedAt))),
  ).sort();
  if (days.length === 0) return { current: 0, best: 0 };

  let best = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    run = days[i] === addDays(days[i - 1], 1) ? run + 1 : 1;
    if (run > best) best = run;
  }

  const today = dayKey(now.toISOString());
  const yesterday = addDays(today, -1);
  const last = days[days.length - 1];
  if (last !== today && last !== yesterday) return { current: 0, best };

  // La série courante est le run qui se termine sur le dernier jour connu.
  let current = 1;
  for (let i = days.length - 1; i > 0; i--) {
    if (days[i] === addDays(days[i - 1], 1)) current += 1;
    else break;
  }
  return { current, best };
}

export function computeStats({ userId, matches, sessions, bookings, friends }: StatsInput): PlayerStats {
  const now = Date.now();
  const completed = sessions.filter(isSessionComplete);
  const { current, best } = computeStreaks(sessions);

  return {
    matchesPlayed: matches.filter(
      (m) => hasJoined(m, userId) && m.status !== 'cancelled' && isPast(m, now),
    ).length,
    matchesUpcoming: matches.filter(
      (m) => hasJoined(m, userId) && m.status === 'open' && !isPast(m, now),
    ).length,
    matchesOrganized: matches.filter((m) => m.organizerId === userId).length,
    sessionsCompleted: completed.length,
    trainingMinutes: Math.round(
      completed.reduce((total, session) => total + session.durationSeconds, 0) / 60,
    ),
    bookings: bookings.filter((b) => b.status === 'confirmed').length,
    friends: friends.filter((f) => f.status === 'accepted').length,
    currentStreakDays: current,
    bestStreakDays: best,
  };
}

/** Statistique suivie par un badge. */
export type BadgeMetric = keyof Pick<
  PlayerStats,
  'matchesPlayed' | 'matchesOrganized' | 'sessionsCompleted' | 'trainingMinutes' | 'friends' | 'bestStreakDays'
>;

export interface BadgeDefinition {
  id: string;
  nameKey: string;
  descriptionKey: string;
  metric: BadgeMetric;
  /** Valeur à atteindre pour décrocher le badge. */
  threshold: number;
}

function badge(id: string, metric: BadgeMetric, threshold: number): BadgeDefinition {
  return {
    id,
    nameKey: `profile.badges.items.${id}.name`,
    descriptionKey: `profile.badges.items.${id}.description`,
    metric,
    threshold,
  };
}

/** Paliers volontairement bas au début : le premier badge doit tomber vite. */
export const BADGES: BadgeDefinition[] = [
  badge('first_touch', 'sessionsCompleted', 1),
  badge('regular', 'sessionsCompleted', 10),
  badge('grinder', 'sessionsCompleted', 30),
  badge('hour_club', 'trainingMinutes', 60),
  badge('marathon', 'trainingMinutes', 600),
  badge('streak_three', 'bestStreakDays', 3),
  badge('streak_week', 'bestStreakDays', 7),
  badge('first_match', 'matchesPlayed', 1),
  badge('team_player', 'matchesPlayed', 10),
  badge('organizer', 'matchesOrganized', 3),
  badge('connected', 'friends', 3),
  badge('captain', 'friends', 10),
];

export interface BadgeProgress {
  definition: BadgeDefinition;
  earned: boolean;
  /** Valeur atteinte, plafonnée au palier. */
  value: number;
  /** Progression de 0 à 1. */
  ratio: number;
}

export function badgeProgress(stats: PlayerStats): BadgeProgress[] {
  return BADGES.map((definition) => {
    const raw = stats[definition.metric];
    return {
      definition,
      earned: raw >= definition.threshold,
      value: Math.min(raw, definition.threshold),
      ratio: definition.threshold === 0 ? 1 : Math.min(1, raw / definition.threshold),
    };
  });
}

/** Badges décrochés, puis les plus proches d'être atteints. */
export function sortedBadges(stats: PlayerStats): BadgeProgress[] {
  return badgeProgress(stats).sort((a, b) => {
    if (a.earned !== b.earned) return a.earned ? -1 : 1;
    return b.ratio - a.ratio;
  });
}
