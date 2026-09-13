/**
 * Équipe supportée (thème) : persistée localement (visiteur compris) et synchronisée
 * avec `user_profiles.favorite_team_id` quand l'utilisateur est connecté.
 * `previewTeamId` permet la preview live du sélecteur d'équipe sans valider.
 */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { appStorage, STORAGE_KEYS } from '@/lib/storage';

export const NO_TEAM_ID = 'none';

interface ThemeState {
  favoriteTeamId: string;
  previewTeamId: string | null;
  /** Incrémenté pour déclencher l'animation « le thème s'applique » (~400 ms). */
  applyPulse: number;
  setFavoriteTeam: (id: string) => void;
  setPreviewTeam: (id: string | null) => void;
  clearPreview: () => void;
  triggerApplyAnimation: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      favoriteTeamId: NO_TEAM_ID,
      previewTeamId: null,
      applyPulse: 0,
      setFavoriteTeam: (id) => set({ favoriteTeamId: id || NO_TEAM_ID, previewTeamId: null }),
      setPreviewTeam: (id) => set({ previewTeamId: id }),
      clearPreview: () => set({ previewTeamId: null }),
      triggerApplyAnimation: () => set((state) => ({ applyPulse: state.applyPulse + 1 })),
    }),
    {
      name: STORAGE_KEYS.theme,
      storage: createJSONStorage(() => appStorage),
      partialize: (state) => ({ favoriteTeamId: state.favoriteTeamId }),
    },
  ),
);
