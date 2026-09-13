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

export type MatchFormatRow = 'five' | 'futsal' | 'seven' | 'eleven';
export type MatchLevelRow = 'all' | 'leisure' | 'confirmed' | 'competition';
export type MatchStatusRow = 'open' | 'cancelled' | 'played';
export type VenueKindRow = 'five_indoor' | 'futsal' | 'club_pitch' | 'city_stadium';
export type BookingStatusRow = 'confirmed' | 'cancelled';
export type FriendshipStatusRow = 'pending' | 'accepted';
export type ActivityKindRow =
  | 'match_created'
  | 'match_joined'
  | 'session_completed'
  | 'booking_created'
  | 'friend_added'
  | 'badge_earned';

export type MatchRow = {
  id: string;
  organizer_id: string;
  format: MatchFormatRow;
  level: MatchLevelRow;
  kickoff_at: string;
  duration_minutes: number;
  venue_name: string;
  city: string;
  max_players: number;
  notes: string | null;
  status: MatchStatusRow;
  created_at: string;
};

/** Profil embarqué dans une jointure PostgREST (`user_profiles(...)`). */
export type EmbeddedProfile = {
  display_name: string | null;
  avatar_url: string | null;
  favorite_team_id: string | null;
  city: string | null;
} | null;

export type MatchParticipantRow = {
  match_id: string;
  user_id: string;
  joined_at: string;
};

export type TrainingSessionRow = {
  id: string;
  user_id: string;
  program_id: string;
  started_at: string;
  completed_at: string;
  completed_exercises: number;
  total_exercises: number;
  duration_seconds: number;
};

export type BookingRow = {
  id: string;
  user_id: string;
  venue_id: string;
  venue_kind: VenueKindRow;
  city: string;
  starts_at: string;
  ends_at: string;
  price: number | null;
  status: BookingStatusRow;
  created_at: string;
};

export type FriendshipRow = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatusRow;
  created_at: string;
};

export type ActivityRow = {
  id: string;
  user_id: string;
  kind: ActivityKindRow;
  subject: string | null;
  created_at: string;
};

/**
 * Vue `public_profiles` : les seules colonnes qu'un joueur peut voir d'un autre.
 * `user_profiles` reste fermee — elle contient la position et les reponses au
 * questionnaire.
 */
export type PublicProfileRow = {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  favorite_team_id: string | null;
  city: string | null;
};

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
      matches: {
        Row: MatchRow;
        Insert: Partial<MatchRow> & { organizer_id: string };
        Update: Partial<MatchRow>;
        Relationships: [];
      };
      match_participants: {
        Row: MatchParticipantRow;
        Insert: MatchParticipantRow;
        Update: Partial<MatchParticipantRow>;
        Relationships: [];
      };
      training_sessions: {
        Row: TrainingSessionRow;
        Insert: Partial<TrainingSessionRow> & { user_id: string };
        Update: Partial<TrainingSessionRow>;
        Relationships: [];
      };
      bookings: {
        Row: BookingRow;
        Insert: Partial<BookingRow> & { user_id: string };
        Update: Partial<BookingRow>;
        Relationships: [];
      };
      friendships: {
        Row: FriendshipRow;
        Insert: Partial<FriendshipRow> & { requester_id: string; addressee_id: string };
        Update: Partial<FriendshipRow>;
        Relationships: [];
      };
      activities: {
        Row: ActivityRow;
        Insert: Partial<ActivityRow> & { user_id: string };
        Update: Partial<ActivityRow>;
        Relationships: [];
      };
    };
    Views: {
      public_profiles: {
        Row: PublicProfileRow;
        Relationships: [];
      };
    };
    Functions: { [_ in never]: never };
    Enums: {
      match_format: MatchFormatRow;
      match_level: MatchLevelRow;
      match_status: MatchStatusRow;
      venue_kind: VenueKindRow;
      booking_status: BookingStatusRow;
      friendship_status: FriendshipStatusRow;
      activity_kind: ActivityKindRow;
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
