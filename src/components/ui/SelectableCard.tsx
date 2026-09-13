import { Check, type LucideIcon } from 'lucide-react-native';
import React from 'react';
import { Animated, Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import { haptics } from '@/lib/haptics';
import { springs, usePressScale, useSpringTo } from '@/lib/motion';
import { useTheme } from '@/theme/ThemeProvider';

import { Text } from './Text';

interface SelectableCardProps {
  title: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
  /** Icône affichée dans une pastille à gauche du libellé. */
  icon?: LucideIcon;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Diamètre de la pastille d'icône. */
const BADGE_SIZE = 40;

/**
 * Grande carte sélectionnable au tap : réponse du questionnaire.
 * La sélection est animée — la pastille de validation arrive par un ressort et
 * la bordure s'épaissit — pour que le choix soit perçu sans relire la carte.
 */
export function SelectableCard({
  title,
  description,
  selected,
  onPress,
  icon: Icon,
  disabled,
  style,
}: SelectableCardProps) {
  const theme = useTheme();
  const press = usePressScale(0.02);
  const state = useSpringTo(selected ? 1 : 0, springs.bouncy);

  // Pastille : absente puis rebond jusqu'à sa taille.
  const markScale = state.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
  const markOpacity = state.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 0.3, 1] });

  return (
    <Animated.View style={[press.style, style]}>
      <Pressable
        onPress={() => {
          void haptics.selection();
          onPress();
        }}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityState={{ selected, disabled: Boolean(disabled) }}
        accessibilityLabel={title}
        style={({ pressed }) => ({
          minHeight: 64,
          borderRadius: theme.radius.md,
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
          backgroundColor: selected ? theme.colors.primarySoft : theme.colors.surface,
          borderWidth: 2,
          borderColor: selected ? theme.colors.primary : 'transparent',
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing.md,
          opacity: disabled ? 0.4 : pressed ? 0.92 : 1,
        })}
      >
        {Icon ? (
          <View
            style={{
              width: BADGE_SIZE,
              height: BADGE_SIZE,
              borderRadius: BADGE_SIZE / 2,
              backgroundColor: selected ? theme.colors.primary : theme.colors.background,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon
              size={20}
              color={selected ? theme.colors.onPrimary : theme.colors.textSecondary}
              strokeWidth={2}
            />
          </View>
        ) : null}
        <View style={{ flex: 1 }}>
          <Text variant="bodyBold" color={selected ? 'primary' : 'text'}>
            {title}
          </Text>
          {description ? (
            <Text variant="caption" color="textSecondary" style={{ marginTop: 2 }}>
              {description}
            </Text>
          ) : null}
        </View>

        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            borderWidth: 2,
            borderColor: selected ? theme.colors.primary : theme.colors.border,
            backgroundColor: selected ? theme.colors.primary : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Animated.View style={{ opacity: markOpacity, transform: [{ scale: markScale }] }}>
            <Check size={14} color={theme.colors.onPrimary} strokeWidth={3} />
          </Animated.View>
        </View>
      </Pressable>
    </Animated.View>
  );
}
