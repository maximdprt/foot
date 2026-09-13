/**
 * Écran unique de création de compte / connexion (section 4.2).
 * Segment en haut, Apple et Google en premier, puis email + mot de passe avec
 * validation en temps réel et messages d'erreur sous le champ.
 */
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { X } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { Animated, Platform, View } from 'react-native';

import { Logo } from '@/components/brand';
import {
  AppleGlyph,
  Button,
  Divider,
  GoogleGlyph,
  IconButton,
  Input,
  Screen,
  SegmentedControl,
  Text,
} from '@/components/ui';
import {
  authErrorKey,
  signInWithEmail,
  signInWithProvider,
  signUpWithEmail,
  type PostAuthRoute,
} from '@/features/auth/service';
import { APP_NAME } from '@/config/app';
import { stepAt } from '@/features/onboarding/steps';
import { useTranslation } from '@/i18n';
import { IS_DEMO_MODE } from '@/lib/backend';
import { useEntrance } from '@/lib/motion';
import { isValidEmail, isValidPassword } from '@/lib/validation';
import { useTheme } from '@/theme/ThemeProvider';

type Mode = 'signup' | 'login';

/** Nom lisible du fournisseur, injecté dans `auth.errors.providerUnavailable`. */
const PROVIDER_LABELS: Record<'email' | 'google' | 'apple', string> = {
  email: 'Email',
  google: 'Google',
  apple: 'Apple',
};

export default function SignInScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ mode?: string }>();

  const [mode, setMode] = useState<Mode>(params.mode === 'login' ? 'login' : 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState({ email: false, password: false });
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState<'email' | 'google' | 'apple' | null>(null);
  const brandIn = useEntrance({ duration: 460, scaleFrom: 0.9 });
  const formIn = useEntrance({ delay: 120, duration: 460 });

  const emailError =
    touched.email && email.length > 0 && !isValidEmail(email) ? t('auth.errors.emailInvalid') : null;
  const passwordError =
    touched.password && password.length > 0 && !isValidPassword(password)
      ? t('auth.errors.passwordTooShort')
      : null;
  const canSubmit = isValidEmail(email) && isValidPassword(password) && pending === null;

  const options = useMemo(
    () => [
      { key: 'signup' as const, label: t('auth.signup') },
      { key: 'login' as const, label: t('auth.login') },
    ],
    [t],
  );

  /** Destination après authentification : onboarding (reprise) ou app. */
  const go = useCallback((route: PostAuthRoute) => {
    if (route.kind === 'onboarding') router.replace(stepAt(route.step).path as Href);
    else router.replace('/' as Href);
  }, []);

  const run = useCallback(
    async (kind: 'email' | 'google' | 'apple', action: () => Promise<PostAuthRoute>) => {
      setFormError(null);
      setPending(kind);
      try {
        go(await action());
      } catch (error) {
        // `providerUnavailable` attend le nom du fournisseur ; les autres clés l'ignorent.
        setFormError(t(authErrorKey(error), { provider: PROVIDER_LABELS[kind] }));
      } finally {
        setPending(null);
      }
    },
    [go, t],
  );

  const submitEmail = useCallback(() => {
    setTouched({ email: true, password: true });
    if (!canSubmit) return;
    void run('email', () =>
      mode === 'signup' ? signUpWithEmail(email, password) : signInWithEmail(email, password),
    );
  }, [canSubmit, email, mode, password, run]);

  return (
    <Screen keyboard>
      <View style={{ alignItems: 'flex-end', paddingTop: theme.spacing.sm }}>
        <IconButton
          accessibilityLabel={t('common.close')}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/' as Href))}
        >
          <X size={24} color={theme.colors.text} strokeWidth={2} />
        </IconButton>
      </View>

      <Animated.View style={[{ alignItems: 'center', marginBottom: theme.spacing.lg }, brandIn]}>
        <Logo size={72} variant="gradient" accessibilityLabel={APP_NAME} />
      </Animated.View>

      <SegmentedControl
        options={options}
        value={mode}
        onChange={(next) => {
          setMode(next);
          setFormError(null);
        }}
        style={{ marginBottom: theme.sizes.sectionGap }}
      />

      <Animated.View style={[{ gap: theme.spacing.sm }, formIn]}>
        <Button
          title={t('auth.apple')}
          variant="secondary"
          icon={<AppleGlyph size={18} color={theme.colors.text} />}
          loading={pending === 'apple'}
          disabled={pending !== null}
          onPress={() => void run('apple', () => signInWithProvider('apple'))}
        />
        <Button
          title={t('auth.google')}
          variant="secondary"
          icon={<GoogleGlyph size={18} />}
          loading={pending === 'google'}
          disabled={pending !== null}
          onPress={() => void run('google', () => signInWithProvider('google'))}
        />
      </Animated.View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing.md,
          marginVertical: theme.sizes.sectionGap,
        }}
      >
        <Divider style={{ flex: 1 }} />
        <Text variant="caption" color="textSecondary">
          {t('auth.or')}
        </Text>
        <Divider style={{ flex: 1 }} />
      </View>

      <View style={{ gap: theme.spacing.lg }}>
        <Input
          label={t('auth.email')}
          value={email}
          onChangeText={setEmail}
          onBlur={() => setTouched((s) => ({ ...s, email: true }))}
          placeholder={t('auth.emailPlaceholder')}
          error={emailError}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect={false}
          textContentType="emailAddress"
        />
        <Input
          label={t('auth.password')}
          value={password}
          onChangeText={setPassword}
          onBlur={() => setTouched((s) => ({ ...s, password: true }))}
          placeholder={t('auth.passwordPlaceholder')}
          error={passwordError}
          secure
          autoCapitalize="none"
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          textContentType={mode === 'signup' ? 'newPassword' : 'password'}
          onSubmitEditing={submitEmail}
          returnKeyType="go"
        />
      </View>

      {formError ? (
        <Text
          variant="caption"
          color="error"
          accessibilityLiveRegion="polite"
          style={{ marginTop: theme.spacing.md }}
        >
          {formError}
        </Text>
      ) : null}

      <Button
        title={mode === 'signup' ? t('auth.submitSignup') : t('auth.submitLogin')}
        onPress={submitEmail}
        disabled={!canSubmit}
        loading={pending === 'email'}
        style={{ marginTop: theme.sizes.sectionGap }}
      />

      {mode === 'login' ? (
        <Button
          title={t('auth.forgotPassword')}
          variant="text"
          onPress={() => router.push('/forgot-password' as Href)}
          style={{ marginTop: theme.spacing.xs }}
        />
      ) : null}

      <Text
        variant="caption"
        color="textSecondary"
        align="center"
        style={{ marginTop: theme.spacing.lg }}
      >
        {t('auth.legalHint')}
      </Text>

      {IS_DEMO_MODE ? (
        <Text
          variant="caption"
          color="textSecondary"
          align="center"
          style={{ marginTop: theme.spacing.md }}
        >
          {t('common.demoMode')}
        </Text>
      ) : null}

      {Platform.OS === 'web' ? null : <View style={{ height: theme.spacing.xxl }} />}
    </Screen>
  );
}
