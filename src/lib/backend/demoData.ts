/**
 * Données de départ du mode démo.
 *
 * Sans elles, un utilisateur qui ouvre l'app sans backend tombe sur cinq onglets
 * vides et ne peut rien essayer. On sème donc quelques **profils fictifs** et
 * des matchs ouverts dans sa ville.
 *
 * Ces profils sont explicitement fictifs : prénoms courants, aucune adresse,
 * aucun contact. Ils n'existent que dans le stockage local de l'appareil, et
 * uniquement quand Supabase n'est pas configuré.
 */
import { FORMAT_PLAYERS, type Match, type MatchFormat, type MatchLevel } from '@/features/matches/types';
import type { PlayerSummary } from '@/features/social/types';
import { normalizeSearch } from '@/lib/validation';

/** Prénoms utilisés pour les profils de démonstration. */
const FIRST_NAMES = [
  'Camille', 'Sacha', 'Noa', 'Léa', 'Yanis', 'Inès',
  'Rayan', 'Jade', 'Théo', 'Manon', 'Ilyas', 'Chloé',
];

/** Équipes supportées attribuées aux profils fictifs, pour varier les pastilles. */
const DEMO_TEAMS = [
  'paris-saint-germain', 'marseille', 'lyon', 'lille',
  'monaco', 'nice', 'rennes', 'lens',
  null, 'toulouse', 'brest', null,
];

/** Entier déterministe tiré d'une chaîne : même ville, mêmes joueurs. */
function seeded(seed: string, max: number): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % max;
}

/** Les 8 joueurs fictifs d'une ville. */
export function demoPlayersFor(city: string | null | undefined): PlayerSummary[] {
  const resolved = city?.trim() || '';
  const slug = normalizeSearch(resolved).replace(/\s+/g, '-') || 'sans-ville';
  // Un seul décalage tiré par ville, puis on avance d'un cran par joueur : les
  // huit prénoms sont alors tous distincts (huit joueurs, douze prénoms). Tirer
  // chaque prénom indépendamment provoquait des collisions — jusqu'à trois
  // homonymes dans le même match.
  const offset = seeded(slug, FIRST_NAMES.length);
  return Array.from({ length: 8 }, (_, index) => {
    const pick = (offset + index) % FIRST_NAMES.length;
    return {
      userId: `demo-${slug}-${index}`,
      displayName: FIRST_NAMES[pick],
      avatarUrl: null,
      favoriteTeamId: DEMO_TEAMS[(pick + index) % DEMO_TEAMS.length],
      city: resolved,
    };
  });
}

const FORMATS: MatchFormat[] = ['five', 'futsal', 'seven', 'eleven'];
const LEVELS: MatchLevel[] = ['all', 'leisure', 'confirmed'];
const VENUE_KEYS = ['booking.venues.five_indoor', 'booking.venues.futsal', 'booking.venues.club_pitch', 'booking.venues.city_stadium'];

/**
 * Matchs ouverts d'une ville, répartis sur les dix prochains jours.
 * `venueName` porte ici une clé i18n : le mode démo ne connaît pas de vrais
 * établissements, il affiche donc le type de terrain.
 */
export function demoMatchesFor(city: string | null | undefined, now = new Date()): Match[] {
  const resolved = city?.trim() || '';
  const slug = normalizeSearch(resolved).replace(/\s+/g, '-') || 'sans-ville';
  const players = demoPlayersFor(resolved);

  return Array.from({ length: 4 }, (_, index) => {
    const organizer = players[index % players.length];
    const format = FORMATS[seeded(`${slug}|format|${index}`, FORMATS.length)];
    const maxPlayers = FORMAT_PLAYERS[format];

    // Étalés sur 2 à 9 jours, en soirée.
    const kickoff = new Date(now);
    kickoff.setDate(kickoff.getDate() + 2 + index * 2);
    kickoff.setHours(18 + seeded(`${slug}|hour|${index}`, 4), 0, 0, 0);

    // Match déjà à moitié rempli : il reste des places, mais pas beaucoup.
    const joined = players.slice(1, 1 + Math.max(2, Math.floor(maxPlayers / 2)));

    return {
      id: `demo-match-${slug}-${index}`,
      organizerId: organizer.userId,
      organizerName: organizer.displayName,
      format,
      level: LEVELS[seeded(`${slug}|level|${index}`, LEVELS.length)],
      kickoffAt: kickoff.toISOString(),
      durationMinutes: format === 'eleven' ? 90 : 60,
      venueName: VENUE_KEYS[seeded(`${slug}|venue|${index}`, VENUE_KEYS.length)],
      city: resolved,
      maxPlayers,
      notes: null,
      status: 'open' as const,
      participants: [
        {
          userId: organizer.userId,
          displayName: organizer.displayName,
          avatarUrl: null,
          favoriteTeamId: organizer.favoriteTeamId,
          joinedAt: now.toISOString(),
        },
        ...joined.map((player) => ({
          userId: player.userId,
          displayName: player.displayName,
          avatarUrl: null,
          favoriteTeamId: player.favoriteTeamId,
          joinedAt: now.toISOString(),
        })),
      ],
      createdAt: now.toISOString(),
    };
  });
}

/** Un nom de terrain qui est en réalité une clé i18n (matchs de démonstration). */
export function isVenueKey(venueName: string): boolean {
  return venueName.startsWith('booking.venues.');
}
