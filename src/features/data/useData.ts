/**
 * Accès aux données métier depuis les écrans : sélecteurs mémorisés,
 * rafraîchissement, et garde d'authentification.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';

import { computeStats, type PlayerStats } from '@/features/profile/stats';
import { useDataStore } from '@/store/dataStore';
import { useSessionStore } from '@/store/sessionStore';
import { useUIStore } from '@/store/uiStore';

import { refreshAll } from './service';

/** Identifiant de l'utilisateur connecté, ou `null` pour un visiteur. */
export function useUserId(): string | null {
  return useSessionStore((s) => s.user?.id ?? null);
}

/**
 * Déclenche un chargement quand les données en mémoire ne correspondent pas à
 * l'utilisateur courant (première ouverture, connexion, déconnexion), et expose
 * le « tirer pour rafraîchir ».
 */
export function useRefresh(): { refreshing: boolean; refresh: () => void } {
  const userId = useUserId();
  const loadedFor = useDataStore((s) => s.loadedFor);
  const loadedAt = useDataStore((s) => s.loadedAt);
  const loading = useDataStore((s) => s.loading);
  const [manual, setManual] = useState(false);

  const stale = loadedAt === null || loadedFor !== userId;

  // `userId` fait partie des dépendances : à la restauration de la session il
  // change, alors que `stale` reste à `true`. Sans lui, l'effet ne se rejouait
  // pas et le jeu de données visiteur restait affiché pour un compte connecté.
  useEffect(() => {
    if (!stale) return;
    void refreshAll();
  }, [stale, userId]);

  const refresh = useCallback(() => {
    setManual(true);
    void refreshAll().finally(() => setManual(false));
  }, []);

  return { refreshing: manual && loading, refresh };
}

/**
 * Enveloppe une action réservée aux comptes : un visiteur voit la bottom sheet
 * « Connecte-toi pour continuer » au lieu d'une erreur.
 */
export function useRequireAuth(): (action: () => void) => void {
  const userId = useUserId();
  const showAuthGate = useUIStore((s) => s.showAuthGate);
  return useCallback(
    (action: () => void) => {
      if (!userId) {
        showAuthGate();
        return;
      }
      action();
    },
    [showAuthGate, userId],
  );
}

/** Statistiques du joueur, recalculées quand une collection change. */
export function usePlayerStats(): PlayerStats {
  const userId = useUserId();
  const matches = useDataStore((s) => s.matches);
  const sessions = useDataStore((s) => s.sessions);
  const bookings = useDataStore((s) => s.bookings);
  const friends = useDataStore((s) => s.friends);

  return useMemo(
    () => computeStats({ userId, matches, sessions, bookings, friends }),
    [userId, matches, sessions, bookings, friends],
  );
}
