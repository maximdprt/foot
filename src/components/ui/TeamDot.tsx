import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { normalizeHex } from '@/lib/contrast';
import { useTheme } from '@/theme/ThemeProvider';
import type { TeamEntry } from '@/theme/types';

import { Text } from './Text';

/** Couleurs de la pastille : primaire effective (override appliqué) à gauche, secondaire d'identité à droite. */
export function getTeamDotColors(team: TeamEntry): { left: string; right: string } {
  const left = normalizeHex(team.themeOverride?.primary) ?? normalizeHex(team.colors.primary) ?? '#121212';
  const right =
    normalizeHex(team.themeOverride?.secondary) ??
    normalizeHex(team.colors.secondary) ??
    normalizeHex(team.colors.tertiary) ??
    '#FFFFFF';
  return { left, right };
}

interface TeamDotProps {
  team: TeamEntry;
  size?: number;
  /** Affiche l'abréviation sous la pastille. */
  showLabel?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Pastille bicolore (cercle divisé primaire / secondaire) + abréviation.
 * Remplace les écussons officiels (marques déposées), cf. section 6.1.
 */
export function TeamDot({ team, size = 28, showLabel = false, style }: TeamDotProps) {
  const theme = useTheme();
  const { left, right } = getTeamDotColors(team);
  return (
    <View style={[{ alignItems: 'center' }, style]} accessibilityLabel={team.name}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Path d="M50 2 A48 48 0 0 0 50 98 Z" fill={left} />
        <Path d="M50 2 A48 48 0 0 1 50 98 Z" fill={right} />
        <Circle cx={50} cy={50} r={48} fill="none" stroke={theme.colors.border} strokeWidth={3} />
      </Svg>
      {showLabel ? (
        <Text variant="label" color="textSecondary" style={{ marginTop: theme.spacing.xs }}>
          {team.shortName}
        </Text>
      ) : null}
    </View>
  );
}
