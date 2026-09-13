#!/usr/bin/env node
/**
 * Génère `src/theme/teams.json` (toutes les équipes des 8 championnats + top 30 FIFA)
 * à partir de sources publiques croisées, puis écrit le rapport `docs/teams-report.md`
 * et la provenance brute `scripts/out/teams-provenance.json`.
 *
 *   node scripts/scrape-teams.mjs [--season 2026-27] [--no-cache] [--help]
 *
 * Sources :
 *   • Effectifs : pages de saison Wikipédia (en) « 2026–27 Ligue 1 », etc. (table des stades)
 *   • Couleurs A : infobox Wikipédia (en) du club (couleurs hex du maillot domicile)
 *                 + infobox Wikipédia (fr) (couleur cadre / couleur écriture)
 *   • Couleurs B : TheSportsDB (clé publique) — strColour1/2/3
 *   • Couleurs C : scripts/data/official-colors.json (chartes officielles, curées à la main)
 *   • Sélections : classement FIFA complet (module Lua « SportsRankings/data/FIFA World Rankings »)
 *
 * Aucune dépendance npm : Node ≥ 18 (fetch natif).
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { contrastOnWhite, darkenToContrast, deltaE, isNearBlack, isNearWhite, isNeutral, normalizeHex } from './lib/color.mjs';
import { createHttp } from './lib/http.mjs';
import { pickClub, pickNation, searchTeams, summarize } from './lib/sportsdb.mjs';
import { fetchPage, parseClubInfobox, parseFifaRankingModule, parseFrenchInfobox, parseRoster } from './lib/wiki.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = path.join(ROOT, 'scripts', 'data');
const OUT_JSON = path.join(ROOT, 'src', 'theme', 'teams.json');
const OUT_REPORT = path.join(ROOT, 'docs', 'teams-report.md');
const OUT_PROVENANCE = path.join(ROOT, 'scripts', 'out', 'teams-provenance.json');
const CACHE_DIR = path.join(ROOT, 'scripts', '.cache');

const MIN_CONTRAST = 4.5; // WCAG AA texte normal
const DELTA_E_AGREE = 30; // au-delà, deux sources ne décrivent plus la même couleur
const NATIONS_COUNT = 30;

/** Championnats dans l'ordre du cahier des charges. */
const LEAGUES = [
  { id: 'ligue1', label: 'Ligue 1', country: 'FR', countryName: 'France', sportsdb: 'French Ligue 1', wiki: 'Ligue 1', size: 18 },
  { id: 'ligue2', label: 'Ligue 2', country: 'FR', countryName: 'France', sportsdb: 'French Ligue 2', wiki: 'Ligue 2', size: 18 },
  { id: 'premier_league', label: 'Premier League', country: 'GB', countryName: 'England', sportsdb: 'English Premier League', wiki: 'Premier League', size: 20 },
  { id: 'la_liga', label: 'La Liga', country: 'ES', countryName: 'Spain', sportsdb: 'Spanish La Liga', wiki: 'La Liga', size: 20 },
  { id: 'serie_a', label: 'Serie A', country: 'IT', countryName: 'Italy', sportsdb: 'Italian Serie A', wiki: 'Serie A', size: 20 },
  { id: 'bundesliga', label: 'Bundesliga', country: 'DE', countryName: 'Germany', sportsdb: 'German Bundesliga', wiki: 'Bundesliga', size: 18 },
  { id: 'liga_portugal', label: 'Liga Portugal', country: 'PT', countryName: 'Portugal', sportsdb: 'Portuguese Primeira Liga', wiki: 'Primeira Liga', size: 18 },
  { id: 'eredivisie', label: 'Eredivisie', country: 'NL', countryName: 'Netherlands', sportsdb: 'Dutch Eredivisie', wiki: 'Eredivisie', size: 18 },
];

/** Entrée « aucune équipe » → thème Neutre (noir #121212 + vert pelouse #2E9E5B). */
const NONE_TEAM = {
  id: 'none',
  name: 'Aucune équipe',
  nameFr: 'Aucune équipe',
  nameEn: 'No team',
  shortName: '—',
  city: '',
  country: '',
  league: 'none',
  colors: { primary: '#2E9E5B', secondary: '#121212', tertiary: '#FFFFFF' },
  // Le vert pelouse du cahier des charges ne fait que 3,41:1 sur blanc : comme
  // pour les clubs à couleur trop claire, on l'assombrit et on le documente.
  themeOverride: {
    primary: '#27864D',
    secondary: '#121212',
    reason:
      "Vert pelouse #2E9E5B assombri en #27864D : la primaire sert aussi au texte et aux icônes sur blanc (3,41:1 → 4,56:1, WCAG AA).",
  },
  logoUrl: null,
};

