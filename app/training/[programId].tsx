/**
 * Détail d'un programme : ce qu'on va faire, dans quel ordre, avec quel matériel.
 * On veut pouvoir décider en dix secondes si on a le temps et le matériel.
 */
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { Dumbbell } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';

import { Button, Card, Divider, EmptyState, Screen, ScreenHeader, Text } from '@/components/ui';
import { useRequireAuth } from '@/features/data/useData';
import { EXERCISES, getProgram, programExercises } from '@/features/training/catalogue';
import { programDuration, programIntensity } from '@/features/training/types';
import { useTranslation } from '@/i18n';
import { formatClock, formatMinutes } from '@/lib/format';
import { useTheme } from '@/theme/ThemeProvider';

export default function ProgramScreen() {
  const theme = useTheme();
  const { t, locale } = useTranslation();
  const { programId } = useLocalSearchParams<{ programId: string }>();
  const requireAuth = useRequireAuth();

  const program = getProgram(programId ?? '');
  if (!program) {
    return (
      <Screen>
        <ScreenHeader title={t('training.programs')} back size="compact" />
        <EmptyState
          icon={Dumbbell}
          title={t('training.notFound')}
          subtitle={t('training.notFoundHint')}
        />
      </Screen>
    );
  }

  const exercises = programExercises(program);
  const minutes = Math.round(programDuration(program, EXERCISES) / 60);
  const intensity = programIntensity(program, EXERCISES);
  // Le matériel le plus exigeant du programme donne le prérequis global.
  const gearOrder = ['none', 'ball', 'cones', 'wall'] as const;
  const gear = exercises.reduce<(typeof gearOrder)[number]>(
    (worst, exercise) =>
      gearOrder.indexOf(exercise.gear) > gearOrder.indexOf(worst) ? exercise.gear : worst,
    'none',
  );

  return (
    <Screen>
      <ScreenHeader title={t(program.nameKey)} back size="compact" />

      <Text variant="body" color="textSecondary">
        {t(program.descriptionKey)}
      </Text>

      <View style={{ flexDirection: 'row', gap: theme.spacing.md, marginTop: theme.sizes.sectionGap }}>
        <Badge label={formatMinutes(minutes, locale)} />
        <Badge
          label={
            exercises.length === 1
              ? t('training.exercisesCount.one')
              : t('training.exercisesCount.many', { count: exercises.length })
          }
        />
        <Badge label={t(`training.intensityLevels.${intensity}`)} />
      </View>

      <Text variant="caption" color="textSecondary" style={{ marginTop: theme.spacing.md }}>
        {t(`training.gear.${gear}`)}
      </Text>

      <Card tone="surface" style={{ marginTop: theme.sizes.sectionGap }}>
        {exercises.map((exercise, index) => (
          <View key={`${exercise.id}-${index}`}>
            {index > 0 ? <Divider /> : null}
            <View style={{ paddingVertical: theme.spacing.md, flexDirection: 'row', gap: theme.spacing.md }}>
              <Text variant="bodyBold" color="primary" style={{ width: 24 }}>
                {index + 1}
              </Text>
              <View style={{ flex: 1 }}>
                <Text variant="bodyBold">{t(exercise.nameKey)}</Text>
                <Text variant="caption" color="textSecondary" style={{ marginTop: 2 }}>
                  {t(exercise.descriptionKey)}
                </Text>
                <Text variant="label" color="textSecondary" style={{ marginTop: theme.spacing.xs }}>
                  {`${formatClock(exercise.workSeconds)} · ${t(`training.categories.${exercise.category}`)}`}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </Card>

      <Button
        title={t('training.start')}
        glow
        style={{ marginTop: theme.sizes.sectionGap }}
        onPress={() =>
          requireAuth(() => router.push(`/training/session/${program.id}` as Href))
        }
      />
    </Screen>
  );
}

/** Pastille d'information sur fond teinté. */
function Badge({ label }: { label: string }) {
  const theme = useTheme();
  return (
    <View
      style={{
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.radius.pill,
        backgroundColor: theme.colors.primarySoft,
      }}
    >
      <Text variant="label" color="primary">
        {label}
      </Text>
    </View>
  );
}
