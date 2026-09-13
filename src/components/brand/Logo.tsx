/**
 * Logo de l'app, vectoriel et thémable.
 *
 * Trois remplissages :
 *  • `mono`     couleur unie (token du thème) — usage courant ;
 *  • `gradient` dégradé primaire → secondaire du club — écrans de marque ;
 *  • `outline`  contour seul — filigranes et fonds discrets.
 *
 * Avec `animated`, le logo se dessine trait par trait puis se remplit : c'est
 * l'entrée du splash et de l'écran de bienvenue.
 */
import React, { forwardRef, useEffect, useMemo, useState } from 'react';
import { Animated, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop, type PathProps } from 'react-native-svg';

import { useReducedMotion } from '@/lib/motion';
import { useTheme } from '@/theme/ThemeProvider';
import type { ColorToken } from '@/theme/types';

import {
  LOGO_ASPECT_RATIO,
  LOGO_PATH,
  LOGO_PATH_LENGTH,
  LOGO_VIEW_BOX,
} from './logoPath';

/**
 * `Animated.createAnimatedComponent` force `collapsable: false` sur le composant
 * enveloppé, pour empêcher l'aplatissement de la vue native. `react-native-svg`
 * transmet les props qu'il ne connaît pas à l'élément DOM sur le web : React
 * signale alors une valeur booléenne sur un attribut qui ne l'est pas. On filtre
 * donc la prop avant de la laisser passer.
 */
const SvgPath = forwardRef<React.ComponentRef<typeof Path>, PathProps & { collapsable?: boolean }>(
  function SvgPath({ collapsable: _collapsable, ...props }, ref) {
    return <Path ref={ref} {...props} />;
  },
);

const AnimatedPath = Animated.createAnimatedComponent(SvgPath);

export interface LogoProps {
  /** Hauteur du logo en px ; la largeur suit le rapport d'aspect. */
  size?: number;
  variant?: 'mono' | 'gradient' | 'outline';
  /** Couleur du remplissage `mono` et du contour (défaut : `text`). */
  color?: ColorToken;
  /** Opacité globale, pour les filigranes. */
  opacity?: number;
  /** Dessine le tracé puis remplit, à l'apparition. */
  animated?: boolean;
  /** Retard avant le début de l'animation, en ms. */
  delay?: number;
  /** Appelé quand l'animation d'entrée est terminée. */
  onAnimationEnd?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export function Logo({
  size = 64,
  variant = 'mono',
  color = 'text',
  opacity = 1,
  animated = false,
  delay = 0,
  onAnimationEnd,
  style,
  accessibilityLabel,
}: LogoProps) {
  const theme = useTheme();
  const reduced = useReducedMotion();
  const shouldAnimate = animated && !reduced;

  // 0 → contour vide · 1 → contour complet · 2 → rempli
  const [progress] = useState(() => new Animated.Value(shouldAnimate ? 0 : 2));

  useEffect(() => {
    if (!shouldAnimate) {
      progress.setValue(2);
      onAnimationEnd?.();
      return undefined;
    }
    // `useNativeDriver: false` est obligatoire : le pilote natif ne sait animer
    // que l'opacité et les transformations d'une View. Ici on anime des
    // attributs SVG (`strokeDashoffset`, `fillOpacity`), qui doivent être
    // écrits depuis JS — sinon le tracé reste figé sur son contour.
    const animation = Animated.sequence([
      Animated.timing(progress, {
        toValue: 1,
        duration: 900,
        delay,
        useNativeDriver: false,
      }),
      Animated.timing(progress, { toValue: 2, duration: 320, useNativeDriver: false }),
    ]);
    animation.start(({ finished }) => {
      if (finished) onAnimationEnd?.();
    });
    return () => animation.stop();
    // `onAnimationEnd` est volontairement hors dépendances : sa recréation ne doit pas relancer l'animation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delay, progress, shouldAnimate]);

  const width = size * LOGO_ASPECT_RATIO;
  const strokeColor = theme.colors[color];
  const fillColor = variant === 'gradient' ? 'url(#logoGradient)' : theme.colors[color];

  // Épaisseur pensée pour le viewBox (hauteur 100) : ~2 px à 100 px de haut.
  const strokeWidth = variant === 'outline' ? 1.2 : 0.9;

  const dashOffset = useMemo(
    () =>
      progress.interpolate({
        inputRange: [0, 1, 2],
        outputRange: [LOGO_PATH_LENGTH, 0, 0],
      }),
    [progress],
  );

  const fillOpacity = useMemo(
    () => progress.interpolate({ inputRange: [0, 1, 2], outputRange: [0, 0, 1] }),
    [progress],
  );

  const strokeOpacity = useMemo(
    () => progress.interpolate({ inputRange: [0, 1, 2], outputRange: [1, 1, 0] }),
    [progress],
  );

  return (
    <View
      style={[{ width, height: size, opacity }, style]}
      accessibilityRole={accessibilityLabel ? 'image' : undefined}
      accessibilityLabel={accessibilityLabel}
      accessibilityElementsHidden={!accessibilityLabel}
      importantForAccessibility={accessibilityLabel ? 'yes' : 'no-hide-descendants'}
    >
      <Svg width="100%" height="100%" viewBox={LOGO_VIEW_BOX}>
        {variant === 'gradient' ? (
          <Defs>
            <LinearGradient id="logoGradient" x1="0" y1="0" x2="0.6" y2="1">
              <Stop offset="0" stopColor={theme.gradient[0]} />
              <Stop offset="1" stopColor={theme.gradient[1]} />
            </LinearGradient>
          </Defs>
        ) : null}

        {variant === 'outline' ? (
          <Path
            d={LOGO_PATH}
            fill="none"
            fillRule="evenodd"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
        ) : shouldAnimate ? (
          <>
            <AnimatedPath
              d={LOGO_PATH}
              fill={fillColor}
              fillRule="evenodd"
              fillOpacity={fillOpacity}
            />
            <AnimatedPath
              d={LOGO_PATH}
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
              strokeDasharray={`${LOGO_PATH_LENGTH}`}
              strokeDashoffset={dashOffset}
              strokeOpacity={strokeOpacity}
            />
          </>
        ) : (
          <Path d={LOGO_PATH} fill={fillColor} fillRule="evenodd" />
        )}
      </Svg>
    </View>
  );
}
