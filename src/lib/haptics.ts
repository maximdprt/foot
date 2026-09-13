/** Retour haptique léger sur les sélections (no-op sur le web et en cas d'erreur). */
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

async function safe(run: () => Promise<void>): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await run();
  } catch {
    // Pas de moteur haptique (simulateur, appareil sans vibreur) : on ignore.
  }
}

export const haptics = {
  selection: () => safe(() => Haptics.selectionAsync()),
  light: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  medium: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  success: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  error: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
};
