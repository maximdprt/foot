/**
 * Paramètres (section 4.5) : liste en sections, séparateurs fins, chevrons.
 * Un visiteur ne voit que la version réduite : Apparence, Langue, Aide, À propos.
 */
import { router, type Href } from 'expo-router';
import {
  Bell,
  CircleQuestionMark,
  Info,
  Languages,
  Lock,
  Palette,
  Shield,
  UserRound,
} from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { View } from 'react-native';

import { Button, Card, ListItem, ListSection, Screen, ScreenHeader, Sheet, Text } from '@/components/ui';
import { signOut } from '@/features/auth/service';
import { useTranslation } from '@/i18n';
import { IS_DEMO_MODE } from '@/lib/backend';
import { selectIsAuthenticated, useSessionStore } from '@/store/sessionStore';
import { toast } from '@/store/uiStore';
import { useTheme } from '@/theme/ThemeProvider';

export default function SettingsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const isAuthenticated = useSessionStore(selectIsAuthenticated);
  const [logoutVisible, setLogoutVisible] = useState(false);

  const icon = (Icon: typeof Bell) => <Icon size={20} color={theme.colors.textSecondary} strokeWidth={2} />;
  const go = useCallback((path: string) => router.push(path as Href), []);

  const confirmLogout = useCallback(async () => {
    setLogoutVisible(false);
    await signOut();
    toast(t('toasts.loggedOut'), 'info');
    router.replace('/' as Href);
  }, [t]);

  return (
    <Screen>
      <ScreenHeader title={t('settings.title')} back size="compact" />

      {IS_DEMO_MODE ? (
        <Card tone="surface" size="sm" style={{ marginBottom: theme.sizes.sectionGap }}>
          <Text variant="caption" color="textSecondary">
            {t('common.demoMode')}
          </Text>
        </Card>
      ) : null}

      {isAuthenticated ? (
        <>
          <ListSection title={t('settings.sections.account')}>
            <ListItem
              title={t('settings.account.title')}
              icon={icon(Shield)}
              onPress={() => go('/settings/account')}
            />
          </ListSection>

          <ListSection title={t('settings.sections.profile')}>
            <ListItem
              title={t('settings.profile.title')}
              icon={icon(UserRound)}
              onPress={() => go('/settings/profile')}
            />
          </ListSection>
        </>
      ) : (
        <Card tone="soft" style={{ marginBottom: theme.sizes.sectionGap }}>
          <Text variant="body" color="textSecondary">
            {t('settings.guestHint')}
          </Text>
          <Button
            title={t('auth.signup')}
            onPress={() => router.push({ pathname: '/sign-in', params: { mode: 'signup' } } as Href)}
            style={{ marginTop: theme.spacing.lg }}
          />
        </Card>
      )}

      <ListSection title={t('settings.sections.appearance')}>
        <ListItem
          title={t('settings.appearance.title')}
          icon={icon(Palette)}
          onPress={() => go('/settings/appearance')}
        />
      </ListSection>

      {isAuthenticated ? (
        <>
          <ListSection title={t('settings.sections.notifications')}>
            <ListItem
              title={t('settings.notifications.title')}
              icon={icon(Bell)}
              onPress={() => go('/settings/notifications')}
            />
          </ListSection>

          <ListSection title={t('settings.sections.privacy')}>
            <ListItem
              title={t('settings.privacy.title')}
              icon={icon(Lock)}
              onPress={() => go('/settings/privacy')}
            />
          </ListSection>
        </>
      ) : null}

      <ListSection title={t('settings.sections.language')}>
        <ListItem
          title={t('settings.language.title')}
          icon={icon(Languages)}
          onPress={() => go('/settings/language')}
        />
      </ListSection>

      <ListSection title={t('settings.sections.help')}>
        <ListItem
          title={t('settings.help.title')}
          icon={icon(CircleQuestionMark)}
          onPress={() => go('/settings/help')}
        />
      </ListSection>

      <ListSection title={t('settings.sections.about')}>
        <ListItem
          title={t('settings.about.title')}
          icon={icon(Info)}
          onPress={() => go('/settings/about')}
        />
      </ListSection>

      {isAuthenticated ? (
        <View style={{ marginTop: theme.spacing.sm }}>
          <Button title={t('settings.logout')} variant="text" onPress={() => setLogoutVisible(true)} />
        </View>
      ) : null}

      <Sheet
        visible={logoutVisible}
        onClose={() => setLogoutVisible(false)}
        title={t('settings.logoutTitle')}
        subtitle={t('settings.logoutSubtitle')}
      >
        <View style={{ gap: theme.spacing.sm, paddingBottom: theme.spacing.sm }}>
          <Button title={t('settings.logout')} variant="danger" onPress={() => void confirmLogout()} />
          <Button title={t('common.cancel')} variant="text" onPress={() => setLogoutVisible(false)} />
        </View>
      </Sheet>
    </Screen>
  );
}
