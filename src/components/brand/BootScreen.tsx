/**
 * Écran de démarrage animé, superposé à l'app pendant l'initialisation
 * (polices, stores, session).
 *
 * Le logo se dessine, le ballon rebondit, puis l'ensemble s'efface. L'écran
 * reste affiché au minimum `MIN_DURATION` pour que l'animation ne soit pas
 * coupée net sur un appareil rapide — mais il ne retarde jamais l'app de plus
 * de ce délai : dès que tout est prêt et le minimum écoulé, il disparaît.
 */
import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { Football3D, PitchBackground } from '@/components/motion';
import { APP_NAME } from '@/config/app';
import { easings, useReducedMotion } from '@/lib/motion';
import { useTheme } from '@/theme/ThemeProvider';

import { Logo } from './Logo';

/** Durée minimale d'affichage, en ms : le temps que le logo se dessine. */
const MIN_DURATION = 1100;
/** Durée du fondu de sortie. */
const FADE_OUT = 320;

interface BootScreenProps {
  /** L'app est prête à prendre la main. */
  ready: boolean;
  /** Appelé une fois l'écran totalement effacé. */
  onFinish: () => void;
}

export function BootScreen({ ready, onFinish }: BootScreenProps) {
  const theme = useTheme();
  const reduced = useReducedMotion();
  const [opacity] = useState(() => new Animated.Value(1));
  const [contentScale] = useState(() => new Animated.Value(1));
  const [minElapsed, setMinElapsed] = useState(reduced);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (reduced) return undefined;
    const timer = setTimeout(() => setMinElapsed(true), MIN_DURATION);
    return () => clearTimeout(timer);
  }, [reduced]);

  useEffect(() => {
    if (!ready || !minElapsed) return undefined;
    const animation = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: reduced ? 0 : FADE_OUT,
        easing: easings.in,
        useNativeDriver: true,
      }),
      // Léger zoom avant : l'app semble arriver « derrière » le logo.
      Animated.timing(contentScale, {
        toValue: reduced ? 1 : 1.08,
        duration: reduced ? 0 : FADE_OUT,
        easing: easings.in,
        useNativeDriver: true,
      }),
    ]);
    animation.start(({ finished }) => {
      if (!finished) return;
      setHidden(true);
      onFinish();
    });
    return () => animation.stop();
    // `onFinish` volontairement hors dépendances : sa recréation ne doit pas rejouer la sortie.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentScale, minElapsed, opacity, ready, reduced]);

  if (hidden) return null;

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor: theme.colors.background, opacity, zIndex: 10, pointerEvents: 'none' },
      ]}
    >
      <PitchBackground intensity={0.035} stripes={14} />
      <Animated.View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          gap: theme.spacing.xl,
          transform: [{ scale: contentScale }],
        }}
      >
        <Logo size={148} variant="gradient" animated accessibilityLabel={APP_NAME} />
        <BrandName />
        <Football3D size={44} spinDuration={2600} bounce bounceHeight={18} shadow />
      </Animated.View>
    </Animated.View>
  );
}

/** Nom de l'app, qui apparaît une fois le tracé du logo terminé. */
function BrandName() {
  const reduced = useReducedMotion();
  const [progress] = useState(() => new Animated.Value(reduced ? 1 : 0));

  useEffect(() => {
    if (reduced) return undefined;
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: 420,
      delay: 780,
      easing: easings.out,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [progress, reduced]);

  return (
    <Animated.View
      style={{
        opacity: progress,
        transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
      }}
    >
      <View style={{ alignItems: 'center' }}>
        <Text variant="h2" style={{ letterSpacing: 2, textTransform: 'uppercase' }}>
          {APP_NAME}
        </Text>
      </View>
    </Animated.View>
  );
}
