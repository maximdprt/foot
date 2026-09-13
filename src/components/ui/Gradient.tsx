import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { useTheme } from '@/theme/ThemeProvider';

interface GradientProps {
  /** Couleurs du dégradé (défaut : `theme.gradient`, primaire → secondaire). */
  colors?: [string, string];
  /** Diagonale (défaut) ou horizontal. */
  direction?: 'diagonal' | 'horizontal' | 'vertical';
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

/**
 * Dégradé primaire → secondaire (bandeau du profil, animation de validation).
 * Utilise `react-native-svg` pour éviter une dépendance supplémentaire.
 */
export function Gradient({ colors, direction = 'diagonal', style, children }: GradientProps) {
  const theme = useTheme();
  const [from, to] = colors ?? theme.gradient;
  const coords =
    direction === 'horizontal'
      ? { x1: '0', y1: '0', x2: '1', y2: '0' }
      : direction === 'vertical'
        ? { x1: '0', y1: '0', x2: '0', y2: '1' }
        : { x1: '0', y1: '0', x2: '1', y2: '1' };

  return (
    <View style={style}>
      {/* `width`/`height` explicites : sans eux le SVG retombe sur 300×150 sur le web. */}
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} accessibilityElementsHidden>
        <Defs>
          <LinearGradient id="grad" {...coords}>
            <Stop offset="0" stopColor={from} />
            <Stop offset="1" stopColor={to} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#grad)" />
      </Svg>
      {children}
    </View>
  );
}
