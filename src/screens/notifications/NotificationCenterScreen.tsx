import { useCallback, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { router } from 'expo-router';

import { NotificationFilterChips } from '@/components/notifications/NotificationFilterChips';
import { NotificationListItem } from '@/components/notifications/NotificationListItem';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { Screen } from '@/components/ui/Screen';
import type { AppNotification, NotificationFilterCategory } from '@/domain/notifications/types';
import { useNotifications } from '@/hooks/useNotifications';
import { resolveNotificationHref } from '@/lib/notification-navigation';
import { layout, text } from '@/theme/classes';
import { spacing } from '@/theme/spacing';

export function NotificationCenterScreen() {
  const [filter, setFilter] = useState<NotificationFilterCategory>('all');
  const { items, loading, error, refetch, markRead, markAllRead, markingAllRead } =
    useNotifications(filter);

  const handleNotificationPress = useCallback(
    (item: AppNotification) => {
      if (!item.isRead) markRead(item.id);
      const href = resolveNotificationHref(item);
      if (href) router.push(href as never);
    },
    [markRead],
  );

  const renderItem = useCallback(
    ({ item }: { item: AppNotification }) => (
      <NotificationListItem notification={item} onPress={() => handleNotificationPress(item)} />
    ),
    [handleNotificationPress],
  );

  const listHeader = (
    <View>
      <View className={layout.screenTop}>
        <Text className={text.screenTitle}>Notifications</Text>
        <Text className={`${layout.stack} ${text.caption}`}>
          Membership, payments, attendance, and gym updates.
        </Text>
      </View>

      <NotificationFilterChips value={filter} onChange={setFilter} />

      <View style={{ marginTop: spacing[3], marginBottom: spacing[2] }}>
        <Button
          title={markingAllRead ? 'Marking…' : 'Mark all as read'}
          variant="ghost"
          onPress={() => markAllRead()}
          disabled={markingAllRead || items.every((item) => item.isRead)}
        />
      </View>
    </View>
  );

  if (loading) {
    return <LoadingScreen label="Loading notifications…" />;
  }

  if (error) {
    return (
      <Screen>
        <EmptyState
          title="Could not load notifications"
          description={error instanceof Error ? error.message : 'Try again.'}
          actionLabel="Retry"
          onAction={() => void refetch()}
        />
      </Screen>
    );
  }

  return (
    <Screen className="flex-1">
      <FlatList
        style={{ flex: 1 }}
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          <EmptyState
            title="No notifications yet"
            description="Alerts for membership, payments, and gym activity will appear here."
          />
        }
        contentContainerStyle={{ flexGrow: 1, paddingBottom: spacing[6] }}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}
