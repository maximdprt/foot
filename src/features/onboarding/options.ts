/**
 * Listes de réponses du questionnaire. Chaque option ne porte que sa valeur
 * (enum du modèle), sa clé i18n et son icône : aucun libellé en dur dans les écrans.
 */
import {
  Calendar,
  CalendarCheck,
  CalendarDays,
  CalendarMinus,
  Clock,
  Compass,
  Crosshair,
  Fence,
  Flame,
  Footprints,
  Hand,
  Handshake,
  HeartPulse,
  LandPlot,
  Medal,
  PartyPopper,
  RotateCcw,
  Search,
  Shield,
  Shuffle,
  Sprout,
  Star,
  Trees,
  TrendingUp,
  Trophy,
  Volleyball,
  Warehouse,
  type LucideIcon,
} from 'lucide-react-native';

import {
  FREQUENCY_VALUES,
  GOAL_VALUES,
  LEVEL_VALUES,
  PLAY_LOCATION_VALUES,
  PLAYS_FOOTBALL_VALUES,
  POSITION_VALUES,
  type Frequency,
  type Goal,
  type Level,
  type PlayLocation,
  type PlaysFootball,
  type Position,
} from '@/features/profile/types';

export interface Option<T extends string> {
  value: T;
  /** Clé i18n complète, ex. `onboarding.level.options.leisure`. */
  labelKey: string;
  /** Icône affichée dans la pastille de la carte. */
  icon: LucideIcon;
}

/**
 * Icône de chaque réponse. Elles ne remplacent jamais le libellé : elles
 * servent de repère visuel pour parcourir la liste plus vite.
 */
const ICONS: Record<string, LucideIcon> = {
  // « Tu joues déjà au foot ? »
  regularly: Flame,
  sometimes: Clock,
  returning: RotateCcw,
  // « Ton niveau ? » — `beginner` est partagé avec la question précédente.
  beginner: Sprout,
  leisure: Footprints,
  confirmed: Star,
  competition: Trophy,
  high_level: Medal,
  // « Ton poste préféré ? »
  goalkeeper: Hand,
  defender: Shield,
  midfielder: Compass,
  forward: Crosshair,
  anywhere: Shuffle,
  // « Où joues-tu ? »
  five_indoor: Warehouse,
  futsal: Volleyball,
  club_pitch: LandPlot,
  city_stadium: Fence,
  // « À quelle fréquence ? »
  lt_monthly: CalendarMinus,
  monthly_1_3: Calendar,
  weekly_1: CalendarDays,
  weekly_2_3: CalendarCheck,
  weekly_4_plus: Flame,
  // « Tes objectifs ? »
  improve: TrendingUp,
  fitness: HeartPulse,
  find_matches: Search,
  meet_players: Handshake,
  compete: Trophy,
  fun: PartyPopper,
};

/** `anywhere` existe pour le poste **et** pour le lieu : l'icône diffère. */
const LOCATION_ICONS: Record<string, LucideIcon> = { anywhere: Trees };

function build<T extends string>(
  group: string,
  values: readonly T[],
  overrides: Record<string, LucideIcon> = {},
): Option<T>[] {
  return values.map((value) => ({
    value,
    labelKey: `onboarding.${group}.options.${value}`,
    icon: overrides[value] ?? ICONS[value] ?? Star,
  }));
}

export const PLAYS_OPTIONS: Option<PlaysFootball>[] = build('plays', PLAYS_FOOTBALL_VALUES);
export const LEVEL_OPTIONS: Option<Level>[] = build('level', LEVEL_VALUES);
export const POSITION_OPTIONS: Option<Position>[] = build('position', POSITION_VALUES);
export const PLAY_LOCATION_OPTIONS: Option<PlayLocation>[] = build(
  'playLocations',
  PLAY_LOCATION_VALUES,
  LOCATION_ICONS,
);
export const FREQUENCY_OPTIONS: Option<Frequency>[] = build('frequency', FREQUENCY_VALUES);
export const GOAL_OPTIONS: Option<Goal>[] = build('goals', GOAL_VALUES);

/** Clé i18n d'une valeur d'enum, pour l'affichage en lecture seule (récap, paramètres). */
export function optionLabelKey(group: string, value: string | null | undefined): string | null {
  return value ? `onboarding.${group}.options.${value}` : null;
}
