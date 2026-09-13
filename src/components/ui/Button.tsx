import React, { type ReactNode } from 'react';
import { ActivityIndicator, Animated, Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import { haptics } from '@/lib/haptics';
import { usePressScale, usePulse } from '@/lib/motion';
import { useTheme } from '@/theme/ThemeProvider';

import { Text } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'text' | 'danger';

export interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: 'lg' | 'md';
  disabled?: boolean;
  loading?: boolean;
  /** Icône lucide ou glyphe de marque, à gauche du libellé. */
  icon?: ReactNode;
  fullWidth?: boolean;
  haptic?: boolean;
  /** Halo qui respire autour du bouton : réservé à l'action principale d'un écran de marque. */
  glow?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Bouton pill (grammaire Spotify) : hauteur 52 px, texte 16 px gras.
 * Variantes : primaire (plein), secondaire (bordure 1 px), texte, danger.
 * L'appui enfonce légèrement le bouton, qui revient par un ressort.
 */
export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'lg',
  disabled = false,
  loading = false,
  icon,
  fullWidth = true,
  haptic = true,
  glow = false,
  accessibilityLabel,
  style,
}: ButtonProps) {
  const theme = useTheme();
  const { colors } = theme;
  const press = usePressScale(0.03);
  const pulse = usePulse(2400, glow && !disabled && !loading);

  const backgroundColor =
    variant === 'primary'
      ? colors.primary
      : variant === 'danger'
        ? colors.error
        : variant === 'secondary'
          ? colors.background
          : 'transparent';
  const textColor =
    variant === 'primary'
      ? 'onPrimary'
      : variant === 'danger'
        ? 'onError'
        : variant === 'secondary'
          ? 'text'
          : 'primary';
  const borderColor = variant === 'secondary' ? colors.text : 'transparent';
  const height = size === 'lg' ? theme.sizes.buttonHeight : theme.sizes.buttonHeightSmall;
  const isDisabled = disabled || loading;

  const handlePress = () => {
    if (haptic) void haptics.light();
    onPress?.();
  };

  // Le halo est un calque derrière le bouton, qui enfle et s'estompe.
  const glowScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });
  const glowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] });

  return (
    <Animated.View
      style={[
        { alignSelf: fullWidth ? 'stretch' : 'flex-start' },
        press.style,
        style,
      ]}
    >
      {glow ? (
        <Animated.View
          style={{
            position: 'absolute',
            pointerEvents: 'none',
            left: 0,
            right: 0,
            top: 0,
            height,
            borderRadius: theme.radius.pill,
            backgroundColor: colors.primary,
            opacity: glowOpacity,
            transform: [{ scale: glowScale }],
          }}
        />
      ) : null}

      <Pressable
        onPress={handlePress}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        disabled={isDisabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? title}
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        style={({ pressed }) => ({
          height,
          minHeight: height,
          borderRadius: theme.radius.pill,
          paddingHorizontal: theme.spacing.xl,
          backgroundColor,
          borderWidth: 1,
          borderColor,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          opacity: disabled ? 0.4 : pressed ? 0.92 : 1,
        })}
      >
        {loading ? (
          <ActivityIndicator color={colors[textColor]} />
        ) : (
          <>
            {icon ? <View style={{ marginRight: theme.spacing.sm }}>{icon}</View> : null}
            <Text variant="button" color={textColor} numberOfLines={1}>
              {title}
            </Text>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}
