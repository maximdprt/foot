/**
 * Détail d'un match : informations, participants, et l'action qui va avec le
 * rôle de l'utilisateur (rejoindre, quitter, ou annuler pour l'organisateur).
 */
import { router, useLocalSearchParams } from 'expo-router';
import { Clock, Goal, MapPin, Users } from 'lucide-react-native';
import React, { useState } from 'react';
import { View } from 'react-native';

import { Button, Card, Divider, EmptyState, Screen, ScreenHeader, Sheet, Text } from '@/components/ui';
import { cancelMatch, joinMatch, leaveMatch } from '@/features/data/service';
import { useRefresh, useRequireAuth, useUserId } from '@/features/data/useData';
import { useVenueLabel } from '@/features/matches/MatchCard';
import { canJoin, hasJoined, isFull, isPast, spotsLeft } from '@/features/matches/types';
import { PlayerRow } from '@/features/social/PlayerRow';
import { useTranslation } from '@/i18n';
import { formatDateTime, formatMinutes } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { useDataStore } from '@/store/dataStore';
import { toast } from '@/store/uiStore';
import { useTheme } from '@/theme/ThemeProvider';

export default function MatchDetailScreen() {
  const theme = useTheme();
  const { t, locale } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = useUserId();
  const requireAuth = useRequireAuth();
  const venueLabel = useVenueLabel();
  // Sans cela, un lien direct ou un rechargement laisserait le magasin vide et
  // l'écran afficherait « match introuvable » pour toujours.
  const { refreshing, refresh } = useRefresh();
  const loading = useDataStore((s) => s.loading);
  const match = useDataStore((s) => s.matches.find((item) => item.id === id));
  const [pending, setPending] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  if (!match) {
    return (
      <Screen onRefresh={refresh} refreshing={refreshing}>
        <ScreenHeader title={t('matches.title')} back size="compact" />
        {loading ? (
          <Text variant="body" color="textSecondary" align="center">
            {t('common.loading')}
          </Text>
        ) : (
          <EmptyState icon={Goal} title={t('matches.notFound')} subtitle={t('matches.notFoundHint')} />
        )}
      </Screen>
    );
  }

  const isOrganizer = match.organizerId === userId;
  const joined = hasJoined(match, userId);
  const past = isPast(match);
  const cancelled = match.status === 'cancelled';
  const left = spotsLeft(match);

  const run = async (action: () => Promise<unknown>, successKey?: string) => {
    setPending(true);
    try {
      await action();
      void haptics.success();
      if (successKey) toast(t(successKey), 'success');
    } catch {
      toast(t('common.error'), 'error');
    } finally {
      setPending(false);
    }
  };

  return (
    <Screen onRefresh={refresh} refreshing={refreshing}>
      <ScreenHeader
        title={t(`matches.formats.${match.format}`)}
        subtitle={t(`matches.levels.${match.level}`)}
        back
        size="compact"
      />

      <Card tone="surface" style={{ gap: theme.spacing.md }}>
        <InfoRow
          icon={<Clock size={18} color={theme.colors.primary} strokeWidth={2} />}
          label={t('matches.when')}
          value={`${formatDateTime(match.kickoffAt, locale)} · ${formatMinutes(match.durationMinutes, locale)}`}
        />
        <Divider />
        <InfoRow
          icon={<MapPin size={18} color={theme.colors.primary} strokeWidth={2} />}
          label={t('matches.venue')}
          value={[venueLabel(match.venueName), match.city].filter(Boolean).join(' · ')}
        />
        <Divider />
        <InfoRow
          icon={<Users size={18} color={theme.colors.primary} strokeWidth={2} />}
          label={t('matches.participants')}
          value={`${match.participants.length}/${match.maxPlayers}`}
        />
      </Card>

      <Text variant="caption" color="textSecondary" style={{ marginTop: theme.spacing.md }}>
        {isOrganizer
          ? t('matches.organizerYou')
          : t('matches.organizer', { name: match.organizerName ?? t('common.notSet') })}
      </Text>

      {match.notes ? (
        <Card tone="surface" size="sm" style={{ marginTop: theme.spacing.md }}>
          <Text variant="caption" color="textSecondary">
            {t('matches.notes')}
          </Text>
          <Text variant="body" style={{ marginTop: theme.spacing.xs }}>
            {match.notes}
          </Text>
        </Card>
      ) : null}

      <View style={{ marginTop: theme.sizes.sectionGap, gap: theme.spacing.sm }}>
        {cancelled ? (
          <Text variant="bodyBold" color="error">
            {t('matches.cancelled')}
          </Text>
        ) : past ? (
          <Text variant="bodyBold" color="textSecondary">
            {t('matches.past')}
          </Text>
        ) : canJoin(match, userId) ? (
          <Button
            title={t('matches.join')}
            glow
            loading={pending}
            onPress={() => requireAuth(() => void run(() => joinMatch(match.id), 'matches.joined'))}
          />
        ) : isFull(match) && !joined ? (
          <Text variant="bodyBold" color="textSecondary">
            {t('matches.full')}
          </Text>
        ) : null}

        {joined && !past && !cancelled && !isOrganizer ? (
          <Button
            title={t('matches.leave')}
            variant="secondary"
            loading={pending}
            onPress={() => void run(() => leaveMatch(match.id))}
          />
        ) : null}

        {isOrganizer && !past && !cancelled ? (
          <Button
            title={t('matches.cancelMatch')}
            variant="text"
            onPress={() => setConfirmCancel(true)}
          />
        ) : null}

        {!cancelled && !past && left > 0 ? (
          <Text variant="caption" color="textSecondary" align="center">
            {left === 1 ? t('matches.spotsLeft.one') : t('matches.spotsLeft.many', { count: left })}
          </Text>
        ) : null}
      </View>

      <Text variant="h3" style={{ marginTop: theme.sizes.sectionGap, marginBottom: theme.spacing.sm }}>
        {t('matches.participants')}
      </Text>
      <View>
        {match.participants.map((participant, index) => (
          <View key={participant.userId}>
            {index > 0 ? <Divider /> : null}
            <PlayerRow
              player={{
                userId: participant.userId,
                displayName: participant.displayName,
                avatarUrl: participant.avatarUrl,
                favoriteTeamId: participant.favoriteTeamId,
                city: match.city,
              }}
              action={
                participant.userId === match.organizerId ? (
                  <Text variant="label" color="primary">
                    {t('matches.organizer', { name: '' }).trim()}
                  </Text>
                ) : undefined
              }
            />
          </View>
        ))}
      </View>

      <Sheet
        visible={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        tone="danger"
        title={t('matches.cancelConfirmTitle')}
        subtitle={t('matches.cancelConfirmSubtitle')}
      >
        <View style={{ gap: theme.spacing.sm, paddingBottom: theme.spacing.sm }}>
          <Button
            title={t('matches.cancelMatch')}
            variant="danger"
            loading={pending}
            onPress={() => {
              setConfirmCancel(false);
              void run(() => cancelMatch(match.id)).then(() => router.back());
            }}
          />
          <Button title={t('common.cancel')} variant="text" onPress={() => setConfirmCancel(false)} />
        </View>
      </Sheet>
    </Screen>
  );
}

/** Ligne d'information : icône colorée, libellé discret, valeur lisible. */
function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
      {icon}
      <View style={{ flex: 1 }}>
        <Text variant="caption" color="textSecondary">
          {label}
        </Text>
        <Text variant="bodyBold">{value}</Text>
      </View>
    </View>
  );
}
