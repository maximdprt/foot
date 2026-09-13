/**
 * Onglet Home : le tableau de bord.
 *
 * Trois questions, dans cet ordre : quand est-ce que je rejoue, qu'est-ce que
 * je fais aujourd'hui, et que font les autres. Les raccourcis viennent après —
 * ils servent quand rien de tout cela n'est en cours.
 */
import { router, type Href } from 'expo-router';
import { CalendarPlus, Dumbbell, Flame, Goal, MapPin, Users } from 'lucide-react-native';
import React from 'react';
import { Animated, View } from 'react-native';

import { Logo } from '@/components/brand';
import { PitchBackground } from '@/components/motion';
import {
  Button,
  Card,
  Screen,
  ScreenHeader,
  StatTile,
  Text,
  Tile,
  TileGrid,
} from '@/components/ui';
import { currentCity } from '@/features/data/service';
import { useRefresh, useRequireAuth, usePlayerStats, useUserId } from '@/features/data/useData';
import { MatchCard } from '@/features/matches/MatchCard';
import { nextMatchFor } from '@/features/matches/types';
import { EXERCISES, programsForLevel } from '@/features/training/catalogue';
import { programDuration } from '@/features/training/types';
import { useTranslation } from '@/i18n';
import { formatMinutes, formatRelative } from '@/lib/format';
import { useEntrance, usePulse } from '@/lib/motion';
import { useDataStore } from '@/store/dataStore';
import { useProfileStore } from '@/store/profileStore';
import { selectIsAuthenticated, useSessionStore } from '@/store/sessionStore';
import { useTheme } from '@/theme/ThemeProvider';