// ---------------------------------------------------------------------------
// Utilitaires
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const out = { season: '2026-27', cache: true, help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') out.help = true;
    else if (a === '--no-cache') out.cache = false;
    else if (a === '--season') out.season = argv[++i];
    else if (a.startsWith('--season=')) out.season = a.slice('--season='.length);
    else throw new Error(`Option inconnue : ${a} (voir --help)`);
  }
  if (!/^\d{4}-\d{2}$/.test(out.season ?? '')) throw new Error('--season attend le format AAAA-AA, ex. 2026-27');
  return out;
}

function printHelp() {
  console.log(`Usage : node scripts/scrape-teams.mjs [options]

Options :
  --season AAAA-AA   Saison à scraper (défaut : 2026-27). Les pages Wikipédia « AAAA–AA <Ligue> » doivent exister.
  --no-cache         Ignore le cache disque (scripts/.cache) et refait toutes les requêtes.
  -h, --help         Affiche cette aide.

Sorties :
  src/theme/teams.json               données consommées par l'app (ordre : none, championnats, sélections)
  scripts/out/teams-provenance.json  valeurs brutes de chaque source, par équipe
  docs/teams-report.md               rapport (overrides, assombrissements, écarts entre sources)

Données curées (à maintenir à la main) :
  scripts/data/official-colors.json  chartes officielles (prioritaires)
  scripts/data/overrides.json        themeOverride documentés pour les équipes à couleur claire
  scripts/data/aliases.json          alias de noms (TheSportsDB / Wikipédia), abréviations, villes, sélections
`);
}

/** Slug ASCII stable : « Paris Saint-Germain » → paris-saint-germain, « N.E.C. » → nec. */
function slugify(label) {
  return label
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[.'’]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const STOP_WORDS = new Set(['fc', 'sc', 'cf', 'ud', 'ac', 'as', 'us', 'cd', 'sl', 'sv', 'de', 'da', 'do', 'di', 'la', 'le', 'the', 'and', 'of', 'club', 'united', 'city', 'town']);

/** Abréviation générée si aucune source n'en fournit : initiales ou 3 premières lettres. */
function generateShortName(label) {
  const words = label
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  const meaningful = words.filter((w) => !STOP_WORDS.has(w.toLowerCase()));
  const base = meaningful.length ? meaningful : words;
  if (base.length >= 2) return base.map((w) => w[0]).join('').toUpperCase().slice(0, 4);
  return (base[0] ?? label).replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 3);
}

async function readJson(file, fallback) {
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT' && fallback !== undefined) return fallback;
    throw error;
  }
}

