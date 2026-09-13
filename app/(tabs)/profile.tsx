/**
 * Onglet Profil : bandeau supérieur en dégradé (≤ 120 px, seule zone où la
 * couleur du club couvre le fond), accès aux Paramètres par l'engrenage,
 * puis état vide et tuiles comme les autres onglets.
 *
 * Le bandeau est inclinable : il réagit au doigt en 3D, avec le logo en
 * filigrane et les tracés du terrain à l'intérieur.
 */
import { router, type Href } from 'expo-router';
import { Activity, Award, RotateCcw, Settings, Shield, Trophy } from 'lucide-react-native';
import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { Logo } from '@/components/brand';
import { PitchBackground, TiltCard } from '@/components/motion';
import {
  Avatar,
  Button,
  Card,
  EmptyState,
  Gradient,
  IconButton,
  Screen,
  ScreenHeader,
  TeamDot,
  Text,
  Tile,
  TileGrid,
} from '@/components/ui';
import { useTranslation } from '@/i18n';
import { useEntrance } from '@/lib/motion';
import { useProfileStore } from '@/store/profileStore';
import { selectIsAuthenticated, useSessionStore } from '@/store/sessionStore';
import { useThemeStore } from '@/store/themeStore';
import { useUIStore } from '@/store/uiStore';
import { getTeam, getTeamDisplayName } from '@/theme/teams';
import { useTheme } from '@/theme/ThemeProvider';

export default function ProfileScreen() {
  const theme = useTheme();
  const { t, locale } = useTranslation();
  const isAuthenticated = useSessionStore(selectIsAuthenticated);
  const profile = useProfileStore((s) => s.profile);
  const draft = useProfileStore((s) => s.draft);
  const favoriteTeamId = useThemeStore((s) => s.favoriteTeamId);
  const showAuthGate = useUIStore((s) => s.showAuthGate);

  const bannerIn = useEntrance({ duration: 520, scaleFrom: 0.97 });
  const identityIn = useEntrance({ delay: 140 });
  const tilesIn = useEntrance({ delay: 260 });

  const team = getTeam(favoriteTeamId);
  const displayName = profile?.displayName ?? draft.displayName ?? null;
  const avatarUrl = profile?.avatarUrl ?? draft.avatarUrl ?? null;
  const iconColor = theme.colors.onPrimary;

  return (
    <Screen>
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

      <EmptyState icon={Activity} title={t('profile.emptyTitle')} />

      <Animated.View style={[{ marginTop: theme.sizes.sectionGap }, tilesIn]}>
        <TileGrid>
          {[
            <Tile
              key="stats"
              title={t('profile.tiles.stats')}
              caption={t('common.soon')}
              icon={<Trophy size={24} color={iconColor} strokeWidth={2} />}
              onPress={showAuthGate}
            />,
            <Tile
              key="badges"
              title={t('profile.tiles.badges')}
              caption={t('common.soon')}
              icon={<Award size={24} color={iconColor} strokeWidth={2} />}
              onPress={showAuthGate}
            />,
            <Tile
              key="history"
              title={t('profile.tiles.history')}
              caption={t('common.soon')}
              icon={<RotateCcw size={24} color={iconColor} strokeWidth={2} />}
              onPress={showAuthGate}
            />,
            <Tile
              key="team"
              title={t('profile.tiles.team')}
              caption={t('common.soon')}
              icon={<Shield size={24} color={iconColor} strokeWidth={2} />}
              onPress={showAuthGate}
            />,
          ]}
        </TileGrid>
      </Animated.View>
    </Screen>
  );
}
