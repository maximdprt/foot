/** Conversion entre la ligne Postgres `user_profiles` (snake_case) et `UserProfile` (camelCase). */
import type { UserProfileRow } from '@/lib/database.types';
import type { Locale } from '@/i18n/locale';

import type { ProfileDraft, UserProfile } from './types';

export function rowToProfile(row: UserProfileRow): UserProfile {
  return {
    id: row.id,
    userId: row.user_id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    playsFootball: row.plays_football,
    level: row.level,
    clubName: row.club_name,
    position: row.position,
    region: row.region,
    city: row.city,
    lat: row.lat,
    lng: row.lng,
    playLocations: row.play_locations ?? [],
    frequency: row.frequency,
    goals: row.goals ?? [],
    favoriteTeamId: row.favorite_team_id,
    onboardingStep: row.onboarding_step,
    onboardingCompleted: row.onboarding_completed,
    locale: (row.locale === 'en' ? 'en' : 'fr') as Locale,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Colonne Postgres correspondant à chaque champ du brouillon. */
const COLUMNS: Record<keyof ProfileDraft, keyof UserProfileRow> = {
  displayName: 'display_name',
  avatarUrl: 'avatar_url',
  playsFootball: 'plays_football',
  level: 'level',
  clubName: 'club_name',
  position: 'position',
  region: 'region',
  city: 'city',
  lat: 'lat',
  lng: 'lng',
  playLocations: 'play_locations',
  frequency: 'frequency',
  goals: 'goals',
  favoriteTeamId: 'favorite_team_id',
  onboardingStep: 'onboarding_step',
  onboardingCompleted: 'onboarding_completed',
  locale: 'locale',
};

/** N'envoie que les champs réellement présents dans le brouillon (mise à jour partielle). */
export function draftToRow(draft: ProfileDraft): Partial<UserProfileRow> {
  const row: Record<string, unknown> = {};
  (Object.keys(draft) as (keyof ProfileDraft)[]).forEach((key) => {
    const column = COLUMNS[key];
    const value = draft[key];
    if (column && value !== undefined) row[column] = value;
  });
  return row as Partial<UserProfileRow>;
}
