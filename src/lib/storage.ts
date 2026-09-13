/**
 * Stockage clé/valeur local (AsyncStorage : iOS, Android et web via localStorage).
 * Fournit l'adaptateur `appStorage` pour `zustand/persist` et des helpers JSON.
 * Remplaçable par MMKV en changeant uniquement ce fichier.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StateStorage } from 'zustand/middleware';

const memoryFallback = new Map<string, string>();

export const STORAGE_KEYS = {
  theme: 'pelouse.theme',
  profile: 'pelouse.profile',
  settings: 'pelouse.settings',
  localBackend: 'pelouse.local-backend',
} as const;

export const appStorage: StateStorage = {
  async getItem(name) {
    try {
      return await AsyncStorage.getItem(name);
    } catch {
      return memoryFallback.get(name) ?? null;
    }
  },
  async setItem(name, value) {
    try {
      await AsyncStorage.setItem(name, value);
    } catch {
      memoryFallback.set(name, value);
    }
  },
  async removeItem(name) {
    try {
      await AsyncStorage.removeItem(name);
    } catch {
      memoryFallback.delete(name);
    }
  },
};

export async function getJSON<T>(key: string): Promise<T | null> {
  const raw = await appStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function setJSON(key: string, value: unknown): Promise<void> {
  await appStorage.setItem(key, JSON.stringify(value));
}

export async function removeKey(key: string): Promise<void> {
  await appStorage.removeItem(key);
}
