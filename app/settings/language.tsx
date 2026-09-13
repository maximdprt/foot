/** Paramètres > Langue : français (défaut) ou anglais. Changement instantané. */
import { Check } from 'lucide-react-native';
import React from 'react';

import { ListItem, ListSection, Screen, ScreenHeader } from '@/components/ui';
import { patchProfile, persistSettings } from '@/features/profile/service';
import { useTranslation } from '@/i18n';
import { SUPPORTED_LOCALES, type Locale } from '@/i18n/locale';
import { useSettingsStore } from '@/store/settingsStore';
import { useTheme } from '@/theme/ThemeProvider';

export default function LanguageSettingsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const locale = useSettingsStore((s) => s.locale);
  const setLocale = useSettingsStore((s) => s.setLocale);

  const select = (next: Locale) => {
    setLocale(next);
    void persistSettings();
    void patchProfile({ locale: next });
  };

  return (
    <Screen>
      <ScreenHeader title={t('settings.language.title')} back size="compact" />
      <ListSection>
        {SUPPORTED_LOCALES.map((code) => (
          <ListItem
            key={code}
            title={t(`settings.language.${code}`)}
            onPress={() => select(code)}
            right={
              code === locale ? (
                <Check size={20} color={theme.colors.primary} strokeWidth={2.5} />
              ) : (
                'none'
              )
            }
          />
        ))}
      </ListSection>
    </Screen>
  );
}
