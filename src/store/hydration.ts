/** Attend la réhydratation des stores persistés avant d'afficher l'app (évite un flash de thème Neutre). */
import { useSyncExternalStore } from 'react';

import { useProfileStore } from './profileStore';
import { useSettingsStore } from './settingsStore';
import { useThemeStore } from './themeStore';

const persistedStores = [useThemeStore, useProfileStore, useSettingsStore] as const;

function allHydrated(): boolean {
  return persistedStores.every((store) => store.persist.hasHydrated());
}

/** S'abonne à la fin de réhydratation de chaque store persisté. */
function subscribe(onStoreChange: () => void): () => void {
  const unsubscribers = persistedStores.map((store) =>
    store.persist.onFinishHydration(onStoreChange),
  );
  return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
}

export function useStoresHydrated(): boolean {
  // Source externe (zustand/persist) : `useSyncExternalStore` évite tout setState en effet.
  return useSyncExternalStore(subscribe, allHydrated, allHydrated);
}
