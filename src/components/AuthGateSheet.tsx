/**
 * Bottom sheet « Connecte-toi pour continuer » (section 4.1).
 * Montée une seule fois à la racine ; toute action nécessitant un compte
 * appelle `useUIStore.getState().showAuthGate()`.
 */
import { router, type Href } from 'expo-router';
import React, { useCallback } from 'react';
import { View } from 'react-native';

import { Button, Sheet } from '@/components/ui';
import { useTranslation } from '@/i18n';
import { useUIStore } from '@/store/uiStore';
import { useTheme } from '@/theme/ThemeProvider';

export function AuthGateSheet() {
  const theme = useTheme();
  const { t } = useTranslation();
  const visible = useUIStore((s) => s.authGateVisible);
  const hide = useUIStore((s) => s.hideAuthGate);

  const go = useCallback(
    (mode: 'signup' | 'login') => {
      hide();
      router.push({ pathname: '/sign-in', params: { mode } } as Href);
    },
    [hide],
  );

  return (
    <Sheet
      visible={visible}
      onClose={hide}
      title={t('auth.gate.title')}
      subtitle={t('auth.gate.subtitle')}
    >
      <View style={{ gap: theme.spacing.sm, paddingBottom: theme.spacing.sm }}>
        <Button title={t('auth.gate.signup')} onPress={() => go('signup')} />
        <Button title={t('auth.gate.login')} variant="secondary" onPress={() => go('login')} />
        <Button title={t('common.cancel')} variant="text" onPress={hide} />
      </View>
    </Sheet>
  );
}
