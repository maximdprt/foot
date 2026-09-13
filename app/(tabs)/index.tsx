/**
 * Onglet Home. Aucune logique métier : l'écran montre la direction artistique
 * (en-tête de marque, carte visiteur, état vide, tuiles) avec les composants du
 * design system.
 */
import { router, type Href } from 'expo-router';
import { Dumbbell, Goal, MapPin, Newspaper, Users } from 'lucide-react-native';
import React from 'react';
import { Animated, View } from 'react-native';

import { Logo } from '@/components/brand';
import { PitchBackground } from '@/components/motion';
import { Button, Card, EmptyState, Screen, ScreenHeader, Text, Tile, TileGrid } from '@/components/ui';
import { useTranslation } from '@/i18n';
import { useEntrance, usePulse } from '@/lib/motion';
import { useProfileStore } from '@/store/profileStore';
import { selectIsAuthenticated, useSessionStore } from '@/store/sessionStore';
import { useUIStore } from '@/store/uiStore';
import { useTheme } from '@/theme/ThemeProvider';

export default function HomeScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const isAuthenticated = useSessionStore(selectIsAuthenticated);
  const displayName = useProfileStore((s) => s.profile?.displayName ?? s.draft.displayName ?? null);
  const showAuthGate = useUIStore((s) => s.showAuthGate);

  const cardIn = useEntrance({ delay: 80 });
  const emptyIn = useEntrance({ delay: 160 });
  const tilesIn = useEntrance({ delay: 240 });

  const greeting =
    isAuthenticated && displayName ? t('home.greeting', { name: displayName }) : t('home.greetingGuest');

  return (
    <Screen padded={false}>
      <HeroHeader greeting={greeting} />

      <View style={{ paddingHorizontal: theme.sizes.screenPadding }}>
        {isAuthenticated ? null : (
          <Animated.View style={cardIn}>
            <VisitorCard />
          </Animated.View>
        )}

        <Animated.View style={emptyIn}>
          <EmptyState icon={Newspaper} title={t('home.emptyTitle')} animate={false} />
        </Animated.View>

        <Animated.View style={[{ marginTop: theme.sizes.sectionGap }, tilesIn]}>
          <Text variant="h3" style={{ marginBottom: theme.spacing.md }}>
            {t('home.shortcuts')}
          </Text>
          <TileGrid>
            {[
              <Tile
                key="matches"
                title={t('home.tiles.matches')}
                caption={t('common.soon')}
                icon={<Goal size={24} color={theme.colors.onPrimary} strokeWidth={2} />}
                onPress={showAuthGate}
              />,
              <Tile
                key="sessions"
                title={t('home.tiles.sessions')}
                caption={t('common.soon')}
                icon={<Dumbbell size={24} color={theme.colors.onPrimary} strokeWidth={2} />}
                onPress={showAuthGate}
              />,
              <Tile
                key="friends"
                title={t('home.tiles.friends')}
                caption={t('common.soon')}
                icon={<Users size={24} color={theme.colors.onPrimary} strokeWidth={2} />}
                onPress={showAuthGate}
              />,
              <Tile
                key="pitches"
                title={t('home.tiles.pitches')}
                caption={t('common.soon')}
                icon={<MapPin size={24} color={theme.colors.onPrimary} strokeWidth={2} />}
                onPress={showAuthGate}
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
 * logo en filigrane qui dérive très lentement — assez pour que l'écran respire,
 * assez peu pour ne jamais tirer l'œil hors du contenu.
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
