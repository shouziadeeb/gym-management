import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { AppNotification } from '@/domain/notifications/types';
import { useTheme } from '@/hooks/useTheme';
import { spacing } from '@/theme/spacing';

type Props = {
  notification: AppNotification;
  onPress: () => void;
};

function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function NotificationListItem({ notification, onPress }: Props) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.row,
        {
          borderColor: colors.border,
          backgroundColor: notification.isRead ? colors.card : colors.chipInactive,
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
            {notification.title}
          </Text>
          {!notification.isRead ? (
            <View style={[styles.dot, { backgroundColor: colors.primary }]} />
          ) : null}
        </View>
        <Text style={[styles.message, { color: colors.muted }]} numberOfLines={2}>
          {notification.message}
        </Text>
        <Text style={[styles.time, { color: colors.muted }]}>{formatWhen(notification.createdAt)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    borderWidth: 1,
    borderRadius: 14,
    padding: spacing[3],
    marginBottom: spacing[2],
  },
  content: {
    gap: spacing[1],
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[2],
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
  },
  time: {
    fontSize: 12,
    marginTop: spacing[1],
  },
});
