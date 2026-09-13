/** « Mot de passe oublié » : envoi du lien de réinitialisation (section 4.2). */
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { View } from 'react-native';

import { Button, Input, Screen, ScreenHeader, Text } from '@/components/ui';
import { authErrorKey, sendPasswordReset } from '@/features/auth/service';
import { useTranslation } from '@/i18n';
import { isValidEmail } from '@/lib/validation';
import { useTheme } from '@/theme/ThemeProvider';

export default function ForgotPasswordScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState<string | null>(null);

  const emailError = touched && email.length > 0 && !isValidEmail(email) ? t('auth.errors.emailInvalid') : null;

  const submit = useCallback(async () => {
    setTouched(true);
    if (!isValidEmail(email)) return;
    setStatus('sending');
    setError(null);
    try {
      await sendPasswordReset(email);
      setStatus('sent');
    } catch (caught) {
      setError(t(authErrorKey(caught), { provider: 'Email' }));
      setStatus('idle');
    }
  }, [email, t]);

  return (
    <Screen keyboard>
      <ScreenHeader title={t('auth.forgot.title')} subtitle={t('auth.forgot.subtitle')} back size="compact" />

      <Input
        label={t('auth.email')}
        value={email}
        onChangeText={setEmail}
        onBlur={() => setTouched(true)}
        placeholder={t('auth.emailPlaceholder')}
        error={emailError}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
        textContentType="emailAddress"
        onSubmitEditing={() => void submit()}
        returnKeyType="go"
      />

      {error ? (
        <Text variant="caption" color="error" style={{ marginTop: theme.spacing.md }}>
          {error}
        </Text>
      ) : null}

      {status === 'sent' ? (
        <View style={{ marginTop: theme.sizes.sectionGap }}>
          <Text variant="body" accessibilityLiveRegion="polite">
            {t('auth.forgot.sent')}
          </Text>
          <Button
            title={t('common.ok')}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            style={{ marginTop: theme.spacing.lg }}
          />
        </View>
      ) : (
        <Button
          title={t('auth.forgot.submit')}
          onPress={() => void submit()}
          disabled={!isValidEmail(email)}
          loading={status === 'sending'}
          style={{ marginTop: theme.sizes.sectionGap }}
        />
      )}
    </Screen>
  );
}
