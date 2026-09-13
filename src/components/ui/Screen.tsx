import { ChevronLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import React, { type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTranslation } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';

import { IconButton } from './IconButton';
import { Text } from './Text';

interface ScreenProps {
  children: ReactNode;
  /** Contenu défilant (défaut) ou fixe (listes virtualisées, écrans avec bouton bas). */
  scroll?: boolean;
  padded?: boolean;
  /** Ajoute un KeyboardAvoidingView (formulaires). */
  keyboard?: boolean;
  /** Bords protégés par la safe area (le bas est géré par la tab bar quand elle est présente). */
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  /** Active le « tirer pour rafraîchir » (écrans alimentés par le backend). */
  onRefresh?: () => void;
  refreshing?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}

/** Conteneur d'écran : fond blanc, safe area, padding horizontal 16 px. */
export function Screen({
  children,
  scroll = true,
  padded = true,
  keyboard = false,
  edges = ['top', 'left', 'right'],
  onRefresh,
  refreshing = false,
  contentStyle,
}: ScreenProps) {
  const theme = useTheme();
  const padding = padded ? { paddingHorizontal: theme.sizes.screenPadding } : null;

  const body = scroll ? (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        ) : undefined
      }
      contentContainerStyle={[padding, { paddingBottom: theme.spacing.xxl }, contentStyle]}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[{ flex: 1 }, padding, contentStyle]}>{children}</View>
  );

  return (
    <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {keyboard ? (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {body}
        </KeyboardAvoidingView>
      ) : (
        body
      )}
    </SafeAreaView>
  );
}

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  /** Affiche un chevron retour (router.back par défaut). */
  back?: boolean;
  onBack?: () => void;
  /** Action à droite (ex. engrenage). */
  right?: ReactNode;
  /** Titre 28 px (onglets) ou 22 px (sous-écrans). */
  size?: 'large' | 'compact';
  style?: StyleProp<ViewStyle>;
}

/** En-tête d'écran : titre en gras sur fond blanc, chevron à gauche et action à droite optionnels. */
export function ScreenHeader({ title, subtitle, back = false, onBack, right, size = 'large', style }: ScreenHeaderProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const handleBack = onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/')));
  return (
    <View style={[{ paddingTop: theme.spacing.md, paddingBottom: theme.spacing.lg }, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: theme.sizes.touchTarget }}>
        {back ? (
          <IconButton accessibilityLabel={t('common.back')} onPress={handleBack} style={{ marginLeft: -theme.spacing.md }}>
            <ChevronLeft size={26} color={theme.colors.text} strokeWidth={2} />
          </IconButton>
        ) : null}
        <View style={{ flex: 1 }}>
          <Text variant={size === 'large' ? 'h1' : 'h2'} numberOfLines={2} style={size === 'large' ? { fontSize: 28, lineHeight: 34 } : null}>
            {title}
          </Text>
        </View>
        {right ? <View style={{ marginRight: -theme.spacing.sm }}>{right}</View> : null}
      </View>
      {subtitle ? (
        <Text variant="body" color="textSecondary" style={{ marginTop: theme.spacing.xs }}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
