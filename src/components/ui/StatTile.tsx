import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { AnimatedNumber } from '@/components/motion';
import { useTheme } from '@/theme/ThemeProvider';

import { Text } from './Text';

interface StatTileProps {
  label: string;
  value: number;
  /** Texte accolé au nombre (« min », « j »). */
  suffix?: string;
  /** Met la tuile en avant : fond teinté et chiffre dans la couleur primaire. */
  highlight?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Tuile de statistique : un grand nombre qui défile jusqu'à sa valeur, et son libellé. */
export function StatTile({ label, value, suffix, highlight = false, style }: StatTileProps) {
  const theme = useTheme();
  return (
    <View
      style={[
        {
          flex: 1,
          minWidth: 96,
          paddingVertical: theme.spacing.lg,
          paddingHorizontal: theme.spacing.md,
          borderRadius: theme.radius.md,
          backgroundColor: highlight ? theme.colors.primarySoft : theme.colors.surface,
        },
        style,
      ]}
    >
      <AnimatedNumber
        value={value}
        suffix={suffix}
        variant="h2"
        color={highlight ? 'primary' : 'text'}
      />
      <Text variant="caption" color="textSecondary" numberOfLines={2} style={{ marginTop: 2 }}>
        {label}
      </Text>
    </View>
  );
}
