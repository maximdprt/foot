/**
 * Listes de réponses du questionnaire : grandes cartes sélectionnables au tap
 * (aucun champ texte quand on peut l'éviter, section 4.3).
 */
import React from 'react';
import { Animated, View } from 'react-native';

import { SelectableCard, Text } from '@/components/ui';
import { useTranslation } from '@/i18n';
import { staggerDelay, useEntrance } from '@/lib/motion';
import { useTheme } from '@/theme/ThemeProvider';

import type { Option } from './options';

/**
 * Une réponse qui entre avec le décalage de son rang.
 * Chaque carte a son propre hook : le nombre de réponses d'un écran est fixe,
 * l'ordre des hooks est donc stable.
 */
function StaggeredOption({ index, children }: { index: number; children: React.ReactNode }) {
  const entrance = useEntrance({ delay: staggerDelay(index), from: 14, duration: 380 });
  return <Animated.View style={entrance}>{children}</Animated.View>;
}

interface SingleChoiceProps<T extends string> {
  options: Option<T>[];
  value: T | null | undefined;
  onChange: (value: T) => void;
}

/** Choix unique : un tap sélectionne (et remplace la sélection précédente). */
export function SingleChoice<T extends string>({ options, value, onChange }: SingleChoiceProps<T>) {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <View style={{ gap: theme.spacing.md }}>
      {options.map((option, index) => (
        <StaggeredOption key={option.value} index={index}>
          <SelectableCard
            title={t(option.labelKey)}
            icon={option.icon}
            selected={option.value === value}
            onPress={() => onChange(option.value)}
          />
        </StaggeredOption>
      ))}
    </View>
  );
}

interface MultiChoiceProps<T extends string> {
  options: Option<T>[];
  values: T[];
  onChange: (values: T[]) => void;
  /** Nombre maximum de réponses (les autres cartes se désactivent une fois atteint). */
  max?: number;
  /** Message affiché quand le maximum est atteint. */
  maxHint?: string;
}

/** Choix multiple, avec plafond optionnel (ex. 3 objectifs maximum). */
export function MultiChoice<T extends string>({
  options,
  values,
  onChange,
  max,
  maxHint,
}: MultiChoiceProps<T>) {
  const theme = useTheme();
  const { t } = useTranslation();
  const atMax = max !== undefined && values.length >= max;

  const toggle = (value: T) => {
    if (values.includes(value)) onChange(values.filter((v) => v !== value));
    else if (!atMax) onChange([...values, value]);
  };

  return (
    <View style={{ gap: theme.spacing.md }}>
      {options.map((option, index) => {
        const selected = values.includes(option.value);
        return (
          <StaggeredOption key={option.value} index={index}>
            <SelectableCard
              title={t(option.labelKey)}
              icon={option.icon}
              selected={selected}
              disabled={!selected && atMax}
              onPress={() => toggle(option.value)}
            />
          </StaggeredOption>
        );
      })}
      {atMax && maxHint ? (
        <Text variant="caption" color="textSecondary" accessibilityLiveRegion="polite">
          {maxHint}
        </Text>
      ) : null}
    </View>
  );
}
