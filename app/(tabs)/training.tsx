/**
 * Onglet Entraînement : les programmes, mis en avant selon le niveau déclaré
 * pendant l'onboarding, puis l'historique des séances.
 */
import { router, type Href } from 'expo-router';
import { Dumbbell, Flame } from 'lucide-react-native';
import React from 'react';
import { Animated, View } from 'react-native';

import { Card, EmptyState, Screen, ScreenHeader, StatTile, Text } from '@/components/ui';
import { useRefresh, usePlayerStats } from '@/features/data/useData';
import { EXERCISES, programExercises, programsForLevel } from '@/features/training/catalogue';
import {
  isSessionComplete,
  programDuration,
  programIntensity,
  type Program,
} from '@/features/training/types';
import { useTranslation } from '@/i18n';
import { formatMinutes, formatRelative } from '@/lib/format';
import { staggerDelay, useEntrance } from '@/lib/motion';
import { useDataStore } from '@/store/dataStore';
import { useProfileStore } from '@/store/profileStore';
import { useTheme } from '@/theme/ThemeProvider';

export default function TrainingScreen() {
  const theme = useTheme();
  const { t, locale } = useTranslation();
  const { refreshing, refresh } = useRefresh();
  const sessions = useDataStore((s) => s.sessions);
  const stats = usePlayerStats();
  const level = useProfileStore((s) => s.draft.level ?? s.profile?.level ?? null);

  const programs = programsForLevel(level);
  const completed = sessions.filter(isSessionComplete);

  return (
    <Screen onRefresh={refresh} refreshing={refreshing}>
      <ScreenHeader title={t('training.title')} />

      <View style={{ flexDirection: 'row', gap: theme.spacing.md, marginBottom: theme.sizes.sectionGap }}>
        <StatTile
          label={t('profile.stats.sessionsCompleted')}
          value={stats.sessionsCompleted}
          highlight
        />
        <StatTile
          label={t('profile.stats.trainingMinutes')}
          value={stats.trainingMinutes}
          suffix={` ${t('common.min')}`}
        />
        <StatTile label={t('profile.stats.currentStreakDays')} value={stats.currentStreakDays} />
      </View>

      <Text variant="h3" style={{ marginBottom: theme.spacing.md }}>
        {t('training.programs')}
      </Text>
      <View style={{ gap: theme.spacing.md }}>
        {programs.map((program, index) => (
          <ProgramRow key={program.id} program={program} index={index} />
        ))}
      </View>

      <Text
        variant="h3"
        style={{ marginTop: theme.sizes.sectionGap, marginBottom: theme.spacing.md }}
      >
        {t('training.history')}
      </Text>

      {completed.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title={t('training.historyEmpty')}
          subtitle={t('training.historyEmptyHint')}
          animate={false}
        />
      ) : (
        <View style={{ gap: theme.spacing.sm }}>
          {completed.slice(0, 10).map((session) => (
            <Card key={session.id} tone="surface" size="sm" padding={theme.spacing.md}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
                <Flame size={18} color={theme.colors.primary} strokeWidth={2} />
                <View style={{ flex: 1 }}>
                  <Text variant="bodyBold" numberOfLines={1}>
                    {t(`training.catalogue.programs.${session.programId}.name`)}
                  </Text>
                  <Text variant="caption" color="textSecondary">
                    {`${formatRelative(session.completedAt, locale)} · ${formatMinutes(
                      Math.round(session.durationSeconds / 60),
                      locale,
                    )}`}
                  </Text>
                </View>
                <Text variant="caption" color="textSecondary">
                  {`${session.completedExercises}/${session.totalExercises}`}
                </Text>
              </View>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}

/** Carte d'un programme : durée, nombre d'exercices, intensité. */
function ProgramRow({ program, index }: { program: Program; index: number }) {
  const theme = useTheme();
  const { t, locale } = useTranslation();
  const entrance = useEntrance({ delay: staggerDelay(index), from: 14 });

  const exercises = programExercises(program);
  const minutes = Math.round(programDuration(program, EXERCISES) / 60);
  const intensity = programIntensity(program, EXERCISES);

  return (
    <Animated.View style={entrance}>
      <Card
        tone="surface"
        onPress={() => router.push(`/training/${program.id}` as Href)}
        accessibilityLabel={t(program.nameKey)}
      >
        <Text variant="bodyBold">{t(program.nameKey)}</Text>
        <Text variant="caption" color="textSecondary" style={{ marginTop: theme.spacing.xxs }}>
          {t(program.descriptionKey)}
        </Text>
        <View style={{ flexDirection: 'row', gap: theme.spacing.md, marginTop: theme.spacing.md }}>
          <Text variant="label" color="primary">
            {formatMinutes(minutes, locale)}
          </Text>
          <Text variant="label" color="textSecondary">
            {exercises.length === 1
              ? t('training.exercisesCount.one')
              : t('training.exercisesCount.many', { count: exercises.length })}
          </Text>
          <Text variant="label" color="textSecondary">
            {t(`training.intensityLevels.${intensity}`)}
          </Text>
        </View>
      </Card>
    </Animated.View>
  );
}
