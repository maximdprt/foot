/** Onglet Réservation : vide fonctionnellement, direction artistique appliquée. */
import { Calendar, CalendarCheck, LandPlot, MapPinned, Volleyball } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';

import { EmptyState, Screen, ScreenHeader, Tile, TileGrid } from '@/components/ui';
import { useTranslation } from '@/i18n';
import { useUIStore } from '@/store/uiStore';
import { useTheme } from '@/theme/ThemeProvider';

export default function BookingScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const showAuthGate = useUIStore((s) => s.showAuthGate);
  const iconColor = theme.colors.onPrimary;

  return (
    <Screen>
      <ScreenHeader title={t('booking.title')} />
      <EmptyState icon={Calendar} title={t('booking.emptyTitle')} />
      <View style={{ marginTop: theme.sizes.sectionGap }}>
        <TileGrid>
          {[
            <Tile
              key="five"
              title={t('booking.tiles.five')}
              caption={t('common.soon')}
              icon={<LandPlot size={24} color={iconColor} strokeWidth={2} />}
              onPress={showAuthGate}
            />,
            <Tile
              key="futsal"
              title={t('booking.tiles.futsal')}
              caption={t('common.soon')}
              icon={<Volleyball size={24} color={iconColor} strokeWidth={2} />}
              onPress={showAuthGate}
            />,
            <Tile
              key="pitches"
              title={t('booking.tiles.pitches')}
              caption={t('common.soon')}
              icon={<MapPinned size={24} color={iconColor} strokeWidth={2} />}
              onPress={showAuthGate}
            />,
            <Tile
              key="bookings"
              title={t('booking.tiles.bookings')}
              caption={t('common.soon')}
              icon={<CalendarCheck size={24} color={iconColor} strokeWidth={2} />}
              onPress={showAuthGate}
            />,
          ]}
        </TileGrid>
      </View>
    </Screen>
  );
}
