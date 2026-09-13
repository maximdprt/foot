/**
 * Profil et brouillon d'onboarding.
 * - `profile` : profil de l'utilisateur connecté (miroir de `user_profiles`), null pour un visiteur.
 * - `draft`   : réponses en cours (persistées localement pour reprendre exactement où on s'est arrêté).
 */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { ProfileDraft, UserProfile } from '@/features/profile/types';
import { appStorage, STORAGE_KEYS } from '@/lib/storage';

interface ProfileState {
  profile: UserProfile | null;
  draft: ProfileDraft;
  setProfile: (profile: UserProfile | null) => void;
  patchDraft: (patch: ProfileDraft) => void;
  setDraft: (draft: ProfileDraft) => void;
  resetDraft: () => void;
  reset: () => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      profile: null,
      draft: {},
      setProfile: (profile) => set({ profile }),
      patchDraft: (patch) => set((state) => ({ draft: { ...state.draft, ...patch } })),
      setDraft: (draft) => set({ draft }),
      resetDraft: () => set({ draft: {} }),
      reset: () => set({ profile: null, draft: {} }),
    }),
    {
      name: STORAGE_KEYS.profile,
      storage: createJSONStorage(() => appStorage),
      partialize: (state) => ({ profile: state.profile, draft: state.draft }),
    },
  ),
);
