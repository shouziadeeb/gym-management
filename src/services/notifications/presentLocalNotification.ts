import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { EXPO_PUSH_CHANNEL } from '@/constants/notifications';

export type LocalNotificationPayload = {
  id: string;
  title: string;
  body?: string | null;
  data?: Record<string, unknown> | null;
};

/** Shows an immediate banner when Realtime delivers a new in-app notification row. */
export async function presentLocalNotification(payload: LocalNotificationPayload): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: payload.title,
      body: payload.body ?? '',
      data: {
        notificationId: payload.id,
        ...(payload.data ?? {}),
      },
      sound: 'default',
      ...(Platform.OS === 'android' ? { channelId: EXPO_PUSH_CHANNEL } : {}),
    },
    trigger: null,
  });
}
