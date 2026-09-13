/**
 * Grand écusson d'équipe.
 *
 * Les écussons officiels sont des marques déposées : on n'en intègre aucun
 * (section 6.1). À la place, un disque bicolore aux couleurs du club, avec son
 * abréviation — la même grammaire que `TeamDot`, en grand format.
 *
 * Quand l'équipe change, l'écusson pivote sur lui-même et le nouveau club
 * apparaît à mi-rotation : la bascule se voit sans avoir à relire le nom.
 */
import React, { useEffect, useState } from 'react';
import { Animated, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from 'react-native-svg';

import { normalizeHex } from '@/lib/contrast';
import { easings, useReducedMotion } from '@/lib/motion';
import { useTheme } from '@/theme/ThemeProvider';
import type { TeamEntry } from '@/theme/types';

import { getTeamDotColors } from './TeamDot';
import { Text } from './Text';

interface TeamCrestProps {
  team: TeamEntry;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

/** Durée d'un demi-tour, en ms. */
const FLIP_DURATION = 320;

export function TeamCrest({ team, size = 112, style }: TeamCrestProps) {
  const theme = useTheme();
  const reduced = useReducedMotion();

  // `shown` est l'équipe réellement dessinée : elle ne change qu'à mi-rotation.
  const [shown, setShown] = useState(team);
  const [pending, setPending] = useState<TeamEntry | null>(null);
  const [flip] = useState(() => new Animated.Value(0));

  // Ajustement d'état pendant le rendu : sans animation on bascule tout de
  // suite, sinon on met le nouveau club en attente le temps du demi-tour.
  if (team.id !== shown.id && pending?.id !== team.id) {
    if (reduced) setShown(team);
    else setPending(team);
  }

  useEffect(() => {
    if (!pending || reduced) return undefined;
    const animation = Animated.sequence([
      Animated.timing(flip, { toValue: 1, duration: FLIP_DURATION, easing: easings.in, useNativeDriver: true }),
      Animated.timing(flip, { toValue: 0, duration: FLIP_DURATION, easing: easings.out, useNativeDriver: true }),
    ]);
    // À mi-parcours, l'écusson est vu par la tranche : c'est là qu'on change de club.
    const swap = setTimeout(() => {
      setShown(pending);
      setPending(null);
    }, FLIP_DURATION);
    animation.start();
    return () => {
      clearTimeout(swap);
      animation.stop();
    };
  }, [flip, pending, reduced]);

  const { left, right } = getTeamDotColors(shown);
  const rotateY = flip.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '90deg'] });
  const isNeutral = shown.id === 'none';

  return (
    <View style={[{ alignItems: 'center' }, style]}>
      <Animated.View
        style={{
          width: size,
          height: size,
          // Le disque rogne le bandeau du nom : il épouse la forme de l'écusson
          // au lieu de flotter par-dessus comme une étiquette.
          borderRadius: size / 2,
          overflow: 'hidden',
          transform: [{ perspective: 800 }, { rotateY }],
        }}
        accessibilityLabel={shown.name}
      >
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Defs>
            <RadialGradient id="crestLight" cx="32%" cy="26%" r="80%">
              <Stop offset="0" stopColor={theme.colors.background} stopOpacity="0.38" />
              <Stop offset="0.65" stopColor={theme.colors.background} stopOpacity="0" />
              <Stop offset="1" stopColor={theme.colors.text} stopOpacity="0.18" />
            </RadialGradient>
          </Defs>

          <Path d="M50 2 A48 48 0 0 0 50 98 Z" fill={normalizeHex(left) ?? theme.colors.primary} />
          <Path d="M50 2 A48 48 0 0 1 50 98 Z" fill={normalizeHex(right) ?? theme.colors.secondary} />
          {/* Volume : lumière en haut à gauche, ombre sur le pourtour. */}
          <Circle cx="50" cy="50" r="48" fill="url(#crestLight)" />
          <Circle cx="50" cy="50" r="48" fill="none" stroke={theme.colors.border} strokeWidth="2" />
        </Svg>

        {isNeutral ? null : (
          <View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: size * 0.1,
              height: size * 0.22,
              backgroundColor: theme.colors.text,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              variant="label"
              style={{
                color: theme.colors.background,
                fontSize: size * 0.13,
                lineHeight: size * 0.17,
                letterSpacing: 1,
              }}
            >
              {shown.shortName}
            </Text>
          </View>
        )}
      </Animated.View>
    </View>
  );
}
