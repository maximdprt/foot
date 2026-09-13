/**
 * Onglet Réservation : les terrains de la ville, leurs créneaux du jour choisi,
 * et les réservations déjà prises.
 */
import { router, type Href } from 'expo-router';
import { Calendar, CalendarCheck } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';

import {
  Button,
  Card,
  Chip,
  Divider,
  EmptyState,
  Screen,
  ScreenHeader,
  Text,
} from '@/components/ui';
import { bookSlot, cancelBooking } from '@/features/data/service';
import { useRefresh, useRequireAuth } from '@/features/data/useData';
import { compareByStart, type Booking } from '@/features/booking/types';
import { BOOKABLE_DAYS, dayStart, slotsFor, venuesForCity } from '@/features/booking/venues';
import { useTranslation } from '@/i18n';
import { formatDayChip, formatPrice, formatTime } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { useDataStore } from '@/store/dataStore';
import { useProfileStore } from '@/store/profileStore';
import { toast } from '@/store/uiStore';
import { useTheme } from '@/theme/ThemeProvider';

export default function BookingScreen() {
  const theme = useTheme();
  const { t, locale } = useTranslation();
  const { refreshing, refresh } = useRefresh();
  const requireAuth = useRequireAuth();
  const city = useProfileStore((s) => s.draft.city ?? s.profile?.city ?? null);
  const bookings = useDataStore((s) => s.bookings);

  const [chosenDay, setChosenDay] = useState<number | null>(null);
  const [venueId, setVenueId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const venues = useMemo(() => venuesForCity(city), [city]);
  const venue = venues.find((item) => item.id === venueId) ?? venues[0] ?? null;

  // Ouvrir sur un jour sans créneau est un cul-de-sac : le soir, tout ce qui
  // restait aujourd'hui est déjà passé. Tant que l'utilisateur n'a pas choisi
  // de jour, on présente donc le premier où il reste quelque chose.
  const firstOpenDay = useMemo(() => {
    if (!venue) return 0;
    for (let offset = 0; offset < BOOKABLE_DAYS; offset++) {
      if (slotsFor(venue, offset).some((slot) => slot.available)) return offset;
    }
    return 0;
  }, [venue]);
  const dayOffset = chosenDay ?? firstOpenDay;

  const slots = useMemo(
    () => (venue ? slotsFor(venue, dayOffset).filter((slot) => slot.available) : []),
    [venue, dayOffset],
  );

  const days = useMemo(
    () => Array.from({ length: BOOKABLE_DAYS }, (_, index) => dayStart(index)),
    [],
  );

  const upcoming = bookings
    .filter((booking) => booking.status === 'confirmed')
    .sort(compareByStart);

  if (!city) {
    return (
      <Screen onRefresh={refresh} refreshing={refreshing}>
        <ScreenHeader title={t('booking.title')} />
        <EmptyState icon={Calendar} title={t('booking.cityMissing')} subtitle={t('booking.cityMissingHint')} />
        <Button
          title={t('booking.setCity')}
          onPress={() => router.push({ pathname: '/location', params: { edit: '1' } } as Href)}
        />
      </Screen>
    );
  }

  return (
    <Screen onRefresh={refresh} refreshing={refreshing}>
      <ScreenHeader title={t('booking.title')} />

      {upcoming.length > 0 ? (
        <View style={{ marginBottom: theme.sizes.sectionGap }}>
          <Text variant="h3" style={{ marginBottom: theme.spacing.md }}>
            {t('booking.myBookings')}
          </Text>
          <View style={{ gap: theme.spacing.sm }}>
            {upcoming.map((booking) => (
              <BookingRow
                key={booking.id}
                booking={booking}
                onCancel={() =>
                  void run(setPending, async () => {
                    await cancelBooking(booking.id);
                    toast(t('booking.cancelled'), 'info');
                  })
                }
              />
            ))}
          </View>
        </View>
      ) : null}

      <Text variant="h3" style={{ marginBottom: theme.spacing.md }}>
        {t('booking.venuesTitle')}
      </Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
        {venues.map((item) => (
          <Chip
            key={item.id}
            label={t(item.nameKey)}
            selected={item.id === venue?.id}
            onPress={() => setVenueId(item.id)}
          />
        ))}
      </View>

      {venue ? (
        <>
          <Text variant="caption" color="textSecondary" style={{ marginTop: theme.spacing.md }}>
            {[
              venue.covered ? t('booking.covered') : t('booking.outdoor'),
              formatPrice(venue.pricePerHour, locale, t('common.free')),
            ].join(' · ')}
          </Text>

          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: theme.spacing.sm,
              marginTop: theme.sizes.sectionGap,
            }}
          >
            {days.map((date, index) => (
              <Chip
                key={index}
                label={formatDayChip(date.toISOString(), locale, {
                  today: t('common.today'),
                  tomorrow: t('common.tomorrow'),
                })}
                selected={index === dayOffset}
                onPress={() => setChosenDay(index)}
              />
            ))}
          </View>

          <Text variant="h3" style={{ marginTop: theme.sizes.sectionGap, marginBottom: theme.spacing.md }}>
            {t('booking.slots')}
          </Text>

          {slots.length === 0 ? (
            <Text variant="body" color="textSecondary">
              {t('booking.noSlots')}
            </Text>
          ) : (
            <Card tone="surface">
              {slots.map((slot, index) => (
                <View key={slot.startsAt}>
                  {index > 0 ? <Divider /> : null}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: theme.spacing.md,
                      paddingVertical: theme.spacing.sm,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyBold">
                        {`${formatTime(slot.startsAt, locale)} – ${formatTime(slot.endsAt, locale)}`}
                      </Text>
                      <Text variant="caption" color="textSecondary">
                        {formatPrice(slot.price, locale, t('common.free'))}
                      </Text>
                    </View>
                    <Button
                      title={t('booking.book')}
                      size="md"
                      fullWidth={false}
                      disabled={pending}
                      onPress={() =>
                        requireAuth(() =>
                          void run(setPending, async () => {
                            await bookSlot(venue, slot);
                            void haptics.success();
                            toast(t('booking.booked'), 'success');
                          }),
                        )
                      }
                    />
                  </View>
                </View>
              ))}
            </Card>
          )}
        </>
      ) : null}

      <Text variant="caption" color="textSecondary" style={{ marginTop: theme.sizes.sectionGap }}>
        {t('booking.demoNotice')}
      </Text>
    </Screen>
  );
}

