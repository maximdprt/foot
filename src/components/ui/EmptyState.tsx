import type { LucideIcon } from 'lucide-react-native';
import React from 'react';
import { Animated, View, type StyleProp, type ViewStyle } from 'react-native';

import { useEntrance, usePulse } from '@/lib/motion';
import { useTheme } from '@/theme/ThemeProvider';

import { Text } from './Text';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  /** Désactive l'animation d'entrée (listes déjà animées par ailleurs). */
  animate?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * État vide : grande icône ligne dans un cercle teinté à 10 % de la primaire,
 * titre, et un sous-titre seulement quand l'écran a quelque chose à ajouter.
 *
 * Le cercle respire et une onde s'en échappe : l'écran vide reste vivant sans
 * jamais attirer l'œil plus que le contenu réel.
 */
export function EmptyState({ icon: Icon, title, subtitle, animate = true, style }: EmptyStateProps) {
  const theme = useTheme();
  const entrance = useEntrance({ enabled: animate, scaleFrom: 0.94, duration: 520 });
  const pulse = usePulse(3200);

  // Halo : part de la taille du cercle et s'évanouit en s'élargissant.
  const haloScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] });
  const haloOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] });
  const iconFloat = pulse.interpolate({ inputRange: [0, 1], outputRange: [0, -4] });

  return (
    <Animated.View
      style={[{ alignItems: 'center', paddingVertical: theme.spacing.xxl }, entrance, style]}
    >
      <View style={{ marginBottom: theme.spacing.lg, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View
          style={{
            position: 'absolute',
            pointerEvents: 'none',
            width: 96,
            height: 96,
            borderRadius: 48,
            backgroundColor: theme.colors.primarySoft,
            opacity: haloOpacity,
            transform: [{ scale: haloScale }],
          }}
        />
        <View
          style={{
            width: 96,
            height: 96,
            borderRadius: 48,
            backgroundColor: theme.colors.primarySoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Animated.View style={{ transform: [{ translateY: iconFloat }] }}>
            <Icon size={40} color={theme.colors.primary} strokeWidth={2} />
          </Animated.View>
        </View>
      </View>

      <Text variant="h3" align="center">
        {title}
      </Text>
      {subtitle ? (
        <Text variant="body" color="textSecondary" align="center" style={{ marginTop: theme.spacing.xs }}>
          {subtitle}
        </Text>
      ) : null}
    </Animated.View>
  );
}
