/**
 * Onboarding — écran 1 : identité. Prénom ou pseudo (obligatoire) et photo de
 * profil (facultative, caméra ou galerie). Les permissions média sont demandées
 * au moment du tap, jamais avant.
 */
import * as ImagePicker from 'expo-image-picker';
import { Camera, Images } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { View } from 'react-native';

import { Avatar, Button, Input, Text } from '@/components/ui';
import { QuestionScreen } from '@/features/onboarding/QuestionScreen';
import { useOnboarding } from '@/features/onboarding/useOnboarding';
import { setAvatar } from '@/features/profile/service';
import { useTranslation } from '@/i18n';
import { validateDisplayName } from '@/lib/validation';
import { useTheme } from '@/theme/ThemeProvider';

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.8,
};

export default function IdentityScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const controller = useOnboarding('identity');
  const { draft, set } = controller;
  const [touched, setTouched] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const name = draft.displayName ?? '';
  const nameError = touched && validateDisplayName(name) !== null ? t('onboarding.identity.nameError') : null;

  const pick = useCallback(
    async (source: 'camera' | 'gallery') => {
      setPermissionError(null);
      const permission =
        source === 'camera'
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setPermissionError(t('onboarding.identity.permissionDenied'));
        return;
      }
      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync(PICKER_OPTIONS)
          : await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
      const uri = result.canceled ? null : result.assets[0]?.uri;
      if (!uri) return;
      setUploading(true);
      try {
        await setAvatar(uri);
      } finally {
        setUploading(false);
      }
    },
    [t],
  );

  return (
    <QuestionScreen
      controller={controller}
      title={t('onboarding.identity.title')}
      subtitle={t('onboarding.identity.subtitle')}
      onContinue={() => {
        setTouched(true);
        if (controller.valid) void controller.next({ displayName: name.trim() });
      }}
    >
      <Input
        label={t('onboarding.identity.nameLabel')}
        value={name}
        onChangeText={(value) => set({ displayName: value })}
        onBlur={() => setTouched(true)}
        placeholder={t('onboarding.identity.namePlaceholder')}
        error={nameError}
        autoCapitalize="words"
        autoComplete="given-name"
        maxLength={24}
        returnKeyType="done"
      />

      <View style={{ marginTop: theme.sizes.sectionGap, alignItems: 'center', gap: theme.spacing.md }}>
        <Text variant="caption" color="textSecondary">
          {t('onboarding.identity.photoHint')}
        </Text>
        <Avatar
          uri={draft.avatarUrl}
          name={name || null}
          size={theme.sizes.avatarXl}
          ring={Boolean(draft.avatarUrl)}
        />
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          <Button
            title={t('onboarding.identity.camera')}
            variant="secondary"
            size="md"
            fullWidth={false}
            loading={uploading}
            icon={<Camera size={18} color={theme.colors.text} strokeWidth={2} />}
            onPress={() => void pick('camera')}
          />
          <Button
            title={t('onboarding.identity.gallery')}
            variant="secondary"
            size="md"
            fullWidth={false}
            loading={uploading}
            icon={<Images size={18} color={theme.colors.text} strokeWidth={2} />}
            onPress={() => void pick('gallery')}
          />
        </View>
        {draft.avatarUrl ? (
          <Button
            title={t('onboarding.identity.removePhoto')}
            variant="text"
            size="md"
            fullWidth={false}
            onPress={() => set({ avatarUrl: null })}
          />
        ) : null}
        {permissionError ? (
          <Text variant="caption" color="error" accessibilityLiveRegion="polite">
            {permissionError}
          </Text>
        ) : null}
      </View>
    </QuestionScreen>
  );
}
