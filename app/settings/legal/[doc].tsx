/**
 * Documents légaux : CGU, politique de confidentialité, licences open source.
 * Les deux premiers sont des gabarits à compléter avant la mise en production ;
 * les licences sont générées à partir des dépendances réellement embarquées.
 */
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { Card, Divider, Screen, ScreenHeader, Text } from '@/components/ui';
import { APP_NAME } from '@/config/app';
import { useTranslation } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';

type Doc = 'terms' | 'privacy' | 'licenses';

/** Dépendances principales et leur licence (aucune n'impose d'obligation copyleft). */
const LICENSES: { name: string; license: string }[] = [
  { name: 'react', license: 'MIT' },
  { name: 'react-native', license: 'MIT' },
  { name: 'expo', license: 'MIT' },
  { name: 'expo-router', license: 'MIT' },
  { name: 'zustand', license: 'MIT' },
  { name: '@supabase/supabase-js', license: 'MIT' },
  { name: '@react-native-async-storage/async-storage', license: 'MIT' },
  { name: 'lucide-react-native', license: 'ISC' },
  { name: 'react-native-svg', license: 'MIT' },
  { name: 'react-native-safe-area-context', license: 'MIT' },
  { name: 'react-native-screens', license: 'MIT' },
  { name: 'react-native-gesture-handler', license: 'MIT' },
  { name: 'react-native-reanimated', license: 'MIT' },
  { name: 'i18n-js', license: 'MIT' },
  { name: 'Inter (@expo-google-fonts/inter)', license: 'SIL Open Font License 1.1' },
];

export default function LegalScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ doc?: string }>();
  const doc: Doc =
    params.doc === 'privacy' ? 'privacy' : params.doc === 'licenses' ? 'licenses' : 'terms';

  return (
    <Screen>
      <ScreenHeader title={t(`legal.${doc}.title`)} back size="compact" />

      {doc === 'licenses' ? (
        <Card tone="surface">
          {LICENSES.map((item, index) => (
            <View key={item.name}>
              {index > 0 ? <Divider /> : null}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  paddingVertical: theme.spacing.md,
                  gap: theme.spacing.md,
                }}
              >
                <Text variant="body" style={{ flex: 1 }} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text variant="caption" color="textSecondary">
                  {item.license}
                </Text>
              </View>
            </View>
          ))}
        </Card>
      ) : (
        <Card tone="surface">
          <Text variant="body" color="textSecondary">
            {t('legal.placeholder')}
          </Text>
          <Text variant="caption" color="textSecondary" style={{ marginTop: theme.spacing.md }}>
            {APP_NAME}
          </Text>
        </Card>
      )}
    </Screen>
  );
}
