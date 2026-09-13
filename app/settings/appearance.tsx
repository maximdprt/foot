/**
 * Paramètres > Apparence : équipe supportée (même sélecteur que l'onboarding,
 * preview live) et mode sombre affiché en « Bientôt » — l'architecture des
 * tokens le prévoit déjà (cf. `darkPalette` dans `src/theme/tokens.ts`).
 */
import { SunMoon } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { View } from 'react-native';

import { Card, ListItem, ListSection, Screen, ScreenHeader, TeamCrest, Text } from '@/components/ui';
import { TeamPicker } from '@/components/TeamPicker';
import { patchProfile } from '@/features/profile/service';
import { useTranslation } from '@/i18n';
import { NO_TEAM_ID, useThemeStore } from '@/store/themeStore';
import { toast } from '@/store/uiStore';
import { getTeam, getTeamDisplayName } from '@/theme/teams';
import { useTheme } from '@/theme/ThemeProvider';

export default function AppearanceSettingsScreen() {
  const theme = useTheme();
  const { t, locale } = useTranslation();
  const favoriteTeamId = useThemeStore((s) => s.favoriteTeamId);
  const setFavoriteTeam = useThemeStore((s) => s.setFavoriteTeam);
  const [pickerVisible, setPickerVisible] = useState(false);

  const team = getTeam(favoriteTeamId);
  const isNone = team.id === NO_TEAM_ID;

  /** Un visiteur peut choisir une équipe : le choix reste local puis migre à l'inscription. */
  const confirm = useCallback(
    (teamId: string) => {
      setPickerVisible(false);
      setFavoriteTeam(teamId);
      void patchProfile({ favoriteTeamId: teamId === NO_TEAM_ID ? null : teamId });
      toast(t('settings.appearance.teamSaved'), 'success');
    },
    [setFavoriteTeam, t],
  );

  return (
    <Screen>
      <ScreenHeader title={t('settings.appearance.title')} back size="compact" />

      <Card tone="soft" onPress={() => setPickerVisible(true)} accessibilityLabel={t('settings.appearance.team')}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.lg }}>
          <TeamCrest team={team} size={64} />
          <View style={{ flex: 1 }}>
            <Text variant="caption" color="textSecondary">
              {t('settings.appearance.team')}
            </Text>
            <Text variant="h3" numberOfLines={1}>
              {isNone ? t('onboarding.team.none') : getTeamDisplayName(team, locale)}
            </Text>
          </View>
        </View>
      </Card>

      <ListSection style={{ marginTop: theme.sizes.sectionGap }}>
        <ListItem
          title={t('settings.appearance.darkMode')}
          icon={<SunMoon size={20} color={theme.colors.textSecondary} strokeWidth={2} />}
          badge={t('settings.appearance.darkModeSoon')}
          right="none"
          disabled
        />
      </ListSection>

      <TeamPicker
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onConfirm={confirm}
        selectedTeamId={favoriteTeamId}
      />
    </Screen>
  );
}
