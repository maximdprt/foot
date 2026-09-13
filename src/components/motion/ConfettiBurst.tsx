/**
 * Gerbe de confettis, jouée à la validation du profil.
 *
 * Les particules alternent rectangles (confettis) et petits ballons ; elles
 * partent du centre, retombent avec de la gravité et tournent sur elles-mêmes.
 * Les couleurs viennent du thème : la célébration prend celles du club.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Animated, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { useReducedMotion } from '@/lib/motion';
import { useTheme } from '@/theme/ThemeProvider';

/** Génère un flottant déterministe à partir d'une graine : même gerbe à chaque rendu. */
function seeded(seed: number): number {
  const x = Math.sin(seed * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

interface Particle {
  /** Départ horizontal, en fraction de la largeur (0 = gauche, 1 = droite). */
  originX: number;
  /** Distance horizontale parcourue, en px. */
  driftX: number;
  /** Hauteur du jet, en px (négatif = vers le haut). */
  riseY: number;
  /** Chute finale, en px. */
  fallY: number;
  size: number;
  spin: number;
  delay: number;
  colorIndex: number;
  ball: boolean;
}

function buildParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => {
    const r = (n: number) => seeded(i * 7 + n);
    return {
      originX: 0.25 + r(1) * 0.5,
      driftX: (r(2) - 0.5) * 260,
      riseY: -(90 + r(3) * 150),
      fallY: 260 + r(4) * 180,
      size: 7 + r(5) * 9,
      spin: (r(6) - 0.5) * 900,
      delay: r(7) * 180,
      colorIndex: Math.floor(r(8) * 4),
      // Un quart de ballons parmi les confettis.
      ball: r(9) > 0.75,
    };
  });
}

export interface ConfettiBurstProps {
  /** Chaque incrément relance la gerbe (0 = rien ne s'est encore passé). */
  trigger: number;
  count?: number;
  style?: StyleProp<ViewStyle>;
}

export function ConfettiBurst({ trigger, count = 26, style }: ConfettiBurstProps) {
  const theme = useTheme();
  const reduced = useReducedMotion();
  const [progress] = useState(() => new Animated.Value(0));
  const particles = useMemo(() => buildParticles(count), [count]);

  const palette = [
    theme.colors.primary,
    theme.colors.secondary,
    theme.colors.text,
    theme.colors.success,
  ];

  useEffect(() => {
    if (trigger === 0 || reduced) return undefined;
    progress.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: 1700,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [trigger, progress, reduced]);

  if (trigger === 0 || reduced) return null;

  return (
    <View
      style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }, style]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {particles.map((particle, index) => {
        // Chaque particule démarre avec un léger retard, sur la même horloge.
        const start = particle.delay / 1700;
        const range = [start, start + (1 - start) * 0.45, 1];

        const translateX = progress.interpolate({
          inputRange: range,
          outputRange: [0, particle.driftX * 0.65, particle.driftX],
          extrapolate: 'clamp',
        });
        // Montée rapide puis chute : la trajectoire en cloche d'un vrai lancer.
        const translateY = progress.interpolate({
          inputRange: range,
          outputRange: [0, particle.riseY, particle.fallY],
          extrapolate: 'clamp',
        });
        const rotate = progress.interpolate({
          inputRange: [start, 1],
          outputRange: ['0deg', `${particle.spin}deg`],
          extrapolate: 'clamp',
        });
        const opacity = progress.interpolate({
          inputRange: [start, start + 0.05, 0.75, 1],
          outputRange: [0, 1, 1, 0],
          extrapolate: 'clamp',
        });
        const color = palette[particle.colorIndex % palette.length];

        return (
          <Animated.View
            key={index}
            style={{
              position: 'absolute',
              left: `${particle.originX * 100}%`,
              top: '48%',
              opacity,
              transform: [{ translateX }, { translateY }, { rotate }],
            }}
          >
            {particle.ball ? (
              <Svg width={particle.size} height={particle.size} viewBox="0 0 10 10">
                <Circle cx="5" cy="5" r="5" fill={theme.colors.background} />
                <Circle cx="5" cy="5" r="5" fill="none" stroke={color} strokeWidth="1" />
                <Path d="M5 1.6L6.9 3L6.2 5.3H3.8L3.1 3Z" fill={color} />
              </Svg>
            ) : (
              <View
                style={{
                  width: particle.size,
                  height: particle.size * 0.55,
                  borderRadius: 2,
                  backgroundColor: color,
                }}
              />
            )}
          </Animated.View>
        );
      })}
    </View>
  );
}
