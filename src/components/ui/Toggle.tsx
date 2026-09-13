import React from 'react';
import { Switch } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

interface ToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  accessibilityLabel: string;
  disabled?: boolean;
}

/** Interrupteur : piste primaire quand activé, gris clair sinon. */
export function Toggle({ value, onValueChange, accessibilityLabel, disabled }: ToggleProps) {
  const theme = useTheme();
  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
      thumbColor={theme.colors.background}
      ios_backgroundColor={theme.colors.border}
    />
  );
}
