/**
 * Lecteur de séance : l'écran qu'on garde sous les yeux pendant l'entraînement.
 *
 * Il enchaîne préparation → effort → récupération → exercice suivant, avec un
 * minuteur circulaire, un retour haptique à chaque bascule, et l'exercice
 * suivant annoncé pour ne pas être pris au dépourvu.
 *
 * Tout l'état du minuteur tient dans un seul objet, avancé par une fonction
 * pure (`tick`, `advance`) : le rendu n'a rien à recalculer, et une bascule de
 * phase ne peut pas laisser deux compteurs désynchronisés.
 *
 * Quitter en cours enregistre quand même la séance : le temps passé compte.
 */
import { router, useLocalSearchParams } from 'expo-router';
import { Pause, Play, SkipForward, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import { ConfettiBurst } from '@/components/motion';
import { Button, IconButton, ProgressBar, Sheet, Text } from '@/components/ui';
import { recordSession } from '@/features/data/service';
import { getProgram, programExercises } from '@/features/training/catalogue';
import type { Exercise } from '@/features/training/types';
import { useTranslation } from '@/i18n';
import { formatClock, formatMinutes } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { toast } from '@/store/uiStore';
import { useTheme } from '@/theme/ThemeProvider';

/** Temps de préparation avant le premier effort, en secondes. */
const READY_SECONDS = 5;
/** Période du minuteur : assez fine pour que l'anneau soit fluide. */
const TICK_MS = 100;

type Phase = 'ready' | 'work' | 'rest' | 'done';

interface PlayerState {
  index: number;
  phase: Phase;
  /** Temps restant dans la phase courante, en ms. */
  remaining: number;
  /** Durée totale de la phase courante, pour l'anneau. */
  phaseTotal: number;
  /** Efforts menés à leur terme. */
  completed: number;
  /** Temps écoulé depuis le début, en secondes. */
  elapsed: number;
}

function initialState(): PlayerState {
  return {
    index: 0,
    phase: 'ready',
    remaining: READY_SECONDS * 1000,
    phaseTotal: READY_SECONDS * 1000,
    completed: 0,
    elapsed: 0,
  };
}

/** Passe à la phase suivante. Fonction pure : aucun effet de bord. */
function advance(state: PlayerState, exercises: Exercise[]): PlayerState {
  const current = exercises[state.index];

  if (state.phase === 'ready') {
    const work = (current?.workSeconds ?? 0) * 1000;
    return { ...state, phase: 'work', remaining: work, phaseTotal: work };
  }

  const completed = state.phase === 'work' ? state.completed + 1 : state.completed;

  // Une récupération est prévue après l'effort : on la joue avant d'enchaîner.
  if (state.phase === 'work' && (current?.restSeconds ?? 0) > 0) {
    const rest = (current?.restSeconds ?? 0) * 1000;
    return { ...state, phase: 'rest', remaining: rest, phaseTotal: rest, completed };
  }

  const nextIndex = state.index + 1;
  if (nextIndex >= exercises.length) {
    return { ...state, phase: 'done', remaining: 0, phaseTotal: 0, completed };
  }
  const work = (exercises[nextIndex]?.workSeconds ?? 0) * 1000;
  return { ...state, index: nextIndex, phase: 'work', remaining: work, phaseTotal: work, completed };
}

/** Un battement du minuteur : décrémente, et bascule de phase le cas échéant. */
function tick(state: PlayerState, exercises: Exercise[]): PlayerState {
  if (state.phase === 'done') return state;
  const elapsed = state.elapsed + TICK_MS / 1000;
  const remaining = state.remaining - TICK_MS;
  if (remaining > 0) return { ...state, remaining, elapsed };
  return advance({ ...state, remaining: 0, elapsed }, exercises);
}

export default function SessionPlayerScreen() {
  const theme = useTheme();
  const { t, locale } = useTranslation();
  const { programId } = useLocalSearchParams<{ programId: string }>();

  const program = useMemo(() => getProgram(programId ?? ''), [programId]);
  const exercises = useMemo(() => (program ? programExercises(program) : []), [program]);

  const [state, setState] = useState<PlayerState>(initialState);
  const [paused, setPaused] = useState(false);
  const [confirmQuit, setConfirmQuit] = useState(false);

  const startedAt = useRef(new Date().toISOString());
  /** Évite un double enregistrement (fin de séance puis sortie d'écran). */
  const saved = useRef(false);
  /** Dernière phase jouée, pour ne déclencher l'haptique qu'au changement. */
  const lastPhase = useRef<Phase>('ready');

  const missing = !program || exercises.length === 0;

  // Programme inconnu : on sort, mais depuis un effet — jamais pendant le rendu.
  useEffect(() => {
    if (missing) router.back();
  }, [missing]);

  // Minuteur : une seule horloge, arrêtée en pause et à la fin.
  useEffect(() => {
    if (paused || state.phase === 'done' || missing) return undefined;
    const timer = setInterval(() => setState((value) => tick(value, exercises)), TICK_MS);
    return () => clearInterval(timer);
  }, [paused, state.phase, exercises, missing]);

  // Retour haptique au changement de phase : effort, récupération, fin.
  useEffect(() => {
    if (state.phase === lastPhase.current) return;
    lastPhase.current = state.phase;
    if (state.phase === 'work') void haptics.medium();
    else if (state.phase === 'rest') void haptics.light();
    else if (state.phase === 'done') void haptics.success();
  }, [state.phase]);

  /** Enregistre la séance (complète ou interrompue). */
  const save = useCallback(
    async (snapshot: PlayerState) => {
      if (saved.current || !program) return;
      saved.current = true;
      try {
        await recordSession({
          programId: program.id,
          startedAt: startedAt.current,
          completedAt: new Date().toISOString(),
          completedExercises: snapshot.completed,
          totalExercises: exercises.length,
          durationSeconds: Math.round(snapshot.elapsed),
        });
        toast(t('training.player.saved'), 'success');
      } catch {
        toast(t('common.error'), 'error');
      }
    },
    [exercises.length, program, t],
  );

  // La séance terminée est enregistrée aussitôt, sans attendre le tap final.
  useEffect(() => {
    if (state.phase === 'done') void save(state);
  }, [state, save]);

  const quit = useCallback(() => {
    setConfirmQuit(false);
    void save(state).finally(() => router.back());
  }, [save, state]);

  if (missing) return null;

  const current = exercises[state.index];
  const next = exercises[state.index + 1];

  if (state.phase === 'done') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <ConfettiBurst trigger={1} />
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: theme.sizes.screenPadding,
            gap: theme.spacing.md,
          }}
        >
          <Text variant="h1" align="center">
            {t('training.player.doneTitle')}
          </Text>
          <Text variant="body" color="textSecondary" align="center">
            {t('training.player.doneSubtitle', {
              count: state.completed,
              duration: formatMinutes(Math.max(1, Math.round(state.elapsed / 60)), locale),
            })}
          </Text>
        </View>
        <View style={{ paddingHorizontal: theme.sizes.screenPadding, paddingBottom: theme.spacing.lg }}>
          <Button title={t('training.player.doneCta')} glow onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  const phaseLabel =
    state.phase === 'ready'
      ? t('training.player.getReady')
      : state.phase === 'work'
        ? t('training.player.work')
        : t('training.player.rest');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View
        style={{
          paddingHorizontal: theme.sizes.screenPadding,
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing.md,
        }}
      >
        <View style={{ flex: 1 }}>
          <ProgressBar progress={(state.index + 1) / exercises.length} ball />
        </View>
        <IconButton accessibilityLabel={t('training.player.quit')} onPress={() => setConfirmQuit(true)}>
          <X size={24} color={theme.colors.text} strokeWidth={2} />
        </IconButton>
      </View>

      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: theme.sizes.screenPadding,
          gap: theme.spacing.lg,
        }}
      >
        <Text variant="caption" color="textSecondary">
          {t('training.player.exerciseOf', { current: state.index + 1, total: exercises.length })}
        </Text>

        <TimerRing
          remaining={state.remaining}
          total={state.phaseTotal}
          label={phaseLabel}
          resting={state.phase === 'rest'}
        />

        <Text variant="h2" align="center">
          {current ? t(current.nameKey) : ''}
        </Text>
        <Text variant="body" color="textSecondary" align="center">
          {current ? t(current.descriptionKey) : ''}
        </Text>

        {next ? (
          <Text variant="caption" color="textSecondary" align="center">
            {`${t('training.player.next')} · ${t(next.nameKey)}`}
          </Text>
        ) : null}
      </View>

      <View
        style={{
          flexDirection: 'row',
          gap: theme.spacing.md,
          paddingHorizontal: theme.sizes.screenPadding,
          paddingBottom: theme.spacing.lg,
        }}
      >
        <Button
          title={paused ? t('training.player.resume') : t('training.player.pause')}
          variant="secondary"
          icon={
            paused ? (
              <Play size={18} color={theme.colors.text} strokeWidth={2} />
            ) : (
              <Pause size={18} color={theme.colors.text} strokeWidth={2} />
            )
          }
          onPress={() => setPaused((value) => !value)}
          style={{ flex: 1 }}
        />
        <Button
          title={t('training.player.skip')}
          icon={<SkipForward size={18} color={theme.colors.onPrimary} strokeWidth={2} />}
          onPress={() => setState((value) => advance(value, exercises))}
          style={{ flex: 1 }}
        />
      </View>

      <Sheet
        visible={confirmQuit}
        onClose={() => setConfirmQuit(false)}
        title={t('training.player.quitTitle')}
        subtitle={t('training.player.quitSubtitle')}
      >
        <View style={{ gap: theme.spacing.sm, paddingBottom: theme.spacing.sm }}>
          <Button title={t('training.player.quit')} variant="danger" onPress={quit} />
          <Button title={t('common.cancel')} variant="text" onPress={() => setConfirmQuit(false)} />
        </View>
      </Sheet>
    </SafeAreaView>
  );
}

