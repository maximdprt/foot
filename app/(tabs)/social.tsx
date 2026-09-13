/** Onglet Social : vide fonctionnellement, direction artistique appliquée. */
import { CalendarDays, MessageCircle, Shield, UserPlus, Users } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';

import { EmptyState, Screen, ScreenHeader, Tile, TileGrid } from '@/components/ui';
import { useTranslation } from '@/i18n';
import { useUIStore } from '@/store/uiStore';
import { useTheme } from '@/theme/ThemeProvider';

export default function SocialScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const showAuthGate = useUIStore((s) => s.showAuthGate);
  const iconColor = theme.colors.onPrimary;

  return (
    <Screen>
      <ScreenHeader title={t('social.title')} />
      <EmptyState icon={Users} title={t('social.emptyTitle')} />
      <View style={{ marginTop: theme.sizes.sectionGap }}>
        <TileGrid>
          {[
            <Tile
              key="friends"
              title={t('social.tiles.friends')}
              caption={t('common.soon')}
              icon={<UserPlus size={24} color={iconColor} strokeWidth={2} />}
              onPress={showAuthGate}
            />,
            <Tile
              key="teams"
              title={t('social.tiles.teams')}
              caption={t('common.soon')}
              icon={<Shield size={24} color={iconColor} strokeWidth={2} />}
              onPress={showAuthGate}
            />,
            <Tile
              key="messages"
              title={t('social.tiles.messages')}
              caption={t('common.soon')}
              icon={<MessageCircle size={24} color={iconColor} strokeWidth={2} />}
              onPress={showAuthGate}
            />,
            <Tile
              key="events"
              title={t('social.tiles.events')}
              caption={t('common.soon')}
              icon={<CalendarDays size={24} color={iconColor} strokeWidth={2} />}
              onPress={showAuthGate}
            />,
          ]}
        </TileGrid>
      </View>
    </Screen>
  );
}
