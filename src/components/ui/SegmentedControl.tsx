import React from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import { haptics } from '@/lib/haptics';
import { useTheme } from '@/theme/ThemeProvider';
import { shadows } from '@/theme/tokens';

import { Text } from './Text';

export interface SegmentOption<T extends string> {
  key: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  style?: StyleProp<ViewStyle>;
}

/** Segment (ex. « Créer un compte » / « Se connecter ») : pill grise, segment actif blanc + gras. */
export function SegmentedControl<T extends string>({ options, value, onChange, style }: SegmentedControlProps<T>) {
  const theme = useTheme();
  return (
    <View
      accessibilityRole="tablist"
      style={[
        {
          flexDirection: 'row',
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.pill,
          padding: theme.spacing.xs,
        },
        style,
      ]}
    >
      {options.map((option) => {
        const selected = option.key === value;
        return (
          <Pressable
            key={option.key}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
            onPress={() => {
              if (selected) return;
              void haptics.selection();
              onChange(option.key);
            }}
            style={[
              {
                flex: 1,
                height: 40,
                borderRadius: theme.radius.pill,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: selected ? theme.colors.background : 'transparent',
              },
              selected ? shadows.card : null,
            ]}
          >
            <Text variant={selected ? 'bodyBold' : 'body'} color={selected ? 'text' : 'textSecondary'}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
