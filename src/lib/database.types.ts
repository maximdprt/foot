/**
 * Types de la base Supabase (miroir de `supabase/schema.sql`).
 * Écrits à la main pour rester lisibles ; régénérables avec
 * `npx supabase gen types typescript --project-id <id> > src/lib/database.types.ts`.
 */

export type PlaysFootballRow = 'regularly' | 'sometimes' | 'returning' | 'beginner';
export type LevelRow = 'beginner' | 'leisure' | 'confirmed' | 'competition' | 'high_level';
export type PositionRow = 'goalkeeper' | 'defender' | 'midfielder' | 'forward' | 'anywhere';
export type PlayLocationRow = 'five_indoor' | 'futsal' | 'club_pitch' | 'city_stadium' | 'anywhere';
export type FrequencyRow = 'lt_monthly' | 'monthly_1_3' | 'weekly_1' | 'weekly_2_3' | 'weekly_4_plus';
export type GoalRow = 'improve' | 'fitness' | 'find_matches' | 'meet_players' | 'compete' | 'fun';

export type UserProfileRow = {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  plays_football: PlaysFootballRow | null;
  level: LevelRow | null;
  club_name: string | null;
  position: PositionRow | null;
  region: string | null;
  city: string | null;
  lat: number | null;
  lng: number | null;
  play_locations: PlayLocationRow[] | null;
  frequency: FrequencyRow | null;
  goals: GoalRow[] | null;
  favorite_team_id: string | null;
  onboarding_step: number;
  onboarding_completed: boolean;
  locale: string;
  created_at: string;
  updated_at: string;
}

export type UserSettingsRow = {
  user_id: string;
  notifications: Record<string, unknown>;
  privacy: Record<string, unknown>;
  appearance: Record<string, unknown>;
  updated_at: string;
}

export type TeamRow = {
  id: string;
  name: string;
  short_name: string;
  city: string | null;
  country: string | null;
  league: string;
  colors: Record<string, string>;
  theme_override: Record<string, string> | null;
  logo_url: string | null;
  data_version: string;
}

export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: UserProfileRow;
        Insert: Partial<UserProfileRow> & { user_id: string };
        Update: Partial<UserProfileRow>;
        Relationships: [];
      };
      user_settings: {
        Row: UserSettingsRow;
        Insert: Partial<UserSettingsRow> & { user_id: string };
        Update: Partial<UserSettingsRow>;
        Relationships: [];
      };
      teams: {
        Row: TeamRow;
        Insert: TeamRow;
        Update: Partial<TeamRow>;
        Relationships: [];
      };
    };
    // Idiome des types générés par Supabase pour « aucune vue / fonction ».
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: {
      plays_football: PlaysFootballRow;
      player_level: LevelRow;
      player_position: PositionRow;
      play_location: PlayLocationRow;
      play_frequency: FrequencyRow;
      player_goal: GoalRow;
    };
    CompositeTypes: { [_ in never]: never };
  };
}
