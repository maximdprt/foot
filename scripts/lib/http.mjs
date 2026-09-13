// Client HTTP minimal : cache disque, User-Agent explicite, délai par hôte,
// nouvelle tentative en cas d'erreur réseau ou de limitation (HTTP 429).
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const USER_AGENT = 'app-foot-teams-scraper/1.0 (génération de teams.json ; usage non commercial)';

/** Délai minimal entre deux requêtes vers le même hôte (ms). */
const HOST_DELAY_MS = {
  'www.thesportsdb.com': 2100, // clé gratuite : ~30 requêtes / minute
  'en.wikipedia.org': 1200, // anonyme : rester sous ~1 req/s pour éviter les 429
  'fr.wikipedia.org': 1200,
  default: 300,
};

/** Nombre de tentatives par URL et attente après un 429 (croissante). */
const MAX_ATTEMPTS = 6;
const RETRY_AFTER_429_MS = [10000, 20000, 40000, 60000, 60000, 60000];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function createHttp({ cacheDir, useCache = true, log = () => {} }) {
  const lastRequestAt = new Map();
  /** Pénalité de débit accumulée par hôte après des 429 (ms, plafonnée). */
  const hostPenalty = new Map();
  let networkCalls = 0;
  let cacheHits = 0;

  async function fetchText(url) {
    const key = createHash('sha1').update(url).digest('hex');
    const file = path.join(cacheDir, key + '.txt');
    if (useCache) {
      try {
        const cached = await readFile(file, 'utf8');
        cacheHits++;
        return cached;
      } catch {
        /* pas en cache */
      }
    }
    const host = new URL(url).host;

    let lastError = null;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const delay = (HOST_DELAY_MS[host] ?? HOST_DELAY_MS.default) + (hostPenalty.get(host) ?? 0);
      const wait = (lastRequestAt.get(host) ?? 0) + delay - Date.now();
      if (wait > 0) await sleep(wait);
      try {
        lastRequestAt.set(host, Date.now());
        networkCalls++;
        const res = await fetch(url, {
          headers: { 'User-Agent': USER_AGENT, Accept: 'application/json,text/plain,*/*' },
        });
        if (res.status === 429 || res.status === 503) {
          // Limitation : on ralentit durablement cet hôte puis on retente.
          const penalty = Math.min((hostPenalty.get(host) ?? 0) + 400, 4000);
          hostPenalty.set(host, penalty);
          const pause = Number(res.headers.get('retry-after')) * 1000 || RETRY_AFTER_429_MS[attempt - 1];
          log(`  ⏳ HTTP ${res.status} sur ${host} — pause ${Math.round(pause / 1000)} s puis nouvelle tentative (${attempt}/${MAX_ATTEMPTS}, débit +${penalty} ms)`);
          lastError = new Error(`HTTP ${res.status} pour ${url}`);
          await sleep(pause);
          continue;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status} pour ${url}`);
        const text = await res.text();
        await mkdir(cacheDir, { recursive: true });
        await writeFile(file, text, 'utf8');
        // Succès : on relâche progressivement la pénalité de débit.
        const penalty = hostPenalty.get(host) ?? 0;
        if (penalty > 0) hostPenalty.set(host, Math.max(0, penalty - 50));
        return text;
      } catch (error) {
        lastError = error;
        if (attempt < MAX_ATTEMPTS) await sleep(1000 * attempt);
      }
    }
    throw new Error(
      `Échec après ${MAX_ATTEMPTS} tentatives : ${url}` + (lastError ? ` — ${lastError.message}` : ''),
    );
  }

  async function fetchJson(url) {
    const text = await fetchText(url);
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`Réponse non JSON pour ${url} : ${text.slice(0, 120)}`);
    }
  }

  return { fetchText, fetchJson, stats: () => ({ networkCalls, cacheHits }) };
}
