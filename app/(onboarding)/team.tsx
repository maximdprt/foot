/**
 * Onboarding — écran 10 : équipe de cœur (écran clé).
 * Le sélecteur (section 6.3) liste toutes les équipes de `teams.json` ;
 * la sélection change les couleurs de l'app en direct. « Aucune / plus tard »
 * garde le thème Neutre.
 */
import React, { useState } from 'react';
import { Animated, View } from 'react-native';

import { TiltCard } from '@/components/motion';
import { Button, Card, TeamCrest, Text } from '@/components/ui';
import { TeamPicker } from '@/components/TeamPicker';
import { QuestionScreen } from '@/features/onboarding/QuestionScreen';
import { useOnboarding } from '@/features/onboarding/useOnboarding';
import { useTranslation } from '@/i18n';
import { useEntrance } from '@/lib/motion';
import { NO_TEAM_ID, useThemeStore } from '@/store/themeStore';
import { getTeam, getTeamDisplayName } from '@/theme/teams';
import { useTheme } from '@/theme/ThemeProvider';

export default function TeamScreen() {
  const theme = useTheme();
  const { t, locale } = useTranslation();
  const controller = useOnboarding('team');
  const { draft, set } = controller;
  const setFavoriteTeam = useThemeStore((s) => s.setFavoriteTeam);
  // Un visiteur a pu choisir son équipe depuis Paramètres > Apparence avant
  // l'onboarding : le choix déjà appliqué au thème fait foi si le brouillon est vide.
  const themeTeamId = useThemeStore((s) => s.favoriteTeamId);
  const [initialTeamId] = useState(() => draft.favoriteTeamId ?? themeTeamId);
  // Ouverture automatique à l'arrivée quand aucune équipe n'a encore été choisie.
  const [pickerVisible, setPickerVisible] = useState(() => initialTeamId === NO_TEAM_ID);
  const crestIn = useEntrance({ duration: 480, scaleFrom: 0.88 });

  const selectedId = draft.favoriteTeamId ?? initialTeamId;
  const team = getTeam(selectedId);
  const isNone = team.id === NO_TEAM_ID;

  const apply = (teamId: string) => {
    setPickerVisible(false);
    set({ favoriteTeamId: teamId === NO_TEAM_ID ? null : teamId });
    // Le thème devient celui de l'équipe immédiatement (l'enregistrement a lieu au « Continuer »).
    setFavoriteTeam(teamId);
  };

  return (
    <>
      <QuestionScreen
        controller={controller}
        title={t('onboarding.team.title')}
        subtitle={t('onboarding.team.subtitle')}
        onContinue={() => void controller.next({ favoriteTeamId: isNone ? null : team.id })}
        footer={
          isNone ? null : (
            <Button
              title={t('onboarding.team.none')}
              variant="text"
              onPress={() => apply(NO_TEAM_ID)}
            />
          )
        }
      >
        <Animated.View style={crestIn}>
          <TiltCard maxTilt={14}>
            <Card
              tone="soft"
              onPress={() => setPickerVisible(true)}
              accessibilityLabel={t('onboarding.team.title')}
            >
              <View style={{ alignItems: 'center', gap: theme.spacing.md }}>
                <TeamCrest team={team} size={112} />
                <Text variant="h2" align="center">
                  {isNone ? t('onboarding.team.none') : getTeamDisplayName(team, locale)}
                </Text>
                <Text variant="caption" color="textSecondary" align="center">
                  {isNone
                    ? t('onboarding.team.noneSubtitle')
                    : [team.shortName, team.city].filter(Boolean).join(' · ')}
                </Text>
              </View>
            </Card>
          </TiltCard>
        </Animated.View>

        <Button
          title={t('common.edit')}
          variant="secondary"
          onPress={() => setPickerVisible(true)}
          style={{ marginTop: theme.spacing.lg }}
        />
      </QuestionScreen>

      <TeamPicker
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onConfirm={apply}
        selectedTeamId={selectedId}
      />
    </>
  );
}
