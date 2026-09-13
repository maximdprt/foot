import React, { useEffect, useRef, useState } from 'react';
import { Animated, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { easings, useReducedMotion } from '@/lib/motion';
import { useTheme } from '@/theme/ThemeProvider';

interface ProgressBarProps {
  /** Progression entre 0 et 1. */
  progress: number;
  /** Ballon qui roule en tête de barre, et qui tourne à mesure qu'il avance. */
  ball?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/** Diamètre du ballon de tête, en px. */
const BALL_SIZE = 16;

/**
 * Barre de progression fine dans la couleur primaire.
 * Avec `ball`, un ballon roule en tête : il avance et tourne proportionnellement
 * à la progression — c'est le repère visuel du questionnaire d'onboarding.
 */
export function ProgressBar({ progress, ball = false, accessibilityLabel, style }: ProgressBarProps) {
  const theme = useTheme();
  const reduced = useReducedMotion();
  const clamped = Math.max(0, Math.min(1, progress));
  const [animated] = useState(() => new Animated.Value(clamped));
  const trackWidth = useRef(0);

  useEffect(() => {
    if (reduced) {
      animated.setValue(clamped);
      return undefined;
    }
    const animation = Animated.timing(animated, {
      toValue: clamped,
      duration: 520,
      easing: easings.out,
      // La largeur du remplissage n'est pas prise en charge par le pilote natif.
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [animated, clamped, reduced]);

  const width = animated.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
      onLayout={(event) => {
        trackWidth.current = event.nativeEvent.layout.width;
      }}
      style={[{ justifyContent: 'center' }, style]}
    >
      <View
        style={{
          height: theme.sizes.progressBarHeight,
          backgroundColor: theme.colors.border,
          borderRadius: theme.radius.pill,
          overflow: 'hidden',
        }}
      >
        <Animated.View
          style={{
            height: '100%',
            width,
            backgroundColor: theme.colors.primary,
            borderRadius: theme.radius.pill,
          }}
        />
      </View>

      {ball ? <ProgressBall progress={animated} clamped={clamped} /> : null}
    </View>
  );
}

/**
 * Ballon de tête. Il est positionné en pourcentage de la barre, puis recentré
 * de la moitié de son diamètre ; son angle suit la distance parcourue, comme
 * une vraie roue (un tour par ~50 px).
 */
function ProgressBall({
  progress,
  clamped,
}: {
  progress: Animated.Value;
  clamped: number;
}) {
  const theme = useTheme();

  const left = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const rotate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '540deg'],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        pointerEvents: 'none',
        left,
        marginLeft: -BALL_SIZE / 2,
        width: BALL_SIZE,
        height: BALL_SIZE,
        // Le ballon disparaît tant que rien n'est parcouru : pas de pastille orpheline à 0 %.
        opacity: clamped > 0.001 ? 1 : 0,
        transform: [{ rotate }],
      }}
    >
      <Svg width={BALL_SIZE} height={BALL_SIZE} viewBox="0 0 20 20">
        <Circle cx="10" cy="10" r="9" fill={theme.colors.background} />
        <Circle cx="10" cy="10" r="9" fill="none" stroke={theme.colors.primary} strokeWidth="2" />
        {/* Pentagone central : suffit à lire la rotation à cette taille. */}
        <Path d="M10 4.4L14.3 7.5L12.7 12.6H7.3L5.7 7.5Z" fill={theme.colors.primary} />
      </Svg>
    </Animated.View>
  );
}
