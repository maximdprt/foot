/** Onboarding — « À quelle fréquence ? » : choix unique. */
import React from 'react';

import { SingleChoice } from '@/features/onboarding/ChoiceList';
import { FREQUENCY_OPTIONS } from '@/features/onboarding/options';
import { QuestionScreen } from '@/features/onboarding/QuestionScreen';
import { useOnboarding } from '@/features/onboarding/useOnboarding';
import type { Frequency } from '@/features/profile/types';
import { useTranslation } from '@/i18n';

export default function FrequencyScreen() {
  const { t } = useTranslation();
  const controller = useOnboarding('frequency');

  return (
    <QuestionScreen controller={controller} title={t('onboarding.frequency.title')}>
      <SingleChoice<Frequency>
        options={FREQUENCY_OPTIONS}
        value={controller.draft.frequency}
        onChange={(value) => controller.set({ frequency: value })}
      />
    </QuestionScreen>
  );
}
