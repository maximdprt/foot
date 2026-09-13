import React, { useEffect, useState, type ReactNode } from 'react';
import { Animated, Modal, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTranslation } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { shadows } from '@/theme/tokens';

import { Text } from './Text';

export interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children?: ReactNode;
  /** Occupe ~92 % de l'écran (sélecteur d'équipe). */
  fullScreen?: boolean;
  /** `danger` : titre rouge (confirmations destructives). */
  tone?: 'default' | 'danger';
  footer?: ReactNode;
}

/** Largeur max du contenu (identique au conteneur web de l'app). */
export const SHEET_MAX_WIDTH = 480;

/** Bottom sheet : coins supérieurs 20 px, poignée grise centrée, animation 300 ms. */
export function Sheet({
  visible,
  onClose,
  title,
  subtitle,
  children,
  fullScreen = false,
  tone = 'default',
  footer,
}: SheetProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const [mounted, setMounted] = useState(visible);
  const [wasVisible, setWasVisible] = useState(visible);
  const [translateY] = useState(() => new Animated.Value(visible ? 0 : screenHeight));
  const [backdrop] = useState(() => new Animated.Value(visible ? 1 : 0));

  // Ajustement d'état pendant le rendu (motif React) : la sheet doit être montée
  // avant que l'animation d'entrée ne démarre dans l'effet ci-dessous.
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setMounted(true);
  }

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, { toValue: 0, duration: theme.motion.normal, useNativeDriver: true }),
        Animated.timing(backdrop, { toValue: 1, duration: theme.motion.fast, useNativeDriver: true }),
      ]).start();
      return;
    }
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: screenHeight,
        duration: theme.motion.fast,
        useNativeDriver: true,
      }),
      Animated.timing(backdrop, { toValue: 0, duration: theme.motion.fast, useNativeDriver: true }),
      // Démontage seulement à la fin de l'animation de sortie.
    ]).start(({ finished }) => {
      if (finished) setMounted(false);
    });
  }, [visible, backdrop, screenHeight, theme.motion.fast, theme.motion.normal, translateY]);

  if (!mounted) return null;

  const maxHeight = screenHeight * 0.92;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.overlay, opacity: backdrop }]}>
          <Pressable
            style={styles.backdropPress}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
          />
        </Animated.View>
        <Animated.View
          accessibilityViewIsModal
          style={[
            styles.container,
            shadows.sheet,
            {
              transform: [{ translateY }],
              backgroundColor: theme.colors.background,
              borderTopLeftRadius: theme.radius.xl,
              borderTopRightRadius: theme.radius.xl,
              paddingBottom: insets.bottom + theme.spacing.lg,
              maxHeight,
              height: fullScreen ? maxHeight : undefined,
            },
          ]}
        >
          <View style={styles.handleWrap}>
            <View
              style={{
                width: theme.sizes.sheetHandleWidth,
                height: 4,
                borderRadius: theme.radius.pill,
                backgroundColor: theme.colors.border,
              }}
            />
          </View>
          {title ? (
            <View style={{ paddingHorizontal: theme.sizes.screenPadding, marginBottom: theme.spacing.md }}>
              <Text variant="h2" color={tone === 'danger' ? 'error' : 'text'}>
                {title}
              </Text>
              {subtitle ? (
                <Text variant="body" color="textSecondary" style={{ marginTop: theme.spacing.xs }}>
                  {subtitle}
                </Text>
              ) : null}
            </View>
          ) : null}
          <View style={[{ paddingHorizontal: theme.sizes.screenPadding }, fullScreen ? styles.grow : null]}>
            {children}
          </View>
          {footer ? (
            <View style={{ paddingHorizontal: theme.sizes.screenPadding, paddingTop: theme.spacing.md }}>
              {footer}
            </View>
          ) : null}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdropPress: { flex: 1 },
  container: {
    width: '100%',
    maxWidth: SHEET_MAX_WIDTH,
    alignSelf: 'center',
    paddingTop: 8,
  },
  handleWrap: { alignItems: 'center', paddingBottom: 12 },
  grow: { flex: 1 },
});
