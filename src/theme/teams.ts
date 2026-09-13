/**
 * Accès typé à `teams.json` (généré par `npm run teams:build`).
 * L'entrée « none » du fichier est remplacée par `NEUTRAL_TEAM` (source unique du thème Neutre).
 */
import { normalizeSearch } from '@/lib/validation';

import { NEUTRAL_TEAM } from './buildTheme';
import teamsJson from './teams.json';
import type { LeagueId, TeamEntry, TeamsFile } from './types';

const file = teamsJson as unknown as TeamsFile;

export const TEAMS_VERSION = file.version;
export const TEAMS_SEASON = file.season;
export const FIFA_RANKING_DATE = file.fifaRankingDate ?? null;

/** Toutes les équipes, « none » (thème Neutre) en premier. */
export const TEAMS: TeamEntry[] = [NEUTRAL_TEAM, ...file.teams.filter((t) => t.id !== 'none')];

const byId = new Map<string, TeamEntry>(TEAMS.map((t) => [t.id, t]));

export function getTeam(id: string | null | undefined): TeamEntry {
  if (!id) return NEUTRAL_TEAM;
  return byId.get(id) ?? NEUTRAL_TEAM;
}

export function hasTeam(id: string | null | undefined): boolean {
  return Boolean(id && byId.has(id));
}

/** Ordre d'affichage des championnats (section 6.1). */
export const LEAGUE_ORDER: LeagueId[] = [
  'ligue1',
  'ligue2',
  'premier_league',
  'la_liga',
  'serie_a',
  'bundesliga',
  'liga_portugal',
  'eredivisie',
  'national',
];

export type TeamLocale = 'fr' | 'en';

export function getTeamDisplayName(team: TeamEntry, locale: TeamLocale): string {
  if (locale === 'fr') return team.nameFr ?? team.name;
  return team.nameEn ?? team.name;
}

export interface TeamSection {
  league: LeagueId;
  data: TeamEntry[];
}

/** Groupe une liste d'équipes par championnat, dans l'ordre officiel (sans « none »). */
export function groupTeamsByLeague(teams: TeamEntry[]): TeamSection[] {
  return LEAGUE_ORDER.map((league) => ({
    league,
    data: teams.filter((t) => t.league === league),
  })).filter((section) => section.data.length > 0);
}

/** Recherche par nom, abréviation ou ville (insensible à la casse et aux accents). */
export function searchTeams(query: string, locale: TeamLocale = 'fr'): TeamEntry[] {
  const q = normalizeSearch(query);
  const candidates = TEAMS.filter((t) => t.id !== 'none');
  if (!q) return candidates;
  return candidates.filter((team) => {
    const haystack = [
      team.name,
      team.nameFr ?? '',
      team.nameEn ?? '',
      team.shortName,
      team.city,
      getTeamDisplayName(team, locale),
    ]
      .map(normalizeSearch)
      .join(' ');
    return haystack.includes(q);
  });
}
