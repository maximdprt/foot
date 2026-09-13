/** Onboarding — « Où joues-tu le plus souvent ? » : choix multiple. */
import React from 'react';

import { MultiChoice } from '@/features/onboarding/ChoiceList';
import { PLAY_LOCATION_OPTIONS } from '@/features/onboarding/options';
import { QuestionScreen } from '@/features/onboarding/QuestionScreen';
import { useOnboarding } from '@/features/onboarding/useOnboarding';
import type { PlayLocation } from '@/features/profile/types';
import { useTranslation } from '@/i18n';

export default function PlayLocationsScreen() {
  const { t } = useTranslation();
  const controller = useOnboarding('play-locations');

  return (
    <QuestionScreen
      controller={controller}
      title={t('onboarding.playLocations.title')}
      subtitle={t('onboarding.playLocations.subtitle')}
    >
      <MultiChoice<PlayLocation>
        options={PLAY_LOCATION_OPTIONS}
        values={controller.draft.playLocations ?? []}
        onChange={(values) => controller.set({ playLocations: values })}
      />
    </QuestionScreen>
  );
}
