/**
 * Contrôleur d'une étape du questionnaire : état du brouillon, validation,
 * navigation avant / arrière, et sauvegarde de la progression à chaque étape.
 *
 * Deux modes :
 *  • parcours normal (`/welcome` → `/summary`) ;
 *  • mode édition (`?edit=1`, depuis Paramètres > Mon profil) : le bouton
 *    « Continuer » devient « Enregistrer » et ramène à l'écran précédent.
 */
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

import { patchProfile } from '@/features/profile/service';
import type { ProfileDraft } from '@/features/profile/types';
import { haptics } from '@/lib/haptics';
import { translate } from '@/i18n';
import { useProfileStore } from '@/store/profileStore';
import { toast } from '@/store/uiStore';

import {
  isStepValid,
  LAST_STEP_INDEX,
  stepAt,
  stepIndex,
  stepProgress,
  type OnboardingStep,
  type OnboardingStepKey,
} from './steps';

export interface OnboardingController {
  step: OnboardingStep;
  index: number;
  /** Numéro affiché dans « Étape X sur Y » (l'écran de bienvenue ne compte pas). */
  displayIndex: number;
  progress: number;
  draft: ProfileDraft;
  editing: boolean;
  saving: boolean;
  valid: boolean;
  /** Met à jour le brouillon localement (rendu immédiat, pas d'appel réseau). */
  set: (patch: ProfileDraft) => void;
  /** Valide l'étape : sauvegarde puis passe à la suivante (ou revient en arrière en mode édition). */
  next: (patch?: ProfileDraft) => Promise<void>;
  /** Étape facultative : avance sans enregistrer de réponse. */
  skip: () => Promise<void>;
  back: () => void;
}

export function useOnboarding(key: OnboardingStepKey): OnboardingController {
  const params = useLocalSearchParams<{ edit?: string }>();
  const editing = params.edit === '1';
  const draft = useProfileStore((s) => s.draft);
  const patchDraft = useProfileStore((s) => s.patchDraft);
  const [saving, setSaving] = useState(false);

  const index = useMemo(() => stepIndex(key), [key]);
  const step = stepAt(index);
  const valid = isStepValid(key, draft);

  const set = useCallback((patch: ProfileDraft) => patchDraft(patch), [patchDraft]);

  const commit = useCallback(
    async (patch: ProfileDraft, targetIndex: number) => {
      setSaving(true);
      try {
        await patchProfile({ ...patch, onboardingStep: targetIndex });
      } catch {
        // Le brouillon local reste la source de vérité : l'utilisateur n'est pas bloqué.
        toast(translate('common.error'), 'error');
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  const next = useCallback(
    async (patch: ProfileDraft = {}) => {
      void haptics.light();
      if (editing) {
        setSaving(true);
        try {
          await patchProfile(patch);
        } finally {
          setSaving(false);
        }
        if (router.canGoBack()) router.back();
        return;
      }
      const targetIndex = Math.min(index + 1, LAST_STEP_INDEX);
      await commit(patch, targetIndex);
      router.push(stepAt(targetIndex).path as Href);
    },
    [commit, editing, index],
  );

  const skip = useCallback(async () => {
    if (editing) {
      if (router.canGoBack()) router.back();
      return;
    }
    const targetIndex = Math.min(index + 1, LAST_STEP_INDEX);
    await commit({}, targetIndex);
    router.push(stepAt(targetIndex).path as Href);
  }, [commit, editing, index]);

  const back = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace(stepAt(Math.max(0, index - 1)).path as Href);
  }, [index]);

  return {
    step,
    index,
    displayIndex: index,
    progress: stepProgress(index),
    draft,
    editing,
    saving,
    valid,
    set,
    next,
    skip,
    back,
  };
}
