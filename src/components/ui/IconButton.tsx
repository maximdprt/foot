import React, { type ReactNode } from 'react';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

interface IconButtonProps {
  /** Icône lucide (couleur/taille gérées par l'appelant). */
  children: ReactNode;
  onPress?: () => void;
  accessibilityLabel: string;
  /** Fond teinté (surface) ou transparent. */
  tone?: 'plain' | 'surface';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Bouton icône avec zone tactile de 44 px minimum. */
export function IconButton({
  children,
  onPress,
  accessibilityLabel,
  tone = 'plain',
  disabled,
  style,
}: IconButtonProps) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: Boolean(disabled) }}
      hitSlop={4}
      style={({ pressed }) => [
        {
          width: theme.sizes.touchTarget,
          height: theme.sizes.touchTarget,
          borderRadius: theme.radius.pill,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: tone === 'surface' ? theme.colors.surface : 'transparent',
          opacity: disabled ? 0.4 : pressed ? 0.6 : 1,
        },
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}
