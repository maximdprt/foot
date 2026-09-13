/**
 * Onboarding — écran 4 : club actuel (facultatif).
 *
 * La Fédération française de football ne publie pas d'API ouverte sur sa base
 * de clubs : les suggestions viennent des clubs professionnels français
 * embarqués dans `teams.json`, et la saisie libre reste toujours possible.
 */
import { Search } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';

import { Button, Chip, Input, Text } from '@/components/ui';
import { QuestionScreen } from '@/features/onboarding/QuestionScreen';
import { useOnboarding } from '@/features/onboarding/useOnboarding';
import { useTranslation } from '@/i18n';
import { normalizeSearch } from '@/lib/validation';
import { getTeamDisplayName, TEAMS } from '@/theme/teams';
import { useTheme } from '@/theme/ThemeProvider';

/** Clubs français embarqués, utilisés comme suggestions d'autocomplétion. */
const FRENCH_CLUBS = TEAMS.filter((team) => team.league === 'ligue1' || team.league === 'ligue2');

export default function ClubScreen() {
  const theme = useTheme();
  const { t, locale } = useTranslation();
  const controller = useOnboarding('club');
  const { draft, set } = controller;
  const [query, setQuery] = useState(draft.clubName ?? '');

  const suggestions = useMemo(() => {
    const q = normalizeSearch(query);
    if (q.length < 2) return [];
    return FRENCH_CLUBS.filter((team) =>
      [getTeamDisplayName(team, locale), team.shortName, team.city]
        .map(normalizeSearch)
        .some((value) => value.includes(q)),
    ).slice(0, 8);
  }, [query, locale]);

  const trimmed = query.trim();
  const exactMatch = suggestions.some(
    (team) => normalizeSearch(getTeamDisplayName(team, locale)) === normalizeSearch(trimmed),
  );

  const choose = (name: string) => {
    setQuery(name);
    set({ clubName: name });
  };

  return (
    <QuestionScreen
      controller={controller}
      title={t('onboarding.club.title')}
      subtitle={t('onboarding.club.subtitle')}
      onContinue={() => void controller.next({ clubName: trimmed || null })}
      footer={
        <Button
          title={t('onboarding.club.noClub')}
          variant="secondary"
          onPress={() => {
            setQuery('');
            void controller.next({ clubName: null });
          }}
        />
      }
    >
      <Input
        value={query}
        onChangeText={(value) => {
          setQuery(value);
          set({ clubName: value.trim() || null });
        }}
        placeholder={t('onboarding.club.placeholder')}
        accessibilityLabel={t('onboarding.club.placeholder')}
        autoCorrect={false}
        leftIcon={<Search size={18} color={theme.colors.textSecondary} strokeWidth={2} />}
      />

      <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.sm }}>
        {suggestions.map((team) => (
          <Chip
            key={team.id}
            label={`${getTeamDisplayName(team, locale)}${team.city ? ` · ${team.city}` : ''}`}
            selected={normalizeSearch(draft.clubName ?? '') === normalizeSearch(getTeamDisplayName(team, locale))}
            onPress={() => choose(getTeamDisplayName(team, locale))}
          />
        ))}

        {trimmed.length >= 2 && !exactMatch ? (
          <Text variant="caption" color="textSecondary" style={{ marginTop: theme.spacing.xs }}>
            {suggestions.length === 0
              ? t('onboarding.club.noResults')
              : t('onboarding.club.useFree', { name: trimmed })}
          </Text>
        ) : null}
      </View>
    </QuestionScreen>
  );
}
