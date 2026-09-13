/**
 * Onglet Social : les demandes reçues d'abord (elles attendent une réponse),
 * puis les amis, les joueurs à proposer, et le fil d'activité.
 */
import { Users } from 'lucide-react-native';
import React, { useState } from 'react';
import { View } from 'react-native';

import { Button, Card, Divider, EmptyState, Screen, ScreenHeader, Text } from '@/components/ui';
import { addFriend, removeFriend, respondToFriend } from '@/features/data/service';
import { useRefresh, useRequireAuth } from '@/features/data/useData';
import { PlayerRow } from '@/features/social/PlayerRow';
import { acceptedFriends, compareByDate, incomingRequests } from '@/features/social/types';
import { useTranslation } from '@/i18n';
import { formatRelative } from '@/lib/format';
import { useDataStore } from '@/store/dataStore';
import { toast } from '@/store/uiStore';
import { useTheme } from '@/theme/ThemeProvider';

export default function SocialScreen() {
  const theme = useTheme();
  const { t, locale } = useTranslation();
  const { refreshing, refresh } = useRefresh();
  const requireAuth = useRequireAuth();
  const friends = useDataStore((s) => s.friends);
  const suggestions = useDataStore((s) => s.suggestions);
  const activity = useDataStore((s) => s.activity);
  const [pending, setPending] = useState(false);

  const requests = incomingRequests(friends);
  const accepted = acceptedFriends(friends);
  const outgoing = friends.filter((f) => f.status === 'pending' && f.direction === 'outgoing');

  const act = async (action: () => Promise<void>, messageKey: string) => {
    setPending(true);
    try {
      await action();
      toast(t(messageKey), 'success');
    } catch {
      toast(t('common.error'), 'error');
    } finally {
      setPending(false);
    }
  };

  return (
    <Screen onRefresh={refresh} refreshing={refreshing}>
      <ScreenHeader title={t('social.title')} />

      {requests.length > 0 ? (
        <Section title={t('social.requests')}>
          {requests.map((friend, index) => (
            <View key={friend.userId}>
              {index > 0 ? <Divider /> : null}
              <PlayerRow
                player={friend}
                action={
                  <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
                    <Button
                      title={t('common.accept')}
                      size="md"
                      fullWidth={false}
                      disabled={pending}
                      onPress={() =>
                        void act(() => respondToFriend(friend.userId, true), 'social.accepted')
                      }
                    />
                    <Button
                      title={t('common.decline')}
                      variant="text"
                      size="md"
                      fullWidth={false}
                      disabled={pending}
                      onPress={() =>
                        void act(() => respondToFriend(friend.userId, false), 'social.removed')
                      }
                    />
                  </View>
                }
              />
            </View>
          ))}
        </Section>
      ) : null}

      <Section title={t('social.friends')}>
        {accepted.length === 0 ? (
          <Text variant="body" color="textSecondary">
            {t('social.noFriends')}
          </Text>
        ) : (
          accepted.map((friend, index) => (
            <View key={friend.userId}>
              {index > 0 ? <Divider /> : null}
              <PlayerRow
                player={friend}
                action={
                  <Button
                    title={t('social.remove')}
                    variant="text"
                    size="md"
                    fullWidth={false}
                    disabled={pending}
                    onPress={() => void act(() => removeFriend(friend.userId), 'social.removed')}
                  />
                }
              />
            </View>
          ))
        )}
      </Section>

      <Section title={t('social.suggestions')}>
        {suggestions.length === 0 && outgoing.length === 0 ? (
          <Text variant="body" color="textSecondary">
            {t('social.noSuggestions')}
          </Text>
        ) : (
          <>
            {outgoing.map((friend, index) => (
              <View key={friend.userId}>
                {index > 0 ? <Divider /> : null}
                <PlayerRow
                  player={friend}
                  action={
                    <Text variant="label" color="textSecondary">
                      {t('social.pending')}
                    </Text>
                  }
                />
              </View>
            ))}
            {suggestions.map((player, index) => (
              <View key={player.userId}>
                {(index > 0 || outgoing.length > 0) ? <Divider /> : null}
                <PlayerRow
                  player={player}
                  action={
                    <Button
                      title={t('common.add')}
                      size="md"
                      fullWidth={false}
                      disabled={pending}
                      onPress={() =>
                        requireAuth(() =>
                          void act(() => addFriend(player.userId), 'social.requestSent'),
                        )
                      }
                    />
                  }
                />
              </View>
            ))}
          </>
        )}
      </Section>

      <Text variant="h3" style={{ marginBottom: theme.spacing.md }}>
        {t('social.activity')}
      </Text>
      {activity.length === 0 ? (
        <EmptyState icon={Users} title={t('social.noActivity')} subtitle={t('social.noFriends')} animate={false} />
      ) : (
        <View style={{ gap: theme.spacing.sm }}>
          {[...activity].sort(compareByDate).slice(0, 20).map((item) => (
            <Card key={item.id} tone="surface" size="sm" padding={theme.spacing.md}>
              <Text variant="body" numberOfLines={2}>
                {t(`social.events.${item.kind}`, {
                  name: item.actor.displayName ?? t('common.notSet'),
                })}
              </Text>
              <Text variant="caption" color="textSecondary" style={{ marginTop: 2 }}>
                {formatRelative(item.at, locale)}
              </Text>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}

/** Titre de section et son contenu, avec l'espacement standard. */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ marginBottom: theme.sizes.sectionGap }}>
      <Text variant="h3" style={{ marginBottom: theme.spacing.sm }}>
        {title}
      </Text>
      {children}
    </View>
  );
}
