/**
 * Gabarit commun à toutes les questions de l'onboarding (section 4.3) :
 * fond blanc plein écran, barre de progression fine dans la couleur primaire,
 * chevron retour, titre 28 px, contenu défilant, bouton « Continuer » pill en bas
 * (désactivé tant qu'aucune réponse) et bouton texte « Passer » si facultatif.
 */
import { ChevronLeft } from 'lucide-react-native';
import React, { type ReactNode } from 'react';
import { Animated, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, IconButton, ProgressBar, Text } from '@/components/ui';
import { useTranslation } from '@/i18n';
import { useEntrance } from '@/lib/motion';
import { useTheme } from '@/theme/ThemeProvider';

import { COUNTED_STEPS } from './steps';
import type { OnboardingController } from './useOnboarding';

interface QuestionScreenProps {
  controller: OnboardingController;
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** Libellé du bouton principal (défaut : « Continuer », ou « Enregistrer » en édition). */
  continueLabel?: string;
  /** Appelé au tap sur le bouton principal (défaut : `controller.next()`). */
  onContinue?: () => void;
  /** Force l'activation du bouton principal (défaut : validation de l'étape). */
  canContinue?: boolean;
  /** Contenu additionnel au-dessus du bouton (ex. « Je n'ai pas de club »). */
  footer?: ReactNode;
  /** Masque la barre de progression (écran de bienvenue). */
  hideProgress?: boolean;
}

export function QuestionScreen({
  controller,
  title,
  subtitle,
  children,
  continueLabel,
  onContinue,
  canContinue,
  footer,
  hideProgress = false,
}: QuestionScreenProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { step, displayIndex, progress, editing, saving, valid, next, skip, back } = controller;
  // La question arrive avant ses réponses : l'œil lit le titre en premier.
  const titleIn = useEntrance({ duration: 380 });
  const bodyIn = useEntrance({ delay: 90, duration: 420 });

  const enabled = canContinue ?? valid;
  const label = continueLabel ?? (editing ? t('common.save') : t('common.continue'));

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={{ flex: 1, backgroundColor: theme.colors.background }}
    >
      <View style={{ paddingHorizontal: theme.sizes.screenPadding }}>
        {hideProgress ? null : (
          <ProgressBar
            progress={progress}
            ball
            accessibilityLabel={t('onboarding.stepOf', {
              current: displayIndex,
              total: COUNTED_STEPS,
            })}
            style={{ marginTop: theme.spacing.sm }}
          />
        )}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            minHeight: theme.sizes.touchTarget,
            marginTop: theme.spacing.sm,
          }}
        >
          <IconButton
            accessibilityLabel={t('common.back')}
            onPress={back}
            style={{ marginLeft: -theme.spacing.md }}
          >
            <ChevronLeft size={26} color={theme.colors.text} strokeWidth={2} />
          </IconButton>
          {hideProgress ? null : (
            <Text variant="caption" color="textSecondary">
              {t('onboarding.stepOf', { current: displayIndex, total: COUNTED_STEPS })}
            </Text>
          )}
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: theme.sizes.screenPadding,
            paddingTop: theme.spacing.lg,
            paddingBottom: theme.spacing.xl,
          }}
        >
          <Animated.View style={titleIn}>
            <Text variant="h1">{title}</Text>
            {subtitle ? (
              <Text variant="body" color="textSecondary" style={{ marginTop: theme.spacing.sm }}>
                {subtitle}
              </Text>
            ) : null}
          </Animated.View>
          <Animated.View style={[{ marginTop: theme.sizes.sectionGap }, bodyIn]}>
            {children}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View
        style={{
          paddingHorizontal: theme.sizes.screenPadding,
          paddingTop: theme.spacing.md,
          paddingBottom: theme.spacing.lg,
          gap: theme.spacing.sm,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          backgroundColor: theme.colors.background,
        }}
      >
        {footer}
        <Button
          title={label}
          onPress={onContinue ?? (() => void next())}
          disabled={!enabled}
          loading={saving}
        />
        {step.optional && !editing ? (
          <Button title={t('common.skip')} variant="text" onPress={() => void skip()} />
        ) : null}
      </View>
    </SafeAreaView>
  );
}
