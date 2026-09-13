/**
 * Onboarding — écran 11 : récapitulatif.
 * Chaque ligne est modifiable au tap (rouvre l'écran correspondant en mode
 * édition). À la validation : le thème de l'équipe « s'applique » à toute l'app
 * pendant ~400 ms, puis on entre dans l'app.
 */
import { router, type Href } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { View } from 'react-native';

import { Avatar, Card, ListItem, ListSection, Text } from '@/components/ui';
import { QuestionScreen } from '@/features/onboarding/QuestionScreen';
import { useOnboarding } from '@/features/onboarding/useOnboarding';
import { patchProfile } from '@/features/profile/service';
import { useProfileSummaryRows } from '@/features/profile/summary';
import { useTranslation } from '@/i18n';
import { haptics } from '@/lib/haptics';
import { useProfileStore } from '@/store/profileStore';
import { NO_TEAM_ID, useThemeStore } from '@/store/themeStore';
import { toast } from '@/store/uiStore';
import { getTeam, getTeamDisplayName } from '@/theme/teams';
import { useTheme } from '@/theme/ThemeProvider';

export default function SummaryScreen() {
  const theme = useTheme();
  const { t, locale } = useTranslation();
  const controller = useOnboarding('summary');
  const rows = useProfileSummaryRows();
  const draft = useProfileStore((s) => s.draft);
  const triggerApplyAnimation = useThemeStore((s) => s.triggerApplyAnimation);
  const [saving, setSaving] = useState(false);

  const validate = useCallback(async () => {
    setSaving(true);
    try {
      await patchProfile({ onboardingCompleted: true, onboardingStep: controller.index });
      void haptics.success();
      triggerApplyAnimation();
      const team = getTeam(draft.favoriteTeamId ?? NO_TEAM_ID);
      toast(
        t('toasts.themeApplied', {
          team: team.id === NO_TEAM_ID ? t('onboarding.team.none') : getTeamDisplayName(team, locale),
        }),
        'success',
      );
      // Laisse l'animation « le thème s'applique » se jouer avant d'entrer dans l'app.
      setTimeout(() => router.replace('/' as Href), theme.motion.slow);
    } catch {
      toast(t('common.error'), 'error');
    } finally {
      setSaving(false);
    }
  }, [controller.index, draft.favoriteTeamId, locale, t, theme.motion.slow, triggerApplyAnimation]);

  return (
    <QuestionScreen
      controller={controller}
      title={t('onboarding.summary.title')}
      subtitle={t('onboarding.summary.subtitle')}
      continueLabel={t('onboarding.summary.validate')}
      onContinue={() => void validate()}
      canContinue={!saving}
    >
      <Card tone="surface" padding={theme.spacing.lg}>
        <View style={{ alignItems: 'center', marginBottom: theme.spacing.lg }}>
          <Avatar
            uri={draft.avatarUrl}
            name={draft.displayName ?? null}
            size={theme.sizes.avatarLg}
            ring
          />
          <Text variant="h3" style={{ marginTop: theme.spacing.md }}>
            {draft.displayName ?? t('common.notSet')}
          </Text>
        </View>

        <ListSection>
          {rows.map((row) => (
            <ListItem
              key={row.step}
              title={t(row.labelKey)}
              value={row.value ?? t('common.notSet')}
              onPress={() => router.push({ pathname: row.path, params: { edit: '1' } } as Href)}
            />
          ))}
        </ListSection>
      </Card>
    </QuestionScreen>
  );
}
