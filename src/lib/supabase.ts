/**
 * Client Supabase. Les clés viennent des variables d'environnement Expo
 * (`EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`, cf. `.env.example`).
 *
 * Si elles sont absentes, `supabase` vaut `null` et l'app bascule sur le backend
 * de démonstration local (`src/lib/backend/demoBackend.ts`) : l'app reste
 * entièrement navigable sans backend, ce qui permet un `npm run dev` immédiat.
 */
import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

import type { Database } from './database.types';

const url = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').trim();
const anonKey = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();

/** Vrai si les deux variables d'environnement sont renseignées et cohérentes. */
export const hasSupabaseConfig: boolean = /^https?:\/\/.+/.test(url) && anonKey.length > 20;

export const supabase: SupabaseClient<Database> | null = hasSupabaseConfig
  ? createClient<Database>(url, anonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        // Le web gère le retour OAuth via l'URL ; en natif c'est `expo-auth-session`.
        detectSessionInUrl: Platform.OS === 'web',
        flowType: 'pkce',
      },
    })
  : null;

/** Bucket Storage des avatars (créé par `supabase/schema.sql`). */
export const AVATARS_BUCKET = 'avatars';
