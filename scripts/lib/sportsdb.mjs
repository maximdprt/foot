// TheSportsDB (clé publique gratuite « 3 ») : recherche d'équipe par nom.
// Les endpoints de liste (search_all_teams, lookup_all_teams, lookuptable)
// sont plafonnés ou cassés sur la clé gratuite ; seul searchteams est fiable.
import { normalizeHex } from './color.mjs';

const BASE = 'https://www.thesportsdb.com/api/v1/json/3';

export async function searchTeams(http, name) {
  const data = await http.fetchJson(`${BASE}/searchteams.php?t=${encodeURIComponent(name)}`);
  return (data?.teams ?? []).filter((t) => t.strSport === 'Soccer');
}

function leaguesOf(t) {
  return [t.strLeague, t.strLeague2, t.strLeague3, t.strLeague4, t.strLeague5, t.strLeague6, t.strLeague7].filter(Boolean);
}

export const norm = (s) =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/**
 * Choisit la meilleure fiche club : nom identique (ou alias) puis ligue attendue,
 * puis pays. Retourne `null` si rien de convaincant.
 */
export function pickClub(results, { names, league, country }) {
  const wanted = names.map(norm);
  const nameMatches = results.filter((t) => {
    const alts = [t.strTeam, ...(t.strTeamAlternate ?? '').split(',')].map(norm);
    return alts.some((a) => wanted.includes(a));
  });
  const pool = nameMatches.length ? nameMatches : results;
  const byLeague = pool.find((t) => leaguesOf(t).includes(league));
  if (byLeague) return byLeague;
  const byCountry = pool.find((t) => norm(t.strCountry) === norm(country));
  if (byCountry && nameMatches.length) return byCountry;
  if (nameMatches.length === 1) return nameMatches[0];
  return null;
}

/** Fiche d'une sélection nationale masculine. */
export function pickNation(results, names) {
  const wanted = names.map(norm);
  const international = /world cup|international|nations league|euro|copa|africa cup|gold cup|asian cup|friendl|qualif|olympic/i;
  return (
    results.find((t) => wanted.includes(norm(t.strTeam)) && t.strGender === 'Male' && leaguesOf(t).some((l) => international.test(l))) ??
    results.find((t) => wanted.includes(norm(t.strTeam)) && t.strGender === 'Male' && norm(t.strCountry) === norm(t.strTeam)) ??
    null
  );
}

/** Extrait les données utiles d'une fiche. */
export function summarize(t) {
  if (!t) return null;
  return {
    idTeam: t.idTeam,
    name: t.strTeam,
    shortName: (t.strTeamShort ?? '').trim() || null,
    league: t.strLeague,
    country: t.strCountry,
    location: t.strLocation,
    colour1: normalizeHex(t.strColour1),
    colour2: normalizeHex(t.strColour2),
    colour3: normalizeHex(t.strColour3),
  };
}
