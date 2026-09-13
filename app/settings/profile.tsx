/**
 * Paramètres > Mon profil : pseudo, photo, puis chaque question de l'onboarding
 * éditable individuellement (le tap rouvre l'écran correspondant en mode édition).
 */
import { router, type Href } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useState } from 'react';
import { View } from 'react-native';

import { Avatar, Button, Input, ListItem, ListSection, Screen, ScreenHeader, Text } from '@/components/ui';
import { patchProfile, setAvatar } from '@/features/profile/service';
import { useProfileSummaryRows } from '@/features/profile/summary';
import { useTranslation } from '@/i18n';
import { validateDisplayName } from '@/lib/validation';
import { useProfileStore } from '@/store/profileStore';
import { toast } from '@/store/uiStore';
import { useTheme } from '@/theme/ThemeProvider';

export default function ProfileSettingsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const draft = useProfileStore((s) => s.draft);
  const patchDraft = useProfileStore((s) => s.patchDraft);
  const rows = useProfileSummaryRows();
  const [saving, setSaving] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const name = draft.displayName ?? '';
  const nameError = validateDisplayName(name) !== null ? t('onboarding.identity.nameError') : null;

  const changePhoto = useCallback(async () => {
    setPermissionError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setPermissionError(t('onboarding.identity.permissionDenied'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    const uri = result.canceled ? null : result.assets[0]?.uri;
    if (uri) await setAvatar(uri);
  }, [t]);

  const saveName = useCallback(async () => {
    if (nameError) return;
    setSaving(true);
    try {
      await patchProfile({ displayName: name.trim() });
      toast(t('settings.profile.saved'), 'success');
    } finally {
      setSaving(false);
    }
  }, [name, nameError, t]);

  return (
    <Screen keyboard>
      <ScreenHeader title={t('settings.profile.title')} back size="compact" />

      <View style={{ alignItems: 'center', gap: theme.spacing.md, marginBottom: theme.sizes.sectionGap }}>
        <Avatar uri={draft.avatarUrl} name={name || null} size={theme.sizes.avatarXl} ring />
        <Button
          title={t('settings.profile.changePhoto')}
          variant="secondary"
          size="md"
          fullWidth={false}
          onPress={() => void changePhoto()}
        />
        {permissionError ? (
          <Text variant="caption" color="error">
            {permissionError}
          </Text>
        ) : null}
      </View>

      <Input
        label={t('settings.profile.displayName')}
        value={name}
        onChangeText={(value) => patchDraft({ displayName: value })}
        error={name.length > 0 ? nameError : null}
        maxLength={24}
        autoCapitalize="words"
        returnKeyType="done"
        onSubmitEditing={() => void saveName()}
      />
      <Button
        title={t('common.save')}
        onPress={() => void saveName()}
        disabled={Boolean(nameError)}
        loading={saving}
        style={{ marginTop: theme.spacing.md, marginBottom: theme.sizes.sectionGap }}
      />

      <ListSection title={t('settings.profile.answers')}>
        {rows.map((row) => (
          <ListItem
            key={row.step}
            title={t(row.labelKey)}
            value={row.value ?? t('common.notSet')}
            onPress={() => router.push({ pathname: row.path, params: { edit: '1' } } as Href)}
          />
        ))}
      </ListSection>
    </Screen>
  );
}
