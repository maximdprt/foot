/** Onglet Entraînement : vide fonctionnellement, direction artistique appliquée. */
import { BookOpen, Dumbbell, ListChecks, RotateCcw } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';

import { EmptyState, Screen, ScreenHeader, Tile, TileGrid } from '@/components/ui';
import { useTranslation } from '@/i18n';
import { useUIStore } from '@/store/uiStore';
import { useTheme } from '@/theme/ThemeProvider';

export default function TrainingScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const showAuthGate = useUIStore((s) => s.showAuthGate);
  const iconColor = theme.colors.onPrimary;

  return (
    <Screen>
      <ScreenHeader title={t('training.title')} />
      <EmptyState icon={Dumbbell} title={t('training.emptyTitle')} />
      <View style={{ marginTop: theme.sizes.sectionGap }}>
        <TileGrid>
          {[
            <Tile
              key="programs"
              title={t('training.tiles.programs')}
              caption={t('common.soon')}
              icon={<BookOpen size={24} color={iconColor} strokeWidth={2} />}
              onPress={showAuthGate}
            />,
            <Tile
              key="drills"
              title={t('training.tiles.drills')}
              caption={t('common.soon')}
              icon={<ListChecks size={24} color={iconColor} strokeWidth={2} />}
              onPress={showAuthGate}
            />,
            <Tile
              key="history"
              title={t('training.tiles.history')}
              caption={t('common.soon')}
              icon={<RotateCcw size={24} color={iconColor} strokeWidth={2} />}
              onPress={showAuthGate}
            />,
          ]}
        </TileGrid>
      </View>
    </Screen>
  );
}
