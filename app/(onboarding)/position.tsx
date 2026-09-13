/** Onboarding — « Ton poste préféré ? » : choix unique. */
import React from 'react';

import { SingleChoice } from '@/features/onboarding/ChoiceList';
import { POSITION_OPTIONS } from '@/features/onboarding/options';
import { QuestionScreen } from '@/features/onboarding/QuestionScreen';
import { useOnboarding } from '@/features/onboarding/useOnboarding';
import type { Position } from '@/features/profile/types';
import { useTranslation } from '@/i18n';

export default function PositionScreen() {
  const { t } = useTranslation();
  const controller = useOnboarding('position');

  return (
    <QuestionScreen controller={controller} title={t('onboarding.position.title')}>
      <SingleChoice<Position>
        options={POSITION_OPTIONS}
        value={controller.draft.position}
        onChange={(value) => controller.set({ position: value })}
      />
    </QuestionScreen>
  );
}
