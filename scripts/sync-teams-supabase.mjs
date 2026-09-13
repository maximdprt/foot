#!/usr/bin/env node
/**
 * Synchronise `src/theme/teams.json` vers la table Supabase `public.teams`.
 *
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/sync-teams-supabase.mjs
 *
 * L'app embarque déjà `teams.json` : cette table sert aux jointures
 * (`user_profiles.favorite_team_id`) et aux futures fonctionnalités serveur.
 * La clé `service_role` contourne la RLS ; elle ne doit jamais quitter la machine
 * qui exécute ce script (ni être commitée).
 *
 * Aucune dépendance npm : appelle directement l'API REST PostgREST.
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TEAMS_JSON = path.join(ROOT, 'src', 'theme', 'teams.json');
const CHUNK_SIZE = 100;

const url = (process.env.SUPABASE_URL ?? '').replace(/\/+$/, '');
const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

if (!url || !key) {
  console.error('✖ SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis.');
  process.exit(1);
}

const file = JSON.parse(await readFile(TEAMS_JSON, 'utf8'));

const rows = file.teams.map((team) => ({
  id: team.id,
  name: team.name,
  short_name: team.shortName,
  city: team.city || null,
  country: team.country || null,
  league: team.league,
  colors: team.colors,
  theme_override: team.themeOverride,
  logo_url: team.logoUrl,
  data_version: file.version,
}));

for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
  const chunk = rows.slice(i, i + CHUNK_SIZE);
  const response = await fetch(`${url}/rest/v1/teams?on_conflict=id`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(chunk),
  });
  if (!response.ok) {
    console.error(`✖ HTTP ${response.status} : ${await response.text()}`);
    process.exit(1);
  }
  console.log(`  ✔ ${Math.min(i + CHUNK_SIZE, rows.length)} / ${rows.length}`);
}

console.log(`✔ ${rows.length} équipes synchronisées (version ${file.version}).`);
