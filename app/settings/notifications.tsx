/** Paramètres > Notifications : toggles push, email, rappels, messages, réservations. */
import React from 'react';

import { ListItem, ListSection, Screen, ScreenHeader, Toggle } from '@/components/ui';
import { persistSettings } from '@/features/profile/service';
import { useTranslation } from '@/i18n';
import { useSettingsStore, type NotificationSettings } from '@/store/settingsStore';

const KEYS: (keyof NotificationSettings)[] = ['push', 'email', 'trainingReminders', 'messages', 'bookings'];

export default function NotificationsSettingsScreen() {
  const { t } = useTranslation();
  const notifications = useSettingsStore((s) => s.notifications);
  const setNotification = useSettingsStore((s) => s.setNotification);

  return (
    <Screen>
      <ScreenHeader title={t('settings.notifications.title')} back size="compact" />
      <ListSection>
        {KEYS.map((key) => (
          <ListItem
            key={key}
            title={t(`settings.notifications.${key}`)}
            right={
              <Toggle
                value={notifications[key]}
                accessibilityLabel={t(`settings.notifications.${key}`)}
                onValueChange={(value) => {
                  setNotification(key, value);
                  void persistSettings();
                }}
              />
            }
          />
        ))}
      </ListSection>
    </Screen>
  );
}
