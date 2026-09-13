/**
 * Moteur de thème : fonction pure `buildTheme(team)` (section 6.2).
 * - applique `themeOverride` s'il existe,
 * - garantit un contraste AA (>= 4,5:1) de la primaire sur le fond (assombrissement auto),
 * - calcule `onPrimary` / `onSecondary` (blanc si luminance < 0,5, sinon #121212),
 * - dérive `primarySoft` (primaire à 10 %).
 */
import {
  contrastRatio,
  darkenToContrast,
  normalizeHex,
  relativeLuminance,
  rgbDistance,
  withAlpha,
} from '@/lib/contrast';

import {
  basePalette,
  buildTypography,
  darkPalette,
  motion,
  radius,
  sizes,
  spacing,
} from './tokens';
import type { TeamEntry, Theme, ThemeMode } from './types';

export const WCAG_AA_RATIO = 4.5;

/** Équipe « none » = thème Neutre (noir #121212 + vert pelouse #2E9E5B). */
export const NEUTRAL_TEAM: TeamEntry = {
  id: 'none',
  name: 'Aucune équipe',
  nameFr: 'Aucune équipe',
  nameEn: 'No team',
  shortName: '—',
  city: '',
  country: '',
  league: 'none',
  colors: {
    primary: basePalette.grassGreen,
    secondary: basePalette.black,
    tertiary: basePalette.white,
  },
  // Le vert pelouse (#2E9E5B) ne fait que 3,41:1 sur blanc. La primaire servant
  // aussi au texte et aux icônes, on applique un override documenté plutôt que
  // de dépendre de l'assombrissement automatique (valeur identique dans teams.json).
  themeOverride: {
    primary: basePalette.grassGreenAA,
    secondary: basePalette.black,
    reason:
      'Vert pelouse assombri pour atteindre WCAG AA (4,5:1) quand la primaire sert au texte sur blanc.',
  },
  logoUrl: null,
};

export interface BuildThemeOptions {
  mode?: ThemeMode;
  /** Inter chargée ? (sinon police système + fontWeight). */
  fontsLoaded?: boolean;
}

/** Texte lisible sur une couleur donnée (règle de la spec : luminance < 0,5 => blanc). */
export function onColor(hex: string): string {
  return relativeLuminance(hex) < 0.5 ? basePalette.white : basePalette.black;
}

export function buildTheme(team: TeamEntry, options: BuildThemeOptions = {}): Theme {
  const mode: ThemeMode = options.mode ?? 'light';
  const fontsLoaded = options.fontsLoaded ?? true;

  const background = mode === 'dark' ? darkPalette.background : basePalette.white;
  const surface = mode === 'dark' ? darkPalette.surface : basePalette.surface;
  const text = mode === 'dark' ? darkPalette.text : basePalette.text;
  const textSecondary = mode === 'dark' ? darkPalette.textSecondary : basePalette.textSecondary;
  const border = mode === 'dark' ? darkPalette.border : basePalette.border;

  const originalPrimary = normalizeHex(team.colors.primary) ?? NEUTRAL_TEAM.colors.primary;
  const override = team.themeOverride;
  const overridePrimary = override ? normalizeHex(override.primary) : null;
  const overrideApplied = Boolean(overridePrimary);

  let primary = overridePrimary ?? originalPrimary;
  let primaryAdjusted = false;
  // En mode clair, la primaire sert au texte/icônes sur blanc : AA obligatoire.
  if (mode === 'light' && contrastRatio(primary, background) < WCAG_AA_RATIO) {
    primary = darkenToContrast(primary, background, WCAG_AA_RATIO);
    primaryAdjusted = true;
  }

  let secondary =
    (override?.secondary ? normalizeHex(override.secondary) : null) ??
    normalizeHex(team.colors.secondary) ??
    NEUTRAL_TEAM.colors.secondary;
  // La secondaire doit rester distincte de la primaire (sinon tertiaire, puis couleur texte).
  if (rgbDistance(secondary, primary) < 24) {
    const tertiary = normalizeHex(team.colors.tertiary);
    secondary = tertiary && rgbDistance(tertiary, primary) >= 24 ? tertiary : text;
  }

  return {
    colors: {
      background,
      surface,
      text,
      textSecondary,
      border,
      primary,
      onPrimary: onColor(primary),
      secondary,
      onSecondary: onColor(secondary),
      primarySoft: withAlpha(primary, 0.1),
      success: basePalette.success,
      error: basePalette.error,
      onError: basePalette.white,
      tabInactive: basePalette.textSecondary,
      overlay: basePalette.overlay,
    },
    gradient: [primary, secondary],
    radius,
    spacing,
    sizes,
    motion,
    typography: buildTypography(fontsLoaded),
    meta: {
      teamId: team.id,
      teamName: team.name,
      teamShortName: team.shortName,
      mode,
      overrideApplied,
      primaryAdjusted,
      originalPrimary,
      primaryContrast: Math.round(contrastRatio(primary, background) * 100) / 100,
    },
  };
}
