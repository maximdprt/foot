/**
 * Carte inclinable en 3D : elle suit le doigt comme un objet posé sur un plan,
 * avec une vraie perspective, puis revient à plat au relâchement.
 *
 * Utilisée pour l'équipe de cœur, où le contenu mérite d'être manipulé plutôt
 * que simplement affiché.
 */
import React, { type ReactNode, useMemo, useState } from 'react';
import {
  Animated,
  PanResponder,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { springs, useReducedMotion } from '@/lib/motion';
import { useTheme } from '@/theme/ThemeProvider';

export interface TiltCardProps {
  children: ReactNode;
  /** Inclinaison maximale, en degrés. */
  maxTilt?: number;
  /** Éloignement de la caméra : plus la valeur est basse, plus l'effet est marqué. */
  perspective?: number;
  /** Reflet qui se déplace avec l'inclinaison. */
  gloss?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function TiltCard({
  children,
  maxTilt = 12,
  perspective = 900,
  gloss = true,
  style,
}: TiltCardProps) {
  const theme = useTheme();
  const reduced = useReducedMotion();

  // Position normalisée du doigt : -1 (haut/gauche) → 1 (bas/droite).
  const [tiltX] = useState(() => new Animated.Value(0));
  const [tiltY] = useState(() => new Animated.Value(0));
  const [lift] = useState(() => new Animated.Value(0));
  // La taille est un état : le gestionnaire de gestes en dépend, et la lire
  // depuis une ref pendant le rendu serait une lecture de ref au rendu.
  const [size, setSize] = useState({ width: 1, height: 1 });

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize({ width: Math.max(width, 1), height: Math.max(height, 1) });
  };

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !reduced,
        onMoveShouldSetPanResponder: () => !reduced,
        onPanResponderGrant: (event) => {
          Animated.spring(lift, { ...springs.gentle, toValue: 1 }).start();
          const { locationX, locationY } = event.nativeEvent;
          tiltY.setValue((locationX / size.width) * 2 - 1);
          tiltX.setValue(-((locationY / size.height) * 2 - 1));
        },
        onPanResponderMove: (event) => {
          const { locationX, locationY } = event.nativeEvent;
          // Bornées : au-delà de la carte, l'inclinaison ne s'emballe pas.
          const nx = Math.max(-1, Math.min(1, (locationX / size.width) * 2 - 1));
          const ny = Math.max(-1, Math.min(1, (locationY / size.height) * 2 - 1));
          tiltY.setValue(nx);
          tiltX.setValue(-ny);
        },
        onPanResponderRelease: () => {
          Animated.parallel([
            Animated.spring(tiltX, { ...springs.bouncy, toValue: 0 }),
            Animated.spring(tiltY, { ...springs.bouncy, toValue: 0 }),
            Animated.spring(lift, { ...springs.gentle, toValue: 0 }),
          ]).start();
        },
        onPanResponderTerminate: () => {
          Animated.parallel([
            Animated.spring(tiltX, { ...springs.bouncy, toValue: 0 }),
            Animated.spring(tiltY, { ...springs.bouncy, toValue: 0 }),
            Animated.spring(lift, { ...springs.gentle, toValue: 0 }),
          ]).start();
        },
      }),
    [lift, reduced, size, tiltX, tiltY],
  );

  const rotateX = tiltX.interpolate({
    inputRange: [-1, 1],
    outputRange: [`${-maxTilt}deg`, `${maxTilt}deg`],
  });
  const rotateY = tiltY.interpolate({
    inputRange: [-1, 1],
    outputRange: [`${-maxTilt}deg`, `${maxTilt}deg`],
  });
  const scale = lift.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] });
  const glossX = tiltY.interpolate({ inputRange: [-1, 1], outputRange: ['-40%', '40%'] });
  const glossOpacity = lift.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  return (
    <Animated.View
      {...responder.panHandlers}
      onLayout={onLayout}
      style={[
        {
          transform: [{ perspective }, { rotateX }, { rotateY }, { scale }],
        },
        style,
      ]}
    >
      {children}
      {gloss && !reduced ? (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { opacity: glossOpacity, transform: [{ translateX: glossX }], pointerEvents: 'none' },
          ]}
        >
          <View style={[StyleSheet.absoluteFill, { overflow: 'hidden', borderRadius: theme.radius.lg }]}>
            <Svg width="100%" height="100%" preserveAspectRatio="none">
              <Defs>
                <LinearGradient id="tiltGloss" x1="0" y1="0" x2="1" y2="0.4">
                  <Stop offset="0" stopColor={theme.colors.background} stopOpacity="0" />
                  <Stop offset="0.5" stopColor={theme.colors.background} stopOpacity="0.45" />
                  <Stop offset="1" stopColor={theme.colors.background} stopOpacity="0" />
                </LinearGradient>
              </Defs>
              <Rect x="0" y="0" width="100%" height="100%" fill="url(#tiltGloss)" />
            </Svg>
          </View>
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}
