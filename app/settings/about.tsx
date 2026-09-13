/**
 * Paramètres > À propos : version (5 taps ouvrent l'écran de debug thème,
 * section 6.2), CGU, politique de confidentialité, licences open source.
 */
import { router, type Href } from 'expo-router';
import { FileText, Info, Scale } from 'lucide-react-native';
import React, { useCallback, useRef, useState } from 'react';

import { ListItem, ListSection, Screen, ScreenHeader, Text } from '@/components/ui';
import { APP_NAME, APP_VERSION, DEBUG_TAP_COUNT } from '@/config/app';
import { useTranslation } from '@/i18n';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/theme/ThemeProvider';

export default function AboutSettingsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const taps = useRef(0);
  const [hint, setHint] = useState<string | null>(null);

  /** 5 taps successifs sur la version déverrouillent l'écran de debug thème. */
  const onVersionTap = useCallback(() => {
    taps.current += 1;
    const left = DEBUG_TAP_COUNT - taps.current;
    if (left <= 0) {
      taps.current = 0;
      setHint(null);
      void haptics.success();
      router.push('/settings/debug' as Href);
      return;
    }
    if (left <= 2) setHint(t('settings.about.tapsLeft', { count: left }));
    void haptics.selection();
  }, [t]);

  const icon = (Icon: typeof Info) => <Icon size={20} color={theme.colors.textSecondary} strokeWidth={2} />;

  return (
    <Screen>
      <ScreenHeader title={t('settings.about.title')} back size="compact" />

      <ListSection footer={hint ?? undefined}>
        <ListItem
          title={t('settings.about.version')}
          value={`${APP_NAME} ${APP_VERSION}`}
          icon={icon(Info)}
          right="none"
          onPress={onVersionTap}
          accessibilityLabel={`${t('settings.about.version')} ${APP_VERSION}`}
        />
      </ListSection>

      <ListSection>
        <ListItem
          title={t('settings.about.terms')}
          icon={icon(FileText)}
          onPress={() => router.push('/settings/legal/terms' as Href)}
        />
        <ListItem
          title={t('settings.about.privacyPolicy')}
          icon={icon(FileText)}
          onPress={() => router.push('/settings/legal/privacy' as Href)}
        />
        <ListItem
          title={t('settings.about.licenses')}
          icon={icon(Scale)}
          onPress={() => router.push('/settings/legal/licenses' as Href)}
        />
      </ListSection>

      <Text variant="caption" color="textSecondary" align="center" style={{ marginTop: theme.spacing.lg }}>
        {APP_NAME} · {APP_VERSION}
      </Text>
    </Screen>
  );
}
