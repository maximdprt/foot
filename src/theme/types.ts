import type { TextStyle } from 'react-native';

import type { motion, radius, sizes, spacing, TypographyVariant } from './tokens';

export type LeagueId =
  | 'none'
  | 'ligue1'
  | 'ligue2'
  | 'premier_league'
  | 'la_liga'
  | 'serie_a'
  | 'bundesliga'
  | 'liga_portugal'
  | 'eredivisie'
  | 'national';

export interface TeamColors {
  primary: string;
  secondary: string;
  tertiary: string;
}

export interface ThemeOverride {
  primary: string;
  secondary?: string;
  reason?: string;
}

/** Une entrée de `teams.json` (section 6.1). */
export interface TeamEntry {
  id: string;
  name: string;
  nameFr?: string;
  nameEn?: string;
  shortName: string;
  city: string;
  country: string;
  league: LeagueId;
  colors: TeamColors;
  themeOverride: ThemeOverride | null;
  logoUrl: string | null;
  fifaRank?: number;
}

export interface TeamsFile {
  version: string;
  season: string;
  generatedAt: string;
  fifaRankingDate?: string;
  teams: TeamEntry[];
}

export type ThemeMode = 'light' | 'dark';

export type ColorToken =
  | 'background'
  | 'surface'
  | 'text'
  | 'textSecondary'
  | 'border'
  | 'primary'
  | 'onPrimary'
  | 'secondary'
  | 'onSecondary'
  | 'primarySoft'
  | 'success'
  | 'error'
  | 'onError'
  | 'tabInactive'
  | 'overlay';

export type ThemeColors = Record<ColorToken, string>;

export interface ThemeMeta {
  teamId: string;
  teamName: string;
  teamShortName: string;
  mode: ThemeMode;
  /** Un `themeOverride` de teams.json a été appliqué. */
  overrideApplied: boolean;
  /** La primaire a dû être assombrie automatiquement pour atteindre AA (4,5:1). */
  primaryAdjusted: boolean;
  /** Primaire d'origine (avant override/assombrissement). */
  originalPrimary: string;
  /** Contraste effectif de `primary` sur `background`. */
  primaryContrast: number;
}

export interface Theme {
  colors: ThemeColors;
  /** Dégradé primaire vers secondaire (bandeau du profil, animation de validation). */
  gradient: [string, string];
  radius: typeof radius;
  spacing: typeof spacing;
  sizes: typeof sizes;
  motion: typeof motion;
  typography: Record<TypographyVariant, TextStyle>;
  meta: ThemeMeta;
}
