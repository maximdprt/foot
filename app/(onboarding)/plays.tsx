/** Onboarding — « Tu joues déjà au foot ? » : choix unique. */
import React from 'react';

import { SingleChoice } from '@/features/onboarding/ChoiceList';
import { PLAYS_OPTIONS } from '@/features/onboarding/options';
import { QuestionScreen } from '@/features/onboarding/QuestionScreen';
import { useOnboarding } from '@/features/onboarding/useOnboarding';
import type { PlaysFootball } from '@/features/profile/types';
import { useTranslation } from '@/i18n';

export default function PlaysScreen() {
  const { t } = useTranslation();
  const controller = useOnboarding('plays');

  return (
    <QuestionScreen controller={controller} title={t('onboarding.plays.title')}>
      <SingleChoice<PlaysFootball>
        options={PLAYS_OPTIONS}
        value={controller.draft.playsFootball}
        onChange={(value) => controller.set({ playsFootball: value })}
      />
    </QuestionScreen>
  );
}