const sortFr = (a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' });

// ---------------------------------------------------------------------------
// Fusion des couleurs
// ---------------------------------------------------------------------------

function firstDistinct(candidates, taken) {
  return candidates.find((c) => c && !taken.includes(c)) ?? null;
}

/** Deux couleurs « d'accord » : même famille perceptuelle, ou même neutre (blanc/blanc, noir/noir). */
function agrees(a, b) {
  if (!a || !b) return false;
  if (isNearWhite(a) || isNearWhite(b)) return isNearWhite(a) && isNearWhite(b);
  if (isNearBlack(a) || isNearBlack(b)) return isNearBlack(a) && isNearBlack(b);
  return deltaE(a, b) <= DELTA_E_AGREE;
}

/**
 * Fusionne les sources : charte officielle > TheSportsDB > maillot Wikipédia (en) > infobox (fr).
 * Retourne les couleurs + la liste des sources utilisables + le diagnostic de concordance.
 */
function mergeColors({ official, sportsdb, kit, fr }) {
  const k = {};
  for (const [key, value] of Object.entries(kit ?? {})) k[key] = normalizeHex(value);
  const frCadre = normalizeHex(fr?.couleurCadre);
  const frEcriture = normalizeHex(fr?.couleurEcriture);
  const o = {
    primary: normalizeHex(official?.primary),
    secondary: normalizeHex(official?.secondary),
    tertiary: normalizeHex(official?.tertiary),
  };
  const s = sportsdb ?? {};

  const primarySources = [
    ['official', o.primary],
    ['sportsdb', s.colour1 ?? null],
    ['wikiKit', k.body1 ?? k.leftarm1 ?? null],
    ['wikiFr', frCadre],
  ].filter(([, v]) => v);

  let primary = null;
  let primaryFrom = null;
  for (const [from, value] of primarySources) {
    primary = value;
    primaryFrom = from;
    break;
  }
  if (!primary) return null;

  let secondary =
    o.secondary ??
    (s.colour2 && s.colour2 !== primary ? s.colour2 : null) ??
    firstDistinct([k.shorts1, k.socks1, k.leftarm1, frEcriture, k.body2], [primary]);
  let tertiary =
    o.tertiary ??
    (s.colour3 && s.colour3 !== primary && s.colour3 !== secondary ? s.colour3 : null) ??
    firstDistinct([k.shorts1, k.socks1, k.body2, k.shorts2], [primary, secondary]);

  const neutralFallback = (taken) => (taken.some((c) => c && isNearWhite(c)) ? '#121212' : '#FFFFFF');
  if (!secondary || secondary === primary) secondary = tertiary && tertiary !== primary ? tertiary : neutralFallback([primary]);
  if (!tertiary || tertiary === primary || tertiary === secondary) tertiary = neutralFallback([primary, secondary]);

  const others = primarySources.filter(([from]) => from !== primaryFrom);
  const agreeing = others.filter(([, v]) => agrees(primary, v)).map(([from]) => from);
  return {
    colors: { primary, secondary, tertiary },
    primaryFrom,
    usableSources: primarySources.map(([from]) => from),
    agreeing,
    disagreeing: others.filter(([from]) => !agreeing.includes(from)).map(([from, v]) => `${from}=${v}`),
  };
}

/**
 * Détermine le `themeOverride` d'une équipe dont la couleur principale ne passe pas
 * WCAG AA sur blanc (ou applique l'override curé s'il existe).
 * Les références « primary » / « secondary » / « tertiary » / « darken » renvoient aux couleurs fusionnées.
 */
function resolveOverride(id, colors, curated) {
  const { primary, secondary, tertiary } = colors;
  const resolveRef = (ref) => {
    if (!ref) return null;
    if (ref === 'primary') return primary;
    if (ref === 'secondary') return secondary;
    if (ref === 'tertiary') return tertiary;
    if (ref === 'darken') return primary;
    return normalizeHex(ref);
  };
  const notes = [];

  if (curated) {
    let p = resolveRef(curated.primary) ?? primary;
    if (contrastOnWhite(p) < MIN_CONTRAST) {
      const darker = darkenToContrast(p, MIN_CONTRAST);
      notes.push(`${p} → ${darker} (assombri pour AA)`);
      p = darker;
    }
    let sec = resolveRef(curated.secondary) ?? (primary !== p && !isNearWhite(primary) ? primary : null) ?? (secondary !== p ? secondary : tertiary);
    if (sec === p) sec = isNearWhite(p) ? '#121212' : '#FFFFFF';
    return { override: { primary: p, secondary: sec, reason: curated.reason }, notes, kind: 'curated' };
  }

  if (contrastOnWhite(primary) >= MIN_CONTRAST) return { override: null, notes, kind: null };

  if (isNearWhite(primary) || isNeutral(primary)) {
    // Blanc / gris clair : le blanc est déjà la base de l'app → 2e couleur du club, assombrie si besoin.
    const candidate = [secondary, tertiary].find((c) => c && !isNearWhite(c) && !isNeutral(c)) ?? [secondary, tertiary].find((c) => c && !isNearWhite(c)) ?? '#121212';
    const p = darkenToContrast(candidate, MIN_CONTRAST);
    const sec = [tertiary, secondary].find((c) => c && c !== candidate && c !== p && !isNearWhite(c)) ?? '#FFFFFF';
    const reason =
      `Couleur principale ${primary} (blanc / très claire) : le blanc est déjà la base de l'app ; ` +
      `on utilise la couleur secondaire du club ${candidate}` +
      (p !== candidate ? ` assombrie en ${p} pour WCAG AA` : '') +
      '.';
    return { override: { primary: p, secondary: sec, reason }, notes, kind: 'auto-white' };
  }

  // Couleur claire (jaune, bleu ciel, orange…) : assombrie jusqu'à AA, teinte conservée.
  const p = darkenToContrast(primary, MIN_CONTRAST);
  const sec = secondary && secondary !== p ? secondary : tertiary;
  return {
    override: { primary: p, secondary: sec, reason: `auto-darkened from ${primary} for WCAG AA (contraste ${contrastOnWhite(primary).toFixed(2)}:1)` },
    notes,
    kind: 'auto-darkened',
  };
}

// ---------------------------------------------------------------------------
// Collecte
// ---------------------------------------------------------------------------

async function collectClub(http, league, row, data, log) {
  const id = slugify(row.label);
  const alias = data.aliases.clubs[id] ?? {};
  const provenance = { id, league: league.id, wikiArticle: row.article, wikiLabel: row.label, wikiLocation: row.location };

  // Source A : Wikipédia (en) + (fr)
  const page = await fetchPage(http, alias.wikiEn ?? row.article, 'en', 'fr');
  const infobox = page ? parseClubInfobox(page.content) : null;
  provenance.wikiEn = infobox ? { title: page.title, ...infobox } : null;
  let fr = null;
  const frTitle = alias.wikiFr ?? page?.langlink ?? null;
  if (frTitle) {
    const frPage = await fetchPage(http, frTitle, 'fr');
    fr = frPage ? parseFrenchInfobox(frPage.content) : null;
    provenance.wikiFr = fr ? { title: frPage.title, ...fr } : null;
  }

  // Source B : TheSportsDB
  const queries = [...(alias.sportsdb ? [alias.sportsdb] : []), row.label];
  let sportsdb = null;
  for (const q of queries) {
    const results = await searchTeams(http, q);
    const picked = pickClub(results, {
      names: [q, row.label, row.article, infobox?.clubname, infobox?.fullname, alias.sportsdb].filter(Boolean),
      league: league.sportsdb,
      country: league.countryName,
    });
    if (picked) {
      sportsdb = summarize(picked);
      break;
    }
  }
  provenance.sportsdb = sportsdb;

  // Source C : charte officielle
  const official = data.official[id] ?? null;
  provenance.official = official;

  const merged = mergeColors({ official, sportsdb, kit: infobox?.kit, fr });
  if (!merged) {
    log(`  ✖ ${row.label} : aucune couleur trouvée dans aucune source`);
    return { entry: null, provenance, merged: null };
  }

  const { override, notes, kind } = resolveOverride(id, merged.colors, data.overrides[id]);
  const sdbShort = sportsdb?.shortName && /^[A-Z0-9]{2,4}$/.test(sportsdb.shortName) ? sportsdb.shortName : null;
  const shortName = alias.shortName ?? sdbShort ?? generateShortName(row.label);
  const entry = {
    id,
    name: alias.name ?? row.label,
    ...(alias.nameFr ? { nameFr: alias.nameFr } : {}),
    shortName,
    city: alias.city ?? row.location ?? sportsdb?.location?.split(',')[0]?.trim() ?? '',
    country: league.country,
    league: league.id,
    colors: merged.colors,
    themeOverride: override,
    logoUrl: null,
  };
  return { entry, provenance, merged, overrideKind: kind, overrideNotes: notes, shortNameFrom: alias.shortName ? 'alias' : sdbShort ? 'sportsdb' : 'generated' };
}

async function collectNation(http, ranking, data, log) {
  const alias = data.aliases.nations[ranking.name];
  if (!alias) throw new Error(`Sélection « ${ranking.name} » (rang ${ranking.rank}) absente de scripts/data/aliases.json → nations`);
  const id = `nt-${slugify(alias.nameEn ?? ranking.name)}`;
  const provenance = { id, league: 'national', fifaName: ranking.name, fifaRank: ranking.rank };

  const page = await fetchPage(http, alias.wikiEn, 'en', 'fr');
  const infobox = page ? parseClubInfobox(page.content) : null;
  provenance.wikiEn = infobox ? { title: page.title, ...infobox } : null;
  let fr = null;
  if (page?.langlink) {
    const frPage = await fetchPage(http, page.langlink, 'fr');
    fr = frPage ? parseFrenchInfobox(frPage.content) : null;
    provenance.wikiFr = fr ? { title: frPage.title, ...fr } : null;
  }

  let sportsdb = null;
  for (const q of alias.sportsdb ?? [alias.nameEn ?? ranking.name]) {
    const results = await searchTeams(http, q);
    const picked = pickNation(results, [q, alias.nameEn, ranking.name].filter(Boolean));
    if (picked) {
      sportsdb = summarize(picked);
      break;
    }
  }
  provenance.sportsdb = sportsdb;
  const official = data.official[id] ?? null;
  provenance.official = official;

  const merged = mergeColors({ official, sportsdb, kit: infobox?.kit, fr });
  if (!merged) {
    log(`  ✖ ${ranking.name} : aucune couleur trouvée`);
    return { entry: null, provenance, merged: null };
  }
  const { override, notes, kind } = resolveOverride(id, merged.colors, data.overrides[id]);
  const trigram = alias.trigram ?? (infobox?.fifaTrigramme && /^[A-Z]{3}$/.test(infobox.fifaTrigramme) ? infobox.fifaTrigramme : null);
  if (!trigram) throw new Error(`Trigramme FIFA introuvable pour ${ranking.name}`);
  const entry = {
    id,
    name: alias.nameEn ?? ranking.name,
    nameFr: alias.nameFr,
    nameEn: alias.nameEn ?? ranking.name,
    shortName: trigram,
    city: alias.nameFr,
    country: alias.iso,
    league: 'national',
    fifaRank: ranking.rank,
    colors: merged.colors,
    themeOverride: override,
    logoUrl: null,
  };
  return { entry, provenance, merged, overrideKind: kind, overrideNotes: notes, shortNameFrom: alias.trigram ? 'alias' : 'wikipedia' };
}

// ---------------------------------------------------------------------------
// Validation et rapport
// ---------------------------------------------------------------------------

function validate(teams) {
  const errors = [];
  const ids = new Set();
  const hex = /^#[0-9A-F]{6}$/;
  const leagues = new Set([...LEAGUES.map((l) => l.id), 'national', 'none']);
  for (const t of teams) {
    if (ids.has(t.id)) errors.push(`id en double : ${t.id}`);
    ids.add(t.id);
    if (!leagues.has(t.league)) errors.push(`${t.id} : league invalide ${t.league}`);
    for (const key of ['primary', 'secondary', 'tertiary']) if (!hex.test(t.colors[key])) errors.push(`${t.id} : colors.${key} invalide (${t.colors[key]})`);
    if (t.themeOverride) {
      if (!hex.test(t.themeOverride.primary)) errors.push(`${t.id} : override.primary invalide`);
      if (!hex.test(t.themeOverride.secondary)) errors.push(`${t.id} : override.secondary invalide`);
      if (!t.themeOverride.reason) errors.push(`${t.id} : override sans raison`);
    }
    const effective = t.themeOverride?.primary ?? t.colors.primary;
    const effectiveSecondary = t.themeOverride?.secondary ?? t.colors.secondary;
    if (contrastOnWhite(effective) < MIN_CONTRAST) errors.push(`${t.id} : contraste ${contrastOnWhite(effective).toFixed(2)} < 4.5 pour ${effective}`);
    if (effective === effectiveSecondary) errors.push(`${t.id} : secondaire identique à la primaire`);
    if (!/^[A-Z0-9—]{1,5}$/.test(t.shortName)) errors.push(`${t.id} : shortName invalide « ${t.shortName} »`);
    if (t.league !== 'none' && !/^[A-Z]{2}$/.test(t.country)) errors.push(`${t.id} : country invalide`);
    if (t.logoUrl !== null) errors.push(`${t.id} : logoUrl doit rester null`);
  }
  const counts = {};
  for (const t of teams) counts[t.league] = (counts[t.league] ?? 0) + 1;
  for (const l of LEAGUES) if (counts[l.id] !== l.size) errors.push(`${l.id} : ${counts[l.id] ?? 0} équipes au lieu de ${l.size}`);
  if (counts.national !== NATIONS_COUNT && counts.national !== NATIONS_COUNT + 1) errors.push(`national : ${counts.national} sélections`);
  if (counts.none !== 1) errors.push('entrée none manquante');
  return { errors, counts };
}

function buildReport({ season, generatedAt, teams, details, fifa, counts, httpStats }) {
  const byId = new Map(details.map((d) => [d.entry?.id, d]));
  const nameOf = (t) => (t.league === 'national' ? `${t.nameFr} (${t.shortName})` : t.name);
  const leagueLabel = (id) => LEAGUES.find((l) => l.id === id)?.label ?? (id === 'national' ? 'Sélections' : id);
  const lines = [];
  lines.push(`# Rapport de génération de \`teams.json\``);
  lines.push('');
  lines.push(`- Généré le : ${generatedAt}`);
  lines.push(`- Saison : ${season}`);
  lines.push(`- Équipes : ${teams.length} (dont l'entrée \`none\`)`);
  lines.push(`- Requêtes réseau : ${httpStats.networkCalls} · réponses servies depuis le cache : ${httpStats.cacheHits}`);
  lines.push(`- Classement FIFA utilisé : ${fifa.updated} (${fifa.sourceUrl})`);
  lines.push('');
  lines.push('## Sources');
  lines.push('');
  lines.push('| Rôle | Source | Usage |');
  lines.push('|---|---|---|');
  lines.push('| Effectifs | Wikipédia (en), pages « 2026–27 <championnat> », table *Stadiums and locations* | liste des clubs, ville |');
  lines.push('| Couleurs C (prioritaire) | `scripts/data/official-colors.json` — chartes officielles / identités documentées | primaire, secondaire, tertiaire |');
  lines.push('| Couleurs B | TheSportsDB (`searchteams.php`, clé publique) — `strColour1/2/3`, `strTeamShort`, `strLocation` | primaire, secondaire, tertiaire, abréviation |');
  lines.push('| Couleurs A | Wikipédia (en) — infobox du club, hex du maillot domicile (`body1`, `shorts1`, `socks1`…) ; Wikipédia (fr) — `couleur cadre` / `couleur écriture` | repli + contrôle croisé |');
  lines.push('| Sélections | Module Lua Wikipédia `SportsRankings/data/FIFA World Rankings` (classement FIFA complet) | top 30 |');
  lines.push('');
  lines.push('Règle de fusion : **charte officielle > TheSportsDB > maillot Wikipédia (en) > infobox (fr)**. Chaque primaire retenue est comparée aux autres sources (ΔE CIE76 ≤ 30 = même famille de couleur ; blanc/blanc et noir/noir comptent comme concordants).');
  lines.push('');
  lines.push('## Effectifs');
  lines.push('');
  lines.push('| Championnat | Équipes |');
  lines.push('|---|---|');
  for (const l of LEAGUES) lines.push(`| ${l.label} | ${counts[l.id]} |`);
  lines.push(`| Sélections nationales | ${counts.national} |`);
  lines.push('');

  const overrides = teams.filter((t) => t.themeOverride);
  lines.push(`## Équipes avec \`themeOverride\` (${overrides.length})`);
  lines.push('');
  lines.push('Le blanc est la base de l\'app : une primaire blanche ou trop claire (contraste < 4,5:1 sur blanc) est remplacée par une couleur foncée issue de l\'identité du club. `primary` d\'origine = couleur documentée du club, conservée dans `colors` ; `themeOverride.primary` = couleur effectivement utilisée par le moteur de thème.');
  lines.push('');
  lines.push('| Équipe | Championnat | Primaire d\'origine (contraste) | Override primaire (contraste) | Override secondaire | Type | Raison |');
  lines.push('|---|---|---|---|---|---|---|');
  for (const t of overrides) {
    const d = byId.get(t.id);
    const kind = d?.overrideKind === 'curated' ? 'curé' : d?.overrideKind === 'auto-white' ? 'auto (blanc)' : 'auto (assombri)';
    const notes = d?.overrideNotes?.length ? ` — ${d.overrideNotes.join(' ; ')}` : '';
    lines.push(
      `| ${nameOf(t)} | ${leagueLabel(t.league)} | \`${t.colors.primary}\` (${contrastOnWhite(t.colors.primary).toFixed(2)}) | \`${t.themeOverride.primary}\` (${contrastOnWhite(t.themeOverride.primary).toFixed(2)}) | \`${t.themeOverride.secondary}\` | ${kind} | ${t.themeOverride.reason.replace(/\|/g, '/')}${notes} |`
    );
  }
  lines.push('');

  const darkened = teams.filter((t) => t.themeOverride && byId.get(t.id)?.overrideKind === 'auto-darkened');
  lines.push(`## Primaires assombries automatiquement (${darkened.length})`);
  lines.push('');
  lines.push('Teinte et saturation conservées, luminosité HSL réduite par pas de 1 % jusqu\'à 4,5:1.');
  lines.push('');
  lines.push('| Équipe | Origine | Assombrie | Contraste obtenu |');
  lines.push('|---|---|---|---|');
  for (const t of darkened) lines.push(`| ${nameOf(t)} | \`${t.colors.primary}\` | \`${t.themeOverride.primary}\` | ${contrastOnWhite(t.themeOverride.primary).toFixed(2)}:1 |`);
  lines.push('');

  const toVerify = details.filter((d) => d.entry && d.merged.usableSources.length > 1 && d.merged.agreeing.length === 0);
  lines.push(`## À vérifier — sources en désaccord (${toVerify.length})`);
  lines.push('');
  lines.push('La primaire retenue ne concorde avec aucune autre source (ΔE > 30). Le choix suit la priorité des sources ; à contrôler visuellement.');
  lines.push('');
  lines.push('| Équipe | Primaire retenue (source) | Autres sources |');
  lines.push('|---|---|---|');
  for (const d of toVerify) lines.push(`| ${nameOf(d.entry)} | \`${d.merged.colors.primary}\` (${d.merged.primaryFrom}) | ${d.merged.disagreeing.join(', ')} |`);
  lines.push('');

  const single = details.filter((d) => d.entry && d.merged.usableSources.length === 1);
  lines.push(`## Une seule source (${single.length})`);
  lines.push('');
  lines.push('| Équipe | Source unique | Primaire |');
  lines.push('|---|---|---|');
  for (const d of single) lines.push(`| ${nameOf(d.entry)} | ${d.merged.primaryFrom} | \`${d.merged.colors.primary}\` |`);
  lines.push('');

  const generatedShort = details.filter((d) => d.entry && d.shortNameFrom === 'generated');
  lines.push(`## Abréviations générées automatiquement (${generatedShort.length})`);
  lines.push('');
  lines.push(generatedShort.length ? generatedShort.map((d) => `${d.entry.name} → ${d.entry.shortName}`).join(' · ') : 'Aucune.');
  lines.push('');

  lines.push(`## Classement FIFA utilisé (${fifa.updated})`);
  lines.push('');
  lines.push(teams.filter((t) => t.league === 'national').map((t) => `${t.fifaRank}. ${t.nameFr}`).join(' · '));
  lines.push('');
  lines.push('## Tableau complet');
  lines.push('');
  lines.push('| Championnat | Équipe | Abr. | Ville | Primaire | Secondaire | Tertiaire | Primaire effective | Sources concordantes |');
  lines.push('|---|---|---|---|---|---|---|---|---|');
  for (const t of teams) {
    if (t.id === 'none') continue;
    const d = byId.get(t.id);
    const eff = t.themeOverride?.primary ?? t.colors.primary;
    const src = d ? `${d.merged.primaryFrom}${d.merged.agreeing.length ? ' + ' + d.merged.agreeing.join(', ') : ''}` : '';
    lines.push(`| ${leagueLabel(t.league)} | ${nameOf(t)} | ${t.shortName} | ${t.city} | \`${t.colors.primary}\` | \`${t.colors.secondary}\` | \`${t.colors.tertiary}\` | \`${eff}\` | ${src} |`);
  }
  lines.push('');
  lines.push('## Régénérer');
  lines.push('');
  lines.push('```bash');
  lines.push('npm run teams:build                 # = node scripts/scrape-teams.mjs (saison 2026-27, cache activé)');
  lines.push('node scripts/scrape-teams.mjs --season 2027-28 --no-cache');
  lines.push('```');
  lines.push('');
  lines.push('Pour ajouter ou corriger une équipe : compléter `scripts/data/official-colors.json` (couleur officielle), `scripts/data/overrides.json` (override documenté) ou `scripts/data/aliases.json` (nom TheSportsDB, abréviation, ville, nom français), puis relancer.');
  lines.push('');
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Programme principal
// ---------------------------------------------------------------------------

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }
  const log = (...m) => console.log(...m);
  const http = createHttp({ cacheDir: CACHE_DIR, useCache: args.cache, log });
  const data = {
    official: await readJson(path.join(DATA_DIR, 'official-colors.json'), {}),
    overrides: await readJson(path.join(DATA_DIR, 'overrides.json'), {}),
    aliases: await readJson(path.join(DATA_DIR, 'aliases.json'), { clubs: {}, nations: {} }),
  };
  data.aliases.clubs ??= {};
  data.aliases.nations ??= {};
  const wikiSeason = args.season.replace('-', '–'); // tiret demi-cadratin des titres Wikipédia
  const details = [];
  const teams = [NONE_TEAM];

  // 1. Championnats
  for (const league of LEAGUES) {
    const title = `${wikiSeason} ${league.wiki}`;
    log(`\n=== ${league.label} — ${title}`);
    const page = await fetchPage(http, title, 'en');
    if (!page) throw new Error(`Page Wikipédia introuvable : ${title}`);
    const roster = parseRoster(page.content, league.size);
    if (roster.rows.length !== league.size) {
      throw new Error(`${league.label} : ${roster.rows.length} clubs trouvés au lieu de ${league.size} (méthode ${roster.method}, tables ${JSON.stringify(roster.candidates ?? [])})`);
    }
    const rows = [...roster.rows].sort((a, b) => sortFr(a.label, b.label));
    const leagueEntries = [];
    for (const row of rows) {
      const result = await collectClub(http, league, row, data, log);
      details.push(result);
      if (!result.entry) continue;
      leagueEntries.push(result.entry);
      const o = result.entry.themeOverride;
      log(`  ${result.entry.shortName.padEnd(4)} ${result.entry.name.padEnd(28)} ${result.entry.colors.primary} ${result.entry.colors.secondary}${o ? `  → override ${o.primary}` : ''}  [${result.merged.primaryFrom}${result.merged.agreeing.length ? '+' + result.merged.agreeing.join(',') : ''}]`);
    }
    leagueEntries.sort((a, b) => sortFr(a.name, b.name));
    teams.push(...leagueEntries);
  }

  // 2. Sélections nationales
  log('\n=== Sélections nationales');
  const moduleData = await http.fetchJson(
    `https://en.wikipedia.org/w/api.php?${new URLSearchParams({ action: 'query', titles: 'Module:SportsRankings/data/FIFA World Rankings', prop: 'revisions', rvprop: 'content', rvslots: 'main', format: 'json', formatversion: '2' })}`
  );
  const lua = moduleData?.query?.pages?.[0]?.revisions?.[0]?.slots?.main?.content;
  if (!lua) throw new Error('Module Lua du classement FIFA introuvable');
  const fifa = parseFifaRankingModule(lua);
  if (fifa.rankings.length < NATIONS_COUNT) throw new Error('Classement FIFA incomplet');
  const selected = fifa.rankings.filter((r) => r.rank <= NATIONS_COUNT);
  if (!selected.some((r) => r.name === 'France')) selected.push(fifa.rankings.find((r) => r.name === 'France'));
  const nationEntries = [];
  for (const ranking of selected) {
    const result = await collectNation(http, ranking, data, log);
    details.push(result);
    if (!result.entry) continue;
    nationEntries.push(result.entry);
    const o = result.entry.themeOverride;
    log(`  ${String(ranking.rank).padStart(2)}. ${result.entry.shortName} ${result.entry.nameFr.padEnd(14)} ${result.entry.colors.primary} ${result.entry.colors.secondary}${o ? `  → override ${o.primary}` : ''}  [${result.merged.primaryFrom}${result.merged.agreeing.length ? '+' + result.merged.agreeing.join(',') : ''}]`);
  }
  nationEntries.sort((a, b) => a.fifaRank - b.fifaRank);
  teams.push(...nationEntries);

  // 3. Validation
  const missing = details.filter((d) => !d.entry).map((d) => d.provenance.wikiLabel ?? d.provenance.fifaName);
  const { errors, counts } = validate(teams);
  if (missing.length) errors.push(`équipes sans couleur : ${missing.join(', ')}`);
  const generatedAt = new Date().toISOString();

  // 4. Écritures
  await mkdir(path.dirname(OUT_JSON), { recursive: true });
  await mkdir(path.dirname(OUT_PROVENANCE), { recursive: true });
  await mkdir(path.dirname(OUT_REPORT), { recursive: true });
  const output = { version: `${args.season}.1`, season: args.season, generatedAt, fifaRankingDate: fifa.updated, teams };
  await writeFile(OUT_JSON, JSON.stringify(output, null, 2) + '\n', 'utf8');
  await writeFile(
    OUT_PROVENANCE,
    JSON.stringify(
      details.map((d) => ({ ...d.provenance, merged: d.merged, overrideKind: d.overrideKind ?? null, shortNameFrom: d.shortNameFrom ?? null })),
      null,
      2
    ) + '\n',
    'utf8'
  );
  await writeFile(OUT_REPORT, buildReport({ season: args.season, generatedAt, teams, details, fifa, counts, httpStats: http.stats() }), 'utf8');

  log('\n=== Résumé');
  log(`  ${teams.length} entrées → ${path.relative(ROOT, OUT_JSON)}`);
  for (const l of LEAGUES) log(`  ${l.label.padEnd(16)} ${counts[l.id]}`);
  log(`  ${'Sélections'.padEnd(16)} ${counts.national}`);
  log(`  overrides : ${teams.filter((t) => t.themeOverride).length} · réseau : ${http.stats().networkCalls} · cache : ${http.stats().cacheHits}`);
  if (errors.length) {
    console.error('\n✖ Validation échouée :');
    for (const e of errors) console.error('  - ' + e);
    process.exitCode = 1;
  } else {
    log('  ✔ validation OK (ids uniques, hex valides, contraste ≥ 4.5:1 sur blanc, effectifs conformes)');
  }
}

main().catch((error) => {
  console.error('\n✖ ' + (error?.stack ?? error?.message ?? String(error)));
  process.exit(1);
});
