/**
 * Paramètres > Compte : email, changement de mot de passe, comptes liés,
 * suppression du compte en double confirmation (bottom sheet rouge).
 */
import { router, type Href } from 'expo-router';
import { KeyRound, Mail, Trash } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { View } from 'react-native';

import {
  AppleGlyph,
  Button,
  GoogleGlyph,
  Input,
  ListItem,
  ListSection,
  Screen,
  ScreenHeader,
  Sheet,
  Text,
} from '@/components/ui';
import { authErrorKey, deleteAccount, updatePassword } from '@/features/auth/service';
import { useTranslation } from '@/i18n';
import { isValidPassword } from '@/lib/validation';
import { useSessionStore } from '@/store/sessionStore';
import { toast } from '@/store/uiStore';
import { useTheme } from '@/theme/ThemeProvider';

export default function AccountSettingsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const user = useSessionStore((s) => s.user);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [deleteStep, setDeleteStep] = useState<0 | 1 | 2>(0);
  const [deleting, setDeleting] = useState(false);

  const providers = user?.providers ?? [];
  const icon = (Icon: typeof Mail) => <Icon size={20} color={theme.colors.textSecondary} strokeWidth={2} />;

  const confirmDelete = useCallback(async () => {
    setDeleting(true);
    try {
      await deleteAccount();
      setDeleteStep(0);
      toast(t('settings.account.delete.done'), 'info');
      router.replace('/' as Href);
    } catch (error) {
      toast(t(authErrorKey(error), { provider: 'Email' }), 'error');
    } finally {
      setDeleting(false);
    }
  }, [t]);

  return (
    <Screen>
      <ScreenHeader title={t('settings.account.title')} back size="compact" />

      <ListSection>
        <ListItem title={t('settings.account.email')} value={user?.email ?? '—'} icon={icon(Mail)} right="none" />
        <ListItem
          title={t('settings.account.changePassword')}
          icon={icon(KeyRound)}
          onPress={() => setPasswordVisible(true)}
        />
      </ListSection>

      <ListSection title={t('settings.account.linkedAccounts')}>
        <ListItem
          title="Apple"
          icon={<AppleGlyph size={18} color={theme.colors.textSecondary} />}
          value={providers.includes('apple') ? t('settings.account.linked') : t('settings.account.notLinked')}
          right="none"
        />
        <ListItem
          title="Google"
          icon={<GoogleGlyph size={18} />}
          value={providers.includes('google') ? t('settings.account.linked') : t('settings.account.notLinked')}
          right="none"
        />
      </ListSection>

      <ListSection>
        <ListItem
          title={t('settings.account.deleteAccount')}
          icon={<Trash size={20} color={theme.colors.error} strokeWidth={2} />}
          destructive
          onPress={() => setDeleteStep(1)}
        />
      </ListSection>

      <ChangePasswordSheet visible={passwordVisible} onClose={() => setPasswordVisible(false)} />

      {/* Double confirmation avant suppression définitive. */}
      <Sheet
        visible={deleteStep === 1}
        onClose={() => setDeleteStep(0)}
        tone="danger"
        title={t('settings.account.delete.title')}
        subtitle={t('settings.account.delete.subtitle')}
      >
        <View style={{ gap: theme.spacing.sm, paddingBottom: theme.spacing.sm }}>
          <Button
            title={t('settings.account.delete.continue')}
            variant="danger"
            onPress={() => setDeleteStep(2)}
          />
          <Button title={t('common.cancel')} variant="text" onPress={() => setDeleteStep(0)} />
        </View>
      </Sheet>

      <Sheet
        visible={deleteStep === 2}
        onClose={() => setDeleteStep(0)}
        tone="danger"
        title={t('settings.account.delete.title2')}
        subtitle={t('settings.account.delete.subtitle2')}
      >
        <View style={{ gap: theme.spacing.sm, paddingBottom: theme.spacing.sm }}>
          <Button
            title={t('settings.account.delete.confirm')}
            variant="danger"
            loading={deleting}
            onPress={() => void confirmDelete()}
          />
          <Button title={t('common.cancel')} variant="text" onPress={() => setDeleteStep(0)} />
        </View>
      </Sheet>
    </Screen>
  );
}

function ChangePasswordSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mismatch = confirmation.length > 0 && confirmation !== password;
  const canSubmit = isValidPassword(password) && !mismatch && !saving;

  const submit = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      await updatePassword(password);
      setPassword('');
      setConfirmation('');
      onClose();
      toast(t('settings.account.password.success'), 'success');
    } catch (caught) {
      setError(t(authErrorKey(caught), { provider: 'Email' }));
    } finally {
      setSaving(false);
    }
  }, [onClose, password, t]);

  return (
    <Sheet visible={visible} onClose={onClose} title={t('settings.account.password.title')}>
      <View style={{ gap: theme.spacing.lg, paddingBottom: theme.spacing.sm }}>
        <Input
          label={t('settings.account.password.new')}
          value={password}
          onChangeText={setPassword}
          placeholder={t('auth.passwordPlaceholder')}
          secure
          autoCapitalize="none"
          textContentType="newPassword"
        />
        <Input
          label={t('settings.account.password.confirm')}
          value={confirmation}
          onChangeText={setConfirmation}
          error={mismatch ? t('settings.account.password.mismatch') : null}
          secure
          autoCapitalize="none"
          textContentType="newPassword"
        />
        {error ? (
          <Text variant="caption" color="error">
            {error}
          </Text>
        ) : null}
        <Button
          title={t('settings.account.password.submit')}
          onPress={() => void submit()}
          disabled={!canSubmit}
          loading={saving}
        />
      </View>
    </Sheet>
  );
}
