/**
 * Point d'entrée du backend. Supabase quand les variables d'environnement sont
 * présentes, sinon backend de démonstration local : l'app reste entièrement
 * navigable sans configuration (`npm run dev` fonctionne immédiatement).
 */
import { hasSupabaseConfig } from '@/lib/supabase';

import { demoBackend } from './demoBackend';
import { supabaseBackend } from './supabaseBackend';
import type { Backend } from './types';

export const backend: Backend = hasSupabaseConfig ? supabaseBackend : demoBackend;

/** Vrai quand l'app tourne sans Supabase (bandeau « mode démo » dans les Paramètres). */
export const IS_DEMO_MODE: boolean = !hasSupabaseConfig;

export * from './types';
