/**
 * Briques d'animation partagées.
 *
 * Tout passe par l'API `Animated` de React Native : elle fonctionne à
 * l'identique sur iOS, Android et le web, et le pilote natif prend en charge
 * les transformations et l'opacité — donc tout ce qui suit.
 *
 * Règle d'accessibilité : si « Réduire les animations » est actif sur
 * l'appareil, les boucles décoratives s'arrêtent et les entrées deviennent
 * instantanées. Aucun contenu n'est jamais masqué par une animation.
 */
import { useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, type ViewStyle } from 'react-native';

/** Courbes d'accélération du design system. */
export const easings = {
  /** Entrées et sorties standard (material standard). */
  standard: Easing.bezier(0.2, 0, 0, 1),
  /** Apparitions : démarrage franc, arrivée douce. */
  out: Easing.bezier(0.16, 1, 0.3, 1),
  /** Disparitions. */
  in: Easing.bezier(0.4, 0, 1, 1),
  /** Rebond léger, pour les validations. */
  overshoot: Easing.bezier(0.34, 1.56, 0.64, 1),
  linear: Easing.linear,
} as const;

/** Réglages de ressort réutilisables (`Animated.spring`). */
export const springs = {
  /** Retour au repos sans rebond visible : appuis, bascules. */
  gentle: { tension: 180, friction: 22, useNativeDriver: true },
  /** Rebond marqué : onglet actif, validation. */
  bouncy: { tension: 220, friction: 12, useNativeDriver: true },
  /** Très réactif, quasi immédiat. */
  snappy: { tension: 320, friction: 26, useNativeDriver: true },
} as const;

/** Vrai si l'utilisateur a demandé à réduire les animations. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (mounted) setReduced(value);
      })
      .catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reduced;
}

/**
 * Valeur 0 → 1 rejouée en boucle : sert de horloge aux animations continues
 * (rotation du ballon, défilement des bandes de pelouse, scintillement).
 * La boucle est arrêtée si les animations sont réduites, ou si `enabled` est faux.
 */
export function useLoop(duration: number, enabled = true): Animated.Value {
  const reduced = useReducedMotion();
  const [value] = useState(() => new Animated.Value(0));
  const running = enabled && !reduced;

  useEffect(() => {
    if (!running) {
      value.setValue(0);
      return undefined;
    }
    const animation = Animated.loop(
      Animated.timing(value, {
        toValue: 1,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => {
      animation.stop();
      value.setValue(0);
    };
  }, [duration, running, value]);

  return value;
}

/**
 * Va-et-vient 0 → 1 → 0 : respiration, halo, flottement.
 * Séparé de `useLoop` car l'interpolation d'un aller-retour sur une rampe
 * linéaire produirait une cassure au bouclage.
 */
export function usePulse(duration: number, enabled = true): Animated.Value {
  const reduced = useReducedMotion();
  const [value] = useState(() => new Animated.Value(0));
  const running = enabled && !reduced;

  useEffect(() => {
    if (!running) {
      value.setValue(0);
      return undefined;
    }
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(value, {
          toValue: 1,
          duration: duration / 2,
          easing: easings.standard,
          useNativeDriver: true,
        }),
        Animated.timing(value, {
          toValue: 0,
          duration: duration / 2,
          easing: easings.standard,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => {
      animation.stop();
      value.setValue(0);
    };
  }, [duration, running, value]);

  return value;
}

export interface EntranceOptions {
  /** Retard avant le départ, en ms : sert à décaler une liste (effet cascade). */
  delay?: number;
  duration?: number;
  /** Décalage vertical de départ, en px (négatif = arrive du haut). */
  from?: number;
  /** Échelle de départ (1 = pas de zoom). */
  scaleFrom?: number;
  enabled?: boolean;
}

/**
 * Entrée d'un élément : fondu + glissement (+ zoom optionnel).
 * Retourne un style à appliquer tel quel à un `Animated.View`.
 */
export function useEntrance({
  delay = 0,
  duration = 420,
  from = 16,
  scaleFrom = 1,
  enabled = true,
}: EntranceOptions = {}): Animated.WithAnimatedObject<ViewStyle> {
  const reduced = useReducedMotion();
  const [progress] = useState(() => new Animated.Value(enabled && !reduced ? 0 : 1));

  useEffect(() => {
    if (!enabled || reduced) {
      progress.setValue(1);
      return undefined;
    }
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration,
      delay,
      easing: easings.out,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [delay, duration, enabled, progress, reduced]);

  return useMemo(
    () => ({
      opacity: progress,
      transform: [
        { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [from, 0] }) },
        { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [scaleFrom, 1] }) },
      ],
    }),
    [from, progress, scaleFrom],
  );
}

/** Décalage d'une liste : `staggerDelay(index)` → retard à passer à `useEntrance`. */
export function staggerDelay(index: number, step = 55, max = 6): number {
  return Math.min(index, max) * step;
}

/**
 * Valeur animée qui suit une cible avec un ressort.
 * Utilisé pour les états discrets (sélectionné / non sélectionné, actif / inactif).
 */
export function useSpringTo(
  target: number,
  config: (typeof springs)[keyof typeof springs] = springs.gentle,
): Animated.Value {
  const reduced = useReducedMotion();
  const [value] = useState(() => new Animated.Value(target));

  useEffect(() => {
    if (reduced) {
      value.setValue(target);
      return undefined;
    }
    const animation = Animated.spring(value, { ...config, toValue: target });
    animation.start();
    return () => animation.stop();
  }, [config, reduced, target, value]);

  return value;
}

/** Interpolation d'un angle en degrés, prête pour `transform: [{ rotate }]`. */
export function rotate(value: Animated.Value, from: number, to: number): Animated.AnimatedInterpolation<string> {
  return value.interpolate({ inputRange: [0, 1], outputRange: [`${from}deg`, `${to}deg`] });
}

export interface PressScale {
  /** À brancher sur `onPressIn` du Pressable. */
  onPressIn: () => void;
  /** À brancher sur `onPressOut`. */
  onPressOut: () => void;
  /** Style à appliquer à l'`Animated.View` enveloppant le contenu. */
  style: Animated.WithAnimatedObject<ViewStyle>;
}

/**
 * Retour tactile des surfaces pressables : léger enfoncement au doigt, retour
 * élastique au relâchement. Plus lisible qu'un simple changement d'opacité,
 * et c'est le même ressort partout (boutons, cartes, tuiles, chips).
 */
export function usePressScale(depth = 0.04): PressScale {
  const reduced = useReducedMotion();
  const [value] = useState(() => new Animated.Value(1));

  // Un appui suivi d'une navigation laisserait sinon le ressort tourner dans le vide.
  useEffect(() => () => value.stopAnimation(), [value]);

  const animateTo = (toValue: number, config: (typeof springs)[keyof typeof springs]) => {
    if (reduced) {
      value.setValue(1);
      return;
    }
    Animated.spring(value, { ...config, toValue }).start();
  };

  return {
    onPressIn: () => animateTo(1 - depth, springs.snappy),
    onPressOut: () => animateTo(1, springs.bouncy),
    style: { transform: [{ scale: value }] },
  };
}
