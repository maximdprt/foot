#!/usr/bin/env node
/**
 * Génère les captures de `docs/screenshots/` : les 5 onglets rendus avec trois
 * thèmes (Neutre, PSG, OM) plus les écrans clés — livrable 6 du cahier des
 * charges.
 *
 *   npm run screenshots
 *
 * Chaîne : export web statique → petit serveur local (avec une route `/seed`
 * qui fixe l'équipe supportée dans `localStorage`) → Chrome piloté par CDP,
 * en émulation iPhone (390 × 844, densité 2).
 *
 * Aucune dépendance npm ; Chrome doit être installé (ou `CHROME_PATH` défini).
 */
import { spawn } from 'node:child_process';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { openBrowser } from './lib/chrome.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EXPORT_DIR = path.join(ROOT, '.expo-web-export');
const SHOTS_DIR = path.join(ROOT, 'docs', 'screenshots');
const PORT = 4173;

/** Temps laissé à l'app après le chargement : écran de démarrage + entrées. */
const SETTLE_MS = 3200;

/**
 * Profil de démonstration des captures. Sans ville ni session, les écrans
 * Matchs, Réservation, Social et Profil ne montrent que leur état vide — ce qui
 * ne documente aucune fonctionnalité.
 */
const DEMO = { city: 'Rennes', name: 'Kylian', userId: 'demo-capture', email: 'demo@pelouse.local' };

/** Raccourci : capture prise avec le compte de démonstration. */
const AS_MEMBER = { city: DEMO.city, auth: true };

const THEMES = [
  { tag: 'neutre', team: 'none' },
  { tag: 'psg', team: 'paris-saint-germain' },
  { tag: 'om', team: 'marseille' },
];

const TABS = [
  { name: '1-home', route: '/' },
  { name: '2-entrainement', route: '/training' },
  { name: '3-reservation', route: '/booking' },
  { name: '4-social', route: '/social' },
  { name: '5-profil', route: '/profile' },
];

const EXTRAS = [
  { name: 'auth-creation-compte', team: 'paris-saint-germain', route: '/sign-in' },
  { name: 'onboarding-bienvenue', team: 'paris-saint-germain', route: '/welcome' },
  { name: 'onboarding-niveau', team: 'paris-saint-germain', route: '/level' },
  { name: 'onboarding-selecteur-equipe', team: 'paris-saint-germain', route: '/team' },
  { name: 'onboarding-recapitulatif', team: 'om', route: '/summary' },
  // Fonctionnalités des onglets
  { name: 'matchs-liste', team: 'paris-saint-germain', route: '/matches', ...AS_MEMBER },
  { name: 'matchs-detail', team: 'paris-saint-germain', route: '/matches/demo-match-rennes-0', ...AS_MEMBER },
  { name: 'matchs-creation', team: 'paris-saint-germain', route: '/matches/new', ...AS_MEMBER },
  { name: 'entrainement-programme', team: 'om', route: '/training/sharp_finish', ...AS_MEMBER },
  { name: 'entrainement-seance', team: 'om', route: '/training/session/quick_touch', ...AS_MEMBER },
  { name: 'parametres', team: 'paris-saint-germain', route: '/settings', ...AS_MEMBER },
  { name: 'debug-theme', team: 'marseille', route: '/settings/debug' },
];

