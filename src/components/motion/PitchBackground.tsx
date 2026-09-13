/**
 * Fond « pelouse » : bandes de tonte et tracés du terrain.
 *
 * Décor seulement, dans la couleur primaire à très faible opacité — le blanc
 * reste la base (section 5.1). Un reflet balaye lentement les bandes, comme
 * la lumière des projecteurs sur un gazon fraîchement tondu.
 */
import React from 'react';
import { Animated, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Rect, Stop } from 'react-native-svg';

import { useLoop } from '@/lib/motion';
import { useTheme } from '@/theme/ThemeProvider';

const AnimatedView = Animated.View;

export interface PitchBackgroundProps {
  /** `stripes` : bandes seules · `pitch` : bandes + tracés vus du dessus. */
  variant?: 'stripes' | 'pitch';
  /** Opacité du décor (0,035 par défaut : présent sans jamais concurrencer le contenu). */
  intensity?: number;
  /** Nombre de bandes de tonte. Au-delà de 10, la trame devient une texture. */
  stripes?: number;
  /** Reflet qui balaye le terrain. */
  sweep?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function PitchBackground({
  variant = 'stripes',
  intensity = 0.035,
  stripes = 14,
  sweep = true,
  style,
}: PitchBackgroundProps) {
  const theme = useTheme();
  const loop = useLoop(9000, sweep);

  const bandWidth = 100 / stripes;

  // Le reflet traverse l'écran de gauche à droite, puis recommence.
  const translateX = loop.interpolate({ inputRange: [0, 1], outputRange: ['-60%', '160%'] });

  return (
    <View
      style={[StyleSheet.absoluteFill, { overflow: 'hidden', pointerEvents: 'none' }, style]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        {Array.from({ length: stripes }, (_, i) =>
          // Une bande sur deux : c'est le contraste entre les deux sens de tonte.
          i % 2 === 0 ? (
            <Rect
              key={i}
              x={i * bandWidth}
              y={0}
              width={bandWidth}
              height={100}
              fill={theme.colors.primary}
              opacity={intensity}
            />
          ) : null,
        )}
      </Svg>

      {variant === 'pitch' ? (
        // `slice` conserve le rapport d'aspect (le rond central reste rond) et
        // recadre les côtés ; `none` l'étirerait en ellipse sur un écran haut.
        <Svg
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid slice"
          style={StyleSheet.absoluteFill}
        >
          {/* Ligne médiane, rond central et point de coup d'envoi. */}
          <Line x1="0" y1="50" x2="100" y2="50" stroke={theme.colors.primary} strokeWidth="0.5" opacity={intensity * 2} />
          <Circle cx="50" cy="50" r="16" fill="none" stroke={theme.colors.primary} strokeWidth="0.5" opacity={intensity * 2} />
          <Circle cx="50" cy="50" r="1" fill={theme.colors.primary} opacity={intensity * 3} />
          {/* Surfaces de réparation. */}
          <Rect x="28" y="0" width="44" height="16" fill="none" stroke={theme.colors.primary} strokeWidth="0.5" opacity={intensity * 2} />
          <Rect x="28" y="84" width="44" height="16" fill="none" stroke={theme.colors.primary} strokeWidth="0.5" opacity={intensity * 2} />
        </Svg>
      ) : null}

      {sweep ? (
        <AnimatedView
          style={[StyleSheet.absoluteFill, { transform: [{ translateX }], pointerEvents: 'none' }]}
        >
          <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
            <Defs>
              <LinearGradient id="pitchSweep" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor={theme.colors.primary} stopOpacity="0" />
                <Stop offset="0.5" stopColor={theme.colors.primary} stopOpacity={intensity * 1.6} />
                <Stop offset="1" stopColor={theme.colors.primary} stopOpacity="0" />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="40" height="100" fill="url(#pitchSweep)" />
          </Svg>
        </AnimatedView>
      ) : null}
    </View>
  );
}
