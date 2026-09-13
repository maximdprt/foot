/**
 * Écran de debug thème (section 6.2), déverrouillé par 5 taps sur la version.
 * Affiche tous les tokens du thème courant, ses métadonnées, un aperçu des
 * composants, et une « galerie » qui fait défiler tous les thèmes d'équipes.
 */
import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

import {
  Button,
  Card,
  Chip,
  Divider,
  Input,
  ListItem,
  ListSection,
  ProgressBar,
  Screen,
  ScreenHeader,
  SelectableCard,
  TeamDot,
  Text,
  Toggle,
} from '@/components/ui';
import { useTranslation } from '@/i18n';
import { contrastRatio } from '@/lib/contrast';
import { useThemeStore } from '@/store/themeStore';
import { getTeam, getTeamDisplayName, TEAMS, TEAMS_SEASON, TEAMS_VERSION } from '@/theme/teams';
import { useTheme } from '@/theme/ThemeProvider';
import type { ColorToken } from '@/theme/types';

/** Durée d'affichage de chaque équipe en mode galerie (ms). */
const GALLERY_INTERVAL = 900;

export default function DebugThemeScreen() {
  const theme = useTheme();
  const { t, locale } = useTranslation();
  const setPreviewTeam = useThemeStore((s) => s.setPreviewTeam);
  const clearPreview = useThemeStore((s) => s.clearPreview);
  const previewTeamId = useThemeStore((s) => s.previewTeamId);
  const [galleryRunning, setGalleryRunning] = useState(false);
  const indexRef = useRef(0);

  // Galerie : défilement automatique de tous les thèmes pour contrôle visuel.
  useEffect(() => {
    if (!galleryRunning) return undefined;
    const timer = setInterval(() => {
      indexRef.current = (indexRef.current + 1) % TEAMS.length;
      setPreviewTeam(TEAMS[indexRef.current].id);
    }, GALLERY_INTERVAL);
    return () => clearInterval(timer);
  }, [galleryRunning, setPreviewTeam]);

  // La preview ne doit jamais survivre à la sortie de l'écran.
  useEffect(() => () => clearPreview(), [clearPreview]);

  const colorTokens = Object.keys(theme.colors) as ColorToken[];
  const previewTeam = previewTeamId ? getTeam(previewTeamId) : null;

  return (
    <Screen>
      <ScreenHeader
        title={t('settings.debug.title')}
        back
        size="compact"
        onBack={() => {
          setGalleryRunning(false);
          clearPreview();
        }}
      />

      <Text variant="caption" color="textSecondary" style={{ marginBottom: theme.sizes.sectionGap }}>
        {t('settings.debug.teamsCount', {
          count: TEAMS.length,
          season: TEAMS_SEASON,
          version: TEAMS_VERSION,
        })}
      </Text>

      {/* Galerie */}
      <Card tone="surface" style={{ marginBottom: theme.sizes.sectionGap }}>
        <Text variant="h3">{t('settings.debug.gallery')}</Text>
        {previewTeam ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: theme.spacing.md,
              marginTop: theme.spacing.md,
            }}
          >
            <TeamDot team={previewTeam} size={32} />
            <Text variant="bodyBold">{getTeamDisplayName(previewTeam, locale)}</Text>
          </View>
        ) : null}
        <Button
          title={galleryRunning ? t('settings.debug.galleryStop') : t('settings.debug.galleryStart')}
          variant={galleryRunning ? 'secondary' : 'primary'}
          style={{ marginTop: theme.spacing.lg }}
          onPress={() => {
            if (galleryRunning) {
              setGalleryRunning(false);
              clearPreview();
            } else {
              setGalleryRunning(true);
              setPreviewTeam(TEAMS[indexRef.current].id);
            }
          }}
        />
      </Card>

      {/* Métadonnées du thème */}
      <ListSection title={t('settings.debug.meta')}>
        <ListItem title="teamId" value={theme.meta.teamId} right="none" />
        <ListItem title="teamName" value={theme.meta.teamName} right="none" />
        <ListItem title="mode" value={theme.meta.mode} right="none" />
        <ListItem title="overrideApplied" value={String(theme.meta.overrideApplied)} right="none" />
        <ListItem title="primaryAdjusted" value={String(theme.meta.primaryAdjusted)} right="none" />
        <ListItem title="originalPrimary" value={theme.meta.originalPrimary} right="none" />
        <ListItem title="primaryContrast" value={`${theme.meta.primaryContrast}:1`} right="none" />
      </ListSection>

      {/* Tokens de couleur */}
      <Text variant="h3" style={{ marginBottom: theme.spacing.md }}>
        {t('settings.debug.tokens')}
      </Text>
      <Card tone="surface" style={{ marginBottom: theme.sizes.sectionGap }}>
        {colorTokens.map((token, index) => (
          <View key={token}>
            {index > 0 ? <Divider /> : null}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: theme.spacing.md,
                paddingVertical: theme.spacing.sm,
              }}
            >
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: theme.radius.sm,
                  backgroundColor: theme.colors[token],
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                }}
              />
              <Text variant="body" style={{ flex: 1 }}>
                {token}
              </Text>
              <Text variant="caption" color="textSecondary">
                {theme.colors[token]}
              </Text>
              <Text variant="caption" color="textSecondary">
                {contrastRatio(theme.colors[token].slice(0, 7), theme.colors.background).toFixed(2)}:1
              </Text>
            </View>
          </View>
        ))}
      </Card>

      {/* Aperçu des composants */}
      <Text variant="h3" style={{ marginBottom: theme.spacing.md }}>
        {t('settings.debug.preview')}
      </Text>
      <View style={{ gap: theme.spacing.md, marginBottom: theme.spacing.xxl }}>
        <Button title="Primary" />
        <Button title="Secondary" variant="secondary" />
        <Button title="Text" variant="text" />
        <Button title="Danger" variant="danger" />
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          <Chip label="Chip" selected />
          <Chip label="Chip" />
        </View>
        <ProgressBar progress={0.6} />
        <Input placeholder="Input" accessibilityLabel="Input" />
        <SelectableCard title="SelectableCard" selected onPress={() => undefined} />
        <SelectableCard title="SelectableCard" selected={false} onPress={() => undefined} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
          <Toggle value onValueChange={() => undefined} accessibilityLabel="Toggle on" />
          <Toggle value={false} onValueChange={() => undefined} accessibilityLabel="Toggle off" />
        </View>
      </View>
    </Screen>
  );
}
