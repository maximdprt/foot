/**
 * Contrôle de l'internationalisation :
 *  • `fr.json` et `en.json` ont exactement les mêmes clés ;
 *  • toute clé littérale utilisée dans `app/` ou `src/` existe dans les deux ;
 *  • les clés construites dynamiquement (options du questionnaire, championnats)
 *    sont couvertes pour chaque valeur possible.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

import {
  FREQUENCY_OPTIONS,
  GOAL_OPTIONS,
  LEVEL_OPTIONS,
  PLAY_LOCATION_OPTIONS,
  PLAYS_OPTIONS,
  POSITION_OPTIONS,
} from '@/features/onboarding/options';
import { ONBOARDING_STEPS } from '@/features/onboarding/steps';
import en from '@/i18n/en.json';
import fr from '@/i18n/fr.json';
import { LEAGUE_ORDER } from '@/theme/teams';

type Tree = Record<string, unknown>;

const ROOT = path.resolve(__dirname, '..', '..');
const SCANNED_DIRS = ['app', 'src'];

/** Aplati un arbre de traductions en chemins pointés (`a.b.c`). */
function flatten(tree: Tree, prefix = ''): string[] {
  return Object.entries(tree).flatMap(([key, value]) => {
    const full = prefix ? `${prefix}.${key}` : key;
    return value !== null && typeof value === 'object' && !Array.isArray(value)
      ? flatten(value as Tree, full)
      : [full];
  });
}

function has(tree: Tree, key: string): boolean {
  let node: unknown = tree;
  for (const segment of key.split('.')) {
    if (node === null || typeof node !== 'object') return false;
    node = (node as Tree)[segment];
  }
  return node !== undefined;
}

function sourceFiles(dir: string): string[] {
  const absolute = path.join(ROOT, dir);
  return readdirSync(absolute).flatMap((entry) => {
    const full = path.join(absolute, entry);
    if (statSync(full).isDirectory()) return sourceFiles(path.join(dir, entry));
    return /\.tsx?$/.test(entry) && !full.includes('__tests__') ? [full] : [];
  });
}

/** Clés littérales passées à `t(...)` ou `translate(...)`, hors gabarits dynamiques. */
function literalKeys(): Map<string, string[]> {
  const found = new Map<string, string[]>();
  const pattern = /\b(?:t|translate|useTranslatedList<[^>]*>)\(\s*(['"`])([A-Za-z0-9_.]+)\1/g;
  for (const file of SCANNED_DIRS.flatMap(sourceFiles)) {
    const content = readFileSync(file, 'utf8');
    for (const match of content.matchAll(pattern)) {
      const key = match[2];
      found.set(key, [...(found.get(key) ?? []), path.relative(ROOT, file)]);
    }
  }
  return found;
}

const frKeys = flatten(fr as Tree).sort();
const enKeys = flatten(en as Tree).sort();

describe('fichiers de langue', () => {
  it('fr.json et en.json ont exactement les mêmes clés', () => {
    expect(enKeys.filter((key) => !frKeys.includes(key))).toEqual([]);
    expect(frKeys.filter((key) => !enKeys.includes(key))).toEqual([]);
  });

  it('ne contient aucune valeur vide', () => {
    [fr, en].forEach((tree) => {
      flatten(tree as Tree).forEach((key) => {
        const value = key.split('.').reduce<unknown>((node, s) => (node as Tree)?.[s], tree);
        expect(typeof value === 'string' ? value.trim().length : 1).toBeGreaterThan(0);
      });
    });
  });

  it('garde les mêmes interpolations {{…}} dans les deux langues', () => {
    const placeholders = (tree: Tree, key: string): string[] => {
      const value = key.split('.').reduce<unknown>((node, s) => (node as Tree)?.[s], tree);
      return typeof value === 'string' ? [...value.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]).sort() : [];
    };
    frKeys.forEach((key) => {
      expect({ key, params: placeholders(en as Tree, key) }).toEqual({
        key,
        params: placeholders(fr as Tree, key),
      });
    });
  });
});

describe('clés utilisées par le code', () => {
  it('existe dans fr.json et en.json', () => {
    const missing: string[] = [];
    literalKeys().forEach((files, key) => {
      if (!has(fr as Tree, key)) missing.push(`fr: ${key} (${files[0]})`);
      if (!has(en as Tree, key)) missing.push(`en: ${key} (${files[0]})`);
    });
    expect(missing).toEqual([]);
  });

  it('couvre toutes les options du questionnaire', () => {
    const options = [
      ...PLAYS_OPTIONS,
      ...LEVEL_OPTIONS,
      ...POSITION_OPTIONS,
      ...PLAY_LOCATION_OPTIONS,
      ...FREQUENCY_OPTIONS,
      ...GOAL_OPTIONS,
    ];
    const missing = options
      .map((option) => option.labelKey)
      .filter((key) => !has(fr as Tree, key) || !has(en as Tree, key));
    expect(missing).toEqual([]);
  });

  it('couvre le titre de chaque étape et de chaque championnat', () => {
    ONBOARDING_STEPS.forEach((step) => {
      expect(has(fr as Tree, `onboarding.${step.i18nKey}.title`)).toBe(true);
      expect(has(en as Tree, `onboarding.${step.i18nKey}.title`)).toBe(true);
    });
    [...LEAGUE_ORDER, 'none'].forEach((league) => {
      expect(has(fr as Tree, `leagues.${league}`)).toBe(true);
      expect(has(en as Tree, `leagues.${league}`)).toBe(true);
    });
  });

  it('couvre chaque ligne du récapitulatif et chaque erreur d authentification', () => {
    ['identity', 'plays', 'level', 'club', 'position', 'location', 'playLocations', 'frequency', 'goals', 'team'].forEach(
      (row) => {
        expect(has(fr as Tree, `onboarding.summary.rows.${row}`)).toBe(true);
      },
    );
    ['emailInvalid', 'passwordTooShort', 'emailTaken', 'invalidCredentials', 'providerUnavailable', 'confirmEmail', 'generic'].forEach(
      (code) => {
        expect(has(fr as Tree, `auth.errors.${code}`)).toBe(true);
        expect(has(en as Tree, `auth.errors.${code}`)).toBe(true);
      },
    );
  });
});
