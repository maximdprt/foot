/** Paramètres > Aide & support : FAQ, contact, signalement de bug. */
import { Bug, Mail } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { Linking, View } from 'react-native';

import { Card, Divider, ListItem, ListSection, Screen, ScreenHeader, Text } from '@/components/ui';
import { APP_NAME, APP_VERSION, SUPPORT_EMAIL } from '@/config/app';
import { useTranslatedList, useTranslation } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';

interface FaqItem {
  q: string;
  a: string;
}

export default function HelpSettingsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faq = useTranslatedList<FaqItem>('settings.help.faqItems');

  const mailTo = useCallback(
    (subject: string) => {
      const body = `\n\n---\n${APP_NAME} ${APP_VERSION}`;
      void Linking.openURL(
        `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
      );
    },
    [],
  );

  return (
    <Screen>
      <ScreenHeader title={t('settings.help.title')} back size="compact" />

      <Card tone="surface">
        <Text variant="h3" style={{ marginBottom: theme.spacing.md }}>
          {t('settings.help.faq')}
        </Text>
        {faq.map((item, index) => (
          <View key={item.q}>
            {index > 0 ? <Divider /> : null}
            <ListItem
              title={item.q}
              subtitle={openIndex === index ? item.a : undefined}
              right="none"
              onPress={() => setOpenIndex(openIndex === index ? null : index)}
            />
          </View>
        ))}
      </Card>

      <ListSection style={{ marginTop: theme.sizes.sectionGap }}>
        <ListItem
          title={t('settings.help.contact')}
          icon={<Mail size={20} color={theme.colors.textSecondary} strokeWidth={2} />}
          onPress={() => mailTo(`${APP_NAME} — ${t('settings.help.contact')}`)}
        />
        <ListItem
          title={t('settings.help.bug')}
          icon={<Bug size={20} color={theme.colors.textSecondary} strokeWidth={2} />}
          onPress={() => mailTo(`${APP_NAME} — ${t('settings.help.bug')}`)}
        />
      </ListSection>
    </Screen>
  );
}
