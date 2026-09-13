import React, { type ReactNode } from 'react';
import { Animated, Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import { usePressScale } from '@/lib/motion';
import { useTheme } from '@/theme/ThemeProvider';
import { shadows } from '@/theme/tokens';

export interface CardProps {
  children: ReactNode;
  /** Petite carte (12 px) ou grande (16 px). */
  size?: 'sm' | 'lg';
  /** Fond gris clair sans ombre, ou blanc avec ombre très légère. */
  tone?: 'surface' | 'elevated' | 'soft';
  padding?: number;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/** Carte sans bordure : coins 12/16 px, fond #F7F7F8 ou blanc + ombre. */
export function Card({
  children,
  size = 'lg',
  tone = 'surface',
  padding,
  onPress,
  accessibilityLabel,
  style,
}: CardProps) {
  const theme = useTheme();
  const press = usePressScale(0.02);
  const base: ViewStyle = {
    borderRadius: size === 'lg' ? theme.radius.lg : theme.radius.md,
    padding: padding ?? theme.spacing.lg,
    backgroundColor:
      tone === 'elevated'
        ? theme.colors.background
        : tone === 'soft'
          ? theme.colors.primarySoft
          : theme.colors.surface,
    ...(tone === 'elevated' ? shadows.card : null),
  };

  if (onPress) {
    return (
      <Animated.View style={[press.style, style]}>
        <Pressable
          onPress={onPress}
          onPressIn={press.onPressIn}
          onPressOut={press.onPressOut}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          style={({ pressed }) => [base, { opacity: pressed ? 0.92 : 1 }]}
        >
          {children}
        </Pressable>
      </Animated.View>
    );
  }
  return <View style={[base, style]}>{children}</View>;
}
