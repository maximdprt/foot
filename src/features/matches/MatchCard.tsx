/**
 * Carte d'un match, partagée par le tableau de bord et la liste des matchs.
 * Elle dit en un coup d'œil : quand, quel format, où, et combien de places.
 */
import { Clock, MapPin, Users } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';

import { Card, TeamDot, Text } from '@/components/ui';
import { useTranslation } from '@/i18n';
import { formatDateTime, formatMinutes } from '@/lib/format';
import { getTeam } from '@/theme/teams';
import { useTheme } from '@/theme/ThemeProvider';

import { hasJoined, isFull, isPast, spotsLeft, type Match } from './types';

interface MatchCardProps {
  match: Match;
  /** Utilisateur courant : sert à afficher « Tu es inscrit ». */
  userId: string | null;
  onPress?: () => void;
  /** Affiche l'équipe de cœur de l'organisateur à gauche. */
  compact?: boolean;
}

/**
 * Un nom de terrain peut être une clé i18n (matchs de démonstration, qui ne
 * connaissent pas de vrais établissements) ou un texte libre saisi par
 * l'organisateur.
 */
export function useVenueLabel(): (venueName: string) => string {
  const { t } = useTranslation();
  return (venueName: string) => (venueName.startsWith('booking.venues.') ? t(venueName) : venueName);
}

export function MatchCard({ match, userId, onPress, compact = false }: MatchCardProps) {
  const theme = useTheme();
  const { t, locale } = useTranslation();
  const venueLabel = useVenueLabel();

  const joined = hasJoined(match, userId);
  const left = spotsLeft(match);
  const past = isPast(match);
  const cancelled = match.status === 'cancelled';

  // Un seul badge d'état, dans cet ordre de priorité.
  const badge = cancelled
    ? { label: t('matches.cancelled'), tone: 'error' as const }
    : past
      ? { label: t('matches.past'), tone: 'muted' as const }
      : isFull(match)
        ? { label: t('matches.full'), tone: 'muted' as const }
        : {
            label: left === 1 ? t('matches.spotsLeft.one') : t('matches.spotsLeft.many', { count: left }),
            tone: 'primary' as const,
          };

  return (
    <Card tone="surface" size="lg" onPress={onPress} accessibilityLabel={venueLabel(match.venueName)}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.md }}>
        {compact ? null : <TeamDot team={getTeam(match.participants[0]?.favoriteTeamId)} size={32} />}

        <View style={{ flex: 1, gap: theme.spacing.xs }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
            <Text variant="bodyBold" numberOfLines={1} style={{ flex: 1 }}>
              {t(`matches.formats.${match.format}`)}
            </Text>
            <Text
              variant="label"
              color={badge.tone === 'error' ? 'error' : badge.tone === 'primary' ? 'primary' : 'textSecondary'}
            >
              {badge.label}
            </Text>
          </View>

          <Row icon={<Clock size={14} color={theme.colors.textSecondary} strokeWidth={2} />}>
            {`${formatDateTime(match.kickoffAt, locale)} · ${formatMinutes(match.durationMinutes, locale)}`}
          </Row>
          <Row icon={<MapPin size={14} color={theme.colors.textSecondary} strokeWidth={2} />}>
            {[venueLabel(match.venueName), match.city].filter(Boolean).join(' · ')}
          </Row>
          <Row icon={<Users size={14} color={theme.colors.textSecondary} strokeWidth={2} />}>
            {`${match.participants.length}/${match.maxPlayers} · ${t(`matches.levels.${match.level}`)}`}
          </Row>

          {joined && !cancelled ? (
            <Text variant="label" color="primary" style={{ marginTop: theme.spacing.xxs }}>
              {match.organizerId === userId ? t('matches.organizerYou') : t('matches.joined')}
            </Text>
          ) : null}
        </View>
      </View>
    </Card>
  );
}

/** Ligne d'information : petite icône grise puis texte secondaire. */
function Row({ icon, children }: { icon: React.ReactNode; children: string }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
      {icon}
      <Text variant="caption" color="textSecondary" numberOfLines={1} style={{ flex: 1 }}>
        {children}
      </Text>
    </View>
  );
}
