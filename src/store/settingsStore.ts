/** Réglages utilisateur (langue, notifications, confidentialité, apparence). Persistés localement. */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { detectDeviceLocale, type Locale } from '@/i18n/locale';
import { appStorage, STORAGE_KEYS } from '@/lib/storage';

export interface NotificationSettings {
  push: boolean;
  email: boolean;
  trainingReminders: boolean;
  messages: boolean;
  bookings: boolean;
}

export type ProfileVisibility = 'public' | 'friends' | 'private';

export interface PrivacySettings {
  profileVisibility: ProfileVisibility;
  locationVisible: boolean;
}

export interface AppearanceSettings {
  /** Hors périmètre côté UI (« Bientôt »), mais prévu par l'architecture des tokens. */
  darkMode: boolean;
}

export interface UserSettings {
  locale: Locale;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  appearance: AppearanceSettings;
}

export const DEFAULT_SETTINGS: UserSettings = {
  locale: detectDeviceLocale(),
  notifications: {
    push: true,
    email: true,
    trainingReminders: true,
    messages: true,
    bookings: true,
  },
  privacy: {
    profileVisibility: 'public',
    locationVisible: true,
  },
  appearance: {
    darkMode: false,
  },
};

interface SettingsState extends UserSettings {
  setLocale: (locale: Locale) => void;
  setNotification: (key: keyof NotificationSettings, value: boolean) => void;
  setPrivacy: (patch: Partial<PrivacySettings>) => void;
  setAppearance: (patch: Partial<AppearanceSettings>) => void;
  replaceAll: (settings: Partial<UserSettings>) => void;
  reset: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      setLocale: (locale) => set({ locale }),
      setNotification: (key, value) =>
        set((state) => ({ notifications: { ...state.notifications, [key]: value } })),
      setPrivacy: (patch) => set((state) => ({ privacy: { ...state.privacy, ...patch } })),
      setAppearance: (patch) => set((state) => ({ appearance: { ...state.appearance, ...patch } })),
      replaceAll: (settings) =>
        set((state) => ({
          locale: settings.locale ?? state.locale,
          notifications: { ...state.notifications, ...(settings.notifications ?? {}) },
          privacy: { ...state.privacy, ...(settings.privacy ?? {}) },
          appearance: { ...state.appearance, ...(settings.appearance ?? {}) },
        })),
      reset: () => set({ ...DEFAULT_SETTINGS }),
    }),
    {
      name: STORAGE_KEYS.settings,
      storage: createJSONStorage(() => appStorage),
      partialize: (state) => ({
        locale: state.locale,
        notifications: state.notifications,
        privacy: state.privacy,
        appearance: state.appearance,
      }),
    },
  ),
);

export function selectSettings(state: SettingsState): UserSettings {
  return {
    locale: state.locale,
    notifications: state.notifications,
    privacy: state.privacy,
    appearance: state.appearance,
  };
}