export default function HomeScreen() {
  const theme = useTheme();
  const { t, locale } = useTranslation();
  const userId = useUserId();
  const isAuthenticated = useSessionStore(selectIsAuthenticated);
  const displayName = useProfileStore((s) => s.profile?.displayName ?? s.draft.displayName ?? null);
  const level = useProfileStore((s) => s.draft.level ?? s.profile?.level ?? null);
  const matches = useDataStore((s) => s.matches);
  const activity = useDataStore((s) => s.activity);
  const stats = usePlayerStats();
  const { refreshing, refresh } = useRefresh();
  const requireAuth = useRequireAuth();

  const cardIn = useEntrance({ delay: 80 });
  const sessionIn = useEntrance({ delay: 160 });
  const activityIn = useEntrance({ delay: 240 });
  const tilesIn = useEntrance({ delay: 320 });

  const greeting =
    isAuthenticated && displayName
      ? t('home.greeting', { name: displayName })
      : t('home.greetingGuest');

  const nextMatch = nextMatchFor(matches, userId);
  // Le programme mis en avant est le premier de la liste triée par niveau.
  const suggested = programsForLevel(level)[0];
  const suggestedMinutes = suggested ? Math.round(programDuration(suggested, EXERCISES) / 60) : 0;

  return (
    <Screen padded={false} onRefresh={refresh} refreshing={refreshing}>
      <HeroHeader greeting={greeting} />

      <View style={{ paddingHorizontal: theme.sizes.screenPadding }}>
        {isAuthenticated ? null : (
          <Animated.View style={cardIn}>
            <VisitorCard />
          </Animated.View>
        )}

        {/* 1. Le prochain match */}
        <Animated.View style={cardIn}>
          <Text variant="h3" style={{ marginBottom: theme.spacing.md }}>
            {t('home.nextMatch')}
          </Text>
          {nextMatch ? (
            <MatchCard
              match={nextMatch}
              userId={userId}
              onPress={() => router.push(`/matches/${nextMatch.id}` as Href)}
            />
          ) : (
            <Card tone="surface">
              <Text variant="bodyBold">{t('home.noMatchTitle')}</Text>
              <Text variant="caption" color="textSecondary" style={{ marginTop: theme.spacing.xxs }}>
                {t('home.noMatchSubtitle')}
              </Text>
              <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.lg }}>
                <Button
                  title={t('home.findMatch')}
                  size="md"
                  style={{ flex: 1 }}
                  onPress={() => router.push('/matches' as Href)}
                />
                <Button
                  title={t('home.createMatch')}
                  variant="secondary"
                  size="md"
                  style={{ flex: 1 }}
                  onPress={() => requireAuth(() => router.push('/matches/new' as Href))}
                />
              </View>
            </Card>
          )}
        </Animated.View>

        {/* 2. La séance du jour */}
        {suggested ? (
          <Animated.View style={[{ marginTop: theme.sizes.sectionGap }, sessionIn]}>
            <Text variant="h3" style={{ marginBottom: theme.spacing.md }}>
              {t('home.todaySession')}
            </Text>
            {/*
              La carte n'est pas pressable : elle contient déjà deux boutons, et
              imbriquer des zones tappables donne un DOM invalide sur le web
              comme une cible ambiguë sur mobile.
            */}
            <Card tone="soft">
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
                <Dumbbell size={22} color={theme.colors.primary} strokeWidth={2} />
                <View style={{ flex: 1 }}>
                  <Text variant="bodyBold">{t(suggested.nameKey)}</Text>
                  <Text variant="caption" color="textSecondary">
                    {formatMinutes(suggestedMinutes, locale)}
                  </Text>
                </View>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: theme.spacing.sm,
                  marginTop: theme.spacing.md,
                }}
              >
                <Flame size={14} color={theme.colors.primary} strokeWidth={2} />
                <Text variant="caption" color="primary">
                  {stats.currentStreakDays === 0
                    ? t('home.streak.none')
                    : stats.currentStreakDays === 1
                      ? t('home.streak.one')
                      : t('home.streak.many', { count: stats.currentStreakDays })}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.lg }}>
                <Button
                  title={t('home.startSession')}
                  size="md"
                  style={{ flex: 1 }}
                  onPress={() =>
                    requireAuth(() => router.push(`/training/session/${suggested.id}` as Href))
                  }
                />
                <Button
                  title={t('common.seeAll')}
                  variant="secondary"
                  size="md"
                  style={{ flex: 1 }}
                  onPress={() => router.push(`/training/${suggested.id}` as Href)}
                />
              </View>
            </Card>
          </Animated.View>
        ) : null}

        {/* 3. Ce que font les autres */}
        <Animated.View style={[{ marginTop: theme.sizes.sectionGap }, activityIn]}>
          <Text variant="h3" style={{ marginBottom: theme.spacing.md }}>
            {t('home.activityTitle')}
          </Text>
          {activity.length === 0 ? (
            <Card tone="surface" size="sm">
              <Text variant="caption" color="textSecondary">
                {t('home.activityEmpty')}
              </Text>
            </Card>
          ) : (
            <View style={{ gap: theme.spacing.sm }}>
              {activity.slice(0, 3).map((item) => (
                <Card key={item.id} tone="surface" size="sm" padding={theme.spacing.md}>
                  <Text variant="body" numberOfLines={2}>
                    {t(`social.events.${item.kind}`, {
                      name: item.actor.displayName ?? t('common.notSet'),
                    })}
                  </Text>
                  <Text variant="caption" color="textSecondary" style={{ marginTop: 2 }}>
                    {formatRelative(item.at, locale)}
                  </Text>
                </Card>
              ))}
            </View>
          )}
        </Animated.View>

        {/* 4. Le mois écoulé, puis les raccourcis */}
        {isAuthenticated ? (
          <Animated.View style={[{ marginTop: theme.sizes.sectionGap }, tilesIn]}>
            <Text variant="h3" style={{ marginBottom: theme.spacing.md }}>
              {t('home.statsTitle')}
            </Text>
            <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
              <StatTile label={t('profile.stats.matchesPlayed')} value={stats.matchesPlayed} highlight />
              <StatTile label={t('profile.stats.sessionsCompleted')} value={stats.sessionsCompleted} />
              <StatTile label={t('profile.stats.friends')} value={stats.friends} />
            </View>
          </Animated.View>
        ) : null}

        <Animated.View style={[{ marginTop: theme.sizes.sectionGap }, tilesIn]}>
          <Text variant="h3" style={{ marginBottom: theme.spacing.md }}>
            {t('home.shortcuts')}
          </Text>
          <TileGrid>
            {[
              <Tile
                key="matches"
                title={t('home.tiles.matches')}
                icon={<Goal size={24} color={theme.colors.onPrimary} strokeWidth={2} />}
                onPress={() => router.push('/matches' as Href)}
              />,
              <Tile
                key="sessions"
                title={t('home.tiles.sessions')}
                icon={<Dumbbell size={24} color={theme.colors.onPrimary} strokeWidth={2} />}
                onPress={() => router.push('/training' as Href)}
              />,
              <Tile
                key="friends"
                title={t('home.tiles.friends')}
                icon={<Users size={24} color={theme.colors.onPrimary} strokeWidth={2} />}
                onPress={() => router.push('/social' as Href)}
              />,
              <Tile
                key="pitches"
                title={t('home.tiles.pitches')}
                caption={currentCity() ?? undefined}
                icon={<MapPin size={24} color={theme.colors.onPrimary} strokeWidth={2} />}
                onPress={() => router.push('/booking' as Href)}
              />,
            ]}
          </TileGrid>
        </Animated.View>
      </View>
    </Screen>
  );
}

