import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

interface DividerProps {
  /** Retrait à gauche (ex. aligné avec le texte d'une liste). */
  inset?: number;
  style?: StyleProp<ViewStyle>;
}

/** Ligne de séparation fine (#E5E7EB). */
export function Divider({ inset = 0, style }: DividerProps) {
  const theme = useTheme();
  return (
    <View
      accessibilityElementsHidden
      style={[{ height: 1, backgroundColor: theme.colors.border, marginLeft: inset }, style]}
    />
  );
}
