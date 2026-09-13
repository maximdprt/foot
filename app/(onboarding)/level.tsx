/** Onboarding — « Ton niveau ? » : choix unique. */
import React from 'react';

import { SingleChoice } from '@/features/onboarding/ChoiceList';
import { LEVEL_OPTIONS } from '@/features/onboarding/options';
import { QuestionScreen } from '@/features/onboarding/QuestionScreen';
import { useOnboarding } from '@/features/onboarding/useOnboarding';
import type { Level } from '@/features/profile/types';
import { useTranslation } from '@/i18n';

export default function LevelScreen() {
  const { t } = useTranslation();
  const controller = useOnboarding('level');

  return (
    <QuestionScreen controller={controller} title={t('onboarding.level.title')}>
      <SingleChoice<Level>
        options={LEVEL_OPTIONS}
        value={controller.draft.level}
        onChange={(value) => controller.set({ level: value })}
      />
    </QuestionScreen>
  );
}
