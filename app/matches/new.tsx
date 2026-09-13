/**
 * Création d'un match.
 *
 * Le formulaire n'utilise que des choix tapables (format, niveau, jour, heure) :
 * aucun sélecteur de date natif, qui diffère trop d'une plateforme à l'autre et
 * alourdirait un parcours qui doit tenir en quelques secondes.
 */
import { router, type Href } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';

import { Button, Chip, Input, Screen, ScreenHeader, Text } from '@/components/ui';
import { createMatch, currentCity } from '@/features/data/service';
import {
  FORMAT_PLAYERS,
  MATCH_FORMATS,
  MATCH_LEVELS,
  type MatchFormat,
  type MatchLevel,
} from '@/features/matches/types';
import { useTranslation } from '@/i18n';
import { formatDayChip, formatMinutes } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { toast } from '@/store/uiStore';
import { useTheme } from '@/theme/ThemeProvider';

/** Jours proposés : aujourd'hui et les treize suivants. */
const DAYS = 14;
/** Créneaux horaires proposés, en heures locales. */
const HOURS = [10, 12, 14, 16, 18, 19, 20, 21];
const DURATIONS = [45, 60, 90];

export default function NewMatchScreen() {
  const theme = useTheme();
  const { t, locale } = useTranslation();

  const [format, setFormat] = useState<MatchFormat>('five');
  const [level, setLevel] = useState<MatchLevel>('all');
  const [dayOffset, setDayOffset] = useState(1);
  const [hour, setHour] = useState(19);
  const [duration, setDuration] = useState(60);
  const [venue, setVenue] = useState('');
  const [city, setCity] = useState(currentCity() ?? '');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const days = useMemo(() => {
    const now = new Date();
    return Array.from({ length: DAYS }, (_, index) => {
      const date = new Date(now);
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() + index);
      return date;
    });
  }, []);

  const kickoff = useMemo(() => {
    const date = new Date(days[dayOffset] ?? new Date());
    date.setHours(hour, 0, 0, 0);
    return date;
  }, [days, dayOffset, hour]);

  const canSubmit = venue.trim().length >= 2 && city.trim().length >= 2 && !saving;

  const submit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    try {
      const match = await createMatch({
        format,
        level,
        kickoffAt: kickoff.toISOString(),
        durationMinutes: duration,
        venueName: venue.trim(),
        city: city.trim(),
        maxPlayers: FORMAT_PLAYERS[format],
        notes: notes.trim() || null,
      });
      void haptics.success();
      toast(t('matches.new.created'), 'success');
      router.replace(`/matches/${match.id}` as Href);
    } catch {
      toast(t('common.error'), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen keyboard>
      <ScreenHeader title={t('matches.new.title')} back size="compact" />

      <Field label={t('matches.new.format')}>
        {MATCH_FORMATS.map((value) => (
          <Chip
            key={value}
            label={t(`matches.formats.${value}`)}
            selected={value === format}
            onPress={() => setFormat(value)}
          />
        ))}
      </Field>

      <Field label={t('matches.new.level')}>
        {MATCH_LEVELS.map((value) => (
          <Chip
            key={value}
            label={t(`matches.levels.${value}`)}
            selected={value === level}
            onPress={() => setLevel(value)}
          />
        ))}
      </Field>

      <Field label={t('matches.new.day')}>
        {days.map((date, index) => (
          <Chip
            key={index}
            label={formatDayChip(date.toISOString(), locale, {
              today: t('common.today'),
              tomorrow: t('common.tomorrow'),
            })}
            selected={index === dayOffset}
            onPress={() => setDayOffset(index)}
          />
        ))}
      </Field>

      <Field label={t('matches.new.time')}>
        {HOURS.map((value) => (
          <Chip
            key={value}
            label={`${String(value).padStart(2, '0')}:00`}
            selected={value === hour}
            onPress={() => setHour(value)}
          />
        ))}
      </Field>

      <Field label={t('matches.new.duration')}>
        {DURATIONS.map((value) => (
          <Chip
            key={value}
            label={formatMinutes(value, locale)}
            selected={value === duration}
            onPress={() => setDuration(value)}
          />
        ))}
      </Field>

      <View style={{ gap: theme.spacing.lg, marginBottom: theme.sizes.sectionGap }}>
        <Input
          label={t('matches.new.venue')}
          value={venue}
          onChangeText={setVenue}
          placeholder={t('matches.new.venuePlaceholder')}
          maxLength={60}
        />
        <Input
          label={t('matches.new.city')}
          value={city}
          onChangeText={setCity}
          placeholder={t('matches.new.cityPlaceholder')}
          maxLength={60}
        />
        <Input
          label={t('matches.new.notes')}
          value={notes}
          onChangeText={setNotes}
          placeholder={t('matches.new.notesPlaceholder')}
          multiline
          maxLength={200}
        />
      </View>

      <Text variant="caption" color="textSecondary" style={{ marginBottom: theme.spacing.md }}>
        {`${t('matches.new.players')} · ${FORMAT_PLAYERS[format]}`}
      </Text>

      <Button
        title={t('matches.new.submit')}
        onPress={() => void submit()}
        disabled={!canSubmit}
        loading={saving}
      />
    </Screen>
  );
}

/** Un libellé et sa rangée de chips, qui passe à la ligne. */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ marginBottom: theme.sizes.sectionGap }}>
      <Text variant="caption" color="textSecondary" style={{ marginBottom: theme.spacing.sm }}>
        {label}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>{children}</View>
    </View>
  );
}
