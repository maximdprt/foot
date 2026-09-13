/** Modèle du profil utilisateur (miroir de la table Supabase `user_profiles`). */

export type PlaysFootball = 'regularly' | 'sometimes' | 'returning' | 'beginner';
export type Level = 'beginner' | 'leisure' | 'confirmed' | 'competition' | 'high_level';
export type Position = 'goalkeeper' | 'defender' | 'midfielder' | 'forward' | 'anywhere';
export type PlayLocation = 'five_indoor' | 'futsal' | 'club_pitch' | 'city_stadium' | 'anywhere';
export type Frequency = 'lt_monthly' | 'monthly_1_3' | 'weekly_1' | 'weekly_2_3' | 'weekly_4_plus';
export type Goal = 'improve' | 'fitness' | 'find_matches' | 'meet_players' | 'compete' | 'fun';

export const PLAYS_FOOTBALL_VALUES: PlaysFootball[] = ['regularly', 'sometimes', 'returning', 'beginner'];
export const LEVEL_VALUES: Level[] = ['beginner', 'leisure', 'confirmed', 'competition', 'high_level'];
export const POSITION_VALUES: Position[] = ['goalkeeper', 'defender', 'midfielder', 'forward', 'anywhere'];
export const PLAY_LOCATION_VALUES: PlayLocation[] = [
  'five_indoor',
  'futsal',
  'club_pitch',
  'city_stadium',
  'anywhere',
];
export const FREQUENCY_VALUES: Frequency[] = [
  'lt_monthly',
  'monthly_1_3',
  'weekly_1',
  'weekly_2_3',
  'weekly_4_plus',
];
export const GOAL_VALUES: Goal[] = ['improve', 'fitness', 'find_matches', 'meet_players', 'compete', 'fun'];

export const GOALS_MIN = 1;
export const GOALS_MAX = 3;

export interface UserProfile {
  id: string | null;
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
  playsFootball: PlaysFootball | null;
  level: Level | null;
  clubName: string | null;
  position: Position | null;
  region: string | null;
  city: string | null;
  lat: number | null;
  lng: number | null;
  playLocations: PlayLocation[];
  frequency: Frequency | null;
  goals: Goal[];
  favoriteTeamId: string | null;
  /** Index de la prochaine étape d'onboarding à afficher (0 = bienvenue). */
  onboardingStep: number;
  onboardingCompleted: boolean;
  locale: 'fr' | 'en';
  createdAt?: string;
  updatedAt?: string;
}

/** Réponses en cours (visiteur ou onboarding non terminé) : tout est optionnel. */
export type ProfileDraft = Partial<Omit<UserProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>;

export function emptyProfile(userId: string, locale: 'fr' | 'en' = 'fr'): UserProfile {
  return {
    id: null,
    userId,
    displayName: null,
    avatarUrl: null,
    playsFootball: null,
    level: null,
    clubName: null,
    position: null,
    region: null,
    city: null,
    lat: null,
    lng: null,
    playLocations: [],
    frequency: null,
    goals: [],
    favoriteTeamId: null,
    onboardingStep: 0,
    onboardingCompleted: false,
    locale,
  };
}

/** Fusionne un brouillon dans un profil (les champs non définis du brouillon sont ignorés). */
export function mergeDraft(profile: UserProfile, draft: ProfileDraft): UserProfile {
  const next: UserProfile = { ...profile };
  (Object.keys(draft) as (keyof ProfileDraft)[]).forEach((key) => {
    const value = draft[key];
    if (value !== undefined) {
      (next as unknown as Record<string, unknown>)[key] = value;
    }
  });
  return next;
}
