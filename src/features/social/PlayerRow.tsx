/**
 * Ligne d'un joueur : avatar, nom, équipe de cœur, et une action à droite.
 * Sert aux amis, aux demandes reçues, aux suggestions et aux participants d'un match.
 */
import React, { type ReactNode } from 'react';
import { View } from 'react-native';

import { Avatar, TeamDot, Text } from '@/components/ui';
import { useTranslation } from '@/i18n';
import { getTeam, getTeamDisplayName } from '@/theme/teams';
import { useTheme } from '@/theme/ThemeProvider';

import type { PlayerSummary } from './types';

interface PlayerRowProps {
  player: PlayerSummary;
  /** Boutons ou libellé d'état, alignés à droite. */
  action?: ReactNode;
  /** Ligne secondaire ; par défaut l'équipe de cœur, ou la ville à défaut. */
  subtitle?: string;
}

export function PlayerRow({ player, action, subtitle }: PlayerRowProps) {
  const theme = useTheme();
  const { t, locale } = useTranslation();
  const team = getTeam(player.favoriteTeamId);
  const hasTeam = team.id !== 'none';

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
        paddingVertical: theme.spacing.md,
        minHeight: theme.sizes.touchTarget,
      }}
    >
      <Avatar uri={player.avatarUrl} name={player.displayName} size={theme.sizes.avatarMd} />

      <View style={{ flex: 1 }}>
        <Text variant="bodyBold" numberOfLines={1}>
          {player.displayName ?? t('common.notSet')}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
          {hasTeam ? <TeamDot team={team} size={14} /> : null}
          <Text variant="caption" color="textSecondary" numberOfLines={1} style={{ flex: 1 }}>
            {subtitle ?? (hasTeam ? getTeamDisplayName(team, locale) : (player.city ?? ''))}
          </Text>
        </View>
      </View>

      {action}
    </View>
  );
}
