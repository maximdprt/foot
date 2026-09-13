import { ChevronRight } from 'lucide-react-native';
import React, { isValidElement, type ReactNode } from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

import { Divider } from './Divider';
import { Text } from './Text';

export interface ListItemProps {
  title: string;
  subtitle?: string;
  /** Valeur affichée à droite (ex. email, langue). */
  value?: string;
  icon?: ReactNode;
  /** `chevron` (défaut si onPress), `none`, ou un élément (Toggle, etc.). */
  right?: 'chevron' | 'none' | ReactNode;
  badge?: string;
  onPress?: () => void;
  disabled?: boolean;
  destructive?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/** Ligne de liste type iOS / Spotify : titre, sous-titre, valeur, chevron à droite. */
export function ListItem({
  title,
  subtitle,
  value,
  icon,
  right,
  badge,
  onPress,
  disabled = false,
  destructive = false,
  accessibilityLabel,
  style,
}: ListItemProps) {
  const theme = useTheme();
  const rightMode = right === undefined ? (onPress ? 'chevron' : 'none') : right;
  const interactive = Boolean(onPress) && !disabled;

  return (
    <Pressable
      onPress={onPress}
      disabled={!interactive}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={accessibilityLabel ?? (value ? `${title}, ${value}` : title)}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        {
          minHeight: 52,
          paddingVertical: theme.spacing.md,
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing.md,
          opacity: disabled ? 0.5 : pressed && interactive ? 0.6 : 1,
        },
        style,
      ]}
    >
      {icon ? <View style={{ width: 24, alignItems: 'center' }}>{icon}</View> : null}
      <View style={{ flex: 1 }}>
        <Text variant="body" color={destructive ? 'error' : 'text'} numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" color="textSecondary" numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {value ? (
        <Text variant="body" color="textSecondary" numberOfLines={1} style={{ maxWidth: '45%' }}>
          {value}
        </Text>
      ) : null}
      {badge ? (
        <View
          style={{
            paddingHorizontal: theme.spacing.sm,
            paddingVertical: theme.spacing.xxs,
            borderRadius: theme.radius.pill,
            backgroundColor: theme.colors.surface,
          }}
        >
          <Text variant="label" color="textSecondary">
            {badge}
          </Text>
        </View>
      ) : null}
      {rightMode === 'chevron' ? (
        <ChevronRight size={20} color={theme.colors.textSecondary} strokeWidth={2} />
      ) : isValidElement(rightMode) ? (
        rightMode
      ) : null}
    </Pressable>
  );
}

interface ListSectionProps {
  title?: string;
  children: ReactNode;
  footer?: string;
  style?: StyleProp<ViewStyle>;
}

/** Section de liste avec titre discret et séparateurs fins entre les lignes. */
export function ListSection({ title, children, footer, style }: ListSectionProps) {
  const theme = useTheme();
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={[{ marginBottom: theme.sizes.sectionGap }, style]}>
      {title ? (
        <Text
          variant="caption"
          color="textSecondary"
          style={{ marginBottom: theme.spacing.xs, letterSpacing: 0.6, textTransform: 'uppercase' }}
        >
          {title}
        </Text>
      ) : null}
      <View>
        {items.map((child, index) => (
          <React.Fragment key={index}>
            {child}
            {index < items.length - 1 ? <Divider /> : null}
          </React.Fragment>
        ))}
      </View>
      {footer ? (
        <Text variant="caption" color="textSecondary" style={{ marginTop: theme.spacing.sm }}>
          {footer}
        </Text>
      ) : null}
    </View>
  );
}
