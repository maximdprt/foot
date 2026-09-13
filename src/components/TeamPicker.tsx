/**
 * Sélecteur d'équipe (section 6.3), partagé par l'onboarding et
 * Paramètres > Apparence : bottom sheet plein écran, recherche par nom /
 * abréviation / ville, liste groupée par championnat avec en-têtes collants,
 * preview immédiate du thème en arrière-plan, bouton « Confirmer » en bas.
 */
import { Check, Search } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, SectionList, View } from 'react-native';

import { Button, Input, Sheet, TeamDot, Text } from '@/components/ui';
import { useTranslation } from '@/i18n';
import { haptics } from '@/lib/haptics';
import { NEUTRAL_TEAM } from '@/theme/buildTheme';
import { getTeamDisplayName, groupTeamsByLeague, searchTeams } from '@/theme/teams';
import { useTheme } from '@/theme/ThemeProvider';
import type { TeamEntry } from '@/theme/types';
import { useThemeStore } from '@/store/themeStore';

interface TeamPickerProps {
  visible: boolean;
  onClose: () => void;
  /** Appelé avec l'identifiant retenu (« none » = thème Neutre). */
  onConfirm: (teamId: string) => void;
  selectedTeamId: string;
}

export function TeamPicker({ visible, onClose, onConfirm, selectedTeamId }: TeamPickerProps) {
  const theme = useTheme();
  const { t, locale } = useTranslation();
  const setPreviewTeam = useThemeStore((s) => s.setPreviewTeam);
  const clearPreview = useThemeStore((s) => s.clearPreview);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(selectedTeamId);
  const [wasVisible, setWasVisible] = useState(visible);

  // À l'ouverture : on repart de l'équipe courante et on efface la recherche.
  // Ajustement d'état pendant le rendu (motif React) plutôt que dans un effet.
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setSelected(selectedTeamId);
      setQuery('');
    }
  }

  const sections = useMemo(
    () => groupTeamsByLeague(searchTeams(query, locale)),
    [query, locale],
  );

  const select = useCallback(
    (teamId: string) => {
      void haptics.selection();
      setSelected(teamId);
      // Preview live : le thème de l'app change immédiatement, sans être enregistré.
      setPreviewTeam(teamId);
    },
    [setPreviewTeam],
  );

  const close = useCallback(() => {
    clearPreview();
    onClose();
  }, [clearPreview, onClose]);

  const confirm = useCallback(() => {
    clearPreview();
    onConfirm(selected);
  }, [clearPreview, onConfirm, selected]);

  const renderRow = useCallback(
    (team: TeamEntry, subtitle?: string) => {
      const isSelected = team.id === selected;
      return (
        <Pressable
          onPress={() => select(team.id)}
          accessibilityRole="button"
          accessibilityState={{ selected: isSelected }}
          accessibilityLabel={getTeamDisplayName(team, locale)}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.spacing.md,
            minHeight: theme.sizes.touchTarget,
            paddingVertical: theme.spacing.md,
            paddingHorizontal: theme.spacing.sm,
            borderRadius: theme.radius.md,
            backgroundColor: isSelected ? theme.colors.primarySoft : 'transparent',
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <TeamDot team={team} size={32} />
          <View style={{ flex: 1 }}>
            <Text variant="bodyBold" numberOfLines={1} color={isSelected ? 'primary' : 'text'}>
              {getTeamDisplayName(team, locale)}
            </Text>
            {subtitle ?? team.city ? (
              <Text variant="caption" color="textSecondary" numberOfLines={1}>
                {subtitle ?? [team.shortName, team.city].filter(Boolean).join(' · ')}
              </Text>
            ) : null}
          </View>
          {isSelected ? <Check size={20} color={theme.colors.primary} strokeWidth={2.5} /> : null}
        </Pressable>
      );
    },
    [locale, select, selected, theme],
  );

  return (
    <Sheet
      visible={visible}
      onClose={close}
      fullScreen
      title={t('onboarding.team.title')}
      footer={<Button title={t('onboarding.team.confirm')} onPress={confirm} />}
    >
      <Input
        value={query}
        onChangeText={setQuery}
        placeholder={t('onboarding.team.searchPlaceholder')}
        accessibilityLabel={t('common.search')}
        autoCorrect={false}
        leftIcon={<Search size={18} color={theme.colors.textSecondary} strokeWidth={2} />}
        containerStyle={{ marginBottom: theme.spacing.md }}
      />
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          // « Aucune équipe » toujours en tête de liste (thème Neutre).
          query.trim().length === 0
            ? renderRow(NEUTRAL_TEAM, t('onboarding.team.noneSubtitle'))
            : null
        }
        ListEmptyComponent={
          <Text
            variant="body"
            color="textSecondary"
            align="center"
            style={{ paddingVertical: theme.spacing.xxl }}
          >
            {t('onboarding.team.noResults')}
          </Text>
        }
        renderSectionHeader={({ section }) => (
          <View
            style={{
              backgroundColor: theme.colors.background,
              paddingTop: theme.spacing.md,
              paddingBottom: theme.spacing.xs,
            }}
          >
            <Text
              variant="caption"
              color="textSecondary"
              style={{ textTransform: 'uppercase', letterSpacing: 0.6 }}
            >
              {t(`leagues.${section.league}`)}
            </Text>
          </View>
        )}
        renderItem={({ item }) => renderRow(item)}
        contentContainerStyle={{ paddingBottom: theme.spacing.lg }}
      />
    </Sheet>
  );
}
