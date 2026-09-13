/**
 * Tab bar des 5 onglets (section 4.4) : Home · Entraînement · Réservation ·
 * Social · Profil. Fond blanc, fine ligne de séparation, icônes lucide 24 px,
 * labels 11 px. L'onglet actif prend la couleur primaire, son libellé passe en
 * gras et une pastille teintée apparaît derrière son icône.
 */
import { Tabs } from 'expo-router';
import { Calendar, CircleUser, Dumbbell, House, Users } from 'lucide-react-native';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TabBarIcon } from '@/components/navigation/TabBarIcon';
import { useTranslation } from '@/i18n';
import { typeScale } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * Hauteur de la barre hors encoche du bas : pastille (30) + libellé (14) +
 * respirations. En dessous, les libellés sont rognés sur les appareils sans encoche.
 */
const BAR_HEIGHT = 72;

export default function TabsLayout() {
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.tabInactive,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          // La ligne fine est déjà la séparation : pas d'ombre supplémentaire.
          elevation: 0,
          boxShadow: 'none',
          // Hauteur explicite + marge basse : les libellés ne sont jamais rognés,
          // y compris sur les appareils sans encoche (où l'inset vaut 0).
          height: BAR_HEIGHT + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: theme.spacing.sm,
        },
        tabBarLabelStyle: {
          fontSize: typeScale.label.size,
          lineHeight: typeScale.label.lineHeight,
          marginTop: 2,
          marginBottom: theme.spacing.xs,
        },
        tabBarItemStyle: { paddingTop: 0 },
        sceneStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color, focused }) => <TabBarIcon icon={House} color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="training"
        options={{
          title: t('tabs.training'),
          tabBarIcon: ({ color, focused }) => <TabBarIcon icon={Dumbbell} color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="booking"
        options={{
          title: t('tabs.booking'),
          tabBarIcon: ({ color, focused }) => <TabBarIcon icon={Calendar} color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          title: t('tabs.social'),
          tabBarIcon: ({ color, focused }) => <TabBarIcon icon={Users} color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color, focused }) => <TabBarIcon icon={CircleUser} color={color} focused={focused} />,
        }}
      />
    </Tabs>
  );
}
