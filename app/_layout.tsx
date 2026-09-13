/**
 * Racine de l'application.
 *
 * Enchaînement au démarrage : chargement d'Inter + réhydratation des stores
 * persistés (le splash reste affiché pour éviter un flash de thème Neutre) →
 * restauration de la session → rendu de la navigation.
 *
 * Aucune couleur ni texte en dur : tout vient de `useTheme()` et de l'i18n.
 */
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack, router, type Href } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthGateSheet } from '@/components/AuthGateSheet';
import { BootScreen } from '@/components/brand';
import { ThemeApplyOverlay } from '@/components/ThemeApplyOverlay';
import { ToastHost } from '@/components/ui';
import { bootstrapSession, subscribeToSession } from '@/features/auth/service';
import { stepAt } from '@/features/onboarding/steps';
import { useStoresHydrated } from '@/store/hydration';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });
  const hydrated = useStoresHydrated();
  const [sessionReady, setSessionReady] = useState(false);
  const resumeRoute = useRef<Href | null>(null);

  // Restauration de la session (et reprise de l'onboarding le cas échéant).
  useEffect(() => {
    if (!hydrated) return undefined;
    let cancelled = false;
    void bootstrapSession()
      .then((route) => {
        if (cancelled) return;
        if (route?.kind === 'onboarding') resumeRoute.current = stepAt(route.step).path as Href;
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setSessionReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [hydrated]);

  // Changements de session hors écran de connexion (retour OAuth, jeton expiré).
  useEffect(() => subscribeToSession(() => undefined), []);

  // Inter indisponible (réseau, cache vide) : on démarre quand même avec la police système.
  const ready = hydrated && sessionReady && (fontsLoaded || Boolean(fontError));

  // Le splash natif laisse la place à l'écran de démarrage animé dès que le
  // thème est connu : le raccord se fait sur le même fond blanc, sans coupure.
  const onLayout = useCallback(() => {
    if (!hydrated) return;
    void SplashScreen.hideAsync();
  }, [hydrated]);

  // La reprise d'onboarding attend la fin de l'écran de démarrage : sinon la
  // navigation se ferait derrière le voile, et l'écran d'arrivée serait déjà passé.
  const handleBootFinished = useCallback(() => {
    if (!resumeRoute.current) return;
    const target = resumeRoute.current;
    resumeRoute.current = null;
    router.replace(target);
  }, []);

  if (!hydrated) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider fontsLoaded={Boolean(fontsLoaded)}>
          <AppShell onLayout={onLayout} ready={ready} onBootFinished={handleBootFinished} />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

interface AppShellProps {
  onLayout: () => void;
  /** Polices, stores et session sont tous prêts. */
  ready: boolean;
  onBootFinished: () => void;
}

/** Coquille rendue sous le `ThemeProvider` : la navigation prend les couleurs du thème. */
function AppShell({ onLayout, ready, onBootFinished }: AppShellProps) {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }} onLayout={onLayout}>
      <StatusBar style={theme.meta.mode === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="(onboarding)" options={{ gestureEnabled: false }} />
        <Stack.Screen name="settings" />
        <Stack.Screen name="matches" />
        <Stack.Screen name="training" />
      </Stack>
      <ToastHost />
      <AuthGateSheet />
      <ThemeApplyOverlay />
      <BootScreen ready={ready} onFinish={onBootFinished} />
    </View>
  );
}
