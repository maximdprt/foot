/**
 * Onglet Profil : bandeau supérieur en dégradé (≤ 120 px, seule zone où la
 * couleur du club couvre le fond), accès aux Paramètres par l'engrenage,
 * puis état vide et tuiles comme les autres onglets.
 *
 * Le bandeau est inclinable : il réagit au doigt en 3D, avec le logo en
 * filigrane et les tracés du terrain à l'intérieur.
 */
import { router, type Href } from 'expo-router';
import { Settings } from 'lucide-react-native';
import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { Logo } from '@/components/brand';
import { PitchBackground, TiltCard } from '@/components/motion';
import {
  Avatar,
  Button,
  Card,
  Gradient,
  IconButton,
  Screen,
  ScreenHeader,
  StatTile,
  TeamDot,
  Text,
} from '@/components/ui';
import { useRefresh, usePlayerStats } from '@/features/data/useData';
import { BadgeGrid } from '@/features/profile/BadgeGrid';
import { sortedBadges } from '@/features/profile/stats';
import { useTranslation } from '@/i18n';
import { useEntrance } from '@/lib/motion';
import { useProfileStore } from '@/store/profileStore';
import { selectIsAuthenticated, useSessionStore } from '@/store/sessionStore';
import { useThemeStore } from '@/store/themeStore';
import { getTeam, getTeamDisplayName } from '@/theme/teams';
import { useTheme } from '@/theme/ThemeProvider';

export default function ProfileScreen() {
  const theme = useTheme();
  const { t, locale } = useTranslation();
  const isAuthenticated = useSessionStore(selectIsAuthenticated);
  const profile = useProfileStore((s) => s.profile);
  const draft = useProfileStore((s) => s.draft);
  const favoriteTeamId = useThemeStore((s) => s.favoriteTeamId);
  const { refreshing, refresh } = useRefresh();
  const stats = usePlayerStats();
  const badges = sortedBadges(stats);
  const earned = badges.filter((badge) => badge.earned).length;

  const bannerIn = useEntrance({ duration: 520, scaleFrom: 0.97 });
  const identityIn = useEntrance({ delay: 140 });
  const statsIn = useEntrance({ delay: 260 });

  const team = getTeam(favoriteTeamId);
  const displayName = profile?.displayName ?? draft.displayName ?? null;
  const avatarUrl = profile?.avatarUrl ?? draft.avatarUrl ?? null;

  return (
    <Screen onRefresh={refresh} refreshing={refreshing}>
      <ScreenHeader
        title={t('profile.title')}
        right={
          <IconButton
            accessibilityLabel={t('profile.settings')}
            onPress={() => router.push('/settings' as Href)}
          >
            <Settings size={24} color={theme.colors.text} strokeWidth={2} />
          </IconButton>
        }
      />

      <Animated.View style={bannerIn}>
        <TiltCard maxTilt={10}>
          <View
            style={{
              height: theme.sizes.profileBannerHeight,
              borderRadius: theme.radius.lg,
              overflow: 'hidden',
            }}
          >
            <Gradient style={StyleSheet.absoluteFill} />
            {/* Tracés du terrain dans la couleur de contraste, très discrets. */}
            <PitchBackground variant="pitch" intensity={0.05} stripes={8} sweep={false} />
            <View style={{ position: 'absolute', right: theme.spacing.lg, top: -8, opacity: 0.22 }}>
              <Logo size={140} color="onPrimary" />
            </View>
          </View>
        </TiltCard>
      </Animated.View>

      <Animated.View style={identityIn}>
        <View style={{ marginTop: -theme.sizes.avatarLg / 2, paddingLeft: theme.spacing.lg }}>
          <Avatar uri={avatarUrl} name={displayName} size={theme.sizes.avatarLg} ring glow />
        </View>

        <View style={{ marginTop: theme.spacing.md }}>
          <Text variant="h2">{displayName ?? t('profile.guestTitle')}</Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: theme.spacing.sm,
              marginTop: theme.spacing.xs,
            }}
          >
            <TeamDot team={team} size={20} />
            <Text variant="caption" color="textSecondary">
              {team.id === 'none' ? t('profile.noTeam') : getTeamDisplayName(team, locale)}
            </Text>
          </View>
        </View>
      </Animated.View>

      {isAuthenticated ? null : (
        <Card tone="soft" style={{ marginTop: theme.sizes.sectionGap }}>
          <Text variant="body" color="textSecondary">
            {t('profile.guestSubtitle')}
          </Text>
          <Button
            title={t('home.visitorCard.create')}
            onPress={() => router.push({ pathname: '/sign-in', params: { mode: 'signup' } } as Href)}
            style={{ marginTop: theme.spacing.lg }}
          />
        </Card>
      )}

      <Animated.View style={[{ marginTop: theme.sizes.sectionGap }, statsIn]}>
        <Text variant="h3" style={{ marginBottom: theme.spacing.md }}>
          {t('profile.statsTitle')}
        </Text>

        <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
          <StatTile label={t('profile.stats.matchesPlayed')} value={stats.matchesPlayed} highlight />
          <StatTile label={t('profile.stats.sessionsCompleted')} value={stats.sessionsCompleted} />
          <StatTile label={t('profile.stats.friends')} value={stats.friends} />
        </View>
        <View style={{ flexDirection: 'row', gap: theme.spacing.md, marginTop: theme.spacing.md }}>
          <StatTile
            label={t('profile.stats.trainingMinutes')}
            value={stats.trainingMinutes}
            suffix={` ${t('common.min')}`}
          />
          <StatTile label={t('profile.stats.bestStreakDays')} value={stats.bestStreakDays} />
          <StatTile label={t('profile.stats.bookings')} value={stats.bookings} />
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            marginTop: theme.sizes.sectionGap,
            marginBottom: theme.spacing.md,
          }}
        >
          <Text variant="h3">{t('profile.badgesTitle')}</Text>
          <Text variant="caption" color="textSecondary">
            {t('profile.badgesEarned', { earned, total: badges.length })}
          </Text>
        </View>
        <BadgeGrid badges={badges} />
      </Animated.View>
    </Screen>
  );
}
