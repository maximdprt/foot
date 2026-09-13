/**
 * Onboarding — écran 0 : bienvenue.
 *
 * Écran de marque : fond pelouse en filigrane, logo, ballon 3D qui rebondit.
 * Aucune question ici, donc pas de barre de progression — c'est le seul écran
 * du parcours où l'on prend le temps de poser l'identité.
 */
import { router, type Href } from 'expo-router';
import React from 'react';
import { Animated, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Logo } from '@/components/brand';
import { Football3D, PitchBackground } from '@/components/motion';
import { Button, Text } from '@/components/ui';
import { APP_NAME } from '@/config/app';
import { stepAt } from '@/features/onboarding/steps';
import { useTranslation } from '@/i18n';
import { useEntrance } from '@/lib/motion';
import { useTheme } from '@/theme/ThemeProvider';

export default function WelcomeScreen() {
  const theme = useTheme();
  const { t } = useTranslation();

  // Entrée en cascade : logo, ballon, titre, sous-titre, durée, bouton.
  const logoIn = useEntrance({ duration: 520, from: -12 });
  const ballIn = useEntrance({ delay: 180, duration: 620, from: -40, scaleFrom: 0.6 });
  const titleIn = useEntrance({ delay: 320 });
  const subtitleIn = useEntrance({ delay: 400 });
  const durationIn = useEntrance({ delay: 480 });
  const ctaIn = useEntrance({ delay: 560, from: 24 });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <PitchBackground variant="pitch" intensity={0.03} stripes={10} />

      <View
        style={{
          flex: 1,
          paddingHorizontal: theme.sizes.screenPadding,
          alignItems: 'center',
          justifyContent: 'center',
          gap: theme.spacing.lg,
        }}
      >
        <Animated.View style={[{ marginBottom: theme.spacing.md }, logoIn]}>
          <Logo size={132} variant="gradient" accessibilityLabel={APP_NAME} />
        </Animated.View>

        <Animated.View style={titleIn}>
          <Text variant="h1" align="center">
            {t('onboarding.welcome.title', { app: APP_NAME })}
          </Text>
        </Animated.View>

        <Animated.View style={subtitleIn}>
          <Text variant="body" color="textSecondary" align="center">
            {t('onboarding.welcome.subtitle')}
          </Text>
        </Animated.View>

        <Animated.View style={durationIn}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: theme.spacing.sm,
              paddingHorizontal: theme.spacing.lg,
              paddingVertical: theme.spacing.sm,
              borderRadius: theme.radius.pill,
              backgroundColor: theme.colors.primarySoft,
            }}
          >
            <Text variant="caption" color="primary">
              {t('onboarding.welcome.duration')}
            </Text>
          </View>
        </Animated.View>
      </View>

      {/* Le ballon vit au ras du bouton, comme posé sur la ligne de touche. */}
      <Animated.View style={[{ alignItems: 'center' }, ballIn]}>
        <Football3D size={56} spinDuration={4200} bounce bounceHeight={18} shadow themed />
      </Animated.View>

      <Animated.View
        style={[
          {
            paddingHorizontal: theme.sizes.screenPadding,
            paddingTop: theme.spacing.lg,
            paddingBottom: theme.spacing.lg,
          },
          ctaIn,
        ]}
      >
        <Button
          title={t('onboarding.welcome.cta')}
          glow
          onPress={() => router.push(stepAt(1).path as Href)}
        />
      </Animated.View>
    </SafeAreaView>
  );
}
