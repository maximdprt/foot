/**
 * Catalogue d'entraînement embarqué : 16 exercices et 5 programmes.
 *
 * Tous les libellés passent par l'i18n (`training.catalogue.*`), comme le reste
 * de l'app. Les exercices sont volontairement réalisables seul, avec au plus un
 * ballon, des plots et un mur : c'est le matériel d'un joueur amateur.
 */
import type { Level } from '@/features/profile/types';

import type { Exercise, ExerciseCategory, Program } from './types';

function exercise(
  id: string,
  category: ExerciseCategory,
  gear: Exercise['gear'],
  workSeconds: number,
  restSeconds: number,
  intensity: 1 | 2 | 3,
): Exercise {
  return {
    id,
    nameKey: `training.catalogue.exercises.${id}.name`,
    descriptionKey: `training.catalogue.exercises.${id}.description`,
    category,
    gear,
    workSeconds,
    restSeconds,
    intensity,
  };
}

export const EXERCISES: Exercise[] = [
  // Technique
  exercise('juggling', 'technique', 'ball', 120, 45, 2),
  exercise('wall_passes', 'technique', 'wall', 90, 30, 2),
  exercise('cone_dribble', 'technique', 'cones', 90, 45, 2),
  exercise('first_touch', 'technique', 'wall', 90, 30, 2),
  exercise('weak_foot', 'technique', 'ball', 120, 45, 2),
  // Physique
  exercise('ladder_steps', 'physical', 'none', 60, 30, 3),
  exercise('sprint_intervals', 'physical', 'none', 45, 60, 3),
  exercise('core_plank', 'physical', 'none', 60, 30, 2),
  exercise('jump_squats', 'physical', 'none', 45, 45, 3),
  exercise('mobility', 'physical', 'none', 180, 0, 1),
  // Frappe
  exercise('shooting_placement', 'shooting', 'ball', 120, 60, 2),
  exercise('volley_control', 'shooting', 'wall', 90, 45, 3),
  // Défense
  exercise('defensive_slides', 'defense', 'cones', 60, 45, 3),
  exercise('one_v_one_stance', 'defense', 'none', 60, 30, 2),
  // Gardien
  exercise('gk_reflexes', 'goalkeeper', 'wall', 90, 45, 3),
  exercise('gk_footwork', 'goalkeeper', 'cones', 60, 30, 2),
];

const byId = new Map(EXERCISES.map((item) => [item.id, item]));

export function getExercise(id: string): Exercise | null {
  return byId.get(id) ?? null;
}

function program(id: string, levels: Level[], exerciseIds: string[]): Program {
  return {
    id,
    nameKey: `training.catalogue.programs.${id}.name`,
    descriptionKey: `training.catalogue.programs.${id}.description`,
    levels,
    exerciseIds,
  };
}

export const PROGRAMS: Program[] = [
  program('quick_touch', ['beginner', 'leisure', 'confirmed', 'competition', 'high_level'], [
    'juggling',
    'wall_passes',
    'first_touch',
    'mobility',
  ]),
  program('first_steps', ['beginner', 'leisure'], [
    'mobility',
    'juggling',
    'cone_dribble',
    'wall_passes',
    'core_plank',
  ]),
  program('sharp_finish', ['confirmed', 'competition', 'high_level'], [
    'mobility',
    'cone_dribble',
    'shooting_placement',
    'volley_control',
    'sprint_intervals',
  ]),
  program('engine', ['leisure', 'confirmed', 'competition', 'high_level'], [
    'mobility',
    'ladder_steps',
    'sprint_intervals',
    'jump_squats',
    'core_plank',
  ]),
  program('keeper_drills', ['beginner', 'leisure', 'confirmed', 'competition', 'high_level'], [
    'mobility',
    'gk_footwork',
    'gk_reflexes',
    'defensive_slides',
  ]),
];

export function getProgram(id: string): Program | null {
  return PROGRAMS.find((item) => item.id === id) ?? null;
}

/** Exercices d'un programme, dans l'ordre, les identifiants inconnus écartés. */
export function programExercises(program: Program): Exercise[] {
  return program.exerciseIds
    .map((id) => byId.get(id))
    .filter((item): item is Exercise => item !== undefined);
}

/**
 * Programmes mis en avant pour un joueur : ceux qui ciblent son niveau d'abord,
 * puis les autres — la liste reste complète, seul l'ordre change.
 */
export function programsForLevel(level: Level | null | undefined): Program[] {
  if (!level) return PROGRAMS;
  const matching = PROGRAMS.filter((item) => item.levels.includes(level));
  const rest = PROGRAMS.filter((item) => !item.levels.includes(level));
  return [...matching, ...rest];
}
