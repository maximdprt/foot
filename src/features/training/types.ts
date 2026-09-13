/**
 * Modèle de l'entraînement.
 *
 * Le catalogue (exercices, programmes) est **embarqué** : il ne change pas d'un
 * utilisateur à l'autre, il doit fonctionner hors ligne, et il n'a donc rien à
 * faire dans une base. Seul l'historique des séances est propre à l'utilisateur
 * et passe par le backend.
 */
import type { Level } from '@/features/profile/types';

export type ExerciseCategory = 'technique' | 'physical' | 'shooting' | 'defense' | 'goalkeeper';

export const EXERCISE_CATEGORIES: ExerciseCategory[] = [
  'technique',
  'physical',
  'shooting',
  'defense',
  'goalkeeper',
];

/** Matériel nécessaire : sert à filtrer « ce que je peux faire là, tout de suite ». */
export type ExerciseGear = 'none' | 'ball' | 'cones' | 'wall';

export interface Exercise {
  id: string;
  /** Clés i18n : aucun libellé n'est écrit en dur. */
  nameKey: string;
  descriptionKey: string;
  category: ExerciseCategory;
  gear: ExerciseGear;
  /** Durée de travail, en secondes. */
  workSeconds: number;
  /** Récupération après l'exercice, en secondes. */
  restSeconds: number;
  /** Intensité de 1 (léger) à 3 (soutenu). */
  intensity: 1 | 2 | 3;
}

export interface Program {
  id: string;
  nameKey: string;
  descriptionKey: string;
  /** Niveaux visés : sert à mettre en avant les programmes pertinents. */
  levels: Level[];
  exerciseIds: string[];
}

/** Une séance réalisée, conservée dans l'historique de l'utilisateur. */
export interface TrainingSession {
  id: string;
  programId: string;
  /** ISO 8601. */
  startedAt: string;
  completedAt: string;
  /** Exercices réellement terminés (une séance peut être quittée en cours). */
  completedExercises: number;
  totalExercises: number;
  /** Durée effective, en secondes. */
  durationSeconds: number;
}

/** Durée totale d'un programme (travail + récupération), en secondes. */
export function programDuration(program: Program, exercises: Exercise[]): number {
  return program.exerciseIds.reduce((total, id) => {
    const exercise = exercises.find((e) => e.id === id);
    return exercise ? total + exercise.workSeconds + exercise.restSeconds : total;
  }, 0);
}

/** Intensité moyenne d'un programme, arrondie. */
export function programIntensity(program: Program, exercises: Exercise[]): 1 | 2 | 3 {
  const values = program.exerciseIds
    .map((id) => exercises.find((e) => e.id === id)?.intensity)
    .filter((value): value is 1 | 2 | 3 => value !== undefined);
  if (values.length === 0) return 1;
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  return Math.min(3, Math.max(1, Math.round(average))) as 1 | 2 | 3;
}

/** Une séance compte comme terminée à partir de 80 % des exercices. */
export const COMPLETION_RATIO = 0.8;

export function isSessionComplete(session: TrainingSession): boolean {
  if (session.totalExercises === 0) return false;
  return session.completedExercises / session.totalExercises >= COMPLETION_RATIO;
}
