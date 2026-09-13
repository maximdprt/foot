import React, { type ReactNode } from 'react';
import { Animated, Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import { haptics } from '@/lib/haptics';
import { usePressScale } from '@/lib/motion';
import { useTheme } from '@/theme/ThemeProvider';

import { Text } from './Text';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: ReactNode;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Chip / filtre : pill fine de 36 px, sélectionnée = fond primaire + texte onPrimary. */
export function Chip({ label, selected = false, onPress, icon, disabled, style }: ChipProps) {
  const theme = useTheme();
  const press = usePressScale(0.05);
  return (
    <Animated.View style={[{ alignSelf: 'flex-start' }, press.style, style]}>
    <Pressable
      onPress={() => {
        void haptics.selection();
        onPress?.();
      }}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled: Boolean(disabled) }}
      accessibilityLabel={label}
      style={({ pressed }) => ({
        height: theme.sizes.chipHeight,
        borderRadius: theme.radius.pill,
        paddingHorizontal: theme.spacing.lg,
        backgroundColor: selected ? theme.colors.primary : theme.colors.surface,
        flexDirection: 'row',
        alignItems: 'center',
        opacity: disabled ? 0.4 : pressed ? 0.9 : 1,
      })}
    >
      {icon ? <View style={{ marginRight: theme.spacing.xs }}>{icon}</View> : null}
      <Text variant="caption" color={selected ? 'onPrimary' : 'text'} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
    </Animated.View>
  );
}
