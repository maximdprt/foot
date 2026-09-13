/**
 * Liste des matchs : ceux qu'on peut rejoindre près de chez soi, et les siens.
 */
import { router, type Href } from 'expo-router';
import { Goal, Plus } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Animated, View } from 'react-native';

import { Button, EmptyState, Screen, ScreenHeader, SegmentedControl } from '@/components/ui';
import { useRefresh, useRequireAuth, useUserId } from '@/features/data/useData';
import { MatchCard } from '@/features/matches/MatchCard';
import { canJoin, hasJoined, isPast, type Match } from '@/features/matches/types';
import { useTranslation } from '@/i18n';
import { staggerDelay, useEntrance } from '@/lib/motion';
import { useDataStore } from '@/store/dataStore';
import { useTheme } from '@/theme/ThemeProvider';

type Tab = 'open' | 'mine';

export default function MatchesScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const userId = useUserId();
  const matches = useDataStore((s) => s.matches);
  const { refreshing, refresh } = useRefresh();
  const requireAuth = useRequireAuth();
  const [tab, setTab] = useState<Tab>('open');

  // `canJoin` et `isPast` lisent l'heure eux-mêmes : pas d'appel impur ici.
  const { open, mine } = useMemo(
    () => ({
      open: matches.filter(
        (match) =>
          canJoin(match, userId) || (!userId && match.status === 'open' && !isPast(match)),
      ),
      mine: matches.filter((match) => hasJoined(match, userId)),
    }),
    [matches, userId],
  );

  const shown = tab === 'open' ? open : mine;

  return (
    <Screen onRefresh={refresh} refreshing={refreshing}>
      <ScreenHeader
        title={t('matches.title')}
        back
        size="compact"
        right={
          <Button
            title={t('common.add')}
            variant="text"
            fullWidth={false}
            icon={<Plus size={18} color={theme.colors.primary} strokeWidth={2.5} />}
            onPress={() => requireAuth(() => router.push('/matches/new' as Href))}
          />
        }
      />

      <SegmentedControl
        options={[
          { key: 'open' as const, label: t('matches.tabs.open') },
          { key: 'mine' as const, label: t('matches.tabs.mine') },
        ]}
        value={tab}
        onChange={setTab}
        style={{ marginBottom: theme.sizes.sectionGap }}
      />

      {shown.length === 0 ? (
        <>
          <EmptyState
            icon={Goal}
            title={tab === 'open' ? t('matches.emptyOpen') : t('matches.emptyMine')}
            subtitle={tab === 'open' ? t('matches.emptyOpenHint') : undefined}
          />
          <Button
            title={t('matches.create')}
            onPress={() => requireAuth(() => router.push('/matches/new' as Href))}
          />
        </>
      ) : (
        <View style={{ gap: theme.spacing.md }}>
          {shown.map((match, index) => (
            <StaggeredCard key={match.id} index={index} match={match} userId={userId} />
          ))}
        </View>
      )}
    </Screen>
  );
}

/** Une carte qui entre avec le décalage de son rang dans la liste. */
function StaggeredCard({
  index,
  match,
  userId,
}: {
  index: number;
  match: Match;
  userId: string | null;
}) {
  const entrance = useEntrance({ delay: staggerDelay(index), from: 14 });
  return (
    <Animated.View style={entrance}>
      <MatchCard
        match={match}
        userId={userId}
        onPress={() => router.push(`/matches/${match.id}` as Href)}
      />
    </Animated.View>
  );
}
