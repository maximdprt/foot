import React, { type ReactNode } from 'react';
import { Animated, Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { haptics } from '@/lib/haptics';
import { usePressScale } from '@/lib/motion';
import { useTheme } from '@/theme/ThemeProvider';

import { Text } from './Text';

export interface TileProps {
  title: string;
  /** Icône lucide affichée dans le bloc de couleur à gauche. */
  icon?: ReactNode;
  caption?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

/** Tuile « raccourci Spotify » : rectangle arrondi 8 px, bloc de couleur à gauche, titre gras à droite. */
export function Tile({ title, icon, caption, onPress, style }: TileProps) {
  const theme = useTheme();
  const press = usePressScale(0.03);
  const height = 64;
  // Bloc de couleur nettement plus étroit que la tuile n'est haute : sur deux
  // colonnes à 390 px, c'est ce qui laisse tenir « Programmes » ou
  // « Statistiques » sur une seule ligne.
  const blockWidth = 44;
  return (
    <Animated.View style={[press.style, style]}>
    <Pressable
      onPress={() => {
        void haptics.selection();
        onPress?.();
      }}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => ({
        height,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: theme.radius.sm,
        backgroundColor: theme.colors.surface,
        overflow: 'hidden',
        opacity: pressed ? 0.92 : 1,
      })}
    >
      <View
        style={{
          width: blockWidth,
          height,
          backgroundColor: theme.colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Cercle de terrain en filigrane derrière l'icône : rappel discret du décor. */}
        <Svg width={blockWidth} height={height} viewBox="0 0 64 64" style={{ position: 'absolute' }}>
          <Circle cx="52" cy="12" r="20" fill={theme.colors.onPrimary} opacity={0.12} />
          <Circle cx="10" cy="56" r="14" fill="none" stroke={theme.colors.onPrimary} strokeWidth="1.5" opacity={0.16} />
        </Svg>
        {icon}
      </View>
      <View style={{ flex: 1, paddingHorizontal: theme.spacing.sm }}>
        <Text variant="bodyBold" numberOfLines={1}>
          {title}
        </Text>
        {caption ? (
          <Text variant="caption" color="textSecondary" numberOfLines={1}>
            {caption}
          </Text>
        ) : null}
      </View>
    </Pressable>
    </Animated.View>
  );
}

interface TileGridProps {
  children: ReactNode[];
  style?: StyleProp<ViewStyle>;
}

/** Grille de tuiles sur deux colonnes (gouttière 12 px). */
export function TileGrid({ children, style }: TileGridProps) {
  const theme = useTheme();
  const rows: ReactNode[][] = [];
  children.forEach((child, index) => {
    if (index % 2 === 0) rows.push([child]);
    else rows[rows.length - 1].push(child);
  });
  return (
    <View style={[{ gap: theme.spacing.md }, style]}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={{ flexDirection: 'row', gap: theme.spacing.md }}>
          {row.map((cell, cellIndex) => (
            <View key={cellIndex} style={{ flex: 1 }}>
              {cell}
            </View>
          ))}
          {row.length === 1 ? <View style={{ flex: 1 }} /> : null}
        </View>
      ))}
    </View>
  );
}
