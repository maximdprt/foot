import { Image } from 'expo-image';
import React from 'react';
import { Animated, View, type StyleProp, type ViewStyle } from 'react-native';

import { usePulse } from '@/lib/motion';
import { useTheme } from '@/theme/ThemeProvider';

import { Text } from './Text';

interface AvatarProps {
  uri?: string | null;
  /** Nom utilisé pour les initiales si pas d'image. */
  name?: string | null;
  size?: number;
  /** Anneau dans la couleur primaire (profil). */
  ring?: boolean;
  /** Onde lumineuse autour de l'anneau : met en avant l'avatar d'un écran clé. */
  glow?: boolean;
  style?: StyleProp<ViewStyle>;
}

function initials(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p.charAt(0).toUpperCase()).join('') || '?';
}

/** Avatar circulaire avec repli sur les initiales. */
export function Avatar({ uri, name, size, ring = false, glow = false, style }: AvatarProps) {
  const theme = useTheme();
  const pulse = usePulse(2800, glow && ring);
  const dimension = size ?? theme.sizes.avatarMd;
  const ringWidth = ring ? 3 : 0;
  const gap = ring ? 3 : 0;
  const inner = dimension - 2 * (ringWidth + gap);

  const content = uri ? (
    <Image
      source={{ uri }}
      accessibilityLabel={name ?? undefined}
      contentFit="cover"
      style={{ width: inner, height: inner, borderRadius: inner / 2 }}
    />
  ) : (
    <View
      accessibilityLabel={name ?? undefined}
      style={{
        width: inner,
        height: inner,
        borderRadius: inner / 2,
        backgroundColor: theme.colors.primarySoft,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        variant="bodyBold"
        color="primary"
        style={{ fontSize: Math.max(12, inner * 0.38), lineHeight: Math.max(16, inner * 0.46) }}
      >
        {initials(name)}
      </Text>
    </View>
  );

  return (
    <View
      style={[
        // Taille fixée : sans cela le conteneur du halo s'étire et recentre l'avatar.
        { width: dimension, height: dimension, alignItems: 'center', justifyContent: 'center' },
        style,
      ]}
    >
      {glow && ring ? (
        <Animated.View
          style={{
            position: 'absolute',
            pointerEvents: 'none',
            width: dimension,
            height: dimension,
            borderRadius: dimension / 2,
            borderWidth: ringWidth,
            borderColor: theme.colors.primary,
            opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] }),
            transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.28] }) }],
          }}
        />
      ) : null}
      <View
        style={{
          width: dimension,
          height: dimension,
          borderRadius: dimension / 2,
          borderWidth: ringWidth,
          borderColor: theme.colors.primary,
          padding: gap,
          backgroundColor: theme.colors.background,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {content}
      </View>
    </View>
  );
}
