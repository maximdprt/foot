import { Eye, EyeOff } from 'lucide-react-native';
import React, { forwardRef, useState, type ReactNode } from 'react';
import { TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';

import { useTranslation } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';

import { IconButton } from './IconButton';
import { Text } from './Text';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string | null;
  helper?: string;
  /** Champ mot de passe masquable. */
  secure?: boolean;
  leftIcon?: ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
}

/** Champ de saisie : fond #F7F7F8, coins 8 px, pas de bordure, bordure primaire au focus. */
export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, helper, secure = false, leftIcon, containerStyle, onFocus, onBlur, ...rest },
  ref,
) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(secure);

  const borderColor = error ? theme.colors.error : focused ? theme.colors.primary : 'transparent';

  return (
    <View style={containerStyle}>
      {label ? (
        <Text variant="caption" color="textSecondary" style={{ marginBottom: theme.spacing.xs }}>
          {label}
        </Text>
      ) : null}
      <View
        style={{
          minHeight: theme.sizes.inputHeight,
          borderRadius: theme.radius.sm,
          backgroundColor: theme.colors.surface,
          borderWidth: 1.5,
          borderColor,
          flexDirection: 'row',
          alignItems: 'center',
          paddingLeft: leftIcon ? theme.spacing.md : theme.spacing.lg,
          paddingRight: secure ? theme.spacing.xs : theme.spacing.lg,
        }}
      >
        {leftIcon ? <View style={{ marginRight: theme.spacing.sm }}>{leftIcon}</View> : null}
        <TextInput
          ref={ref}
          {...rest}
          secureTextEntry={secure ? hidden : rest.secureTextEntry}
          placeholderTextColor={theme.colors.textSecondary}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          accessibilityLabel={rest.accessibilityLabel ?? label}
          style={[
            theme.typography.body,
            {
              flex: 1,
              color: theme.colors.text,
              paddingVertical: theme.spacing.md,
              // Supprime le contour navigateur par défaut (web).
              outlineStyle: 'none',
            } as never,
          ]}
        />
        {secure ? (
          <IconButton
            accessibilityLabel={hidden ? t('auth.showPassword') : t('auth.hidePassword')}
            onPress={() => setHidden((v) => !v)}
          >
            {hidden ? (
              <Eye size={20} color={theme.colors.textSecondary} strokeWidth={2} />
            ) : (
              <EyeOff size={20} color={theme.colors.textSecondary} strokeWidth={2} />
            )}
          </IconButton>
        ) : null}
      </View>
      {error ? (
        <Text variant="caption" color="error" style={{ marginTop: theme.spacing.xs }} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : helper ? (
        <Text variant="caption" color="textSecondary" style={{ marginTop: theme.spacing.xs }}>
          {helper}
        </Text>
      ) : null}
    </View>
  );
});
