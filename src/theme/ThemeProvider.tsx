/**
 * Fournit le thème courant à toute l'app. Le thème est recalculé instantanément quand
 * l'équipe supportée (ou la preview du sélecteur) change : aucun rechargement.
 */
import React, { createContext, useContext, useMemo, type ReactNode } from 'react';
import { StyleSheet } from 'react-native';

import { useSettingsStore } from '@/store/settingsStore';
import { useThemeStore } from '@/store/themeStore';

import { buildTheme } from './buildTheme';
import { getTeam } from './teams';
import type { Theme } from './types';

const ThemeContext = createContext<Theme | null>(null);

interface ThemeProviderProps {
  children: ReactNode;
  /** Inter est-elle chargée ? (sinon police système, voir tokens.buildTypography) */
  fontsLoaded?: boolean;
}

export function ThemeProvider({ children, fontsLoaded = true }: ThemeProviderProps) {
  const favoriteTeamId = useThemeStore((s) => s.favoriteTeamId);
  const previewTeamId = useThemeStore((s) => s.previewTeamId);
  const darkMode = useSettingsStore((s) => s.appearance.darkMode);

  const team = getTeam(previewTeamId ?? favoriteTeamId);
  const theme = useMemo(
    () => buildTheme(team, { mode: darkMode ? 'dark' : 'light', fontsLoaded }),
    [team, darkMode, fontsLoaded],
  );

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error('useTheme doit être utilisé à l\'intérieur de <ThemeProvider>.');
  }
  return theme;
}

/** Crée des styles mémorisés dépendant du thème. */
export function useThemedStyles<T extends StyleSheet.NamedStyles<T>>(
  factory: (theme: Theme) => T,
): T {
  const theme = useTheme();
  return useMemo(() => StyleSheet.create(factory(theme)), [theme, factory]);
}