/** Diamètre du minuteur circulaire, en px. */
const RING_SIZE = 220;
const RING_STROKE = 12;

/**
 * Minuteur circulaire : l'anneau se vide au fil du temps.
 * Le tracé est recalculé à chaque battement plutôt qu'animé — la valeur change
 * déjà dix fois par seconde, l'anneau est donc fluide sans `Animated`.
 */
function TimerRing({
  remaining,
  total,
  label,
  resting,
}: {
  remaining: number;
  total: number;
  label: string;
  resting: boolean;
}) {
  const theme = useTheme();
  const radius = (RING_SIZE - RING_STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = total > 0 ? Math.max(0, Math.min(1, remaining / total)) : 0;
  const color = resting ? theme.colors.textSecondary : theme.colors.primary;

  return (
    <View style={{ width: RING_SIZE, height: RING_SIZE, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={RING_SIZE} height={RING_SIZE} style={{ position: 'absolute' }}>
        <Circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={radius}
          stroke={theme.colors.surface}
          strokeWidth={RING_STROKE}
          fill="none"
        />
        <Circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={radius}
          stroke={color}
          strokeWidth={RING_STROKE}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - ratio)}
          // Départ en haut du cercle plutôt qu'à droite.
          transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
        />
      </Svg>
      <Text variant="h1" style={{ fontSize: 48, lineHeight: 56 }}>
        {formatClock(remaining / 1000)}
      </Text>
      <Text variant="caption" color={resting ? 'textSecondary' : 'primary'}>
        {label}
      </Text>
    </View>
  );
}
