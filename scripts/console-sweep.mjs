#!/usr/bin/env node
/**
 * Parcourt toutes les routes de l'app et remonte les avertissements console.
 *
 *   npm run dev          # dans un terminal
 *   npm run check:console
 *
 * Ce que les captures ne montrent pas : props DOM invalides, API dépréciées,
 * requêtes en échec, clés React manquantes. Ces avertissements n'existent qu'en
 * mode développement — d'où le serveur de `npm run dev` plutôt qu'un export.
 *
 * Le bundle de développement pèse plus de 13 Mo et n'est pas mis en cache :
 * recharger la page à chaque route prenait plus d'une heure. On charge donc
 * l'app une seule fois, puis on navigue côté client.
 *
 * Aucune dépendance npm ; Chrome doit être installé (ou `CHROME_PATH` défini).
 */
import { openBrowser } from './lib/chrome.mjs';

const BASE = process.env.PELOUSE_URL ?? 'http://localhost:8081';

const ROUTES = [
  '/', '/training', '/booking', '/social', '/profile',
  '/matches', '/matches/new', '/matches/demo-match-rennes-0',
  '/training/quick_touch', '/training/engine', '/training/session/quick_touch',
  '/sign-in', '/forgot-password',
  '/welcome', '/identity', '/plays', '/level', '/club', '/position',
  '/location', '/play-locations', '/frequency', '/goals', '/team', '/summary',
  '/settings', '/settings/account', '/settings/profile', '/settings/appearance',
  '/settings/notifications', '/settings/privacy', '/settings/language',
  '/settings/help', '/settings/about', '/settings/debug',
  '/settings/legal/terms', '/settings/legal/licenses',
];

/** Bruit connu et sans conséquence sur le web. */
const IGNORED = [/useNativeDriver` is not supported/];

/** Temps laissé à chaque écran pour se rendre et lancer ses animations. */
const SETTLE_MS = 2600;

/**
 * Compte de démonstration semé avant le balayage : sans lui, les écrans
 * réservés aux membres ne seraient jamais rendus et seraient déclarés sains à
 * tort. La ville peuple les matchs, les terrains et les joueurs alentour.
 */
const PROFILE = {
  id: 'demo-sweep',
  userId: 'demo-sweep',
  displayName: 'Kylian',
  avatarUrl: null,
  playsFootball: 'regularly',
  level: 'confirmed',
  clubName: null,
  position: 'midfielder',
  region: null,
  city: 'Rennes',
  lat: null,
  lng: null,
  playLocations: ['five_indoor'],
  frequency: 'weekly_2_3',
  goals: ['find_matches'],
  favoriteTeamId: 'paris-saint-germain',
  onboardingStep: 0,
  onboardingCompleted: true,
  locale: 'fr',
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Écrit une clé de `localStorage` depuis la page. */
function setItem(key, value) {
  return `localStorage.setItem(${JSON.stringify(key)}, ${JSON.stringify(JSON.stringify(value))});`;
}

async function main() {
  const browser = await openBrowser({ port: 9446 });
  const found = new Map();
  const unreached = [];

  try {
    // Premier chargement, à froid : le bundle de développement est long à venir.
    await browser.capture({ url: BASE + '/', settle: 4000, timeout: 300000 });

    await browser.evaluate(
      setItem('pelouse.profile', { state: { profile: PROFILE, draft: {} }, version: 0 }) +
        setItem('pelouse.local-backend', {
          accounts: {
            'demo@pelouse.local': {
              id: PROFILE.userId,
              email: 'demo@pelouse.local',
              password: null,
              providers: ['email'],
            },
          },
          profiles: { [PROFILE.userId]: PROFILE },
          settings: {},
          matches: [],
          sessions: {},
          bookings: {},
          friends: [],
          activities: [],
          seededCities: [],
          currentUserId: PROFILE.userId,
        }),
    );

    // Rechargement pour prendre la graine : le bundle est cette fois en cache.
    await browser.capture({ url: BASE + '/', settle: 6000, timeout: 300000 });

    for (const route of ROUTES) {
      browser.clearMessages();
      await browser.evaluate(
        `history.pushState({}, '', ${JSON.stringify(route)});` +
          `window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));`,
      );
      await sleep(SETTLE_MS);

      // Contrôle indispensable : sans lui, une navigation muette ferait passer
      // la route pour saine alors qu'elle n'a jamais été rendue.
      const reached = await browser.evaluate('location.pathname');
      const body = await browser.evaluate('document.body.innerText.slice(0, 120)');
      if (reached !== route) unreached.push(`${route} → ${reached}`);

      for (const message of browser.messages()) {
        if (IGNORED.some((pattern) => pattern.test(message.text))) continue;
        const key = message.text.slice(0, 160);
        if (!found.has(key)) found.set(key, { level: message.level, routes: [] });
        const entry = found.get(key);
        if (!entry.routes.includes(route)) entry.routes.push(route);
      }

      const preview = body.replace(/\s+/g, ' ').slice(0, 46);
      console.log(`  ${route.padEnd(32)} ${preview}`);
    }
  } finally {
    await browser.close();
  }

  console.log('');
  if (unreached.length > 0) {
    console.error(`✖ routes non atteintes : ${unreached.join(' | ')}`);
  }
  for (const [text, { level, routes }] of found) {
    console.error(`[${level}] ${text}`);
    console.error(`   routes : ${routes.join(', ')}\n`);
  }

  if (found.size === 0 && unreached.length === 0) {
    console.log(`✔ ${ROUTES.length} routes parcourues, aucun avertissement.`);
    return;
  }
  process.exit(1);
}

main().catch((error) => {
  console.error('\n✖ ' + (error?.stack ?? error?.message ?? String(error)));
  console.error("\nLe serveur de développement tourne-t-il ? `npm run dev`");
  process.exit(1);
});
