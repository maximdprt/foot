/**
 * Lignes du récapitulatif de profil, partagées par l'écran 11 de l'onboarding
 * et par Paramètres > Mon profil > Mes réponses. Chaque ligne connaît l'écran
 * d'onboarding à rouvrir en mode édition.
 */
import { useMemo } from 'react';

import { optionLabelKey } from '@/features/onboarding/options';
import { regionName } from '@/features/onboarding/regions';
import { ONBOARDING_STEPS, type OnboardingStepKey } from '@/features/onboarding/steps';
import { useTranslation, type TFunction } from '@/i18n';
import { useProfileStore } from '@/store/profileStore';
import { NO_TEAM_ID } from '@/store/themeStore';
import { getTeam, getTeamDisplayName, type TeamLocale } from '@/theme/teams';

import type { ProfileDraft } from './types';

export interface SummaryRow {
  step: OnboardingStepKey;
  /** Clé i18n du libellé de la ligne (`onboarding.summary.rows.*`). */
  labelKey: string;
  /** Valeur déjà formatée et traduite, ou `null` si non renseignée. */
  value: string | null;
  /** Route de l'écran à rouvrir en mode édition. */
  path: string;
}

const ROWS: { step: OnboardingStepKey; labelKey: string }[] = [
  { step: 'identity', labelKey: 'onboarding.summary.rows.identity' },
  { step: 'plays', labelKey: 'onboarding.summary.rows.plays' },
  { step: 'level', labelKey: 'onboarding.summary.rows.level' },
  { step: 'club', labelKey: 'onboarding.summary.rows.club' },
  { step: 'position', labelKey: 'onboarding.summary.rows.position' },
  { step: 'location', labelKey: 'onboarding.summary.rows.location' },
  { step: 'play-locations', labelKey: 'onboarding.summary.rows.playLocations' },
  { step: 'frequency', labelKey: 'onboarding.summary.rows.frequency' },
  { step: 'goals', labelKey: 'onboarding.summary.rows.goals' },
  { step: 'team', labelKey: 'onboarding.summary.rows.team' },
];

function pathOf(step: OnboardingStepKey): string {
  return ONBOARDING_STEPS.find((s) => s.key === step)?.path ?? '/';
}

/** Valeur affichable d'une ligne du récapitulatif. */
export function formatValue(
  step: OnboardingStepKey,
  draft: ProfileDraft,
  t: TFunction,
  locale: TeamLocale,
): string | null {
  const translateOption = (group: string, value: string | null | undefined) => {
    const key = optionLabelKey(group, value);
    return key ? t(key) : null;
  };

  switch (step) {
    case 'identity':
      return draft.displayName?.trim() || null;
    case 'plays':
      return translateOption('plays', draft.playsFootball);
    case 'level':
      return translateOption('level', draft.level);
    case 'club':
      return draft.clubName?.trim() || t('onboarding.summary.noClub');
    case 'position':
      return translateOption('position', draft.position);
    case 'location': {
      const region = regionName(draft.region);
      const city = draft.city?.trim() || null;
      if (!region && !city) return null;
      return [city, region].filter(Boolean).join(', ');
    }
    case 'play-locations': {
      const values = draft.playLocations ?? [];
      if (values.length === 0) return null;
      return values.map((v) => t(`onboarding.playLocations.options.${v}`)).join(' · ');
    }
    case 'frequency':
      return translateOption('frequency', draft.frequency);
    case 'goals': {
      const values = draft.goals ?? [];
      if (values.length === 0) return null;
      return values.map((v) => t(`onboarding.goals.options.${v}`)).join(' · ');
    }
    case 'team': {
      const id = draft.favoriteTeamId ?? NO_TEAM_ID;
      if (id === NO_TEAM_ID) return t('onboarding.team.none');
      return getTeamDisplayName(getTeam(id), locale);
    }
    default:
      return null;
  }
}

/** Lignes du récapitulatif pour le brouillon courant. */
export function useProfileSummaryRows(): SummaryRow[] {
  const draft = useProfileStore((s) => s.draft);
  const { t, locale } = useTranslation();
  return useMemo(
    () =>
      ROWS.map(({ step, labelKey }) => ({
        step,
        labelKey,
        value: formatValue(step, draft, t, locale),
        path: pathOf(step),
      })),
    [draft, t, locale],
  );
}
