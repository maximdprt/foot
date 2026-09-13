/**
 * Célébration jouée à la validation du profil : le thème de l'équipe
 * « s'applique » à toute l'app (section 4.3, écran 11).
 *
 * Une onde aux couleurs du club part du centre, le logo s'inscrit dedans, puis
 * des confettis retombent. Déclenché par `useThemeStore.triggerApplyAnimation()`.
 */
import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, useWindowDimensions, View } from 'react-native';

import { Logo } from '@/components/brand';
import { ConfettiBurst } from '@/components/motion';
import { Gradient } from '@/components/ui';
import { easings, useReducedMotion } from '@/lib/motion';
import { useThemeStore } from '@/store/themeStore';

/** Durée totale de l'onde, avant que l'écran redevienne normal. */
const WASH_DURATION = 900;

export function ThemeApplyOverlay() {
  const reduced = useReducedMotion();
  const pulse = useThemeStore((s) => s.applyPulse);
  const { width, height } = useWindowDimensions();

  const [progress] = useState(() => new Animated.Value(0));
  const [visible, setVisible] = useState(false);
  const [lastPulse, setLastPulse] = useState(pulse);

  // Ajustement d'état pendant le rendu (motif React « state adjusted on prop change ») :
  // un nouveau `pulse` monte l'overlay, l'effet ci-dessous joue l'animation.
  if (pulse !== lastPulse) {
    setLastPulse(pulse);
    if (pulse > 0) setVisible(true);
  }

  useEffect(() => {
    if (!visible) return undefined;
    progress.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: reduced ? 200 : WASH_DURATION,
      easing: easings.standard,
      useNativeDriver: true,
    });
    animation.start(({ finished }) => {
      if (finished) setVisible(false);
    });
    return () => animation.stop();
  }, [visible, lastPulse, progress, reduced]);

  if (!visible) return null;

  // L'onde est un disque qui grandit jusqu'à couvrir l'écran, puis s'efface.
  const diameter = Math.hypot(width, height) * 1.2;
  const washScale = progress.interpolate({ inputRange: [0, 0.45, 1], outputRange: [0, 1, 1] });
  const washOpacity = progress.interpolate({ inputRange: [0, 0.4, 0.6, 1], outputRange: [0.95, 0.95, 0.8, 0] });
  const logoOpacity = progress.interpolate({ inputRange: [0, 0.2, 0.55, 0.8], outputRange: [0, 1, 1, 0] });
  const logoScale = progress.interpolate({ inputRange: [0, 0.3, 0.8], outputRange: [0.7, 1, 1.25] });

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 20, pointerEvents: 'none' }]}>
      <Animated.View
        style={{
          position: 'absolute',
          left: (width - diameter) / 2,
          top: (height - diameter) / 2,
          width: diameter,
          height: diameter,
          borderRadius: diameter / 2,
          overflow: 'hidden',
          opacity: washOpacity,
          transform: [{ scale: washScale }],
        }}
      >
        <Gradient style={StyleSheet.absoluteFill} />
      </Animated.View>

      <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
        <Animated.View style={{ opacity: logoOpacity, transform: [{ scale: logoScale }] }}>
          {/* Sur l'onde colorée, le logo se lit dans la couleur de contraste de la primaire. */}
          <Logo size={132} color="onPrimary" />
        </Animated.View>
      </View>

      <ConfettiBurst trigger={lastPulse} />
    </View>
  );
}