/** Écran de démarrage : capturé tôt, pendant que le logo se dessine. */
const BOOT = { name: 'demarrage', team: 'paris-saint-germain', route: '/', settle: 900 };

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.css': 'text/css',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.svg': 'image/svg+xml',
};

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', ...options });
    child.on('error', reject);
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${command} → code ${code}`))));
  });
}

/** Sert l'export statique en SPA + route `/seed` qui fixe l'équipe supportée. */
function startServer() {
  const server = createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    if (url.pathname === '/seed') {
      const to = url.searchParams.get('to') ?? '/';
      const entries = seedState({
        team: url.searchParams.get('team') ?? 'none',
        city: url.searchParams.get('city'),
        auth: url.searchParams.get('auth') === '1',
      });
      const script = Object.entries(entries)
        .map(([key, value]) => `localStorage.setItem(${JSON.stringify(key)},${JSON.stringify(JSON.stringify(value))});`)
        .join('');
      res.writeHead(200, { 'Content-Type': MIME['.html'] });
      res.end(
        `<!doctype html><meta charset="utf-8"><script>${script}location.replace(${JSON.stringify(to)});</script>`,
      );
      return;
    }
    const file = path.join(EXPORT_DIR, decodeURIComponent(url.pathname));
    if (existsSync(file) && statSync(file).isFile()) {
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] ?? 'application/octet-stream' });
      createReadStream(file).pipe(res);
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME['.html'] });
    createReadStream(path.join(EXPORT_DIR, 'index.html')).pipe(res);
  });
  return new Promise((resolve) => server.listen(PORT, () => resolve(server)));
}

/**
 * Contenu de `localStorage` semé avant le chargement de l'app.
 *
 * On ne fabrique **aucun historique personnel** (matchs joués, séances, amis) :
 * l'app afficherait des statistiques et des badges qui n'ont pas été gagnés.
 * Les matchs ouverts, les joueurs alentour et les créneaux sont générés par
 * l'app elle-même à partir de la ville — les captures montrent donc exactement
 * ce que voit un vrai nouveau membre.
 */
function seedState({ team, city, auth }) {
  const entries = { 'pelouse.theme': { state: { favoriteTeamId: team }, version: 0 } };
  if (!city) return entries;

  const favoriteTeamId = team === 'none' ? null : team;
  const profile = {
    id: 'demo-profile',
    userId: DEMO.userId,
    displayName: DEMO.name,
    avatarUrl: null,
    playsFootball: 'regularly',
    level: 'confirmed',
    clubName: null,
    position: 'midfielder',
    region: null,
    city,
    lat: null,
    lng: null,
    playLocations: ['five_indoor', 'club_pitch'],
    frequency: 'weekly_2_3',
    goals: ['find_matches', 'improve'],
    favoriteTeamId,
    onboardingStep: 0,
    onboardingCompleted: true,
    locale: 'fr',
  };

  entries['pelouse.profile'] = {
    state: auth
      ? { profile, draft: {} }
      : { profile: null, draft: { displayName: DEMO.name, city, level: 'confirmed', favoriteTeamId } },
    version: 0,
  };

  if (auth) {
    // Base du backend de démonstration : un compte et son profil, rien de plus.
    entries['pelouse.local-backend'] = {
      accounts: {
        [DEMO.email]: { id: DEMO.userId, email: DEMO.email, password: null, providers: ['email'] },
      },
      profiles: { [DEMO.userId]: profile },
      settings: {},
      matches: [],
      sessions: {},
      bookings: {},
      friends: [],
      activities: [],
      seededCities: [],
      currentUserId: DEMO.userId,
    };
  }
  return entries;
}

function seedUrl({ team, route, city, auth }) {
  const params = new URLSearchParams({ team, to: route });
  if (city) params.set('city', city);
  if (auth) params.set('auth', '1');
  return `http://localhost:${PORT}/seed?${params.toString()}`;
}

async function main() {
  console.log('1/3 Export web…');
  await rm(EXPORT_DIR, { recursive: true, force: true });
  // `npx` est un `.cmd` sous Windows, que `spawn` refuse sans shell : on appelle
  // directement l'entrée Node du CLI Expo.
  await run(
    process.execPath,
    [
      path.join(ROOT, 'node_modules', 'expo', 'bin', 'cli'),
      'export', '--platform', 'web', '--output-dir', EXPORT_DIR, '--clear',
    ],
    { cwd: ROOT, stdio: 'ignore' },
  );

  console.log(`2/3 Serveur local sur http://localhost:${PORT}`);
  const server = await startServer();

  console.log('3/3 Captures (émulation 390 × 844)…');
  await mkdir(SHOTS_DIR, { recursive: true });
  const browser = await openBrowser();

  const shots = [
    ...THEMES.flatMap(({ tag, team }) =>
      TABS.map((tab) => ({ name: `${tag}-${tab.name}`, team, route: tab.route, ...AS_MEMBER })),
    ),
    ...EXTRAS,
    BOOT,
  ];

  try {
    for (const shot of shots) {
      const buffer = await browser.capture({
        url: seedUrl(shot),
        settle: shot.settle ?? SETTLE_MS,
      });
      await writeFile(path.join(SHOTS_DIR, `${shot.name}.png`), buffer);
      console.log(`  ✔ ${shot.name} (${Math.round(buffer.length / 1024)} Ko)`);
    }
  } finally {
    await browser.close();
    server.close();
    await rm(EXPORT_DIR, { recursive: true, force: true });
  }

  console.log(`\n✔ ${shots.length} captures dans ${path.relative(ROOT, SHOTS_DIR)}`);
}

main().catch((error) => {
  console.error('\n✖ ' + (error?.stack ?? error?.message ?? String(error)));
  process.exit(1);
});
