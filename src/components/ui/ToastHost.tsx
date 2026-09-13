import React, { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useUIStore, type Toast as ToastModel } from '@/store/uiStore';
import { useTheme } from '@/theme/ThemeProvider';

import { Text } from './Text';

function ToastItem({ toast }: { toast: ToastModel }) {
  const theme = useTheme();
  const dismiss = useUIStore((s) => s.dismissToast);
  const [opacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: theme.motion.fast, useNativeDriver: true }).start();
  }, [opacity, theme.motion.fast]);

  const backgroundColor =
    toast.kind === 'error' ? theme.colors.error : toast.kind === 'success' ? theme.colors.primary : theme.colors.text;
  const textColor = toast.kind === 'success' ? 'onPrimary' : 'background';

  return (
    <Animated.View style={{ opacity }}>
      <Pressable
        onPress={() => dismiss(toast.id)}
        accessibilityRole="alert"
        style={{
          backgroundColor,
          borderRadius: theme.radius.pill,
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.md,
          marginTop: theme.spacing.sm,
          maxWidth: 420,
        }}
      >
        <Text variant="caption" color={textColor} align="center">
          {toast.message}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

/** Affiche les toasts (retours d'action) au-dessus de la tab bar. À monter une fois à la racine. */
export function ToastHost() {
  const toasts = useUIStore((s) => s.toasts);
  const insets = useSafeAreaInsets();
  if (toasts.length === 0) return null;
  return (
    <View style={[styles.host, { bottom: insets.bottom + 88, pointerEvents: 'box-none' }]}>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  host: { position: 'absolute', left: 16, right: 16, alignItems: 'center' },
});
