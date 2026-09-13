/**
 * Icône d'onglet animée.
 *
 * L'onglet actif fait apparaître une pastille teintée derrière son icône, qui
 * remonte légèrement : on lit l'onglet courant d'un coup d'œil, même sans
 * couleur (utile en cas de daltonisme, et quand la primaire du club est sombre).
 */
import type { LucideIcon } from 'lucide-react-native';
import React from 'react';
import { Animated, View, type ColorValue } from 'react-native';

import { springs, useSpringTo } from '@/lib/motion';
import { useTheme } from '@/theme/ThemeProvider';

interface TabBarIconProps {
  icon: LucideIcon;
  /** Couleur fournie par la tab bar (`ColorValue` : peut être une couleur native opaque). */
  color: ColorValue;
  focused: boolean;
}

/** Taille de la pastille derrière l'icône active. */
const PILL_WIDTH = 48;
const PILL_HEIGHT = 32;

export function TabBarIcon({ icon: Icon, color, focused }: TabBarIconProps) {
  const theme = useTheme();
  const state = useSpringTo(focused ? 1 : 0, springs.bouncy);

  const pillScale = state.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });
  const pillOpacity = state.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const iconLift = state.interpolate({ inputRange: [0, 1], outputRange: [0, -1] });
  const iconScale = state.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });

  return (
    <View style={{ width: PILL_WIDTH, height: PILL_HEIGHT, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={{
          position: 'absolute',
          pointerEvents: 'none',
          width: PILL_WIDTH,
          height: PILL_HEIGHT,
          borderRadius: theme.radius.pill,
          backgroundColor: theme.colors.primarySoft,
          opacity: pillOpacity,
          transform: [{ scale: pillScale }],
        }}
      />
      <Animated.View style={{ transform: [{ translateY: iconLift }, { scale: iconScale }] }}>
        <Icon size={theme.sizes.tabIcon} color={color as string} strokeWidth={focused ? 2.4 : 2} />
      </Animated.View>
    </View>
  );
}