/**
 * En-tête de marque : la salutation sur une trame de pelouse à 2,5 %, avec le
 * logo en filigrane qui dérive très lentement.
 */
function HeroHeader({ greeting }: { greeting: string }) {
  const theme = useTheme();
  const titleIn = useEntrance({ duration: 460 });
  const drift = usePulse(9000);

  const floatY = drift.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });
  const floatOpacity = drift.interpolate({ inputRange: [0, 1], outputRange: [0.05, 0.09] });

  return (
    <View
      style={{
        paddingHorizontal: theme.sizes.screenPadding,
        paddingBottom: theme.spacing.xl,
        overflow: 'hidden',
      }}
    >
      <PitchBackground intensity={0.025} stripes={10} />

      <Animated.View
        style={{
          position: 'absolute',
          pointerEvents: 'none',
          right: -26,
          top: -16,
          opacity: floatOpacity,
          transform: [{ translateY: floatY }],
        }}
      >
        <Logo size={180} variant="outline" />
      </Animated.View>

      <Animated.View style={titleIn}>
        <ScreenHeader title={greeting} style={{ paddingBottom: 0 }} />
      </Animated.View>
    </View>
  );
}

/** Carte discrète proposée au visiteur en haut de Home (section 4.1). */
function VisitorCard() {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <Card tone="soft" style={{ marginBottom: theme.sizes.sectionGap }}>
      <Text variant="h3">{t('home.visitorCard.title')}</Text>
      <Text variant="body" color="textSecondary" style={{ marginTop: theme.spacing.xs }}>
        {t('home.visitorCard.subtitle')}
      </Text>
      <Button
        title={t('home.visitorCard.create')}
        glow
        icon={<CalendarPlus size={18} color={theme.colors.onPrimary} strokeWidth={2} />}
        onPress={() => router.push({ pathname: '/sign-in', params: { mode: 'signup' } } as Href)}
        style={{ marginTop: theme.spacing.lg }}
      />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: theme.spacing.xs }}>
        <Button
          title={t('home.visitorCard.login')}
          variant="text"
          fullWidth={false}
          onPress={() => router.push({ pathname: '/sign-in', params: { mode: 'login' } } as Href)}
        />
        <Button
          title={t('home.visitorCard.settings')}
          variant="text"
          fullWidth={false}
          onPress={() => router.push('/settings' as Href)}
        />
      </View>
    </Card>
  );
}
