/**
 * Nombre qui défile jusqu'à sa valeur (compteurs, statistiques).
 * `Animated` ne sait pas interpoler du texte : on écoute la valeur et on
 * met à jour le rendu, ce qui reste peu coûteux pour un compteur isolé.
 */
import React, { useEffect, useState } from 'react';
import { Animated } from 'react-native';

import { easings, useReducedMotion } from '@/lib/motion';

import { Text, type TextProps } from '@/components/ui/Text';

interface AnimatedNumberProps extends Omit<TextProps, 'children'> {
  value: number;
  duration?: number;
  /** Nombre de décimales affichées. */
  decimals?: number;
  /** Texte ajouté après le nombre (ex. « % »). */
  suffix?: string;
}

export function AnimatedNumber({
  value,
  duration = 900,
  decimals = 0,
  suffix = '',
  ...textProps
}: AnimatedNumberProps) {
  const reduced = useReducedMotion();
  const [animated] = useState(() => new Animated.Value(0));
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (reduced) return undefined;
    const subscription = animated.addListener(({ value: current }) => setDisplay(current));
    const animation = Animated.timing(animated, {
      toValue: value,
      duration,
      easing: easings.out,
      // Une valeur lue en JS ne peut pas passer par le pilote natif.
      useNativeDriver: false,
    });
    animation.start();
    return () => {
      animation.stop();
      animated.removeListener(subscription);
    };
  }, [animated, duration, reduced, value]);

  // Animations réduites : la valeur finale, sans détour par un état.
  const shown = reduced ? value : display;
  return <Text {...textProps}>{`${shown.toFixed(decimals)}${suffix}`}</Text>;
}
