/** Onboarding — « Tes objectifs ? » : choix multiple, 1 à 3 réponses. */
import React from 'react';

import { MultiChoice } from '@/features/onboarding/ChoiceList';
import { GOAL_OPTIONS } from '@/features/onboarding/options';
import { QuestionScreen } from '@/features/onboarding/QuestionScreen';
import { useOnboarding } from '@/features/onboarding/useOnboarding';
import { GOALS_MAX, type Goal } from '@/features/profile/types';
import { useTranslation } from '@/i18n';

export default function GoalsScreen() {
  const { t } = useTranslation();
  const controller = useOnboarding('goals');

  return (
    <QuestionScreen
      controller={controller}
      title={t('onboarding.goals.title')}
      subtitle={t('onboarding.goals.subtitle')}
    >
      <MultiChoice<Goal>
        options={GOAL_OPTIONS}
        values={controller.draft.goals ?? []}
        onChange={(values) => controller.set({ goals: values })}
        max={GOALS_MAX}
        maxHint={t('onboarding.goals.max')}
      />
    </QuestionScreen>
  );
}
