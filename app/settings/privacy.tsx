/**
 * Paramètres > Confidentialité : visibilité du profil, position visible,
 * export des données et suppression (RGPD).
 */
import { router, type Href } from 'expo-router';
import { Check, Download, Trash } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { Platform, Share, View } from 'react-native';

import { ListItem, ListSection, Screen, ScreenHeader, Text, Toggle } from '@/components/ui';
import { persistSettings } from '@/features/profile/service';
import { useTranslation } from '@/i18n';
import { backend } from '@/lib/backend';
import { useSessionStore } from '@/store/sessionStore';
import { useSettingsStore, type ProfileVisibility } from '@/store/settingsStore';
import { toast } from '@/store/uiStore';
import { useTheme } from '@/theme/ThemeProvider';

const VISIBILITIES: ProfileVisibility[] = ['public', 'friends', 'private'];

export default function PrivacySettingsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const privacy = useSettingsStore((s) => s.privacy);
  const setPrivacy = useSettingsStore((s) => s.setPrivacy);
  const userId = useSessionStore((s) => s.user?.id ?? null);
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState<string | null>(null);

  /** Export RGPD : JSON partagé via la feuille de partage système (copié sur le web). */
  const exportData = useCallback(async () => {
    if (!userId) return;
    setExporting(true);
    try {
      const data = await backend.exportData(userId);
      const json = JSON.stringify(data, null, 2);
      if (Platform.OS === 'web') setExported(json);
      else await Share.share({ message: json });
      toast(t('settings.privacy.exportDone'), 'success');
    } catch {
      toast(t('common.error'), 'error');
    } finally {
      setExporting(false);
    }
  }, [t, userId]);

  return (
    <Screen>
      <ScreenHeader title={t('settings.privacy.title')} back size="compact" />

      <ListSection title={t('settings.privacy.visibility')}>
        {VISIBILITIES.map((value) => (
          <ListItem
            key={value}
            title={t(`settings.privacy.visibilityOptions.${value}`)}
            onPress={() => {
              setPrivacy({ profileVisibility: value });
              void persistSettings();
            }}
            right={
              privacy.profileVisibility === value ? (
                <Check size={20} color={theme.colors.primary} strokeWidth={2.5} />
              ) : (
                'none'
              )
            }
          />
        ))}
      </ListSection>

      <ListSection>
        <ListItem
          title={t('settings.privacy.locationVisible')}
          right={
            <Toggle
              value={privacy.locationVisible}
              accessibilityLabel={t('settings.privacy.locationVisible')}
              onValueChange={(value) => {
                setPrivacy({ locationVisible: value });
                void persistSettings();
              }}
            />
          }
        />
      </ListSection>

      <ListSection>
        <ListItem
          title={t('settings.privacy.export')}
          subtitle={t('settings.privacy.exportSubtitle')}
          icon={<Download size={20} color={theme.colors.textSecondary} strokeWidth={2} />}
          disabled={exporting || !userId}
          onPress={() => void exportData()}
        />
        <ListItem
          title={t('settings.privacy.deleteData')}
          icon={<Trash size={20} color={theme.colors.error} strokeWidth={2} />}
          destructive
          onPress={() => router.push('/settings/account' as Href)}
        />
      </ListSection>

      {exported ? (
        <View style={{ marginTop: theme.spacing.md }}>
          <Text variant="caption" color="textSecondary" selectable>
            {exported}
          </Text>
        </View>
      ) : null}
    </Screen>
  );
}
