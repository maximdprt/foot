/**
 * Grille des badges : ceux décrochés d'abord, puis les plus proches d'être
 * atteints — avec leur barre de progression, pour que « verrouillé » ne veuille
 * pas dire « hors de portée ».
 */
import { Award, Lock } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';

import { ProgressBar, Text } from '@/components/ui';
import { useTranslation } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';

import type { BadgeProgress } from './stats';

interface BadgeGridProps {
  badges: BadgeProgress[];
  /** Nombre de badges affichés ; le reste est masqué (aperçu sur le profil). */
  limit?: number;
}

export function BadgeGrid({ badges, limit }: BadgeGridProps) {
  const theme = useTheme();
  const shown = limit ? badges.slice(0, limit) : badges;

  return (
    <View style={{ gap: theme.spacing.sm }}>
      {shown.map((badge) => (
        <BadgeRow key={badge.definition.id} badge={badge} />
      ))}
    </View>
  );
}

function BadgeRow({ badge }: { badge: BadgeProgress }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { definition, earned, ratio } = badge;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
        padding: theme.spacing.md,
        borderRadius: theme.radius.md,
        backgroundColor: earned ? theme.colors.primarySoft : theme.colors.surface,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: earned ? theme.colors.primary : theme.colors.background,
        }}
      >
        {earned ? (
          <Award size={20} color={theme.colors.onPrimary} strokeWidth={2} />
        ) : (
          <Lock size={18} color={theme.colors.textSecondary} strokeWidth={2} />
        )}
      </View>

      <View style={{ flex: 1 }}>
        <Text variant="bodyBold" color={earned ? 'primary' : 'text'} numberOfLines={1}>
          {t(definition.nameKey)}
        </Text>
        <Text variant="caption" color="textSecondary" numberOfLines={2}>
          {t(definition.descriptionKey)}
        </Text>
        {earned ? null : (
          <ProgressBar progress={ratio} style={{ marginTop: theme.spacing.sm }} />
        )}
      </View>
    </View>
  );
}