/** Une réservation à venir, avec son bouton d'annulation. */
function BookingRow({ booking, onCancel }: { booking: Booking; onCancel: () => void }) {
  const theme = useTheme();
  const { t, locale } = useTranslation();
  return (
    <Card tone="surface" size="sm" padding={theme.spacing.md}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
        <CalendarCheck size={18} color={theme.colors.primary} strokeWidth={2} />
        <View style={{ flex: 1 }}>
          <Text variant="bodyBold" numberOfLines={1}>
            {t(`booking.venues.${booking.venueKind}`)}
          </Text>
          <Text variant="caption" color="textSecondary">
            {`${formatDayChip(booking.startsAt, locale, {
              today: t('common.today'),
              tomorrow: t('common.tomorrow'),
            })} · ${formatTime(booking.startsAt, locale)} · ${formatPrice(
              booking.price,
              locale,
              t('common.free'),
            )}`}
          </Text>
        </View>
        <Button
          title={t('booking.cancelBooking')}
          variant="text"
          size="md"
          fullWidth={false}
          onPress={onCancel}
        />
      </View>
    </Card>
  );
}

/** Exécute une action en marquant l'écran occupé, sans laisser l'état bloqué. */
async function run(
  setPending: (value: boolean) => void,
  action: () => Promise<void>,
): Promise<void> {
  setPending(true);
  try {
    await action();
  } finally {
    setPending(false);
  }
}
