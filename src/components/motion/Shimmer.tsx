/**
 * Bloc squelette avec un reflet qui balaye : signale un contenu en cours de
 * chargement sans faire clignoter l'écran.
 */
import React from 'react';
import { Animated, StyleSheet, View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { useLoop } from '@/lib/motion';
import { useTheme } from '@/theme/ThemeProvider';

interface ShimmerProps {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

export function Shimmer({ width = '100%', height = 16, radius, style }: ShimmerProps) {
  const theme = useTheme();
  const loop = useLoop(1600);
  const translateX = loop.interpolate({ inputRange: [0, 1], outputRange: ['-100%', '200%'] });

  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius: radius ?? theme.radius.sm,
          backgroundColor: theme.colors.surface,
          overflow: 'hidden',
        },
        style,
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX }] }]}>
        <Svg width="60%" height="100%" preserveAspectRatio="none">
          <Defs>
            <LinearGradient id="shimmer" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={theme.colors.background} stopOpacity="0" />
              <Stop offset="0.5" stopColor={theme.colors.background} stopOpacity="0.9" />
              <Stop offset="1" stopColor={theme.colors.background} stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#shimmer)" />
        </Svg>
      </Animated.View>
    </View>
  );
}
