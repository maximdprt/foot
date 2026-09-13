/**
 * Onboarding — écran 6 : « Où es-tu ? ».
 * Région (13 métropolitaines + DROM) puis ville avec autocomplétion.
 * La permission de géolocalisation est demandée ici et nulle part avant
 * (bouton « Utiliser ma position », section 4.3).
 */
import * as Location from 'expo-location';
import { LocateFixed, Search } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';

import { Button, Chip, Input, SelectableCard, Text } from '@/components/ui';
import { QuestionScreen } from '@/features/onboarding/QuestionScreen';
import {
  findRegionByCity,
  findRegionByName,
  REGIONS,
  regionName,
  searchCities,
} from '@/features/onboarding/regions';
import { useOnboarding } from '@/features/onboarding/useOnboarding';
import { useTranslation } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';

export default function LocationScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const controller = useOnboarding('location');
  const { draft, set } = controller;
  const [cityQuery, setCityQuery] = useState(draft.city ?? '');
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cities = useMemo(
    () => searchCities(draft.region ?? null, cityQuery).slice(0, 12),
    [draft.region, cityQuery],
  );

  /** Géolocalisation : permission demandée au tap, puis géocodage inverse. */
  const locateMe = useCallback(async () => {
    setError(null);
    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setError(t('onboarding.location.permissionDenied'));
        return;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const [place] = await Location.reverseGeocodeAsync(position.coords);
      const city = place?.city ?? place?.subregion ?? null;
      const region = findRegionByName(place?.region) ?? (city ? findRegionByCity(city) : null);
      if (!city) {
        setError(t('onboarding.location.locationError'));
        return;
      }
      setCityQuery(city);
      set({
        city,
        region: region?.id ?? draft.region ?? null,
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
    } catch {
      setError(t('onboarding.location.locationError'));
    } finally {
      setLocating(false);
    }
  }, [draft.region, set, t]);

  return (
    <QuestionScreen
      controller={controller}
      title={t('onboarding.location.title')}
      subtitle={t('onboarding.location.subtitle')}
      footer={
        <Button
          title={locating ? t('onboarding.location.locating') : t('onboarding.location.useMyLocation')}
          variant="secondary"
          loading={locating}
          icon={<LocateFixed size={18} color={theme.colors.text} strokeWidth={2} />}
          onPress={() => void locateMe()}
        />
      }
    >
      <Text variant="caption" color="textSecondary" style={{ marginBottom: theme.spacing.sm }}>
        {t('onboarding.location.region')}
      </Text>

      {draft.region ? (
        <SelectableCard
          title={regionName(draft.region) ?? ''}
          selected
          onPress={() => set({ region: null, city: null })}
          description={t('onboarding.location.change')}
        />
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
          {REGIONS.map((region) => (
            <Chip
              key={region.id}
              label={region.name}
              selected={false}
              onPress={() => {
                setCityQuery('');
                set({ region: region.id, city: null, lat: null, lng: null });
              }}
            />
          ))}
        </View>
      )}

      {draft.region ? (
        <View style={{ marginTop: theme.sizes.sectionGap }}>
          <Text variant="caption" color="textSecondary" style={{ marginBottom: theme.spacing.sm }}>
            {t('onboarding.location.city')}
          </Text>
          <Input
            value={cityQuery}
            onChangeText={(value) => {
              setCityQuery(value);
              set({ city: value.trim() || null });
            }}
            placeholder={t('onboarding.location.cityPlaceholder')}
            accessibilityLabel={t('onboarding.location.city')}
            autoCorrect={false}
            leftIcon={<Search size={18} color={theme.colors.textSecondary} strokeWidth={2} />}
          />
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: theme.spacing.sm,
              marginTop: theme.spacing.md,
            }}
          >
            {cities.map((city) => (
              <Chip
                key={city}
                label={city}
                selected={draft.city === city}
                onPress={() => {
                  setCityQuery(city);
                  set({ city });
                }}
              />
            ))}
          </View>
          {cityQuery.trim().length >= 2 && cities.length === 0 ? (
            <Text variant="caption" color="textSecondary" style={{ marginTop: theme.spacing.md }}>
              {t('onboarding.location.useFree', { name: cityQuery.trim() })}
            </Text>
          ) : null}
        </View>
      ) : null}

      {error ? (
        <Text
          variant="caption"
          color="error"
          accessibilityLiveRegion="polite"
          style={{ marginTop: theme.spacing.md }}
        >
          {error}
        </Text>
      ) : null}
    </QuestionScreen>
  );
}
